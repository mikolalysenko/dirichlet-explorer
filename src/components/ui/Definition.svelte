<script>
  export let term = '';
  let expanded = false;
</script>

<span class="definition-wrapper">
  <button class="definition-trigger" on:click={() => expanded = !expanded}>
    {term}
    <svg class="icon" class:open={expanded} width="12" height="12" viewBox="0 0 12 12">
      <path d="M3 5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  </button>
  {#if expanded}
    <span class="definition-body">
      <slot />
    </span>
  {/if}
</span>

<style>
  .definition-wrapper {
    display: inline;
  }

  .definition-trigger {
    display: inline;
    background: none;
    border: none;
    border-bottom: 1px dashed var(--color-accent);
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: var(--color-accent);
    padding: 0;
    line-height: inherit;
  }

  .icon {
    display: inline-block;
    transition: transform 0.2s ease;
    vertical-align: middle;
  }

  .icon.open {
    transform: rotate(180deg);
  }

  .definition-body {
    display: block;
    background: var(--color-bg-alt);
    padding: 0.6em 0.8em;
    border-radius: 6px;
    margin: 0.3em 0;
    font-size: 0.9em;
    color: var(--color-text-muted);
    line-height: 1.5;
  }
</style>
