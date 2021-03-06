import type { BaseCommand } from 'mpilot'

// @ts-ignore
import type { Polygon } from '@flatten-js/core'

export interface LayoutNode {
  id: string
  command: BaseCommand
  parent?: LayoutNode
  children: LayoutNode[]
  offset: { x: number; y: number }
  pos: number
  polygon: Polygon
  collapsed: boolean
}

export type GroupedNodes = LayoutNode & {
  nodes: LayoutNode[]
}

export type DiagramMode = 'full' | 'narrow'

export interface SelectEvent {
  node: LayoutNode
}

export interface InfoEvent {
  node: LayoutNode
}

export interface NodeValue {
  value: number
  label: string
  color: string
}

export interface NodeValues {
  [name: string]: NodeValue
}

export interface NodeLabels {
  [name: string]: string
}
