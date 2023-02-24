<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Program } from 'mpilot'
  import type { LayoutNode, DiagramMode, SelectEvent, NodeValues, NodeLabels } from './components'
  import ModelTree from './ModelTree.svelte'
  import ScaleControl from './ScaleControl.svelte'
  import { NODE_SIZE } from './constants'
  import { calculateHeight, calculateOffset, calculateWidth, findNode, layoutTree, narrowTree } from './utils'
  import { tweened } from 'svelte/motion'

  const dispatch = createEventDispatcher()

  // Props
  export let program: Program
  export let values: NodeValues | undefined = undefined
  export let labels: NodeLabels | undefined = undefined
  export let mode: DiagramMode = 'full'
  export let scale: number = 1

  // State
  let prevProgram: Program
  let prevMode: DiagramMode = mode

  let root: LayoutNode
  let narrowRoot: LayoutNode | null

  let selected: LayoutNode | null
  let prevSelected: LayoutNode | null

  let prevScale: number
  let appliedScale = tweened(1)

  let diagramSize: { w: number; h: number }
  let prevDiagramSize: { w: number; h: number }
  let diagramX = tweened(0)
  let diagramY = tweened(0)

  let isDragging = false
  let dragStart: { x: number; y: number } | null = null
  let disableSelect = false

  let treeHeight: number
  let treeWidth: number
  let diagramNode: HTMLDivElement
  let containerNode: HTMLDivElement

  let repositionTimeout = null

  $: {
    if (mode === 'full') {
      narrowRoot = null

      if (root) {
        treeHeight = calculateHeight(root) * scale
        treeWidth = calculateWidth(root) * scale
      }

      if (mode !== prevMode) {
        if (root && selected?.command?.resultName !== root.command.resultName) {
          dispatch('selected', { node: root } as SelectEvent)
        }

        prevMode = mode
        selected = root
      }
    }
  }

  $: {
    if (diagramNode) {
      setDiagramSize()
    }
  }

  $: {
    if (prevDiagramSize !== diagramSize) {
      prevDiagramSize = diagramSize
      centerOn(selected || undefined)
    }
  }

  $: {
    if (selected !== prevSelected && mode === 'full') {
      prevSelected = selected
      centerOn(selected || undefined)
    }
  }

  $: appliedScale.set(scale)

  $: {
    if ($appliedScale !== prevScale) {
      if (prevScale) {
        if (mode === 'full') {
          const scaledMid = {
            x: $diagramX / prevScale + diagramSize.w / prevScale / 2,
            y: $diagramY / prevScale + diagramSize.h / prevScale / 2,
          }

          const scaledPos = {
            x: scaledMid.x - diagramSize.w / $appliedScale / 2,
            y: scaledMid.y - diagramSize.h / $appliedScale / 2,
          }

          const realPos = {
            x: scaledPos.x * $appliedScale,
            y: scaledPos.y * $appliedScale,
          }

          diagramX = tweened(realPos.x)
          diagramY = tweened(realPos.y)
        }
      }

      prevScale = $appliedScale
    }
  }

  $: {
    if (program && program !== prevProgram) {
      prevProgram = program

      const { dependents, dependencies } = program.getDependencyLookup()
      const rootCommands = Object.values(program.commands).filter(command => !dependents[command.resultName])
      if (rootCommands.length) {
        root = layoutTree(rootCommands[0], dependencies, program)
        selected = null

        if (mode !== 'narrow') {
          selected = root
          treeHeight = calculateHeight(root) * scale
          treeWidth = calculateWidth(root) * scale
          setTimeout(() => centerOn(root), 10)
        }
      }
    }
  }

  $: {
    if (root && diagramSize && mode === 'narrow') {
      if (mode !== prevMode) {
        prevMode = mode

        if (selected?.command?.resultName !== root.command.resultName) {
          selected = null
        }
      }

      narrowRoot = narrowTree(root, { w: diagramSize.w / scale, h: diagramSize / scale }, selected || undefined)
      treeHeight = calculateHeight(narrowRoot)
      treeWidth = calculateWidth(narrowRoot)

      if (!selected) {
        selected = prevSelected = narrowRoot
        dispatch('selected', { node: narrowRoot } as SelectEvent)
        centerOn(selected)
      } else {
        selected = prevSelected = findNode(narrowRoot, selected)
        centerOn(selected || undefined)
      }
    }
  }

  export const setDiagramSize = () => {
    if (diagramNode && (diagramNode.offsetWidth !== diagramSize?.w || diagramNode.offsetHeight !== diagramSize?.h)) {
      diagramSize = { w: diagramNode.offsetWidth, h: diagramNode.offsetHeight }
    }
  }

  const centerOn = (node?: LayoutNode) => {
    if (node && diagramSize) {
      const offset = calculateOffset(node)

      clearTimeout(repositionTimeout)
      diagramX.set((offset.x + node.pos + NODE_SIZE.w / 2 - diagramSize.w / scale / 2) * scale)
      diagramY.set((offset.y + NODE_SIZE.h / 2 - (diagramSize.h / scale) * 0.3) * scale)
    }
  }

  const repositionX = () => {
    if (!selected || !diagramSize) {
      return
    }

    let node = selected
    while (node.parent && node.parent.offset.y + NODE_SIZE.h / 2 > $diagramY / scale + (diagramSize.h / scale) * 0.3) {
      node = node.parent
    }

    const offset = calculateOffset(node)
    diagramX.set((offset.x + node.pos + NODE_SIZE.w / 2 - diagramSize.w / scale / 2) * scale)
  }

  const moveView = (dx: number, dy: number) => {
    diagramY = tweened(
      Math.min(Math.max($diagramY + dy, -(diagramSize.h * 0.3)), treeHeight * scale - diagramSize.h * 0.3),
    )

    if (mode === 'full') {
      diagramX = tweened(Math.min(Math.max($diagramX + dx, -(diagramSize.w * 0.7)), treeWidth - diagramSize.w * 0.3))
    } else {
      clearTimeout(repositionTimeout)
      repositionTimeout = setTimeout(repositionX, 100)
    }
  }

  const handlePointerDown = (e: PointerEvent) => {
    isDragging = true
    dragStart = { x: e.x, y: e.y }
  }

  const handlePointerUp = (e: PointerEvent) => {
    isDragging = false
    dragStart = null
    containerNode.releasePointerCapture(e.pointerId)

    setTimeout(() => (disableSelect = false), 1)
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging) {
      if (Math.max(Math.abs(e.x - dragStart!.x), Math.abs(e.y - dragStart!.y)) > 10) {
        containerNode.setPointerCapture(e.pointerId)
        disableSelect = true
      }
      moveView(-e.movementX, -e.movementY)
    }
  }

  const handleWheel = (e: WheelEvent) => {
    moveView(e.deltaX, e.deltaY)
  }

  const handleSelected = (e: CustomEvent<SelectEvent>) => {
    if (!disableSelect) {
      if (e.detail.node !== selected) {
        dispatch('selected', e.detail)
      }
      selected = e.detail.node
    }
  }
