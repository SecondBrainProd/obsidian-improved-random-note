import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, AbstractInputSuggest, FuzzySuggestModal, ItemView, WorkspaceLeaf, MarkdownRenderer } from 'obsidian';

interface FilterPreset {
    name: string;
    includedFolders: string;
    includedTags: string;
    includedProperties: string;
    excludedFolders: string;
    matchCondition: 'AND' | 'OR';
}

interface ImprovedRandomNoteSettings {
    includedFolders: string;
    includedTags: string;
    includedProperties: string;
    excludedFolders: string;
    matchCondition: 'AND' | 'OR';
    openInNewTab: boolean;
    historySize: number;
}

interface ImprovedRandomNoteData {
    settings: ImprovedRandomNoteSettings;
    recentHistory: string[];
    presets: FilterPreset[];
}

const DEFAULT_SETTINGS: ImprovedRandomNoteSettings = {
    includedFolders: '',
    includedTags: '',
    includedProperties: '',
    excludedFolders: '',
    matchCondition: 'OR',
    openInNewTab: false,
    historySize: 5,
}

const DEFAULT_DATA: ImprovedRandomNoteData = {
    settings: DEFAULT_SETTINGS,
    recentHistory: [],
    presets: [],
}

const VIEW_TYPE_RANDOM_NOTE = 'random-note-view';

export default class ImprovedRandomNotePlugin extends Plugin {
    settings!: ImprovedRandomNoteSettings;
    recentHistory: string[] = [];
    presets: FilterPreset[] = [];
    private presetCommandIds: string[] = [];

