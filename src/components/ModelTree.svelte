<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { scale } from 'svelte/transition'
  import type { LayoutNode, GroupedNodes, SelectEvent } from './components'
  import CommandNode from './CommandNode.svelte'
  import ModelTree from './ModelTree.svelte'
  import { NODE_SIZE, NODE_SPACING } from './constants'
  import { isChildOf } from './utils'
  import GroupedNode from './GroupedNode.svelte'

  const dispatch = createEventDispatcher()

  // Props
  export let root: LayoutNode | GroupedNodes
  export let selected: LayoutNode
  export let offset: [number, number] = [0, 0]

  // State
  let active = false
  let connectorLine: { left: number; top: number; length: number }

  $: {
    if (root?.children.length) {
      const firstChild = root.children[0]
      const lastChild = root.children[root.children.length - 1]
      const lineStart = offset[0] + firstChild.offset.x + firstChild.pos + NODE_SIZE.w / 2

      connectorLine = {
        left: lineStart,
        top: offset[1] + NODE_SIZE.h + NODE_SPACING.y / 2,
        length: offset[0] + lastChild.offset.x + lastChild.pos + NODE_SIZE.w / 2 - lineStart,
      }
    }
  }

  $: active = selected ? isChildOf(selected, root) : false

  const handleClick = () => {
    dispatch('selected', { node: root } as SelectEvent)
  }
</script>

{#if root}
  {#if root.nodes}
    <GroupedNode {root} left={offset[0]} top={offset[1]} on:selected />
  {:else}
    <CommandNode
      command={root.command}
      left={offset[0] + root.pos}
      top={offset[1]}
      selected={selected?.command.resultName === root.command.resultName}
      {active}
      on:click={handleClick}
    />

    {#each root.children as child}
      <div
        class="mpilot-vertical-line"
        style={`left: ${offset[0] + child.offset.x + child.pos + NODE_SIZE.w / 2}px; top: ${
          offset[1] + NODE_SIZE.h + NODE_SPACING.y / 2
        }px`}
        transition:scale
      />
      <ModelTree
        root={child}
        offset={[offset[0] + child.offset.x, offset[1] + NODE_SIZE.h + NODE_SPACING.y]}
        {selected}
        on:selected
      />
    {/each}

    {#if root.children.length}
      <div
        class="mpilot-vertical-line"
        style={`left: ${offset[0] + root.pos + NODE_SIZE.w / 2}px; top: ${offset[1] + NODE_SIZE.h + 1}px`}
        transition:scale
      />
      <div
        class="mpilot-horizontal-line"
        style={`left: ${connectorLine.left}px; top: ${connectorLine.top}px; width: ${connectorLine.length}px`}
        transition:scale
      />
    {/if}
  {/if}
{/if}

<style>
  .mpilot-horizontal-line {
    position: absolute;
    height: 0;
    border-top: 1px solid black;
  }

  .mpilot-vertical-line {
    position: absolute;
    width: 0;
    height: 10px;
    border-left: 1px solid black;
  }
</style>
