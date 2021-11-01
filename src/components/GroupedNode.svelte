<script lang="ts">
  import { scale } from 'svelte/transition'
  import type { GroupedNodes, SelectEvent } from './components'
  import { NODE_SIZE } from './constants'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  // Props
  export let root: GroupedNodes
  export let left: number
  export let top: number

  // State
  let selectElement: HTMLSelectElement

  const onChange = (e: Event) => {
    const selected = root.nodes.find(n => n.command.resultName === (e.target as HTMLSelectElement).value)
    if (selected) {
      dispatch('selected', { node: selected } as SelectEvent)
    }
    selectElement.value = ''
  }
</script>

{#if root}
  <div
    class="mpilot-grouped"
    style={`width: ${NODE_SIZE.w}px; height: ${NODE_SIZE.h}px; left: ${left}px; top: ${top}px;`}
    transition:scale
  >
    <div class="mpilot-grouped-label">
      <select on:pointerdown={e => e.stopPropagation()} on:change={onChange} bind:this={selectElement}>
        <option value="" disabled selected>{root.nodes.length} more...</option>
        {#each root.nodes as node}
          <option value={node.command.resultName}>{node.command.resultName}</option>
        {/each}
      </select>
    </div>
  </div>
{/if}

<style>
  .mpilot-grouped {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    border: 1px solid #666;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    background-color: #f7fcf0;
    user-select: none;
  }

  .mpilot-grouped .mpilot-grouped-label {
    position: relative;
    max-width: calc(100% - 10px);
  }

  .mpilot-grouped .mpilot-grouped-label select {
    max-width: 100%;
    border: 1px solid darkgray;
    border-radius: 6px;
    padding: 10px 5px;
  }
</style>
