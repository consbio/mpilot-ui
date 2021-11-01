<script lang="ts">
  export let scale: number = 1
  export let scales: number[] = [1, 0.8, 0.6, 0.5, 0.4]

  // State
  let scaleIdx: number
  let zoomInDisabled: boolean
  let zoomOutDisabled: boolean

  $: {
    let idx = scales.indexOf(scale)
    if (idx === -1) {
      idx = 0
    }
    scaleIdx = idx
  }

  $: zoomInDisabled = scaleIdx === 0
  $: zoomOutDisabled = scaleIdx === scales.length - 1
</script>

<div class="mpilot-scale-control">
  <button
    role="button"
    class="mpilot-zoom-in"
    class:disabled={zoomInDisabled}
    disabled={zoomInDisabled}
    aria-label="Zoom In"
    on:pointerdown={e => e.stopPropagation()}
    on:click={() => (scale = scales[Math.max(scaleIdx - 1, 0)])}>+</button
  >
  <button
    role="button"
    class="mpilot-zoom-out"
    class:disabled={zoomOutDisabled}
    disabled={zoomOutDisabled}
    aria-label="Zoom Out"
    on:pointerdown={e => e.stopPropagation()}
    on:click={() => (scale = scales[Math.min(scaleIdx + 1, scales.length)])}>-</button
  >
</div>

<style>
  .mpilot-scale-control {
    position: absolute;
    top: 20px;
    right: 20px;
    border-radius: 6px;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    z-index: 999;
    background: white;
  }

  button {
    display: block;
    background: lightgray;
    border: none;
    cursor: pointer;
    width: 40px;
    height: 40px;
    color: black;
    font-size: 18px;
    font-weight: bold;
  }

  button:hover {
    background: #333;
    color: white;
  }

  button.disabled {
    opacity: 0.25;
  }

  button.disabled:hover {
    background: lightgray;
    color: black;
  }

  .mpilot-zoom-in {
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    border-bottom: 2px solid #333;
  }

  .mpilot-zoom-out {
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 6px;
  }
</style>
