import type { Program } from 'mpilot/lib'
import { BaseCommand } from 'mpilot/lib/commands'
import { ResultParameter, AnyParameter } from 'mpilot/lib/params'
import { NODE_SIZE, NODE_SPACING } from './constants'

// eslint-disable-next-line import/no-unresolved
import type { LayoutNode } from './components'

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
  if (child.command.resultName === parent.command.resultName) {
    return true
  }

  if (!parent.children.length) {
    return false
  }

  if (parent.children.some(c => c.command.resultName === child.command.resultName)) {
    return true
  }

  return parent.children.some(c => isChildOf(child, c))
}

export const layoutTree = (
  root: BaseCommand,
  dependencies: { [resultName: string]: string[] },
  program: Program,
  yOffset = 0,
): LayoutNode => {
  const children =
    dependencies[root.resultName]?.map(name =>
      layoutTree(program.commands[name], dependencies, program, yOffset + NODE_SIZE.h + NODE_SPACING.y),
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
    command: root,
    children,
    offset: { x: 0, y: yOffset },
    pos: rootPos,
    polygon,
    expand: true,
  } as LayoutNode

  children.forEach(c => (c.parent = node))

  return node
}

export const getDependencyLookup = (program: Program) => {
  const lookup: { dependents: { [resultName: string]: string[] }; dependencies: { [resultName: string]: string[] } } = {
    dependents: {},
    dependencies: {},
  }

  Object.values(program.commands).forEach(command => {
    let references: string[] = []

    command.args.forEach(arg => {
      let value: any
      if (command.inputs[arg.name]) {
        const inp = command.inputs[arg.name]
        value = inp.clean(arg.value, program, arg.lineno)

        if ((inp as AnyParameter) instanceof ResultParameter) {
          references.push(value instanceof BaseCommand ? value.resultName : value)
        }
        if (Array.isArray(value)) {
          references = [
            ...references,
            ...flatten(value)
              .filter(item => item instanceof BaseCommand)
              .map(item => (item instanceof BaseCommand ? item.resultName : item)),
          ]
        }
      }
    })

    lookup.dependencies[command.resultName] = references

    references.forEach(reference => {
      lookup.dependents[reference] = lookup.dependents[reference] || []
      if (!lookup.dependents[reference].includes(command.resultName)) {
        lookup.dependents[reference].push(command.resultName)
      }
    })
  })

  return lookup
}

export const calculateOffset = (node: LayoutNode): { x: number; y: number } => {
  let parentOffset = node.parent ? calculateOffset(node.parent) : { x: 0, y: 0 }
  return {
    x: parentOffset.x + node.offset.x,
    y: node.offset.y,
  }
}

export const collapseTree = (root: LayoutNode, width: number, selected: LayoutNode) => {}
