<script>
  import { onMount, onDestroy } from 'svelte';

  export let sections = [];

  let activeId = sections[0]?.id || '';
  let observer;
  let menuOpen = false;

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = entry.target.id;
            history.replaceState(null, '', `#${entry.target.id}`);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
  });

  onDestroy(() => {
    if (observer) observer.disconnect();
  });

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      menuOpen = false;
    }
  }
</script>

<button class="toc-toggle" on:click={() => menuOpen = !menuOpen} aria-label="Table of Contents">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    {#if menuOpen}
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    {:else}
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    {/if}
  </svg>
</button>

<nav class="toc" class:open={menuOpen}>
  <div class="toc-header">Contents</div>
  <ul>
    {#each sections as section}
      <li class:active={activeId === section.id}>
        <button on:click={() => scrollTo(section.id)}>
          <span class="toc-number">{section.number}</span>
          <span class="toc-label">{section.title}</span>
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .toc {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--sidebar-width);
    height: 100vh;
    padding: 2em 0.8em 2em 1em;
    overflow-y: auto;
    background: var(--color-bg);
    border-right: 1px solid var(--color-border-light);
    z-index: 100;
    transition: transform 0.3s var(--ease-out);
  }

  .toc-header {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-text-light);
    margin-bottom: 1em;
    padding-left: 0.5em;
  }

  ul {
    list-style: none;
  }

  li {
    margin-bottom: 0.15em;
  }

  li button {
    display: flex;
    align-items: baseline;
    gap: 0.4em;
    width: 100%;
    padding: 0.35em 0.5em;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    text-align: left;
    font-family: var(--font-serif);
    font-size: 0.82rem;
    color: var(--color-text-muted);
    transition: all 0.15s ease;
    line-height: 1.3;
  }

  li button:hover {
    background: var(--color-bg-alt);
    color: var(--color-text);
  }

  li.active button {
    background: var(--color-accent-light);
    color: var(--color-accent);
    font-weight: 500;
  }

  .toc-number {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .toc-toggle {
    display: none;
    position: fixed;
    top: 1em;
    left: 1em;
    z-index: 200;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.4em;
    cursor: pointer;
    color: var(--color-text);
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  @media (max-width: 900px) {
    .toc {
      transform: translateX(-100%);
      width: 260px;
      box-shadow: 4px 0 20px rgba(0,0,0,0.1);
    }
    .toc.open {
      transform: translateX(0);
    }
    .toc-toggle {
      display: block;
    }
  }
</style>
