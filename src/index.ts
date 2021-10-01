import { Program } from 'mpilot/lib'
import ModelDiagram from './components/ModelDiagram.svelte'
import type { DiagramMode } from './components/components'

export interface DiagramOptions {
  mode?: DiagramMode
}

export const createDiagram = (node: string | HTMLElement, model: string, options: DiagramOptions) => {
  const { mode } = options

  let domNode: HTMLElement
  if (node instanceof HTMLElement) {
    domNode = node
  } else {
    const element = document.getElementById(node)
    if (element) {
      domNode = element
    } else {
      throw new Error(`Could not find an element with the id ${node}.`)
    }
  }

  const program = Program.fromSource(model)

  return new ModelDiagram({ target: domNode, props: { program, mode } })
}