</script>

<svelte:window on:resize={setDiagramSize} />

<div
  class="mpilot-diagram"
  class:mpilot-dragging={isDragging}
  class:mpilot-narrow-layout={mode === 'narrow'}
  bind:this={diagramNode}
  on:pointerdown={handlePointerDown}
  on:pointerup={handlePointerUp}
  on:pointermove={handlePointerMove}
  on:wheel={handleWheel}
>
  <ScaleControl bind:scale />

  <slot />

  <div class="mpilot-container-stripe" style={`transform: scale(1, ${$appliedScale}); top: calc(30%);`} />
  <div
    class="mpilot-container"
    style={`transform: scale(${$appliedScale}, ${$appliedScale}); left: ${-$diagramX}px; top: ${-$diagramY}px`}
    bind:this={containerNode}
  >
    {#if root}
      <ModelTree root={narrowRoot || root} {values} {labels} {selected} on:selected={handleSelected} on:info />
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
    background: white;
    cursor: pointer;
    font-family: Tahoma, serif;
  }

  .mpilot-container-stripe {
    display: none;
  }

  .mpilot-diagram.mpilot-narrow-layout .mpilot-container-stripe {
    display: block;
    position: absolute;
    height: 90px;
    width: 100%;
    top: 30%;
    left: 0;
    background: #efefef;
    transform-origin: top;
  }

  .mpilot-diagram.mpilot-dragging {
    cursor: grab;
  }

  .mpilot-diagram .mpilot-container {
    position: absolute;
    transform-origin: 50% 50%;
  }
</style>
