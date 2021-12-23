import type { Program } from 'mpilot/lib'
import { BaseCommand } from 'mpilot/lib/commands'
import { NODE_SIZE, NODE_SPACING } from './constants'

// eslint-disable-next-line import/no-unresolved
import type { LayoutNode, GroupedNodes } from './components'

// @ts-ignore
import { Polygon, Box, Vector, BooleanOperations } from '@flatten-js/core'

export const flatten = (arr: any[]) => {
  let result: any[] = []

  arr.forEach(item => {
    if (Array.isArray(item)) {
      result = [...result, ...flatten(item)]
    } else {
      result.push(item)
    }
  })

  return result
}

export const isChildOf = (child: LayoutNode, parent: LayoutNode): boolean => {
  if (child.id === parent.id) {
    return true
  }

  if (!parent.children.length) {
    return false
  }

  if (parent.children.some(c => c.id === child.id)) {
    return true
  }

  return parent.children.some(c => isChildOf(child, c))
}

export const findNode = (root: LayoutNode, node: LayoutNode): LayoutNode | null => {
  if (root.command.resultName === node.command.resultName) {
    return root
  }

  for (let i = 0; i < root.children.length; i += 1) {
    const result = findNode(root.children[i], node)
    if (result) {
      return result
    }
  }

  return null
}

export const makeId = (command: BaseCommand, n: number) => {
  const base = command.resultName
    .split(/\s+/)
    .map(s => s.toLowerCase())
    .join('-')
  return `${base}-${n}`
}

export const layoutTree = (
  root: BaseCommand,
  dependencies: { [resultName: string]: string[] },
  program: Program,
  yOffset = 0,
  id = 0,
): LayoutNode => {
  const children =
    dependencies[root.resultName]?.map((name, i) =>
      layoutTree(program.commands[name], dependencies, program, yOffset + NODE_SIZE.h + NODE_SPACING.y, id + i + 1),
    ) || []

  let polygon: Polygon | null = null
  children.forEach((child, i) => {
    if (polygon === null) {
      polygon = child.polygon
      return
    }

    if (i > 0) {
      const prevChild = children[i - 1]
      child.offset.x = prevChild.offset.x + prevChild.pos
      child.polygon = child.polygon.translate(new Vector(child.offset.x, 0))
    }

    let intersection = BooleanOperations.intersect(polygon, child.polygon)
    while (!intersection.isEmpty()) {
      const box = intersection.box
      const overlapWidth = box.xmax - box.xmin
      child.offset.x += overlapWidth
      child.polygon = child.polygon.translate(new Vector(overlapWidth, 0))
      intersection = BooleanOperations.intersect(polygon, child.polygon)
    }

    child.offset.x += NODE_SPACING.x
    child.polygon = child.polygon.translate(new Vector(NODE_SPACING.x, 0))

    polygon = BooleanOperations.unify(polygon, child.polygon)
  })

  let rootPos
  if (children.length) {
    const firstChild = children[0]
    const lastChild = children[children.length - 1]
    const start = firstChild.offset.x + firstChild.pos
    const end = lastChild.offset.x + lastChild.pos + NODE_SIZE.w

    rootPos = firstChild.offset.x + firstChild.pos + (end - start) / 2 - NODE_SIZE.w / 2

    if (polygon) {
      polygon = BooleanOperations.unify(polygon, new Polygon(new Box(start, 0, end, NODE_SIZE.h)))
    }
  } else {
    rootPos = 0
  }

  if (polygon) {
    polygon = BooleanOperations.unify(
      new Polygon(new Box(rootPos, 0, rootPos + NODE_SIZE.w, NODE_SIZE.h)),
      polygon.translate(new Vector(0, NODE_SIZE.h + NODE_SPACING.y)),
    )
  } else {
    polygon = new Polygon(new Box(0, 0, NODE_SIZE.w, NODE_SIZE.h))
  }

  const node = {
    id: makeId(root, id),
    command: root,
    children,
    offset: { x: 0, y: yOffset },
    pos: rootPos,
    polygon,
    collapsed: false,
  } as LayoutNode

  children.forEach(c => (c.parent = node))

  return node
}

