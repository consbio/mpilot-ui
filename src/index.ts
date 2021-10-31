import { Program } from 'mpilot/lib'
import ModelDiagram from './components/ModelDiagram.svelte'
import type { DiagramMode } from './components/components'

export interface DiagramOptions {
  mode?: DiagramMode
}

class DiagramWrapper {
  diagram: ModelDiagram
  target: Element

  constructor(diagram: ModelDiagram, target: Element) {
    this.diagram = diagram
    this.target = target

    this.diagram.$on('selected', e => this.target.dispatchEvent(e))
  }

  addEventListener() {
    this.target.addEventListener.apply(this.target, arguments as any)
  }

  removeEventListener() {
    this.target.removeEventListener.apply(this.target, arguments as any)
  }
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
  const diagram = new ModelDiagram({ target: domNode, props: { program, mode } })

  return new DiagramWrapper(diagram, domNode)
}