    async onload() {
        await this.loadSettings();

        this.addRibbonIcon('shuffle', 'Открыть случайную заметку (с фильтрами)', () => {
            this.openRandomNote();
        });

        this.addCommand({
            id: 'open-improved-random-note',
            name: 'Открыть случайную заметку...',
            callback: () => {
                this.openRandomNote();
            }
        });

        this.addCommand({
            id: 'clear-random-note-history',
            name: 'Очистить историю случайных заметок',
            callback: async () => {
                this.recentHistory = [];
                await this.savePluginData();
                new Notice('История очищена.');
            }
        });

        this.addCommand({
            id: 'pick-random-note-preset',
            name: 'Выбрать пресет...',
            callback: () => {
                if (this.presets.length === 0) {
                    new Notice('Нет сохранённых пресетов. Создайте пресет в настройках плагина.');
                    return;
                }
                new PresetPickerModal(this.app, this).open();
            }
        });

        this.registerPresetCommands();

        this.registerView(VIEW_TYPE_RANDOM_NOTE, (leaf) => new RandomNoteView(leaf, this));

        this.addCommand({
            id: 'toggle-random-note-sidebar',
            name: 'Показать виджет случайной заметки',
            callback: () => this.activateView(),
        });

        this.addSettingTab(new ImprovedRandomNoteSettingTab(this.app, this));
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_RANDOM_NOTE);
    }

    async activateView() {
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_RANDOM_NOTE);
        if (existing.length > 0) {
            this.app.workspace.revealLeaf(existing[0]);
            return;
        }
        const leaf = this.app.workspace.getRightLeaf(false);
        if (leaf) {
            await leaf.setViewState({ type: VIEW_TYPE_RANDOM_NOTE, active: true });
            this.app.workspace.revealLeaf(leaf);
        }
    }

    registerPresetCommands() {
        // Удаляем старые команды пресетов
        for (const cmdId of this.presetCommandIds) {
            // @ts-ignore — internal API
            this.app.commands.removeCommand(cmdId);
        }
        this.presetCommandIds = [];

        // Регистрируем команду для каждого пресета
        for (let i = 0; i < this.presets.length; i++) {
            const preset = this.presets[i];
            const commandId = `improved-random-note:open-preset-${i}`;
            this.addCommand({
                id: `open-preset-${i}`,
                name: `Случайная заметка: ${preset.name}`,
                callback: () => {
                    this.openRandomNote(preset);
                }
            });
            this.presetCommandIds.push(commandId);
        }
    }

    async loadSettings() {
        const data = await this.loadData();
        if (data && data.settings) {
            // Новый формат данных
            this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
            this.recentHistory = data.recentHistory || [];
            this.presets = data.presets || [];
        } else {
            // Совместимость со старым форматом (настройки хранились в корне)
            this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
            this.recentHistory = [];
            this.presets = [];
        }
    }

    async savePluginData() {
        const data: ImprovedRandomNoteData = {
            settings: this.settings,
            recentHistory: this.recentHistory,
            presets: this.presets,
        };
        await this.saveData(data);
    }

    async saveSettings() {
        await this.savePluginData();
    }

    private parseList(value: string): string[] {
        return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    private isInFolder(file: TFile, folder: string): boolean {
        const normalizedFolder = folder.endsWith('/') ? folder : folder + '/';
        return file.path.startsWith(normalizedFolder);
    }

    getRandomCandidate(preset?: FilterPreset): TFile | null {
        const filters = preset || this.settings;
        const allFiles = this.app.vault.getMarkdownFiles();
        const excludedFolders = this.parseList(filters.excludedFolders);
        let candidates = allFiles.filter(file => {
            if (excludedFolders.length === 0) return true;
            return !excludedFolders.some(folder => this.isInFolder(file, folder));
        });

        const incFolders = this.parseList(filters.includedFolders);
        const incTags = this.parseList(filters.includedTags);
        const incProps = this.parseList(filters.includedProperties);

        const hasAnyFilter = incFolders.length > 0 || incTags.length > 0 || incProps.length > 0;

        if (hasAnyFilter) {
            candidates = candidates.filter(file => {
                const results: boolean[] = [];
                if (incFolders.length > 0) results.push(incFolders.some(f => this.isInFolder(file, f)));
                if (incTags.length > 0) {
                    const cache = this.app.metadataCache.getFileCache(file);
                    const fileTags: string[] = [];
                    if (cache?.frontmatter) {
                        const tags = cache.frontmatter.tags || cache.frontmatter.tag;
                        if (Array.isArray(tags)) fileTags.push(...tags.map(String));
                        else if (tags) fileTags.push(String(tags));
                    }
                    if (cache?.tags) fileTags.push(...cache.tags.map(t => t.tag));
                    const normFileTags = fileTags.map(t => (t.startsWith('#') ? t : '#' + t).toLowerCase());
                    const normWantedTags = incTags.map(t => (t.startsWith('#') ? t : '#' + t).toLowerCase());
                    results.push(normWantedTags.some(t => normFileTags.includes(t)));
                }
                if (incProps.length > 0) {
                    const cache = this.app.metadataCache.getFileCache(file);
                    if (!cache?.frontmatter) results.push(false);
                    else {
                        const fm = cache.frontmatter;
                        results.push(incProps.some(p => {
                            const colon = p.indexOf(':');
                            const k = (colon > -1 ? p.substring(0, colon) : p).trim().toLowerCase();
                            const v = colon > -1 ? p.substring(colon + 1).trim().toLowerCase() : undefined;
                            const realKey = Object.keys(fm).find(key => key.toLowerCase() === k);
                            if (!realKey) return false;
                            return v === undefined ? !!fm[realKey] : String(fm[realKey]).toLowerCase() === v;
                        }));
                    }
                }
                return filters.matchCondition === 'AND' ? results.every(r => r) : results.some(r => r);
            });
        }

        if (candidates.length === 0) return null;

        // Исключаем заметки из недавней истории
        const historySet = new Set(this.recentHistory);
        let filtered = candidates.filter(f => !historySet.has(f.path));
        if (filtered.length === 0) {
            this.recentHistory = [];
            filtered = candidates;
        }

        return filtered[Math.floor(Math.random() * filtered.length)];
    }

    async openRandomNote(preset?: FilterPreset) {
        const randomFile = this.getRandomCandidate(preset);
        if (!randomFile) {
            new Notice('Ничего не найдено с такими фильтрами.');
            return;
        }

        // Добавляем в историю
        this.recentHistory.push(randomFile.path);
        if (this.recentHistory.length > this.settings.historySize) {
            this.recentHistory = this.recentHistory.slice(-this.settings.historySize);
        }
        await this.savePluginData();

        const leaf = this.settings.openInNewTab ? this.app.workspace.getLeaf('tab') : this.app.workspace.getLeaf(false);
        await leaf.openFile(randomFile);
        if (preset) {
            new Notice(`Пресет «${preset.name}» → ${randomFile.basename}`);
        } else {
            new Notice(`Открыто: ${randomFile.basename}`);
        }
    }
}

/**
 * Виджет в боковой панели — показывает случайную заметку.
 */
