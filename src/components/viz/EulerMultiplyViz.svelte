<script>
  import { isPrime, listPrimes } from '../../lib/primes.js';

  let numPrimes = 1;

  $: allPrimes = listPrimes(30);
  $: primes = allPrimes.slice(0, numPrimes);

  const maxTerms = 5; // max powers per prime to show

  // Build the "current product" terms: all numbers of the form p1^a1 * p2^a2 * ...
  // with 0 <= ai < maxTerms, using only the included primes.
  // We build this incrementally to show the multiplication structure.

  // Previous product terms (before adding the latest prime)
  $: prevPrimes = primes.slice(0, -1);
  $: prevTerms = buildTerms(prevPrimes);
  $: newPrime = primes.length > 0 ? primes[primes.length - 1] : null;

  // New prime's powers: 1, p, p^2, p^3, ...
  $: newPowers = newPrime ? Array.from({ length: maxTerms }, (_, k) => ({
    k,
    value: Math.pow(newPrime, k),
    label: k === 0 ? '1' : k === 1 ? String(newPrime) : `${newPrime}^${k}`
  })) : [];

  // All product terms after multiplying
  $: allTerms = buildTerms(primes);

  // Sorted unique product values for display
  $: sortedProducts = [...allTerms].map(t => t.value).sort((a, b) => a - b);

  function buildTerms(ps) {
    if (ps.length === 0) return [{ value: 1, factors: {}, label: '1' }];
    let terms = [{ value: 1, factors: {}, label: '1' }];
    for (const p of ps) {
      const newTerms = [];
      for (const existing of terms) {
        for (let k = 0; k < maxTerms; k++) {
          const val = existing.value * Math.pow(p, k);
          if (val > 10000) break; // don't go too big
          const factors = { ...existing.factors };
          if (k > 0) factors[p] = k;
          newTerms.push({ value: val, factors, label: factorLabel(factors) });
        }
      }
      terms = newTerms;
    }
    return terms;
  }

  function factorLabel(factors) {
    const parts = Object.entries(factors).sort((a, b) => a[0] - b[0]);
    if (parts.length === 0) return '1';
    return parts.map(([p, e]) => e > 1 ? `${p}^${e}` : p).join('·');
  }

  // For the multiplication grid:
  // Columns = prevTerms (sorted by value)
  // Rows = newPowers (1, p, p^2, ...)
  // Cell (row, col) = prevTerms[col].value * newPowers[row].value
  $: gridCols = prevTerms.slice().sort((a, b) => a.value - b.value).slice(0, 12);
  $: gridRows = newPowers.slice(0, 4);

  // Color for primes
  const primeColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

  function addPrime() {
    if (numPrimes < allPrimes.length) numPrimes++;
  }

  function removePrime() {
    if (numPrimes > 1) numPrimes--;
  }

  function resetPrimes() {
    numPrimes = 1;
  }
</script>

