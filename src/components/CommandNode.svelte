<script lang="ts">
  import { scale } from 'svelte/transition'
  import type { BaseCommand } from 'mpilot/lib/commands'
  import { NODE_SIZE } from './constants'
  import type { NodeValue } from './components'

  // Props
  export let command: BaseCommand
  export let value: NodeValue
  export let left: number
  export let top: number
  export let selected = false
  export let active = false

  // State
  let displayName

  $: {
    if (command) {
      const metadata = command.getMetadata()
      displayName = (metadata?.DisplayName || '').replaceAll('&nbsp;', ' ').replaceAll('+', ' ') || command.resultName
    }
  }
</script>

{#key command.resultName}
  <div
    class="mpilot-node"
    class:mpilot-selected={selected}
    class:mpilot-active={active}
    style={`width: ${NODE_SIZE.w}px; height: ${NODE_SIZE.h}px; left: ${left}px; top: ${top}px;`}
    role="button"
    title={displayName}
    transition:scale
    on:click
  >
    <div class="mpilot-title">
      {#if value}
        <div class="mpilot-node-value" title={value.label}>
          <div class="mpilot-node-color" style={`background: ${value.color}`} />
          {value.value}
        </div>
      {/if}
      {displayName}
    </div>
    <div class="mpilot-node-name">{command.displayName}</div>
  </div>
{/key}

<style>
  .mpilot-node {
    position: absolute;
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    border: 1px solid #666;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    background-color: #f7fcf0;
    user-select: none;
  }

  .mpilot-node.mpilot-active,
  .mpilot-node.mpilot-selected {
    background-color: #fff7bc;
  }

  .mpilot-node.mpilot-selected {
    box-shadow: 0 0 5px rgba(33, 113, 181, 1);
  }

  .mpilot-title {
    font-size: 14px;
    padding: 5px;
    flex-grow: 1;
    color: #00330b;
    max-height: 100%;
    overflow: hidden;
  }

  .mpilot-node-value {
    float: right;
    width: 32px;
    max-width: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 5px;
    font-size: 12px;
    text-align: center;
  }

  .mpilot-node-color {
    min-width: 30px;
    height: 30px;
    border: 1px solid darkgray;
    border-radius: 4px;
    margin-bottom: 5px;
  }

  .mpilot-node-name {
    padding: 5px;
    font-size: 14px;
    color: #00441b;
    border-top: 1px solid #ccc;
    background-color: #e0f3db;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }
</style>