class RandomNoteView extends ItemView {
    plugin: ImprovedRandomNotePlugin;
    private currentFile: TFile | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: ImprovedRandomNotePlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return VIEW_TYPE_RANDOM_NOTE;
    }

    getDisplayText(): string {
        return 'Случайная заметка';
    }

    getIcon(): string {
        return 'shuffle';
    }

    async onOpen() {
        await this.showRandomNote();
    }

    async onClose() {
        this.contentEl.empty();
    }

    async showRandomNote() {
        const container = this.contentEl;
        container.empty();
        container.addClass('random-note-widget');

        const file = this.plugin.getRandomCandidate();
        this.currentFile = file;

        if (!file) {
            container.createEl('p', {
                text: 'Не найдено заметок с текущими фильтрами.',
                cls: 'random-note-empty',
            });
            this.addButtons(container);
            return;
        }

        // Карточка заметки
        const card = container.createDiv({ cls: 'random-note-card' });

        // Название
        const title = card.createEl('h4', {
            text: file.basename,
            cls: 'random-note-title',
        });
        title.addEventListener('click', () => this.openCurrentNote());

        // Путь
        card.createEl('div', {
            text: file.parent?.path || '/',
            cls: 'random-note-path',
        });

        // Теги
        const cache = this.app.metadataCache.getFileCache(file);
        const tags: string[] = [];
        if (cache?.frontmatter) {
            const fmTags = cache.frontmatter.tags || cache.frontmatter.tag;
            if (Array.isArray(fmTags)) tags.push(...fmTags.map(String));
            else if (fmTags) tags.push(String(fmTags));
        }
        if (cache?.tags) tags.push(...cache.tags.map(t => t.tag));

        if (tags.length > 0) {
            const tagsEl = card.createDiv({ cls: 'random-note-tags' });
            const uniqueTags = [...new Set(tags.map(t => t.startsWith('#') ? t : '#' + t))];
            for (const tag of uniqueTags) {
                tagsEl.createEl('span', { text: tag, cls: 'random-note-tag' });
            }
        }

        // Превью
        const previewEl = card.createDiv({ cls: 'random-note-preview' });
        try {
            let content = await this.app.vault.cachedRead(file);
            // Убираем frontmatter
            const fmMatch = content.match(/^---\n[\s\S]*?\n---\n?/);
            if (fmMatch) content = content.slice(fmMatch[0].length);
            const excerpt = content.trim().slice(0, 300);
            await MarkdownRenderer.render(this.app, excerpt, previewEl, file.path, this);
        } catch {
            previewEl.createEl('p', { text: 'Не удалось загрузить превью.' });
        }

        this.addButtons(container);
    }

    private addButtons(container: HTMLElement) {
        const btnContainer = container.createDiv({ cls: 'random-note-buttons' });

        const refreshBtn = btnContainer.createEl('button', {
            cls: 'random-note-btn',
        });
        refreshBtn.innerHTML = '🔄 Следующая';
        refreshBtn.addEventListener('click', () => this.showRandomNote());

        const openBtn = btnContainer.createEl('button', {
            cls: 'random-note-btn random-note-btn-open',
        });
        openBtn.innerHTML = '📄 Открыть';
        openBtn.addEventListener('click', () => this.openCurrentNote());
        openBtn.disabled = !this.currentFile;
    }

    private async openCurrentNote() {
        if (!this.currentFile) return;
        const leaf = this.plugin.settings.openInNewTab
            ? this.app.workspace.getLeaf('tab')
            : this.app.workspace.getLeaf(false);
        await leaf.openFile(this.currentFile);
    }
}

/**
 * Базовый класс для подсказок через запятую.
 */
abstract class MultiSuggest<T> extends AbstractInputSuggest<T> {
    inputEl: HTMLInputElement;

    constructor(app: App, inputEl: HTMLInputElement) {
        super(app, inputEl);
        this.inputEl = inputEl;
    }

    abstract getItems(): T[];
    abstract toString(item: T): string;

    getSuggestions(query: string): T[] {
        const lastPart = query.split(',').pop()?.trim().toLowerCase() || '';
        return this.getItems()
            .filter(item => this.toString(item).toLowerCase().contains(lastPart))
            .slice(0, 10);
    }

    renderSuggestion(item: T, el: HTMLElement): void {
        el.setText(this.toString(item));
    }

    selectSuggestion(item: T, evt: MouseEvent | KeyboardEvent): void {
        const parts = this.inputEl.value.split(',').map(s => s.trim());
        parts.pop(); // Удаляем незаконченную часть
        parts.push(this.toString(item));

        const newValue = parts.join(', ') + ', ';
        this.inputEl.value = newValue;
        this.inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        this.close();
    }
}

