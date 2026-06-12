import type { RenderNode } from '../snapshot/types';

export type RenderChangeType =
  | 'inserted'
  | 'deleted'
  | 'text-changed'
  | 'style-changed'
  | 'layout-changed'
  | 'size-changed';

export interface RenderDiffOptions {
  compareText?: boolean;
  compareStyle?: boolean;
  compareLayout?: boolean;
  layoutThreshold?: number;
  getNodeKey?: (el: Element) => string | null;
}

export interface RenderChange {
  type: RenderChangeType;
  oldNodeId?: string;
  newNodeId?: string;
  oldRect?: RenderNode['rect'];
  newRect?: RenderNode['rect'];
}

export interface RenderNodePair {
  oldNode?: RenderNode;
  newNode?: RenderNode;
}

export interface RenderDiffResult {
  changes: RenderChange[];
  pairs: RenderNodePair[];
}
