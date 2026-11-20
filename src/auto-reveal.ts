import { Plugin, TAbstractFile } from 'obsidian';

// The file explorer view is not part of the public API; revealInFolder is the
// method Obsidian's own "Reveal file in navigation" command uses.
interface FileExplorerView {
	revealInFolder?: (file: TAbstractFile) => void;
}

/** Reveals the active note in the file explorer whenever a note is opened. */
export class AutoReveal {
	constructor(
		private plugin: Plugin,
		private isEnabled: () => boolean,
	) {}

	start() {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on('file-open', () => {
				if (this.isEnabled()) this.revealActive();
			}),
		);
	}

	revealActive() {
		const { workspace } = this.plugin.app;
		const file = workspace.getActiveFile();
		if (!file) return;

		const leaf = workspace.getLeavesOfType('file-explorer')[0];
		const view = leaf?.view as unknown as FileExplorerView | undefined;
		view?.revealInFolder?.(file);
	}
}