class FolderSuggest extends MultiSuggest<TFolder> {
    getItems(): TFolder[] {
        return this.app.vault.getAllLoadedFiles().filter(f => f instanceof TFolder && !f.isRoot()) as TFolder[];
    }
    toString(folder: TFolder): string { return folder.path; }
}

class TagSuggest extends MultiSuggest<string> {
    getItems(): string[] {
        // @ts-ignore
        const tags = Object.keys(this.app.metadataCache.getTags());
        return tags.map(t => t.startsWith('#') ? t : '#' + t);
    }
    toString(tag: string): string { return tag; }
}

class PropertySuggest extends MultiSuggest<string> {
    getItems(): string[] {
        // @ts-ignore
        return this.app.metadataCache.getAllPropertyNames?.() || [];
    }
    toString(name: string): string { return name; }
}

/**
 * Модальное окно для быстрого выбора пресета через fuzzy-поиск.
 */
class PresetPickerModal extends FuzzySuggestModal<FilterPreset> {
    plugin: ImprovedRandomNotePlugin;

    constructor(app: App, plugin: ImprovedRandomNotePlugin) {
        super(app);
        this.plugin = plugin;
        this.setPlaceholder('Выберите пресет...');
    }

    getItems(): FilterPreset[] {
        return this.plugin.presets;
    }

    getItemText(preset: FilterPreset): string {
        return preset.name;
    }

    onChooseItem(preset: FilterPreset, evt: MouseEvent | KeyboardEvent): void {
        this.plugin.openRandomNote(preset);
    }
}

class ImprovedRandomNoteSettingTab extends PluginSettingTab {
    plugin: ImprovedRandomNotePlugin;

