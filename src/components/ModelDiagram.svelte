<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Program } from 'mpilot/lib'
  import type { LayoutNode, DiagramMode, SelectEvent } from './components'
  import ModelTree from './ModelTree.svelte'
  import ScaleControl from './ScaleControl.svelte'
  import { NODE_SIZE, NODE_SPACING } from './constants'
  import { calculateHeight, calculateOffset, getDependencyLookup, layoutTree, narrowTree } from './utils'
  import { tweened } from 'svelte/motion'

  const dispatch = createEventDispatcher()

  // Props
  export let program: Program
  export let mode: DiagramMode = 'full'
  export let scale: number = 1

  // State
  let prevProgram: Program
  let root: LayoutNode
  let treeHeight: number
  let narrowRoot: LayoutNode | null
  let selected: LayoutNode | null
  let prevSelected: LayoutNode | null
  let diagramNode: HTMLDivElement
  let containerNode: HTMLDivElement
  let diagramSize: { w: number; h: number }
  let prevDiagramSize: { w: number; h: number }
  let diagramX = tweened(0)
  let diagramY = tweened(0)
  let isDragging = false
  let dragStart: { x: number; y: number } | null = null
  let disableSelect = false

  let repositionTimeout = null

  $: {
    if (mode === 'full') {
      narrowRoot = null

      if (root) {
        treeHeight = calculateHeight(root) * scale
      }
    }
  }

  $: {
    if (diagramNode) {
      diagramSize = { w: diagramNode.offsetWidth, h: diagramNode.offsetHeight }
    }
  }

  $: {
    if (selected !== prevSelected || diagramSize !== prevDiagramSize) {
      prevSelected = selected
      prevDiagramSize = diagramSize

      if (selected && diagramSize) {
        const offset = calculateOffset(selected)

        clearTimeout(repositionTimeout)
        diagramX.set((offset.x + selected.pos + NODE_SIZE.w / 2 - diagramSize.w / scale / 2) * scale)
        diagramY.set((offset.y - NODE_SIZE.h - NODE_SPACING.y) * scale)
      }
    }
  }

  $: {
    if (program && program !== prevProgram) {
      prevProgram = program

      const { dependents, dependencies } = getDependencyLookup(program)
      const rootCommands = Object.values(program.commands).filter(command => !dependents[command.resultName])
      if (rootCommands.length) {
        root = layoutTree(rootCommands[0], dependencies, program)

        if (mode !== 'narrow') {
          selected = root
          treeHeight = calculateHeight(root) * scale
        }
      }
    }
  }

  $: {
    if (root && diagramSize && mode === 'narrow') {
      narrowRoot = narrowTree(root, { w: diagramSize.w / scale, h: diagramSize / scale }, selected || undefined)
      treeHeight = calculateHeight(narrowRoot)
      if (!selected) {
        selected = narrowRoot
      }
    }
  }

  const repositionX = () => {
    if (!selected || !diagramSize) {
      return
    }

    let node = selected
    while (node.parent && node.parent.offset.y * scale > $diagramY + NODE_SIZE.h + NODE_SPACING.y) {
      node = node.parent
    }

    const offset = calculateOffset(node)
    diagramX.set((offset.x + node.pos + NODE_SIZE.w / 2 - diagramSize.w / scale / 2) * scale)
  }

  const moveView = (dx: number, dy: number) => {
    diagramY = tweened(Math.min(Math.max($diagramY + dy, -(NODE_SIZE.h * 2)), treeHeight - NODE_SIZE.h))

    if (mode === 'full') {
      diagramX = tweened($diagramX + dx)
    } else {
      clearTimeout(repositionTimeout)
      repositionTimeout = setTimeout(repositionX, 100)
    }
  }

  const handlePointerDown = (e: PointerEvent) => {
    isDragging = true
    dragStart = { x: e.x, y: e.y }
    containerNode.setPointerCapture(e.pointerId)
  }

  const handlePointerUp = (e: PointerEvent) => {
    isDragging = false
    dragStart = null
    containerNode.releasePointerCapture(e.pointerId)

    setTimeout(() => (disableSelect = false), 1)
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging) {
      moveView(-e.movementX, -e.movementY)
    }
  }

  const handleWheel = (e: WheelEvent) => {
    moveView(e.deltaX, e.deltaY)
  }

  const handleSelected = (e: CustomEvent<SelectEvent>) => {
    if (!disableSelect) {
      selected = e.detail.node
      dispatch('selected', e.detail)
    }
  }
</script>

<div
  class="mpilot-diagram"
  class:mpilot-dragging={isDragging}
  bind:this={diagramNode}
  on:pointerdown={handlePointerDown}
  on:pointerup={handlePointerUp}
  on:pointermove={handlePointerMove}
  on:wheel={handleWheel}
>
  <ScaleControl bind:scale />
  <div
    class="mpilot-container"
    style={`transform: scale(${scale}, ${scale}); left: ${-$diagramX}px; top: ${-$diagramY}px`}
    bind:this={containerNode}
  >
    {#if root}
      <ModelTree root={narrowRoot || root} {selected} on:selected={handleSelected} />
    {/if}
  </div>
</div>

<style>
  .mpilot-diagram {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    background-color: white;
    cursor: pointer;
  }

  .mpilot-diagram.mpilot-dragging {
    cursor: grab;
  }

  .mpilot-diagram .mpilot-container {
    position: absolute;
    transform-origin: 50% 50%;
    transition: transform 0.5s;
  }
</style>
