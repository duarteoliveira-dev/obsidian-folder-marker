import { Plugin, debounce } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	HEX_COLOR,
	NOTE_MARKS,
	FolderMarkerSettings,
	FolderMarkerSettingTab,
} from './settings';
import { FolderChips } from './chips';
import { AutoReveal } from './auto-reveal';
import { AutoClose } from './auto-close';

// Remember to rename these classes and interfaces!

export default class FolderMarkerPlugin extends Plugin {
	settings!: FolderMarkerSettings;
	chips!: FolderChips;
	autoReveal!: AutoReveal;
	autoClose!: AutoClose;

	// Colors apply live; disk writes are batched while the picker is dragged.
	saveSettingsDebounced = debounce(() => void this.saveSettings(), 500, true);

	async onload() {
		await this.loadSettings();

		this.chips = new FolderChips(this);
		this.chips.setColor(this.settings.chipColorLevel1);
		this.chips.setNoteMark(this.settings.noteMark);
		this.chips.start();

		this.autoReveal = new AutoReveal(this, () => this.settings.autoReveal);
		this.autoReveal.start();

		this.autoClose = new AutoClose(
			this,
			() => this.settings.autoCloseFolders,
		);
		this.autoClose.start();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FolderMarkerSettingTab(this.app, this));
	}

	onunload() {
		void this.saveSettings();
		this.chips.stop();
		this.autoClose.stop();
	}

	async loadSettings() {
		const data = ((await this.loadData()) ?? {}) as Partial<FolderMarkerSettings> & {
			showNoteIcon?: boolean;
		};
		// Migrate the old on/off toggle to the new dropdown.
		if (data.noteMark === undefined && data.showNoteIcon === false) {
			data.noteMark = 'none';
		}
		delete data.showNoteIcon;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
		if (typeof this.settings.autoReveal !== 'boolean') {
			this.settings.autoReveal = DEFAULT_SETTINGS.autoReveal;
		}
		if (typeof this.settings.autoCloseFolders !== 'boolean') {
			this.settings.autoCloseFolders = DEFAULT_SETTINGS.autoCloseFolders;
		}
		if (!NOTE_MARKS.includes(this.settings.noteMark)) {
			this.settings.noteMark = DEFAULT_SETTINGS.noteMark;
		}
		if (!HEX_COLOR.test(this.settings.chipColorLevel1)) {
			this.settings.chipColorLevel1 = DEFAULT_SETTINGS.chipColorLevel1;
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
