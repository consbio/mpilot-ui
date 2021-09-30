import type { BaseCommand } from 'mpilot/lib/commands'

// @ts-ignore
import type { Polygon } from '@flatten-js/core'

export interface LayoutNode {
  command: BaseCommand
  parent?: LayoutNode
  children: LayoutNode[]
  offset: { x: number; y: number }
  pos: number
  polygon: Polygon
  expand: boolean
}

export type DiagramMode = 'full' | 'narrow'

export interface SelectEvent {
  node: LayoutNode
}
