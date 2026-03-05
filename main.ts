import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, AbstractInputSuggest, FuzzySuggestModal, ItemView, WorkspaceLeaf, MarkdownRenderer } from 'obsidian';
import { Locale, LOCALE_NAMES, SUPPORTED_LOCALES, TRANSLATIONS, detectLocale } from './i18n';

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
    batchSize: number;
    locale: Locale;
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
    batchSize: 3,
    locale: detectLocale(),
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

    get t() {
        return TRANSLATIONS[this.settings?.locale ?? detectLocale()];
    }
    async onload() {
        await this.loadSettings();

        this.addRibbonIcon('shuffle', this.t.ribbonTooltip, () => {
            this.openRandomNote();
        });

        this.addCommand({
            id: 'open-improved-random-note-pro',
            name: this.t.cmdOpenRandom,
            callback: () => {
                this.openRandomNote();
            }
        });

        this.addCommand({
            id: 'clear-random-note-history',
            name: this.t.cmdClearHistory,
            callback: async () => {
                this.recentHistory = [];
                await this.savePluginData();
                new Notice(this.t.historyClearedNotice);
            }
        });

        this.addCommand({
            id: 'open-multiple-random-notes',
            name: this.t.cmdOpenMultiple,
            callback: () => this.openMultipleRandomNotes(),
        });

        this.addCommand({
            id: 'pick-random-note-preset',
            name: this.t.cmdPickPreset,
            callback: () => {
                if (this.presets.length === 0) {
                    new Notice(this.t.noPresets);
                    return;
                }
                new PresetPickerModal(this.app, this).open();
            }
        });

        this.registerPresetCommands();

        this.registerView(VIEW_TYPE_RANDOM_NOTE, (leaf) => new RandomNoteView(leaf, this));

        this.addCommand({
            id: 'toggle-random-note-sidebar',
            name: this.t.cmdToggleSidebar,
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
        const pluginId = this.manifest.id;
        for (let i = 0; i < this.presets.length; i++) {
            const preset = this.presets[i];
            const commandId = `${pluginId}:open-preset-${i}`;
            this.addCommand({
                id: `open-preset-${i}`,
                name: `${this.t.cmdPresetPrefix} ${preset.name}`,
                callback: () => {
                    this.openRandomNote(preset);
                }
            });
            this.presetCommandIds.push(commandId);
        }
    }

    private validateSettings(raw: unknown): ImprovedRandomNoteSettings {
        const base = Object.assign({}, DEFAULT_SETTINGS);
        if (!raw || typeof raw !== 'object') return base;

        const s = raw as Record<string, unknown>;
        if (typeof s.includedFolders === 'string') base.includedFolders = s.includedFolders;
        if (typeof s.includedTags === 'string') base.includedTags = s.includedTags;
        if (typeof s.includedProperties === 'string') base.includedProperties = s.includedProperties;
        if (typeof s.excludedFolders === 'string') base.excludedFolders = s.excludedFolders;
        if (s.matchCondition === 'AND' || s.matchCondition === 'OR') base.matchCondition = s.matchCondition;
        if (typeof s.openInNewTab === 'boolean') base.openInNewTab = s.openInNewTab;
        if (typeof s.locale === 'string' && SUPPORTED_LOCALES.includes(s.locale as Locale)) base.locale = s.locale as Locale;

        if (typeof s.historySize === 'number' && s.historySize >= 0) base.historySize = s.historySize;
        else if (typeof s.historySize === 'string') {
            const n = parseInt(s.historySize, 10);
            base.historySize = isNaN(n) ? 5 : Math.max(0, n);
        }

        if (typeof s.batchSize === 'number' && s.batchSize >= 1 && s.batchSize <= 20) base.batchSize = s.batchSize;
        else if (typeof s.batchSize === 'string') {
            const n = parseInt(s.batchSize, 10);
            base.batchSize = isNaN(n) ? 3 : Math.max(1, Math.min(20, n));
        }

        return base;
    }

    private validatePreset(raw: unknown): FilterPreset | null {
        if (!raw || typeof raw !== 'object') return null;
        const p = raw as Record<string, unknown>;
        if (typeof p.name !== 'string' || !p.name.trim()) return null;
        return {
            name: String(p.name).trim(),
            includedFolders: typeof p.includedFolders === 'string' ? p.includedFolders : '',
            includedTags: typeof p.includedTags === 'string' ? p.includedTags : '',
            includedProperties: typeof p.includedProperties === 'string' ? p.includedProperties : '',
            excludedFolders: typeof p.excludedFolders === 'string' ? p.excludedFolders : '',
            matchCondition: p.matchCondition === 'AND' || p.matchCondition === 'OR' ? p.matchCondition : 'OR',
        };
    }

    async loadSettings() {
        const data = await this.loadData();
        if (data && data.settings) {
            this.settings = this.validateSettings(data.settings);
            this.recentHistory = Array.isArray(data.recentHistory)
                ? data.recentHistory.filter((p): p is string => typeof p === 'string')
                : [];
            this.presets = Array.isArray(data.presets)
                ? data.presets.map(p => this.validatePreset(p)).filter((p): p is FilterPreset => p !== null)
                : [];
        } else {
            this.settings = this.validateSettings(data);
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
                    fileTags.push(...(cache?.tags?.map(t => t.tag).filter(Boolean) ?? []));
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
            new Notice(this.t.noNotesFound);
            return;
        }

        this.recentHistory.push(randomFile.path);
        if (this.recentHistory.length > this.settings.historySize) {
            this.recentHistory = this.recentHistory.slice(-this.settings.historySize);
        }
        await this.savePluginData();

        const leaf = this.settings.openInNewTab ? this.app.workspace.getLeaf('tab') : this.app.workspace.getLeaf(false);
        await leaf.openFile(randomFile);
        if (preset) {
            new Notice(this.t.presetOpened(preset.name, randomFile.basename));
        } else {
            new Notice(this.t.opened(randomFile.basename));
        }
    }

    async openMultipleRandomNotes() {
        const n = this.settings.batchSize;
        const opened: string[] = [];

        for (let i = 0; i < n; i++) {
            const file = this.getRandomCandidate();
            if (!file) break;
            this.recentHistory.push(file.path);
            if (this.recentHistory.length > this.settings.historySize) {
                this.recentHistory = this.recentHistory.slice(-this.settings.historySize);
            }
            await this.app.workspace.getLeaf('tab').openFile(file);
            opened.push(file.basename);
        }

        await this.savePluginData();

        if (opened.length === 0) {
            new Notice(this.t.noNotesFound);
        } else {
            new Notice(this.t.openedN(opened.length, opened.join(', ')));
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
        return this.plugin.t.widgetTitle;
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
                text: this.plugin.t.widgetEmpty,
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
        tags.push(...(cache?.tags?.map(t => t.tag).filter(Boolean) ?? []));

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
            previewEl.createEl('p', { text: this.plugin.t.widgetPreviewError });
        }

        this.addButtons(container);
    }

    private addButtons(container: HTMLElement) {
        const btnContainer = container.createDiv({ cls: 'random-note-buttons' });

        const refreshBtn = btnContainer.createEl('button', {
            cls: 'random-note-btn',
        });
        refreshBtn.textContent = this.plugin.t.widgetNext;
        refreshBtn.addEventListener('click', () => this.showRandomNote());

        const openBtn = btnContainer.createEl('button', {
            cls: 'random-note-btn random-note-btn-open',
        });
        openBtn.textContent = this.plugin.t.widgetOpen;
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

        // Исключаем уже введённые значения
        const entered = new Set(
            this.inputEl.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        );

        return this.getItems()
            .filter(item => {
                const str = this.toString(item).toLowerCase();
                return str.includes(lastPart) && !entered.has(str);
            })
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
        // @ts-ignore — getTags() может вернуть undefined в некоторых версиях Obsidian
        const tagsObj = this.app.metadataCache.getTags?.() ?? {};
        const tags = Object.keys(tagsObj);
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
        const t = this.plugin.t;
        containerEl.createEl('h2', { text: t.settingsTitle });

        // --- Language selector (always at the top) ---
        new Setting(containerEl)
            .setName(t.langLabel)
            .setDesc(t.langDesc)
            .addDropdown(dd => {
                for (const loc of SUPPORTED_LOCALES) {
                    dd.addOption(loc, LOCALE_NAMES[loc]);
                }
                dd.setValue(this.plugin.settings.locale)
                    .onChange(async (v) => {
                        this.plugin.settings.locale = v as Locale;
                        await this.plugin.saveSettings();
                        this.display(); // re-render settings in new language
                    });
            });

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

        createSetting(t.includedFoldersName, t.includedFoldersDesc, 'includedFolders', FolderSuggest);
        createSetting(t.includedTagsName, t.includedTagsDesc, 'includedTags', TagSuggest);
        createSetting(t.includedPropertiesName, t.includedPropertiesDesc, 'includedProperties', PropertySuggest);
        createSetting(t.excludedFoldersName, t.excludedFoldersDesc, 'excludedFolders', FolderSuggest);

        new Setting(containerEl)
            .setName(t.matchConditionName)
            .setDesc(t.matchConditionDesc)
            .addDropdown(dd => dd
                .addOption('OR', t.matchOr)
                .addOption('AND', t.matchAnd)
                .setValue(this.plugin.settings.matchCondition)
                .onChange(async (v) => {
                    this.plugin.settings.matchCondition = v as 'AND' | 'OR';
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: t.presetsHeader });

        new Setting(containerEl)
            .setName(t.savePresetName)
            .setDesc(t.savePresetDesc)
            .addButton(btn => btn
                .setButtonText(t.savePresetBtn)
                .setCta()
                .onClick(async () => {
                    const name = await this.promptForName(t.presetNamePrompt, t.cancel, t.save);
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
                    new Notice(t.presetSaved(name));
                    this.display();
                }));

        for (let i = 0; i < this.plugin.presets.length; i++) {
            const preset = this.plugin.presets[i];
            const desc = this.presetDescription(preset, t.presetMatchAnd, t.presetMatchOr);
            new Setting(containerEl)
                .setName(preset.name)
                .setDesc(desc)
                .addButton(btn => btn
                    .setButtonText(t.loadBtn)
                    .onClick(async () => {
                        this.plugin.settings.includedFolders = preset.includedFolders;
                        this.plugin.settings.includedTags = preset.includedTags;
                        this.plugin.settings.includedProperties = preset.includedProperties;
                        this.plugin.settings.excludedFolders = preset.excludedFolders;
                        this.plugin.settings.matchCondition = preset.matchCondition;
                        await this.plugin.saveSettings();
                        new Notice(t.presetLoaded(preset.name));
                        this.display();
                    }))
                .addButton(btn => btn
                    .setButtonText(t.deleteBtn)
                    .setWarning()
                    .onClick(async () => {
                        this.plugin.presets.splice(i, 1);
                        await this.plugin.savePluginData();
                        this.plugin.registerPresetCommands();
                        new Notice(t.presetDeleted(preset.name));
                        this.display();
                    }));
        }

        containerEl.createEl('h3', { text: t.behaviorHeader });

        new Setting(containerEl)
            .setName(t.openInNewTabName)
            .setDesc(t.openInNewTabDesc)
            .addToggle(tog => tog
                .setValue(this.plugin.settings.openInNewTab)
                .onChange(async (v) => {
                    this.plugin.settings.openInNewTab = v;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t.historySizeName)
            .setDesc(t.historySizeDesc)
            .addText(text => text
                .setPlaceholder('5')
                .setValue(String(this.plugin.settings.historySize))
                .onChange(async (v) => {
                    const num = parseInt(v, 10);
                    this.plugin.settings.historySize = isNaN(num) ? 5 : Math.max(0, num);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t.batchSizeName)
            .setDesc(t.batchSizeDesc)
            .addText(text => text
                .setPlaceholder('3')
                .setValue(String(this.plugin.settings.batchSize))
                .onChange(async (v) => {
                    const num = parseInt(v, 10);
                    this.plugin.settings.batchSize = isNaN(num) ? 3 : Math.max(1, Math.min(20, num));
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName(t.clearHistoryName)
            .setDesc(t.clearHistoryDesc(this.plugin.recentHistory.length))
            .addButton(btn => btn
                .setButtonText(t.clearHistoryBtn)
                .setCta()
                .onClick(async () => {
                    this.plugin.recentHistory = [];
                    await this.plugin.savePluginData();
                    new Notice(t.historyClearedNotice);
                    this.display();
                }));
    }

    private presetDescription(preset: FilterPreset, andLabel: string, orLabel: string): string {
        const parts: string[] = [];
        if (preset.includedFolders) parts.push(`📁 ${preset.includedFolders}`);
        if (preset.includedTags) parts.push(`🏷️ ${preset.includedTags}`);
        if (preset.includedProperties) parts.push(`📝 ${preset.includedProperties}`);
        if (preset.excludedFolders) parts.push(`🚫 ${preset.excludedFolders}`);
        parts.push(preset.matchCondition === 'AND' ? andLabel : orLabel);
        return parts.join(' | ');
    }

    private promptForName(promptText: string, cancelLabel: string, saveLabel: string): Promise<string | null> {
        return new Promise((resolve) => {
            const modal = new PromptModal(this.app, promptText, '', cancelLabel, saveLabel, (result) => {
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
    private cancelLabel: string;
    private saveLabel: string;
    private onSubmit: (result: string) => void;
    private inputEl!: HTMLInputElement;

    constructor(app: App, promptText: string, defaultValue: string, cancelLabel: string, saveLabel: string, onSubmit: (result: string) => void) {
        super(app);
        this.promptText = promptText;
        this.defaultValue = defaultValue;
        this.cancelLabel = cancelLabel;
        this.saveLabel = saveLabel;
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

        const cancelBtn = btnContainer.createEl('button', { text: this.cancelLabel });
        cancelBtn.addEventListener('click', () => {
            this.onSubmit('');
            this.close();
        });

        const okBtn = btnContainer.createEl('button', { text: this.saveLabel, cls: 'mod-cta' });
        okBtn.addEventListener('click', () => {
            this.onSubmit(this.inputEl.value.trim());
            this.close();
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}
