<script>
  import Tex from '../components/Tex.svelte';
  import NumberLine from '../components/viz/NumberLine.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { gcd } from '../lib/math-utils.js';
  import { primesInProgression } from '../lib/primes.js';

  let q = 6;
  let a = 1;

  $: {
    // Ensure a is coprime to q
    while (a > 0 && gcd(a, q) !== 1) a = (a % q) + 1;
    if (a > q) a = 1;
  }

  $: coprimeAs = Array.from({ length: q }, (_, i) => i + 1).filter(i => gcd(i, q) === 1);
  $: primeCount = primesInProgression(a, q, 500).length;
</script>

<div class="hero">
  <h1>Are There Always More Primes?</h1>
  <p class="hero-subtitle">An explorable guide to one of mathematics' most beautiful theorems</p>

  <div class="hero-question">
    <p>Pick any starting number and step size that share no common factor.
    Count forward: will you keep finding primes <em>forever</em>?</p>
    <p>In 1837, a young mathematician named <strong>Peter Gustav Lejeune Dirichlet</strong>
    proved the answer is always <strong>yes</strong> — and the proof is one of the most
    beautiful in all of mathematics.</p>
  </div>

  <div class="viz-container">
    <h4>Try it yourself</h4>

    <Slider label="Step size (q)" bind:value={q} min={2} max={15} />

    <div class="a-picker">
      <label>Start (a):</label>
      <div class="a-buttons">
        {#each coprimeAs as ca}
          <button
            class:active={ca === a}
            on:click={() => a = ca}
          >
            {ca}
          </button>
        {/each}
      </div>
    </div>

    <p class="progression-label">
      Progression: <span class="number">{a}, {a + q}, {a + 2 * q}, {a + 3 * q}, {a + 4 * q}, ...</span>
    </p>

    <NumberLine maxN={200} highlightProgression={{ a, q }} />

    <p class="prime-count">
      Primes found up to 500: <strong class="prime-number">{primeCount}</strong>
      {#if primeCount > 0}
        — and there are infinitely more!
      {/if}
    </p>
  </div>
</div>

<style>
  .hero {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 4em 1.5em 3em;
    text-align: center;
  }

  .hero h1 {
    font-size: 2.8rem;
    background: linear-gradient(135deg, var(--color-prime) 0%, #c2410c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    color: var(--color-text-muted);
    font-size: 1.2rem;
    font-style: italic;
    margin-bottom: 2em;
  }

  .hero-question {
    text-align: left;
    max-width: 600px;
    margin: 0 auto 2em;
    font-size: 1.1rem;
  }

  .viz-container {
    text-align: left;
  }

  .a-picker {
    display: flex;
    align-items: center;
    gap: 0.8em;
    margin: 0.5em 0;
  }

  .a-picker label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    min-width: 80px;
    white-space: nowrap;
  }

  .a-buttons {
    display: flex;
    gap: 0.3em;
    flex-wrap: wrap;
  }

  .a-buttons button {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .a-buttons button:hover {
    border-color: var(--color-accent);
  }

  .a-buttons button.active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
    font-weight: 600;
  }

  .progression-label {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    margin-top: 1em;
  }

  .prime-count {
    text-align: center;
    margin-top: 0.5em;
    font-size: 1rem;
  }
</style>
