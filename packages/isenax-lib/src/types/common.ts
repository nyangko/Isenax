export interface Coords {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  from: Coords;
  to: Coords;
}

export const ProjectionOrientationEnum = {
  X: 'X',
  Y: 'Y'
} as const;

export type BoundingBox = [Coords, Coords, Coords, Coords];

export type SlimMouseEvent = Pick<
  MouseEvent,
  'clientX' | 'clientY' | 'target' | 'type' | 'preventDefault' | 'button' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'
>;

export const EditorModeEnum = {
  NON_INTERACTIVE: 'NON_INTERACTIVE',
  EXPLORABLE_READONLY: 'EXPLORABLE_READONLY',
  // Same editing restrictions as EXPLORABLE_READONLY (every gate keys off
  // `editorMode !== 'EDITABLE'`), but keeps MAIN_MENU/TOOL_MENU chrome
  // visible -- for a user locking their own diagram, vs. a public read-only
  // viewer link where hiding that chrome is intentional.
  LOCKED: 'LOCKED',
  EDITABLE: 'EDITABLE'
} as const;

// ISOMETRIC is the classic tilted diamond grid; FLAT is a straight top-down
// square grid — same scene, same interactions, different camera angle.
export const ProjectionModeEnum = {
  ISOMETRIC: 'ISOMETRIC',
  FLAT: 'FLAT'
} as const;

// Where the tool menu (select/pan/add-node/rectangle/connector/text) docks
// -- TOP is a horizontal bar top-right (default), LEFT a vertical bar
// centered on the left edge.
export const ToolbarPositionEnum = {
  TOP: 'TOP',
  LEFT: 'LEFT'
} as const;

export const MainMenuOptionsEnum = {
  'ACTION.OPEN': 'ACTION.OPEN',
  'ACTION.SETTINGS': 'ACTION.SETTINGS',
  'EXPORT.JSON': 'EXPORT.JSON',
  'EXPORT.JSON_COMPACT': 'EXPORT.JSON_COMPACT',
  'EXPORT.PNG': 'EXPORT.PNG',
  'ACTION.CLEAR_CANVAS': 'ACTION.CLEAR_CANVAS',
  'LINK.GITHUB': 'LINK.GITHUB',
  'LINK.DISCORD': 'LINK.DISCORD',
  VERSION: 'VERSION'
} as const;

export type MainMenuOptions = (keyof typeof MainMenuOptionsEnum)[];
