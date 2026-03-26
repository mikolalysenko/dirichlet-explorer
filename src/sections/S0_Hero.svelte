<script>
  import Tex from '../components/Tex.svelte';
  import NumberLine from '../components/viz/NumberLine.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { gcd } from '../lib/math-utils.js';
  import { primesInProgression, isPrime } from '../lib/primes.js';

  let q = 6;
  let a = 1;

  $: isCoprime = gcd(a, q) === 1;
  $: commonFactor = isCoprime ? 1 : gcd(a, q);
  $: allAs = Array.from({ length: q }, (_, i) => i + 1);
  $: primeCount = primesInProgression(a, q, 500).length;
  $: progressionTerms = Array.from({ length: 5 }, (_, i) => a + i * q);

  // For non-coprime case: find if there's at most one prime
  $: nonCoprimePrime = !isCoprime && primeCount > 0
    ? primesInProgression(a, q, 500)[0]
    : null;
</script>

<div class="hero">
  <h1>Are There Always More Primes?</h1>
  <p class="hero-subtitle">An explorable guide to one of mathematics' most beautiful theorems</p>

  <div class="hero-question">
    <p>Pick any starting number and step size.
    Count forward: will you keep finding primes <em>forever</em>?</p>
    <p>In 1837, a young mathematician named <strong>Peter Gustav Lejeune Dirichlet</strong>
    proved that the answer is <strong>yes</strong> — but only when the start and step share
    no common factor. When they <em>do</em> share a factor, primes dry up almost immediately.</p>
  </div>

  <div class="viz-container">
    <h4>Try it yourself</h4>

    <Slider label="Step size (q)" bind:value={q} min={2} max={15} />

    <div class="a-picker">
      <label>Start (a):</label>
      <div class="a-buttons">
        {#each allAs as ca}
          {@const coprime = gcd(ca, q) === 1}
          <button
            class:active={ca === a}
            class:coprime
            class:not-coprime={!coprime}
            on:click={() => a = ca}
          >
            {ca}
          </button>
        {/each}
      </div>
    </div>

    <div class="coprime-status" class:is-coprime={isCoprime} class:not-coprime={!isCoprime}>
      {#if isCoprime}
        gcd({a}, {q}) = 1 — coprime! Dirichlet's theorem applies.
      {:else}
        gcd({a}, {q}) = {commonFactor} — they share a factor! Every term is divisible by {commonFactor}.
      {/if}
    </div>

    <p class="progression-label">
      Progression: <span class="number">{progressionTerms.join(', ')}, ...</span>
    </p>

    <NumberLine maxN={200} highlightProgression={{ a, q }} />

    <div class="prime-result" class:success={isCoprime && primeCount > 0} class:failure={!isCoprime}>
      {#if isCoprime}
        <p class="prime-count">
          Primes found up to 500: <strong class="prime-number">{primeCount}</strong>
          — and there are infinitely more!
        </p>
      {:else}
        <p class="prime-count failure-text">
          {#if primeCount === 0}
            <strong>Zero primes found.</strong> Every number in this sequence is divisible by {commonFactor},
            so none can be prime.
          {:else if nonCoprimePrime}
            Only <strong>1 prime</strong> found: <span class="prime-number">{nonCoprimePrime}</span>
            (which equals the common factor {commonFactor} itself).
            Every other term is divisible by {commonFactor} and composite.
            {#if nonCoprimePrime === commonFactor}
              After this single prime, the sequence is forever prime-free.
            {/if}
          {:else}
            Only <strong>{primeCount}</strong> prime{primeCount !== 1 ? 's' : ''} found — the sequence runs out of primes quickly.
          {/if}
        </p>
      {/if}
    </div>
  </div>

  <div class="hero-bridge">
    <p>Try switching between the <span class="coprime-tag-inline">blue (coprime)</span> and
    <span class="not-coprime-tag-inline">red (non-coprime)</span> starting values above.
    The difference is dramatic: coprime progressions are rich with primes, non-coprime ones are barren.
    <strong>Why?</strong> And how could anyone prove that the coprime ones <em>never</em> run out?
    That's what we'll explore.</p>
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
    border: 1.5px solid var(--color-border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .a-buttons button.coprime {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .a-buttons button.not-coprime {
    border-color: #e5867a;
    color: #c0392b;
    opacity: 0.7;
  }

  .a-buttons button:hover {
    opacity: 1;
  }

  .a-buttons button.active.coprime {
    background: var(--color-accent);
    color: white;
    font-weight: 600;
    opacity: 1;
  }

  .a-buttons button.active.not-coprime {
    background: #e74c3c;
    border-color: #e74c3c;
    color: white;
    font-weight: 600;
    opacity: 1;
  }

  .coprime-status {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    padding: 0.4em 0.8em;
    border-radius: 6px;
    margin: 0.5em 0;
  }

  .coprime-status.is-coprime {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }

  .coprime-status.not-coprime {
    background: #fde8e8;
    color: #c0392b;
  }

  .progression-label {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    margin-top: 1em;
  }

  .prime-result {
    text-align: center;
    margin-top: 0.5em;
  }

  .prime-count {
    font-size: 1rem;
    margin: 0;
  }

  .failure-text {
    color: #c0392b;
  }

  .hero-bridge {
    text-align: left;
    max-width: 600px;
    margin: 2em auto 0;
    font-size: 1.05rem;
  }

  .coprime-tag-inline {
    color: var(--color-accent);
    font-weight: 600;
  }

  .not-coprime-tag-inline {
    color: #c0392b;
    font-weight: 600;
  }
</style>
