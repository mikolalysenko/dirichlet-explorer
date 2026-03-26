<script>
  export let type = 'info'; // 'info' | 'insight' | 'question'
</script>

<div class="callout {type}">
  <slot />
</div>

<style>
  .callout {
    background: var(--color-accent-light);
    border-left: 4px solid var(--color-accent);
    padding: 1em 1.2em;
    margin: 1.5em 0;
    border-radius: 0 8px 8px 0;
  }

  .callout.insight {
    background: var(--color-prime-bg);
    border-left-color: var(--color-prime);
  }

  .callout.question {
    background: #f0fdf4;
    border-left-color: #22c55e;
  }

  .callout :global(p:last-child) {
    margin-bottom: 0;
  }
</style>
