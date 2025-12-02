import {
  type Layout,
  type LayoutItem,
  type LayoutWindow,
  type LayoutWindowWithSize,
  type DisplayInfo,
  type SPDisplaysDataType,
  SPDisplaysValues,
  DisplayAlias,
  type LayoutConfig,
  type WorkspaceLayout,
  type Size,
} from "./common.ts";

// ============================================================================
// Layout Orchestrator
// ============================================================================

export class LayoutOrchestrator {
  private api: AerospaceAPI;
  private display: DisplayInfo;
  private layout: Layout;
  private stashWorkspace: string;

  constructor(
    api: AerospaceAPI,
    display: DisplayInfo,
    layout: Layout,
    stashWorkspace: string
  ) {
    this.api = api;
    this.display = display;
    this.layout = layout;
    this.stashWorkspace = stashWorkspace;
  }

  async apply(): Promise<void> {
    console.log("Refreshing window cache...");
    await refreshWindowCache();

    console.log("Clearing workspace...");
    await this.clearWorkspace();

    console.log("Moving windows to workspace...");
    await this.moveWindowsToWorkspace();

    console.log("Refreshing window cache...");
    await refreshWindowCache();

    console.log("Preparing workspace...");
    await this.prepareWorkspace();

    console.log("Repositioning windows...");
    await this.repositionWindows();

    // console.log("Resizing windows...");
    // await this.resizeWindows();

    // console.log("Switching to workspace...");
    // await this.api.switchWorkspace(this.layout.workspace);

    console.log("Done!");
  }

  private async clearWorkspace(): Promise<void> {
    console.log(`Getting windows in workspace ${this.layout.workspace}...`);
    const windows = await this.api.getWindowsInWorkspace(this.layout.workspace);
    console.log(`Found ${windows.length} windows to move`);
    for (const window of windows) {
      if (window["window-id"]) {
        console.log(
          `Moving ${formatWindowId(window["window-id"])} to workspace ${
            this.stashWorkspace
          }`
        );
        await this.api.moveWindowToWorkspace(
          window["window-id"],
          this.stashWorkspace
        );
      }
    }
  }

  private async moveWindowsToWorkspace(): Promise<void> {
    await this.traverseItems(this.layout.windows, async (item) => {
      if ("bundleId" in item) {
        const shouldOpen = item.openIfNotRunning !== false;

        if (shouldOpen) {
          await this.api.launchApp(item.bundleId);
          const windowIds = await this.api.waitForWindow(item.bundleId);
          for (const windowId of windowIds) {
            await this.api.moveWindowToWorkspace(
              windowId,
              this.layout.workspace
            );
            // make sure floating windows are put into flow
            await this.api.setWindowLayout(windowId, "tiling");
          }
        } else {
          // Don't wait, just check if windows exist
          const windowIds = await this.api.getWindowIdsByBundleId(
            item.bundleId
          );
          if (windowIds.length === 0) {
            console.log(
              `Skipping ${item.bundleId} (not running, openIfNotRunning: false)`
            );
          } else {
            for (const windowId of windowIds) {
              await this.api.moveWindowToWorkspace(
                windowId,
                this.layout.workspace
              );
              // make sure floating windows are put into flow
              await this.api.setWindowLayout(windowId, "tiling");
            }
          }
        }
      }
    });
  }

  private async prepareWorkspace(): Promise<void> {
    await this.api.flattenWorkspace(this.layout.workspace);

    const windows = await this.api.getWindowsInWorkspace(this.layout.workspace);
    if (windows[0]?.["window-id"]) {
      await this.api.setWindowLayout(
        windows[0]["window-id"],
        this.layout.layout
      );
    }
  }

  private async repositionWindows(): Promise<void> {
    await this.repositionGroup(this.layout.windows);
  }

  private async repositionGroup(items: LayoutItem[]): Promise<string | null> {
    let lastWindowId: string | null = null;
    let windowGroupIndex = 0;

    for (const item of items) {
      if ("windows" in item) {
        // Nested container
        lastWindowId = await this.repositionGroup(item.windows);
        if (item.layout && lastWindowId) {
          await this.api.setWindowLayout(lastWindowId, item.layout);
        }
        continue;
      }

      if (!("bundleId" in item)) {
        throw new Error(
          "Invalid layout item: must contain bundleId or windows"
        );
      }

      // Join or move subsequent windows
      const windowIds = await this.api.getWindowIdsByBundleId(item.bundleId);
      for (const windowId of windowIds) {
        await this.api.focusWindow(windowId);

        // Skip first window in each group (it's the anchor)
        if (windowGroupIndex === 0) {
          windowGroupIndex++;
          console.log(
            `Skipping anchor window in group ${formatWindowId(windowId)}`
          );
          continue;
        } else if (windowGroupIndex === 1) {
          // First window after anchor: join with anchor
          await this.api.joinWindowWithLeft(windowId);
        } else {
          // Subsequent windows: just move left into group
          await this.api.moveWindowLeft(windowId);
        }

        windowGroupIndex++;
        lastWindowId = windowId;
      }
    }

    return lastWindowId;
  }

  private async resizeWindows(): Promise<void> {
    await this.resizeGroup(this.layout.windows, null);
  }

  private async resizeGroup(
    items: LayoutItem[],
    parent: LayoutItem | null
  ): Promise<void> {
    for (const item of items) {
      if ("windows" in item) {
        // Handle container sizing
        if ("size" in item) {
          const firstChild = item.windows[0];
          if (firstChild && "bundleId" in firstChild) {
            const windowIds = await this.api.getWindowIdsByBundleId(
              firstChild.bundleId
            );
            if (windowIds[0]) {
              const dimension = this.getDimension(parent);
              const pixels = this.calculatePixels(item.size, dimension);
              await this.api.resizeWindow(windowIds[0], dimension, pixels);
            }
          }
        }
        await this.resizeGroup(item.windows, item);
        continue;
      }

      // Handle window sizing
      if ("size" in item && "bundleId" in item) {
        const windowIds = await this.api.getWindowIdsByBundleId(item.bundleId);
        if (windowIds[0]) {
          const dimension = this.getDimension(parent ?? item);
          const pixels = this.calculatePixels(item.size, dimension);
          await this.api.resizeWindow(windowIds[0], dimension, pixels);
        }
      }
    }
  }

  private getDimension(item: LayoutItem | null): "width" | "height" {
    if (item && "orientation" in item) {
      return item.orientation === "horizontal" ? "width" : "height";
    }
    return this.layout.orientation === "horizontal" ? "width" : "height";
  }

  private calculatePixels(size: Size, dimension: "width" | "height"): number {
    const screenDimension =
      dimension === "width" ? this.display.width : this.display.height;
    const [numerator, denominator] = size.split("/").map(Number);

    if (!numerator || !denominator) {
      throw new Error(`Invalid size format: ${size}`);
    }

    return Math.floor(screenDimension * (numerator / denominator));
  }

  private async traverseItems(
    items: LayoutItem[],
    fn: (item: LayoutItem) => Promise<void>
  ): Promise<void> {
    for (const item of items) {
      await fn(item);
      if ("windows" in item) {
        await this.traverseItems(item.windows, fn);
      }
    }
  }
}
