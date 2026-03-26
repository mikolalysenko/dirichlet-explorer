<script>
  import katex from 'katex';

  export let tex = '';
  export let display = false;

  let html = '';

  $: {
    try {
      html = katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        trust: true
      });
    } catch (e) {
      html = `<span style="color:red">${tex}</span>`;
    }
  }
</script>

{#if display}
  <div class="math-display">{@html html}</div>
{:else}
  <span class="math-inline">{@html html}</span>
{/if}