export const narrowTree = (
  root: LayoutNode,
  diagramSize?: { w: number; h: number },
  selected?: LayoutNode,
  parent?: LayoutNode,
) => {
  if (!diagramSize) {
    return root
  }

  if (!selected) {
    selected = root
  }

  const newRoot = {
    ...root,
    children: [],
    parent,
  } as LayoutNode

  const isSelected = selected.command.resultName === root.command.resultName
  const isActive = !isSelected && isChildOf(selected, root)
  const canFit = root.polygon.box.xmax - root.polygon.box.xmin < diagramSize.w
  const canFitCollapsed =
    root.children.length * NODE_SIZE.w + (root.children.length - 1) * NODE_SPACING.x < diagramSize.w

  if (
    !root.children.length ||
    (root.collapsed && !isActive && selected.command.resultName !== root.command.resultName)
  ) {
    newRoot.children = []
  } else if (canFit) {
    newRoot.children = root.children.map(c => narrowTree(c, diagramSize, selected, newRoot))
  } else if (isSelected || isActive || canFitCollapsed) {
    newRoot.children = root.children.map(c => ({
      ...c,
      collapsed: true,
      pos: 0,
    }))

    if (!canFitCollapsed) {
      const numCanFit = Math.max(1, Math.floor(diagramSize.w / (NODE_SIZE.w + NODE_SPACING.x)) - 1)
      const grouped = {
        id: 'group',
        command: new BaseCommand('', [], newRoot.command.program, 0),
        parent: newRoot,
        children: [],
        offset: { x: 0, y: newRoot.offset.y + NODE_SIZE.h + NODE_SPACING.y },
        pos: 0,
        polygon: new Polygon(new Box(0, 0, NODE_SIZE.w, NODE_SIZE.h)),
        collapsed: true,
        nodes: [],
      } as GroupedNodes

      if (isActive) {
        const idx = newRoot.children.findIndex(c => isChildOf(selected!, c))

        const before: LayoutNode[] = []
        const after: LayoutNode[] = []
        for (let i = 0; i < numCanFit - 1; i += 1) {
          const beforeIdx = idx - before.length - 1
          const afterIdx = idx + after.length + 1

          if ((before.length <= after.length || afterIdx >= newRoot.children.length) && beforeIdx >= 0) {
            before.push(newRoot.children[beforeIdx])
          } else if (afterIdx < newRoot.children.length) {
            after.push(newRoot.children[afterIdx])
          } else {
            break
          }
        }

        grouped.nodes = [
          ...newRoot.children.slice(0, idx - before.length),
          ...newRoot.children.slice(idx + after.length + 1),
        ]
        newRoot.children = [...before, newRoot.children[idx], ...after, grouped]
      } else {
        grouped.nodes = newRoot.children.slice(numCanFit)
        newRoot.children = [...newRoot.children.slice(0, numCanFit), grouped]
      }
    }

    newRoot.children = newRoot.children.map((c, i) => {
      const narrow = narrowTree(c, diagramSize, selected, newRoot)
      return Object.assign(narrow, {
        ...narrow,
        collapsed: c.children.length > 0 && !(selected && isChildOf(selected, c)),
        offset: { x: i * (NODE_SIZE.w + NODE_SPACING.x) - narrow.pos, y: c.offset.y },
      })
    })
  }

  if (newRoot.children.length) {
    const firstChild = newRoot.children[0]
    const lastChild = newRoot.children[newRoot.children.length - 1]
    const start = firstChild.offset.x + firstChild.pos
    const end = lastChild.offset.x + lastChild.pos + NODE_SIZE.w

    newRoot.pos = start + (end - start) / 2 - NODE_SIZE.w / 2
  }

  return newRoot
}

export const calculateOffset = (node: LayoutNode): { x: number; y: number } => {
  let parentOffset = node.parent ? calculateOffset(node.parent) : { x: 0, y: 0 }
  return {
    x: parentOffset.x + node.offset.x,
    y: node.offset.y,
  }
}

export const calculateHeight = (node: LayoutNode): number => {
  if (!node.children.length) {
    return NODE_SIZE.h
  }
  return Math.max(...node.children.map(c => calculateHeight(c))) + NODE_SIZE.h + NODE_SPACING.y
}

export const calculateWidth = (node: LayoutNode): number => {
  const findLeftEdge = (n: LayoutNode): number => {
    if (!n.children.length) {
      return 0
    }
    const leftChild = n.children[0]
    return findLeftEdge(leftChild) - n.pos + leftChild.pos
  }

  const findRightEdge = (n: LayoutNode): number => {
    if (!n.children.length) {
      return NODE_SIZE.w
    }
    const rightChild = n.children[n.children.length - 1]
    return findRightEdge(rightChild) + rightChild.offset.x + rightChild.pos - n.pos
  }

  return findRightEdge(node) - findLeftEdge(node)
}
