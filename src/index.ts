import { Program } from 'mpilot/lib'
import ModelDiagram from './components/ModelDiagram.svelte'
import type { DiagramMode, NodeLabels } from './components/components'

export interface DiagramOptions {
  mode?: DiagramMode
  labels: NodeLabels
}

class DiagramWrapper {
  diagram: ModelDiagram
  target: Element

  constructor(diagram: ModelDiagram, target: Element) {
    this.diagram = diagram
    this.target = target
    ;['selected', 'info'].forEach(event => {
      this.diagram.$on(event, e => this.target.dispatchEvent(e))
    })
  }

  addEventListener() {
    this.target.addEventListener.apply(this.target, arguments as any)
  }

  removeEventListener() {
    this.target.removeEventListener.apply(this.target, arguments as any)
  }

  setModel(model: string) {
    const program = Program.fromSource(model)
    this.diagram.$set({ program })
  }

  setOptions(options: DiagramOptions) {
    this.diagram.$set({ ...options })
  }

  update() {
    this.diagram.$$.update()
  }

  destroy() {
    this.diagram.$destroy()
  }
}

export const createDiagram = (node: string | HTMLElement, model: string | Program, options: DiagramOptions) => {
  const { mode, labels } = options

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

  let program: Program
  if (typeof model === 'string') {
    program = Program.fromSource(model)
  } else {
    program = model
  }

  const diagram = new ModelDiagram({ target: domNode, props: { program, mode, labels } })

  return new DiagramWrapper(diagram, domNode)
}

export * from 'mpilot/lib'
