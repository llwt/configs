#!/usr/bin/env node

/**
 * Inlined version of Aerospace Layout Manager
 * @see https://github.com/CarterMcAlister/aerospace-layout-manager
 *
 * Setup to run with node 24 type stripping and no dependencies.
 *
 * pnpm install in root to get type resolution for development.
 */

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

// ============================================================================
// Types
// ============================================================================

type WorkspaceLayout =
  | "h_tiles"
  | "v_tiles"
  | "h_accordion"
  | "v_accordion"
  | "tiles"
  | "accordion"
  | "horizontal"
  | "vertical"
  | "tiling"
  | "floating";

type Orientation = "horizontal" | "vertical";
type Size = `${number}/${number}`;

interface LayoutWindow {
  bundleId: string;
  openIfNotRunning?: boolean;
}

interface LayoutWindowWithSize extends LayoutWindow {
  size: Size;
}

interface LayoutContainer {
  orientation: Orientation;
  layout: WorkspaceLayout;
  windows: LayoutItem[];
}

interface LayoutContainerWithSize extends LayoutContainer {
  size: Size;
}

type LayoutItem =
  | LayoutWindow
  | LayoutContainer
  | LayoutWindowWithSize
  | LayoutContainerWithSize;

type Layout = {
  workspace: string;
  layout: WorkspaceLayout;
  orientation: Orientation;
  windows: LayoutItem[];
  display?: string | number | DisplayAlias;
};

type LayoutConfig = {
  stashWorkspace: string;
  layouts: Record<string, Layout>;
};

type DisplayInfo = {
  id?: number;
  name: string;
  width: number;
  height: number;
  isMain: boolean;
  isInternal?: boolean;
};

type DisplayAlias = "main" | "secondary" | "external" | "internal";

const DisplayAlias = {
  Main: "main" as const,
  Secondary: "secondary" as const,
  External: "external" as const,
  Internal: "internal" as const,
};

type SPDisplaysDataType = {
  _name: string;
  spdisplays_ndrvs: {
    _name: string;
    "_spdisplays_display-product-id": string;
    "_spdisplays_display-serial-number": string;
    "_spdisplays_display-vendor-id": string;
    "_spdisplays_display-week": string;
    "_spdisplays_display-year": string;
    _spdisplays_displayID: string;
    _spdisplays_pixels: string;
    _spdisplays_resolution: string;
    spdisplays_main: "spdisplays_yes" | "spdisplays_no";
    spdisplays_mirror: "spdisplays_off" | "spdisplays_on";
    spdisplays_online: "spdisplays_yes" | "spdisplays_no";
    spdisplays_pixelresolution: string;
    spdisplays_resolution: string;
    spdisplays_rotation: "spdisplays_supported" | "spdisplays_not_supported";
    spdisplays_connection_type?: "spdisplays_internal" | string;
  }[];
};

const SPDisplaysValues = {
  Yes: "spdisplays_yes" as const,
  No: "spdisplays_no" as const,
  Supported: "spdisplays_supported" as const,
  Internal: "spdisplays_internal" as const,
};

// ============================================================================
// Shell Execution Helper
// ============================================================================

type WindowInfo = {
  "app-name": string;
  "window-id": number;
  "window-title": string;
  "app-bundle-id"?: string;
};

let windowCache: WindowInfo[] = [];

async function refreshWindowCache(): Promise<void> {
  try {
    windowCache = await execJSON("aerospace", [
      "list-windows",
      "--all",
      "--json",
    ]);
  } catch (error) {
    console.error("Failed to refresh window cache");
    windowCache = [];
  }
}

function formatWindowId(windowId: string | number): string {
  const id = typeof windowId === "string" ? parseInt(windowId) : windowId;
  const window = windowCache.find((w) => w["window-id"] === id);

  if (!window) {
    return `#${windowId}`;
  }

  const appName = window["app-name"];
  const title = window["window-title"];

  // If app name and title are the same, just show app name
  if (appName === title) {
    return appName;
  }

  // Truncate long titles
  const maxTitleLength = 30;
  const truncatedTitle =
    title.length > maxTitleLength
      ? title.substring(0, maxTitleLength) + "..."
      : title;

  return `${appName} | ${truncatedTitle}`;
}

type ExecOptions = {
  allowedExitCodes?: number[];
};