    constructor(app: App, plugin: ImprovedRandomNotePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Improved Random Note Settings' });

        const createSetting = (name: string, desc: string, key: keyof ImprovedRandomNoteSettings, SuggestClass: any) => {
            new Setting(containerEl)
                .setName(name)
                .setDesc(desc)
                .addText(text => {
                    text.setValue(this.plugin.settings[key] as string)
                        .onChange(async (v) => {
                            (this.plugin.settings as any)[key] = v;
                            await this.plugin.saveSettings();
                        });
                    new SuggestClass(this.app, text.inputEl);
                });
        };

        createSetting('Included Folders', 'Папки для поиска.', 'includedFolders', FolderSuggest);
        createSetting('Included Tags', 'Теги для поиска (с #).', 'includedTags', TagSuggest);
        createSetting('Included Properties', 'YAML-свойства (ключи).', 'includedProperties', PropertySuggest);
        createSetting('Excluded Folders', 'Исключить папки.', 'excludedFolders', FolderSuggest);

        new Setting(containerEl)
            .setName('Match Condition')
            .setDesc('Логика фильтров.')
            .addDropdown(dd => dd
                .addOption('OR', 'ИЛИ (любое условие)')
                .addOption('AND', 'И (все условия сразу)')
                .setValue(this.plugin.settings.matchCondition)
                .onChange(async (v) => {
                    this.plugin.settings.matchCondition = v as 'AND' | 'OR';
                    await this.plugin.saveSettings();
                }));

        // --- Секция пресетов ---
        containerEl.createEl('h3', { text: 'Presets' });

        new Setting(containerEl)
            .setName('Save Current Filters as Preset')
            .setDesc('Сохранить текущие фильтры как именованный пресет.')
            .addButton(btn => btn
                .setButtonText('Сохранить')
                .setCta()
                .onClick(async () => {
                    const name = await this.promptForName();
                    if (!name) return;
                    const preset: FilterPreset = {
                        name,
                        includedFolders: this.plugin.settings.includedFolders,
                        includedTags: this.plugin.settings.includedTags,
                        includedProperties: this.plugin.settings.includedProperties,
                        excludedFolders: this.plugin.settings.excludedFolders,
                        matchCondition: this.plugin.settings.matchCondition,
                    };
                    this.plugin.presets.push(preset);
                    await this.plugin.savePluginData();
                    this.plugin.registerPresetCommands();
                    new Notice(`Пресет «${name}» сохранён.`);
                    this.display();
                }));

        // Список сохранённых пресетов
        for (let i = 0; i < this.plugin.presets.length; i++) {
            const preset = this.plugin.presets[i];
            const desc = this.presetDescription(preset);
            new Setting(containerEl)
                .setName(preset.name)
                .setDesc(desc)
                .addButton(btn => btn
                    .setButtonText('Загрузить')
                    .onClick(async () => {
                        this.plugin.settings.includedFolders = preset.includedFolders;
                        this.plugin.settings.includedTags = preset.includedTags;
                        this.plugin.settings.includedProperties = preset.includedProperties;
                        this.plugin.settings.excludedFolders = preset.excludedFolders;
                        this.plugin.settings.matchCondition = preset.matchCondition;
                        await this.plugin.saveSettings();
                        new Notice(`Пресет «${preset.name}» загружен в текущие фильтры.`);
                        this.display();
                    }))
                .addButton(btn => btn
                    .setButtonText('Удалить')
                    .setWarning()
                    .onClick(async () => {
                        this.plugin.presets.splice(i, 1);
                        await this.plugin.savePluginData();
                        this.plugin.registerPresetCommands();
                        new Notice(`Пресет «${preset.name}» удалён.`);
                        this.display();
                    }));
        }

        containerEl.createEl('h3', { text: 'Appearance & Behavior' });

        new Setting(containerEl)
            .setName('Open in New Tab')
            .setDesc('Всегда открывать в новой вкладке.')
            .addToggle(t => t
                .setValue(this.plugin.settings.openInNewTab)
                .onChange(async (v) => {
                    this.plugin.settings.openInNewTab = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('History Size')
            .setDesc('Сколько последних заметок запоминать, чтобы не открывать повторно (0 — отключить).')
            .addText(text => text
                .setPlaceholder('5')
                .setValue(String(this.plugin.settings.historySize))
                .onChange(async (v) => {
                    const num = parseInt(v, 10);
                    this.plugin.settings.historySize = isNaN(num) ? 5 : Math.max(0, num);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Clear History')
            .setDesc(`Сейчас в истории: ${this.plugin.recentHistory.length} заметок.`)
            .addButton(btn => btn
                .setButtonText('Очистить')
                .setCta()
                .onClick(async () => {
                    this.plugin.recentHistory = [];
                    await this.plugin.savePluginData();
                    new Notice('История очищена.');
                    this.display();
                }));
    }

    private presetDescription(preset: FilterPreset): string {
        const parts: string[] = [];
        if (preset.includedFolders) parts.push(`📁 ${preset.includedFolders}`);
        if (preset.includedTags) parts.push(`🏷️ ${preset.includedTags}`);
        if (preset.includedProperties) parts.push(`📝 ${preset.includedProperties}`);
        if (preset.excludedFolders) parts.push(`🚫 ${preset.excludedFolders}`);
        parts.push(preset.matchCondition === 'AND' ? '(И)' : '(ИЛИ)');
        return parts.join(' | ');
    }

    private promptForName(): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new PromptModal(this.app, 'Название пресета', '', (result) => {
                resolve(result || null);
            });
            modal.open();
        });
    }
}

/**
 * Простое модальное окно для ввода текста.
 */
class PromptModal extends Modal {
    private promptText: string;
    private defaultValue: string;
    private onSubmit: (result: string) => void;
    private inputEl!: HTMLInputElement;

    constructor(app: App, promptText: string, defaultValue: string, onSubmit: (result: string) => void) {
        super(app);
        this.promptText = promptText;
        this.defaultValue = defaultValue;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h3', { text: this.promptText });

        this.inputEl = contentEl.createEl('input', {
            type: 'text',
            value: this.defaultValue,
            cls: 'prompt-input',
        });
        this.inputEl.style.width = '100%';
        this.inputEl.style.marginBottom = '1em';
        this.inputEl.focus();

        this.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.onSubmit(this.inputEl.value.trim());
                this.close();
            }
        });

        const btnContainer = contentEl.createDiv({ cls: 'prompt-buttons' });
        btnContainer.style.display = 'flex';
        btnContainer.style.justifyContent = 'flex-end';
        btnContainer.style.gap = '8px';

        const cancelBtn = btnContainer.createEl('button', { text: 'Отмена' });
        cancelBtn.addEventListener('click', () => {
            this.onSubmit('');
            this.close();
        });

        const okBtn = btnContainer.createEl('button', { text: 'Сохранить', cls: 'mod-cta' });
        okBtn.addEventListener('click', () => {
            this.onSubmit(this.inputEl.value.trim());
            this.close();
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}
