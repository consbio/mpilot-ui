<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { scale } from 'svelte/transition'
  import type { BaseCommand } from 'mpilot'
  import { NODE_SIZE } from './constants'
  import type { NodeValue } from './components'

  // eslint-disable-next-line import/no-unresolved
  import { stripHtml } from 'string-strip-html'

  const dispatch = createEventDispatcher()

  // Props
  export let command: BaseCommand
  export let value: NodeValue
  export let label: string
  export let left: number
  export let top: number
  export let selected = false
  export let active = false

  // State
  let element: HTMLDivElement
  let displayName: string

  $: {
    if (command) {
      const metadata = command.getMetadata()

      displayName =
        label || stripHtml((metadata?.DisplayName || command.resultName).replace(/(&nbsp;)|\+|\xA0/gi, ' ')).result
    }
  }

  const handleInfo = e => {
    e.stopPropagation()
    dispatch('info', {})
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
    tabindex="0"
    transition:scale
    bind:this={element}
    on:click
    on:keydown={e => {
      if (e.keyCode === 32 && element) {
        element.click()
      }
    }}
  >
    <div class="mpilot-title">
      <div class="mpilot-title-label">{@html displayName}</div>
      <div class="mpilot-node-value">
        <button class="mpilot-node-info" on:click={handleInfo}>i</button>

        {#if value}
          <div
            class="mpilot-node-color"
            style={`background: ${value.color}`}
            title={`${value.value} (${value.label})`}
          />
          <div title={value.label}>{value.value}</div>
        {/if}
      </div>
    </div>
    <div class="mpilot-node-name" title={command.displayName}>{command.displayName}</div>
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
    box-shadow: 0 0 5px 1px rgb(33, 113, 181);
  }

  .mpilot-title {
    display: flex;
    font-size: 14px;
    padding: 5px 5px 0 5px;
    flex-grow: 1;
    color: #00330b;
    max-height: 100%;
    overflow: hidden;
    line-height: 1.3;
  }

  .mpilot-title-label {
    flex-grow: 1;
    max-width: calc(100% - 37px);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mpilot-node-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 32px;
    max-width: 40px;
    overflow: hidden;
    white-space: nowrap;
    font-size: 11px;
    text-align: center;
  }

  .mpilot-node-info {
    font-size: 12px;
    font-weight: bold;
    color: white;
    background: black;
    border-radius: 50%;
    border: none;
    padding: 0 6px;
    cursor: pointer;
    margin: 2px 2px 5px 0;
  }

  .mpilot-node-info:hover {
    background: darkgray;
  }

  .mpilot-node-color {
    width: 15px;
    height: 15px;
    min-height: 15px;
    border: 1px solid darkgray;
    border-radius: 4px;
  }

  .mpilot-node-name {
    padding: 5px;
    font-size: 12px;
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