async function exec(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      const allowedCodes = options.allowedExitCodes || [0];
      const isAllowed = allowedCodes.includes(code || 0);

      if (isAllowed || code === 0) {
        resolve(stdout.trim());
      } else if (code === 1 && stdout) {
        // Exit code 1 with output is acceptable
        resolve(stdout.trim());
      } else {
        console.error(`Command failed: ${command} ${args.join(" ")}`);
        console.error(`Exit code: ${code}`);
        if (stderr) console.error(`Stderr: ${stderr}`);
        reject(new Error(`Command exited with code ${code}`));
      }
    });

    child.on("error", (error) => {
      console.error(`Command error: ${command} ${args.join(" ")}`);
      console.error(`Error:`, error.message);
      if (stderr) console.error(`Stderr: ${stderr}`);
      reject(error);
    });
  });
}

async function execJSON<T>(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): Promise<T> {
  const stdout = await exec(command, args, options);
  if (!stdout || stdout === "") {
    return [] as T;
  }
  return JSON.parse(stdout);
}

// ============================================================================
// Layout Validation
// ============================================================================

function validateLayout(layout: Layout): void {
  function validateItems(
    items: LayoutItem[],
    parentPath: string = "layout"
  ): void {
    if (items.length === 0) {
      return;
    }

    // Check if all windows in this group have openIfNotRunning: false
    const windows = items.filter(
      (item): item is LayoutWindow | LayoutWindowWithSize => "bundleId" in item
    );

    if (windows.length > 0) {
      const allDisabled = windows.every((w) => w.openIfNotRunning === false);

      if (allDisabled) {
        throw new Error(
          `Invalid layout at ${parentPath}: All windows have "openIfNotRunning: false". ` +
            `At least one window must be allowed to open.`
        );
      }
    }

    // Recursively validate nested containers
    for (const [index, item] of items.entries()) {
      if ("windows" in item) {
        validateItems(item.windows, `${parentPath}.windows[${index}]`);
      }
    }
  }

  validateItems(layout.windows, "layout.windows");
}

// ============================================================================
// Display Management
// ============================================================================

class DisplayManager {
  displays: DisplayInfo[] = [];

  async initialize(): Promise<void> {
    const data = await execJSON<{ SPDisplaysDataType: SPDisplaysDataType[] }>(
      "system_profiler",
      ["SPDisplaysDataType", "-json"]
    );

    this.displays = data.SPDisplaysDataType.flatMap((gpu: SPDisplaysDataType) =>
      gpu.spdisplays_ndrvs?.map((d) => ({
        name: d._name,
        id: Number.parseInt(d._spdisplays_displayID) || undefined,
        width: Number.parseInt(
          (d._spdisplays_resolution || d.spdisplays_resolution || "").split(
            " x "
          )[0] || "0",
          10
        ),
        height: Number.parseInt(
          (d._spdisplays_resolution || d.spdisplays_resolution || "").split(
            " x "
          )[1] || "0",
          10
        ),
        isMain: d.spdisplays_main === SPDisplaysValues.Yes,
        isInternal: d.spdisplays_connection_type === SPDisplaysValues.Internal,
      }))
    );
  }

  getDisplays(): DisplayInfo[] {
    return this.displays;
  }

  selectDisplay(layout: Layout): DisplayInfo {
    if (!layout.display) {
      return this.getMainDisplay()!;
    }

    let selectedDisplay: DisplayInfo | undefined;

    if (
      typeof layout.display === "string" &&
      Number.isNaN(Number(layout.display))
    ) {
      const isAlias = Object.values(DisplayAlias).includes(
        layout.display as DisplayAlias
      );
      selectedDisplay = isAlias
        ? this.getByAlias(layout.display as DisplayAlias)
        : this.getByName(layout.display);
    } else {
      selectedDisplay = this.getById(Number(layout.display));
    }

    if (!selectedDisplay) {
      console.log(
        `Display not found: ${layout.display}. Defaulting to main display.`
      );
      selectedDisplay = this.getMainDisplay()!;
    }

    console.log(
      `Using display: ${selectedDisplay.name} (${selectedDisplay.width}x${selectedDisplay.height}) ` +
        `(${selectedDisplay.isMain ? "main" : "secondary"}, ${
          selectedDisplay.isInternal ? "internal" : "external"
        })`
    );

    return selectedDisplay;
  }

