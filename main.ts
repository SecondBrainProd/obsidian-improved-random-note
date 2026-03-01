import { App, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface ImprovedRandomNoteSettings {
    includedFolders: string;
    includedTags: string;
    includedProperties: string;
    excludedFolders: string;
    matchCondition: 'AND' | 'OR';
}

const DEFAULT_SETTINGS: ImprovedRandomNoteSettings = {
    includedFolders: '',
    includedTags: '',
    includedProperties: '',
    excludedFolders: '',
    matchCondition: 'OR',
}

export default class ImprovedRandomNotePlugin extends Plugin {
    settings: ImprovedRandomNoteSettings;

    async onload() {
        await this.loadSettings();

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'open-improved-random-note',
            name: 'Open Random Note (with filters)',
            callback: () => {
                this.openRandomNote();
            }
        });

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new ImprovedRandomNoteSettingTab(this.app, this));
    }

    onunload() {
        // Cleanup if needed
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async openRandomNote() {
        // This is the placeholder for the logic that will be implemented in Step 2.
        // For now, it just notifies that the command was triggered.
        const files = this.app.vault.getMarkdownFiles();
        if (files.length === 0) {
            console.log('No markdown files found in the vault.');
            return;
        }

        // Simple random note selection as a placeholder
        const randomFile = files[Math.floor(Math.random() * files.length)];
        this.app.workspace.getLeaf(false).openFile(randomFile);
        console.log('Opening random note:', randomFile.path);
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

        new Setting(containerEl)
            .setName('Included Folders')
            .setDesc('Folders to search in. Separate with commas. If empty, searches everywhere.')
            .addText(text => text
                .setPlaceholder('Folder1, Folder2/Sub')
                .setValue(this.plugin.settings.includedFolders)
                .onChange(async (value) => {
                    this.plugin.settings.includedFolders = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Included Tags')
            .setDesc('Tags to search for, e.g., #idea, #work. Separate with commas.')
            .addText(text => text
                .setPlaceholder('#idea, #important')
                .setValue(this.plugin.settings.includedTags)
                .onChange(async (value) => {
                    this.plugin.settings.includedTags = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Included Properties')
            .setDesc('YAML/frontmatter properties. Format: key:value or just key. Separate with commas.')
            .addText(text => text
                .setPlaceholder('status:todo, favorite')
                .setValue(this.plugin.settings.includedProperties)
                .onChange(async (value) => {
                    this.plugin.settings.includedProperties = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Excluded Folders')
            .setDesc('Folders to ignore. Separate with commas.')
            .addText(text => text
                .setPlaceholder('Templates, Archive')
                .setValue(this.plugin.settings.excludedFolders)
                .onChange(async (value) => {
                    this.plugin.settings.excludedFolders = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Match Condition')
            .setDesc('Should ALL conditions be met or at least ONE?')
            .addDropdown(dropdown => dropdown
                .addOption('OR', 'OR (Any condition)')
                .addOption('AND', 'AND (All conditions)')
                .setValue(this.plugin.settings.matchCondition)
                .onChange(async (value: 'AND' | 'OR') => {
                    this.plugin.settings.matchCondition = value;
                    await this.plugin.saveSettings();
                }));
    }
}
