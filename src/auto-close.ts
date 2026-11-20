import { Plugin } from 'obsidian';

// The file explorer view is not part of the public API. fileItems maps a path
// to its explorer item; folder items have setCollapsed(). Both are used only
// when present, with a click on the folder row as the fallback.
interface FileExplorerView {
	containerEl: HTMLElement;
	fileItems?: Record<string, { setCollapsed?: (collapsed: boolean) => void }>;
}

const COLLAPSED = 'is-collapsed';

/** Closes the other first-level folders when a first-level folder is opened. */
export class AutoClose {
	private observer: MutationObserver | null = null;
	private closing = false;

	constructor(
		private plugin: Plugin,
		private isEnabled: () => boolean,
	) {}

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
	}

	/** (Re)connects the observer to every file explorer container. */
	private attach() {
		this.observer?.disconnect();
		this.observer = new MutationObserver((records) =>
			this.onMutations(records),
		);
		this.plugin.app.workspace
			.getLeavesOfType('file-explorer')
			.forEach((leaf) => {
				this.observer?.observe(leaf.view.containerEl, {
					attributes: true,
					attributeFilter: ['class'],
					attributeOldValue: true,
					subtree: true,
				});
			});
	}

	private onMutations(records: MutationRecord[]) {
		if (this.closing || !this.isEnabled()) return;

		// Find the first-level folder that just went from closed to open.
		let opened: HTMLElement | null = null;
		for (const record of records) {
			const target = record.target as HTMLElement;
			if (!target.classList?.contains('nav-folder')) continue;
			const wasCollapsed = record.oldValue?.split(' ').includes(COLLAPSED);
			if (!wasCollapsed || target.classList.contains(COLLAPSED)) continue;
			if (this.isFirstLevel(target)) opened = target;
		}
		if (!opened) return;

		this.closeOthers(opened);
	}

	private titleOf(folder: HTMLElement): HTMLElement | null {
		return folder.querySelector<HTMLElement>(':scope > .nav-folder-title');
	}

	private isFirstLevel(folder: HTMLElement): boolean {
		const path = this.titleOf(folder)?.dataset.path ?? '';
		return path !== '' && !path.includes('/');
	}

	private closeOthers(opened: HTMLElement) {
		const view = this.explorerViewContaining(opened);
		const folders = Array.from(
			opened.ownerDocument.querySelectorAll<HTMLElement>('.nav-folder'),
		).filter(
			(el) =>
				el !== opened &&
				view?.containerEl.contains(el) &&
				this.isFirstLevel(el) &&
				!el.classList.contains(COLLAPSED),
		);

		this.closing = true;
		try {
			for (const folder of folders) {
				const title = this.titleOf(folder);
				const path = title?.dataset.path;
				const item = path ? view?.fileItems?.[path] : undefined;
				if (item?.setCollapsed) item.setCollapsed(true);
				else title?.click();
			}
		} finally {
			// Let the mutations caused by closing be delivered before listening again.
			window.setTimeout(() => (this.closing = false), 0);
		}
	}

	private explorerViewContaining(el: HTMLElement): FileExplorerView | undefined {
		return this.plugin.app.workspace
			.getLeavesOfType('file-explorer')
			.map((leaf) => leaf.view as unknown as FileExplorerView)
			.find((view) => view.containerEl.contains(el));
	}
}