  private getMainDisplay(): DisplayInfo | undefined {
    return this.displays.find((d) => d.isMain);
  }

  private getById(id: number): DisplayInfo | undefined {
    return this.displays.find((d) => d.id === id);
  }

  private getByName(pattern: string): DisplayInfo | undefined {
    return this.displays.find((d) => new RegExp(pattern, "i").test(d.name));
  }

  private getByAlias(alias: DisplayAlias): DisplayInfo | undefined {
    switch (alias) {
      case DisplayAlias.Main:
        return this.getMainDisplay();

      case DisplayAlias.Secondary: {
        if (this.displays.length < 2) {
          console.log(
            "Alias 'secondary' used but only one display found. Using main display."
          );
          return this.getMainDisplay();
        }
        if (this.displays.length > 2) {
          throw new Error(
            "Alias 'secondary' used but multiple secondary displays found. Please specify exact display."
          );
        }
        return this.displays.find((d) => !d.isMain);
      }

      case DisplayAlias.External: {
        const externals = this.displays.filter((d) => !d.isInternal);
        if (externals.length === 0) {
          console.log(
            "Alias 'external' used but no external displays found. Using main display."
          );
          return this.getMainDisplay();
        }
        if (externals.length > 1) {
          throw new Error(
            "Multiple external displays found. Please specify exact display."
          );
        }
        return externals[0];
      }

      case DisplayAlias.Internal:
        return this.displays.find((d) => d.isInternal);
    }
  }
}

// ============================================================================
// Aerospace API Wrapper
// ============================================================================

class AerospaceAPI {
  async flattenWorkspace(workspace: string): Promise<void> {
    await exec("aerospace", [
      "flatten-workspace-tree",
      "--workspace",
      workspace,
    ]);
  }

  async switchWorkspace(workspace: string): Promise<void> {
    await exec("aerospace", ["workspace", workspace]);
  }

  async moveWindowToWorkspace(
    windowId: string,
    workspace: string
  ): Promise<void> {
    await exec("aerospace", [
      "move-node-to-workspace",
      "--window-id",
      windowId,
      workspace,
      "--focus-follows-window",
    ]);
  }

  async getWindowsInWorkspace(workspace: string): Promise<
    Array<{
      "app-name": string;
      "window-id": string;
      "window-title": string;
      "app-bundle-id": string;
    }>
  > {
    return await execJSON("aerospace", [
      "list-windows",
      "--workspace",
      workspace,
      "--json",
    ]);
  }

  async getWindowIdsByBundleId(bundleId: string): Promise<string[]> {
    const windows = await execJSON<any[]>("aerospace", [
      "list-windows",
      "--monitor",
      "all",
      "--app-bundle-id",
      bundleId,
      "--json",
    ]);

    if (windows.length === 0) {
      console.log("No windows found for", bundleId);
      return [];
    }
    return windows.map((w) => w["window-id"]);
  }

  async joinWindowWithLeft(windowId: string): Promise<void> {
    console.log(
      `Joining window with left neighbor: ${formatWindowId(windowId)}`
    );
    await exec("aerospace", ["join-with", "--window-id", windowId, "left"]);
  }

  async moveWindowLeft(windowId: string): Promise<void> {
    console.log(`Moving window left: ${formatWindowId(windowId)}`);
    await exec("aerospace", ["move", "--window-id", windowId, "left"]);
  }

  async focusWindow(windowId: string): Promise<void> {
    await exec("aerospace", ["focus", "--window-id", windowId]);
  }

  async setWindowLayout(
    windowId: string,
    layout: WorkspaceLayout
  ): Promise<void> {
    console.log(
      `Setting window layout: ${formatWindowId(windowId)} → ${layout}`
    );
    await exec("aerospace", ["layout", layout, "--window-id", windowId], {
      // aerospace exits with code 1 if already in requested layout so it's safe to ignore
      allowedExitCodes: [0, 1],
    });
  }

  async resizeWindow(
    windowId: string,
    dimension: "width" | "height",
    pixels: number
  ): Promise<void> {
    console.log(
      `Resizing window: ${formatWindowId(windowId)} ${dimension} → ${pixels}px`
    );
    await exec("aerospace", [
      "resize",
      "--window-id",
      windowId,
      dimension,
      pixels.toString(),
    ]);
  }

