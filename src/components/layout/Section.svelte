<script>
  export let id = '';
  export let title = '';
  export let subtitle = '';
</script>

<section {id} class="section">
  {#if title}
    <h2 class="section-title">{title}</h2>
  {/if}
  {#if subtitle}
    <p class="section-subtitle">{subtitle}</p>
  {/if}
  <div class="section-content">
    <slot />
  </div>
</section>

<style>
  .section {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 3em 1.5em;
    border-bottom: 1px solid var(--color-border-light);
  }

  .section:last-child {
    border-bottom: none;
  }

  .section-title {
    color: var(--color-text);
  }

  .section-subtitle {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    margin-bottom: 1.5em;
    font-style: italic;
  }

  .section-content {
    width: 100%;
  }
</style>