<div class="euler-mul">
  <div class="prime-controls">
    <button class="ctrl" on:click={removePrime} disabled={numPrimes <= 1}>−</button>
    <button class="ctrl" on:click={addPrime} disabled={numPrimes >= 6}>+</button>
    <button class="ctrl reset" on:click={resetPrimes}>Reset</button>
    <span class="primes-label">
      Primes: <strong>{primes.join(' × ')}</strong>
    </span>
  </div>

  {#if newPrime && primes.length >= 1}
    <!-- Multiplication grid -->
    <div class="grid-section">
      <p class="grid-intro">
        {#if primes.length === 1}
          Start with the geometric series for <strong style="color: {primeColors[0]}">{primes[0]}</strong>:
          the powers 1, {primes[0]}, {primes[0]}², ...
        {:else}
          Multiply the existing terms <span class="muted">(columns)</span> by powers of
          <strong style="color: {primeColors[(primes.length - 1) % primeColors.length]}">{newPrime}</strong>
          <span class="muted">(rows)</span>:
        {/if}
      </p>

      <div class="grid-scroll">
        <table class="mul-grid">
          <thead>
            <tr>
              <th class="corner">×</th>
              {#each gridCols as col}
                <th class="col-header">{col.value}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each gridRows as row, ri}
              <tr>
                <th class="row-header" style="color: {primeColors[(primes.length - 1) % primeColors.length]}">
                  {row.label}
                </th>
                {#each gridCols as col}
                  {@const product = col.value * row.value}
                  {@const isNew = ri > 0 || primes.length > 1}
                  <td class:is-new={ri > 0} class:is-prime={isPrime(product) && product > 1}>
                    {product}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}

  <!-- Sorted result: all generated integers -->
  <div class="result-section">
    <p class="result-label">
      All integers generated (sorted): <span class="result-count">{sortedProducts.length} terms</span>
    </p>
    <div class="result-numbers">
      {#each sortedProducts.slice(0, 40) as n}
        <span class="result-n" class:is-prime={isPrime(n) && n > 1}>
          {n}
        </span>
      {/each}
      {#if sortedProducts.length > 40}
        <span class="result-n muted">…</span>
      {/if}
    </div>
    <p class="result-note">
      {#if primes.length === 1}
        With just the prime {primes[0]}, we get its powers: 1, {primes[0]}, {primes[0]}², ...
      {:else}
        Every product of powers of {primes.join(', ')} appears <strong>exactly once</strong> — unique factorization!
      {/if}
    </p>
  </div>
</div>

<style>
  .euler-mul { width: 100%; }

  .prime-controls {
    display: flex;
    align-items: center;
    gap: 0.4em;
    margin-bottom: 0.8em;
  }

  .ctrl {
    font-family: var(--font-mono);
    font-size: 1rem;
    width: 34px;
    height: 34px;
    border: 1.5px solid var(--color-border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .ctrl:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .ctrl:disabled { opacity: 0.3; cursor: default; }

  .ctrl.reset {
    width: auto;
    padding: 0 0.6em;
    font-size: 0.75rem;
    font-weight: 500;
    font-family: var(--font-serif);
  }

  .primes-label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    margin-left: 0.5em;
  }

  .grid-section { margin-bottom: 1em; }

  .grid-intro {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: 0.4em;
  }

  .grid-scroll { overflow-x: auto; }

  .mul-grid {
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    margin: 0 auto;
  }

  .mul-grid th, .mul-grid td {
    min-width: 38px;
    height: 30px;
    text-align: center;
    padding: 0.15em 0.4em;
    border: 1px solid var(--color-border-light);
  }

  .mul-grid .corner {
    color: var(--color-text-light);
    font-size: 0.9rem;
    background: var(--color-bg-alt);
  }

  .mul-grid .col-header {
    background: var(--color-bg-alt);
    font-weight: 600;
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  .mul-grid .row-header {
    background: var(--color-bg-alt);
    font-weight: 600;
    font-size: 0.75rem;
  }

  .mul-grid td {
    background: white;
    transition: background 0.2s ease;
  }

  .mul-grid td.is-new {
    background: rgba(99, 102, 241, 0.06);
  }

  .mul-grid td.is-prime {
    color: var(--color-prime);
    font-weight: 700;
  }

  .result-section {
    padding: 0.6em 0;
  }

  .result-label {
    font-size: 0.82rem;
    color: var(--color-text-muted);
    margin-bottom: 0.3em;
  }

  .result-count {
    font-family: var(--font-mono);
    color: var(--color-accent);
    font-weight: 600;
  }

  .result-numbers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3em;
    margin-bottom: 0.4em;
  }

  .result-n {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 0.15em 0.4em;
    background: var(--color-accent-light);
    border-radius: 4px;
    color: var(--color-text);
  }

  .result-n.is-prime {
    background: var(--color-prime-bg);
    color: var(--color-prime);
    font-weight: 600;
  }

  .result-n.muted {
    background: var(--color-bg-alt);
    color: var(--color-text-light);
  }

  .result-note {
    font-size: 0.82rem;
    color: var(--color-text-muted);
  }

  .muted { color: var(--color-text-light); }
</style>