  async launchApp(bundleId: string): Promise<void> {
    const isRunning = await exec("osascript", [
      "-e",
      `application id "${bundleId}" is running`,
    ]);
    if (isRunning !== "true") {
      await exec("open", ["-b", bundleId]);
    }
  }

  async waitForWindow(bundleId: string, timeoutMs = 3000): Promise<string[]> {
    const maxAttempts = Math.ceil(timeoutMs / 100);
    for (let i = 0; i < maxAttempts; i++) {
      const windowIds = await this.getWindowIdsByBundleId(bundleId);
      if (windowIds.length > 0) {
        return windowIds;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return [];
  }
}

// ============================================================================
// Layout Orchestrator
// ============================================================================

class LayoutOrchestrator {
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

    console.log("Resizing windows...");
    await this.resizeWindows();

    console.log("Switching to workspace...");
    await this.api.switchWorkspace(this.layout.workspace);

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

      // Skip first window in each group (it's the anchor)
      if (windowGroupIndex === 0) {
        windowGroupIndex++;
        continue;
      }

      // Join or move subsequent windows
      const windowIds = await this.api.getWindowIdsByBundleId(item.bundleId);
      for (const windowId of windowIds) {
        await this.api.focusWindow(windowId);

        if (windowGroupIndex === 1) {
          // First window after anchor: join with anchor
          await this.api.joinWindowWithLeft(windowId);
        } else {
          // Subsequent windows: just move left
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

// ============================================================================
// CLI
// ============================================================================

function printHelp() {
  console.log(`
Aerospace Layout Manager

Usage:
  aerospace-layout-manager [options] <layout-name>

Options:
  -l, --layout <layout-name>   Specify the layout name (can also be provided as the first positional argument)
  -c, --configFile <path>      Path to the layout configuration file (default: ~/.config/aerospace/layouts.json)
  -L, --listLayouts            List available layout names from the configuration file
  -d, --listDisplays           List available display names
  -h, --help                   Show this help message and exit

Examples:
  # Apply the 'work' layout defined in the config
  aerospace-layout-manager work

  # Same as above using the explicit flag
  aerospace-layout-manager --layout work

  # List all available layouts
  aerospace-layout-manager --listLayouts

  # List all available displays
  aerospace-layout-manager --listDisplays
`);
}

async function main() {
  const args = parseArgs({
    args: process.argv.slice(2),
    options: {
      layout: { type: "string", short: "l" },
      configFile: {
        type: "string",
        short: "c",
        default: "~/.config/aerospace/layouts.json",
      },
      listLayouts: { type: "boolean", short: "L" },
      help: { type: "boolean", short: "h" },
      listDisplays: { type: "boolean", short: "d" },
    },
    strict: true,
    allowPositionals: true,
  });

  if (args.values.help) {
    printHelp();
    process.exit(0);
  }

  // Load config - expand tilde manually
  let configFilePath = args.values.configFile!;
  if (configFilePath.startsWith("~")) {
    configFilePath = configFilePath.replace("~", homedir());
  }

  const configContent = await readFile(configFilePath, "utf-8");
  const layoutConfig: LayoutConfig = JSON.parse(configContent);

  // Handle list commands
  if (args.values.listLayouts) {
    console.log(Object.keys(layoutConfig.layouts).join("\n"));
    process.exit(0);
  }

  const displayManager = new DisplayManager();
  await displayManager.initialize();

  if (args.values.listDisplays) {
    console.log(
      displayManager
        .getDisplays()
        .map((d) => d.name)
        .join("\n")
    );
    process.exit(0);
  }

  // Get layout name
  const layoutName = args.values.layout || args.positionals[0];
  if (!layoutName) {
    printHelp();
    process.exit(0);
  }

  // Validate layout
  const layout = layoutConfig.layouts[layoutName];
  if (!layout) {
    throw new Error(`Layout not found: ${layoutName}`);
  }

  // Validate layout structure
  try {
    validateLayout(layout);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Layout validation failed: ${error.message}`);
    }
    throw error;
  }

  // Select display
  const display = displayManager.selectDisplay(layout);
  if (!display) {
    throw new Error(`Could not select display for layout: ${layoutName}`);
  }

  // Apply layout
  const api = new AerospaceAPI();
  const orchestrator = new LayoutOrchestrator(
    api,
    display,
    layout,
    layoutConfig.stashWorkspace ?? "S"
  );

  await orchestrator.apply();
}

main();
