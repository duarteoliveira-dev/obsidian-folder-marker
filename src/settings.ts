import { App, PluginSettingTab, Setting } from 'obsidian';
import FolderMarkerPlugin from './main';

export type NoteMark = 'none' | 'icon' | 'bullet' | 'underscore';

export const NOTE_MARKS: NoteMark[] = ['none', 'icon', 'bullet', 'underscore'];

export interface FolderMarkerSettings {
	chipColorLevel1: string;
	noteMark: NoteMark;
	autoReveal: boolean;
	autoCloseFolders: boolean;
}

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const DEFAULT_SETTINGS: FolderMarkerSettings = {
	chipColorLevel1: '#ffffff',
	noteMark: 'bullet',
	autoReveal: false,
	autoCloseFolders: false,
};

export class FolderMarkerSettingTab extends PluginSettingTab {
	plugin: FolderMarkerPlugin;

	constructor(app: App, plugin: FolderMarkerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setClass('folder-chips-setting')
			.setName('First folder color')
			.setDesc('Color of the chip on the first folder. The other first-level folders get automatic colors derived from it.')
			.addColorPicker((color) =>
				color
					.setValue(this.plugin.settings.chipColorLevel1)
					.onChange((value) => {
						this.plugin.settings.chipColorLevel1 = value;
						this.plugin.chips.setColor(value);
						this.plugin.saveSettingsDebounced();
					}),
			);

		new Setting(containerEl)
			.setName('Note mark')
			.setDesc('Mark shown to the left of note names.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('none', 'No mark')
					.addOption('icon', 'Icon')
					.addOption('bullet', 'Bullet')
					.addOption('underscore', 'Underscore')
					.setValue(this.plugin.settings.noteMark)
					.onChange((value) => {
						const mark = value as NoteMark;
						this.plugin.settings.noteMark = mark;
						this.plugin.chips.setNoteMark(mark);
						this.plugin.saveSettingsDebounced();
					}),
			);

		new Setting(containerEl)
			.setName('Auto reveal note')
			.setDesc('Reveal the open note in the file explorer, expanding its folders.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoReveal)
					.onChange((value) => {
						this.plugin.settings.autoReveal = value;
						if (value) this.plugin.autoReveal.revealActive();
						this.plugin.saveSettingsDebounced();
					}),
			);

		new Setting(containerEl)
			.setName('Auto close folders')
			.setDesc('When you open a first-level folder, close the other first-level folders.')
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoCloseFolders)
					.onChange((value) => {
						this.plugin.settings.autoCloseFolders = value;
						this.plugin.saveSettingsDebounced();
					}),
			);
	}
}
