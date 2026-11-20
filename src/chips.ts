import { Plugin } from 'obsidian';
import { colorForIndex } from './colors';
import type { NoteMark } from './settings';

const CHIP_CLASS = 'folder-chips-level1';
const CHIP2_CLASS = 'folder-chips-level2';
const COLOR_VAR = '--folder-chips-level1';
const COLOR2_VAR = '--folder-chips-level2';
const FILE_CLASSES = [
	'folder-chips-file-icon',
	'folder-chips-file-bullet',
	'folder-chips-file-underscore',
];

/**
 * Marks every folder and note in the file explorer so styles.css can draw a colored
 * chip to the left of its name. First-level folders get their own color
 * (the "level 1" chip); all deeper folders get the "level 2" chip, in the
 * color of their first-level ancestor.
 */
export class FolderChips {
	private observer: MutationObserver | null = null;
	private scheduled = false;
	private color = '#ffffff';
	private noteMark: NoteMark = 'bullet';

	constructor(private plugin: Plugin) {}

	start() {
		const { workspace } = this.plugin.app;
		this.plugin.registerEvent(
			workspace.on('layout-change', () => this.attach()),
		);
		workspace.onLayoutReady(() => this.attach());
	}

	stop() {
		this.observer?.disconnect();
		this.observer = null;
		activeDocument
			.querySelectorAll<HTMLElement>(
				[CHIP_CLASS, CHIP2_CLASS, ...FILE_CLASSES].map((c) => `.${c}`).join(', '),
			)
			.forEach((el) => {
				el.classList.remove(CHIP_CLASS, CHIP2_CLASS, ...FILE_CLASSES);
				el.style.removeProperty(COLOR_VAR);
				el.style.removeProperty(COLOR2_VAR);
			});
	}

	setColor(color: string) {
		this.color = color;
		this.mark();
	}

	setNoteMark(mark: NoteMark) {
		this.noteMark = mark;
		this.mark();
	}

	/** (Re)connects the observer to every file explorer container. */
	private attach() {
		this.observer?.disconnect();
		this.observer = new MutationObserver(() => this.scheduleMark());
		this.plugin.app.workspace
			.getLeavesOfType('file-explorer')
			.forEach((leaf) => {
				this.observer?.observe(leaf.view.containerEl, {
					childList: true,
					subtree: true,
				});
			});
		this.mark();
	}

	// The explorer re-renders often; coalesce bursts of mutations.
	private scheduleMark() {
		if (this.scheduled) return;
		this.scheduled = true;
		window.requestAnimationFrame(() => {
			this.scheduled = false;
			this.mark();
		});
	}

	private mark() {
		this.plugin.app.workspace
			.getLeavesOfType('file-explorer')
			.forEach((leaf) => {
				// Level 1 folders in explorer order; they precede their children in the DOM.
				const level1Colors = new Map<string, string>();
				leaf.view.containerEl
					.querySelectorAll<HTMLElement>('.nav-folder-title[data-path]')
					.forEach((el) => {
						const path = el.dataset.path ?? '';
						const parts = path.split('/');
						const level = path === '' ? 0 : parts.length;
						let color1: string | undefined;
						let color2: string | undefined;

						if (level === 1) {
							color1 = colorForIndex(this.color, level1Colors.size);
							level1Colors.set(path, color1);
						} else if (level >= 2) {
							color2 = parts[0] ? level1Colors.get(parts[0]) : undefined;
						}

						el.classList.toggle(CHIP_CLASS, color1 !== undefined);
						el.classList.toggle(CHIP2_CLASS, color2 !== undefined);
						this.setVar(el, COLOR_VAR, color1);
						this.setVar(el, COLOR2_VAR, color2);
					});

				// Notes get the mark chosen in the settings.
				leaf.view.containerEl
					.querySelectorAll<HTMLElement>('.nav-file-title[data-path]')
					.forEach((el) => {
						const path = el.dataset.path ?? '';
						const isNote = path.toLowerCase().endsWith('.md');
						el.classList.toggle(
							'folder-chips-file-icon',
							isNote && this.noteMark === 'icon',
						);
						el.classList.toggle(
							'folder-chips-file-bullet',
							isNote && this.noteMark === 'bullet',
						);
						el.classList.toggle(
							'folder-chips-file-underscore',
							isNote && this.noteMark === 'underscore',
						);
					});
			});
	}

	private setVar(el: HTMLElement, name: string, value?: string) {
		if (value) el.style.setProperty(name, value);
		else el.style.removeProperty(name);
	}
}
