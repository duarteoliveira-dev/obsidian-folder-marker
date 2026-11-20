import { App, PluginSettingTab, SettingDefinitionItem } from 'obsidian';
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

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'First folder color',
				desc: 'Color of the chip on the first folder. The other first-level folders get automatic colors derived from it.',
				control: { type: 'color', key: 'chipColorLevel1' },
			},
			{
				name: 'Note mark',
				desc: 'Mark shown to the left of note names.',
				control: {
					type: 'dropdown',
					key: 'noteMark',
					options: {
						none: 'No mark',
						icon: 'Icon',
						bullet: 'Bullet',
						underscore: 'Underscore',
					},
				},
			},
			{
				name: 'Auto reveal note',
				desc: 'Reveal the open note in the file explorer, expanding its folders.',
				control: { type: 'toggle', key: 'autoReveal' },
			},
			{
				name: 'Auto close folders',
				desc: 'When you open a first-level folder, close the other first-level folders.',
				control: { type: 'toggle', key: 'autoCloseFolders' },
			},
		];
	}

	setControlValue(key: string, value: unknown): void {
		const settings = this.plugin.settings;
		switch (key) {
			case 'chipColorLevel1':
				if (typeof value !== 'string' || !HEX_COLOR.test(value)) return;
				settings.chipColorLevel1 = value;
				this.plugin.chips.setColor(value);
				break;
			case 'noteMark':
				if (!NOTE_MARKS.includes(value as NoteMark)) return;
				settings.noteMark = value as NoteMark;
				this.plugin.chips.setNoteMark(settings.noteMark);
				break;
			case 'autoReveal':
				settings.autoReveal = value === true;
				if (settings.autoReveal) this.plugin.autoReveal.revealActive();
				break;
			case 'autoCloseFolders':
				settings.autoCloseFolders = value === true;
				break;
			default:
				return;
		}
		this.plugin.saveSettingsDebounced();
	}
}
