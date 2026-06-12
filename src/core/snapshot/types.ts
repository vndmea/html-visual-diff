export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RenderNodeType = 'element' | 'text';

export interface RenderNode {
  id: string;
  tagName: string;
  nodeType: RenderNodeType;
  text?: string;
  textAnchorId?: string;
  attributes: Record<string, string>;
  styles: Record<string, string>;
  rect: Rect;
  children: RenderNode[];
  path: string;
}

export interface RenderSnapshot {
  root: RenderNode;
}
