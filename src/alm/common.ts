export type WorkspaceLayout =
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

export type Orientation = "horizontal" | "vertical";
export type Size = `${number}/${number}`;

export interface LayoutWindow {
  bundleId: string;
  openIfNotRunning?: boolean;
}

export interface LayoutWindowWithSize extends LayoutWindow {
  size: Size;
}

export interface LayoutContainer {
  orientation: Orientation;
  layout: WorkspaceLayout;
  windows: LayoutItem[];
}

export interface LayoutContainerWithSize extends LayoutContainer {
  size: Size;
}

export type LayoutItem =
  | LayoutWindow
  | LayoutContainer
  | LayoutWindowWithSize
  | LayoutContainerWithSize;

export type Layout = {
  workspace: string;
  layout: WorkspaceLayout;
  orientation: Orientation;
  windows: LayoutItem[];
  display?: string | number | DisplayAlias;
};

export type LayoutConfig = {
  stashWorkspace: string;
  layouts: Record<string, Layout>;
};

export type DisplayInfo = {
  id?: number;
  name: string;
  width: number;
  height: number;
  isMain: boolean;
  isInternal?: boolean;
};

export type DisplayAlias = "main" | "secondary" | "external" | "internal";

export const DisplayAlias = {
  Main: "main" as const,
  Secondary: "secondary" as const,
  External: "external" as const,
  Internal: "internal" as const,
};

export type SPDisplaysDataType = {
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

export const SPDisplaysValues = {
  Yes: "spdisplays_yes" as const,
  No: "spdisplays_no" as const,
  Supported: "spdisplays_supported" as const,
  Internal: "spdisplays_internal" as const,
};
