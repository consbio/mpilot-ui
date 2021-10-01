<script lang="ts">
  import { Program } from 'mpilot/lib'
  import type { LayoutNode, DiagramMode, SelectEvent } from './components'
  import ModelTree from './ModelTree.svelte'
  import { NODE_SIZE } from './constants'
  import { calculateOffset, getDependencyLookup, layoutTree, narrowTree } from './utils'
  import { tweened } from 'svelte/motion'

  // Props
  export let program: Program
  export let mode: DiagramMode = 'full'

  // State
  let prevProgram: Program
  let root: LayoutNode
  let narrowRoot: LayoutNode
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

        diagramX.set(offset.x + selected.pos + NODE_SIZE.w / 2 - diagramSize.w / 2)
        diagramY.set(offset.y - diagramSize.h / 4 + NODE_SIZE.h / 2)
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
        }
      }
    }
  }

  $: {
    if (root && diagramSize && mode === 'narrow') {
      narrowRoot = narrowTree(root, diagramSize, selected || undefined)
      console.log('narrowRoot', narrowRoot)
      if (!selected) {
        selected = narrowRoot
      }
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
      if (mode === 'full') {
        diagramX = tweened($diagramX - e.movementX)
      }
      diagramY = tweened($diagramY - e.movementY)

      if (Math.abs(e.x - dragStart!.x) > 5 || Math.abs(e.y - dragStart!.y) > 5) {
        disableSelect = true
      }
    }
  }

  const handleWheel = (e: WheelEvent) => {
    if (mode === 'full') {
      diagramX = tweened($diagramX + e.deltaX)
    }
    diagramY = tweened($diagramY + e.deltaY)
  }

  const handleSelected = (e: CustomEvent<SelectEvent>) => {
    if (!disableSelect) {
      selected = e.detail.node
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
  <div class="mpilot-container" style={`left: ${-$diagramX}px; top: ${-$diagramY}px`} bind:this={containerNode}>
    {#if root}
      <ModelTree root={narrowRoot || root} {selected} {diagramSize} {mode} on:selected={handleSelected} />
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
  }
</style>
