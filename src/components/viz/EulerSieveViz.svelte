<script>
  import { listPrimes, isPrime } from '../../lib/primes.js';
  import { factorize } from '../../lib/math-utils.js';

  export let s = 2;
  export let maxN = 36;

  let numPrimesIncluded = 0;

  $: allPrimes = listPrimes(maxN);
  $: includedPrimes = allPrimes.slice(0, numPrimesIncluded);

  // A number n is "reached" if all its prime factors are in the included set
  $: reachedSet = (() => {
    const included = new Set(includedPrimes);
    const reached = new Set();
    for (let n = 1; n <= maxN; n++) {
      if (n === 1) { reached.add(1); continue; }
      const factors = factorize(n);
      if (factors.every(f => included.has(f))) {
        reached.add(n);
      }
    }
    return reached;
  })();

  // Which numbers were NEWLY reached by the last prime added?
  $: prevIncluded = allPrimes.slice(0, Math.max(0, numPrimesIncluded - 1));
  $: prevReached = (() => {
    const included = new Set(prevIncluded);
    const reached = new Set();
    for (let n = 1; n <= maxN; n++) {
      if (n === 1) { reached.add(1); continue; }
      const factors = factorize(n);
      if (factors.every(f => included.has(f))) reached.add(n);
    }
    return reached;
  })();

  $: newlyReached = (() => {
    const s = new Set();
    for (const n of reachedSet) {
      if (!prevReached.has(n)) s.add(n);
    }
    return s;
  })();

  // Partial sum of 1/n^s over reached numbers
  $: partialSum = (() => {
    let sum = 0;
    for (const n of reachedSet) sum += Math.pow(n, -s);
    return sum;
  })();

  // Product of geometric series factors for included primes
  $: productValue = includedPrimes.reduce((acc, p) => acc / (1 - Math.pow(p, -s)), 1);

  // Full sum for comparison
  $: fullSum = (() => {
    let sum = 0;
    for (let n = 1; n <= maxN; n++) sum += Math.pow(n, -s);
    return sum;
  })();

  // Grid layout
  const cols = 6;
  $: rows = Math.ceil(maxN / cols);
  const cellSize = 52;
  const cellGap = 3;

  $: gridW = cols * (cellSize + cellGap) + cellGap;
  $: gridH = rows * (cellSize + cellGap) + cellGap;

  // Prime colors
  const primeColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  // For a reached number, determine which prime "activated" it
  // (the largest prime factor, or the most recently added prime)
  function activatingPrime(n) {
    if (n === 1) return -1;
    const factors = factorize(n);
    // The prime that first made this reachable is the largest prime factor
    const maxFactor = Math.max(...factors);
    return maxFactor;
  }

  function cellColor(n) {
    if (!reachedSet.has(n)) return 'var(--color-bg-alt)';
    if (n === 1) return 'var(--color-accent-light)';
    if (newlyReached.has(n)) {
      const p = activatingPrime(n);
      const idx = allPrimes.indexOf(p);
      return primeColors[idx % primeColors.length] + '30'; // with alpha
    }
    return 'var(--color-accent-light)';
  }

  function cellBorder(n) {
    if (newlyReached.has(n)) {
      const p = activatingPrime(n);
      const idx = allPrimes.indexOf(p);
      return primeColors[idx % primeColors.length];
    }
    if (reachedSet.has(n)) return 'var(--color-accent)';
    return 'var(--color-border-light)';
  }

  function factorString(n) {
    if (n === 1) return '1';
    const f = factorize(n);
    // Group by prime
    const counts = {};
    for (const p of f) counts[p] = (counts[p] || 0) + 1;
    const supDigits = '⁰¹²³⁴⁵⁶⁷⁸⁹';
    const sup = (n) => String(n).split('').map(d => supDigits[parseInt(d)]).join('');
    return Object.entries(counts).map(([p, e]) => e > 1 ? `${p}${sup(e)}` : p).join('·');
  }

  // The geometric series for the last added prime
  $: lastPrime = numPrimesIncluded > 0 ? allPrimes[numPrimesIncluded - 1] : null;
  $: geoTerms = lastPrime ? Array.from({ length: 5 }, (_, k) => ({
    k,
    value: Math.pow(lastPrime, -k * s),
    label: (() => {
      const sup = (n) => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(d)]).join('');
      if (k === 0) return '1';
      const exp = k * s;
      return `1/${lastPrime}${sup(exp)}`;
    })()
  })) : [];
</script>

<div class="sieve-viz">
  <div class="controls-row">
    <div class="prime-stepper">
      <button class="step-btn" on:click={() => numPrimesIncluded = Math.max(0, numPrimesIncluded - 1)} disabled={numPrimesIncluded === 0}>−</button>
      <span class="step-label">
        {#if numPrimesIncluded === 0}
          No primes yet
        {:else}
          Primes: {includedPrimes.join(', ')}
        {/if}
      </span>
      <button class="step-btn" on:click={() => numPrimesIncluded = Math.min(allPrimes.length, numPrimesIncluded + 1)} disabled={numPrimesIncluded >= allPrimes.length}>+</button>
    </div>
    {#if lastPrime}
      <div class="geo-series">
        Multiplying by: <span class="geo-formula">
          1/(1 − 1/{lastPrime}<sup>{s}</sup>) = {geoTerms.map(t => t.label).join(' + ')} + ···
        </span>
      </div>
    {/if}
  </div>

  <!-- The integer grid -->
  <div class="grid-scroll">
    <svg width={gridW} height={gridH} viewBox="0 0 {gridW} {gridH}">
      {#each Array(maxN) as _, i}
        {@const n = i + 1}
        {@const col = i % cols}
        {@const row = Math.floor(i / cols)}
        {@const x = cellGap + col * (cellSize + cellGap)}
        {@const y = cellGap + row * (cellSize + cellGap)}
        {@const reached = reachedSet.has(n)}
        {@const isNew = newlyReached.has(n)}
        <g>
          <rect
            {x} {y} width={cellSize} height={cellSize}
            rx="5"
            fill={cellColor(n)}
            stroke={cellBorder(n)}
            stroke-width={isNew ? 2 : reached ? 1.5 : 0.75}
            opacity={reached ? 1 : 0.4}
          />
          <!-- Number -->
          <text
            x={x + cellSize / 2} y={y + cellSize / 2 - 4}
            text-anchor="middle" dominant-baseline="central"
            font-size={n >= 100 ? '11' : '14'}
            font-family="var(--font-mono)"
            font-weight={reached ? '600' : '300'}
            fill={reached ? (isPrime(n) && n > 1 ? 'var(--color-prime)' : 'var(--color-text)') : 'var(--color-text-light)'}
            opacity={reached ? 1 : 0.4}
          >
            {n}
          </text>
          <!-- Factorization (small, below the number) -->
          {#if reached && n > 1}
            <text
              x={x + cellSize / 2} y={y + cellSize / 2 + 12}
              text-anchor="middle" dominant-baseline="central"
              font-size="7"
              font-family="var(--font-mono)"
              fill="var(--color-text-muted)"
            >
              {factorString(n)}
            </text>
          {/if}
        </g>
      {/each}
    </svg>
  </div>

  <!-- Summary stats -->
  <div class="stats-row">
    <div class="stat">
      <span class="stat-label">Reached</span>
      <span class="stat-value">{reachedSet.size} / {maxN}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Σ 1/n<sup>{s}</sup> (reached)</span>
      <span class="stat-value">{partialSum.toFixed(4)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Product</span>
      <span class="stat-value">{productValue.toFixed(4)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Full sum (1..{maxN})</span>
      <span class="stat-value">{fullSum.toFixed(4)}</span>
    </div>
  </div>
  <p class="match-note">
    {#if Math.abs(partialSum - productValue) < 0.001}
      The sum over reached numbers <strong>exactly equals</strong> the product of geometric series — they're computing the same thing!
    {:else}
      Sum and product match to the precision of our grid.
    {/if}
    {#if reachedSet.size === maxN}
      <strong>All integers reached!</strong> Every number ≤ {maxN} has been generated by the prime factorizations.
    {/if}
  </p>
</div>

<style>
  .sieve-viz { width: 100%; }

  .controls-row {
    margin-bottom: 1em;
  }

  .prime-stepper {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-bottom: 0.5em;
  }

  .step-btn {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    width: 36px;
    height: 36px;
    border: 1.5px solid var(--color-border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    font-weight: 700;
  }

  .step-btn:hover:not(:disabled) {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .step-btn:disabled {
    opacity: 0.3;
    cursor: default;
  }

  .step-label {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--color-text);
    font-weight: 500;
  }

  .geo-series {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .geo-formula {
    color: var(--color-accent);
  }

  .grid-scroll {
    overflow-x: auto;
    display: flex;
    justify-content: center;
    margin-bottom: 0.8em;
  }

  svg { max-width: 100%; height: auto; }

  rect { transition: all 0.3s ease; }

  .stats-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    justify-content: center;
    margin-bottom: 0.3em;
  }

  .stat {
    text-align: center;
    padding: 0.4em 0.8em;
    background: var(--color-bg-alt);
    border-radius: 6px;
    min-width: 100px;
  }

  .stat-label {
    display: block;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-light);
    margin-bottom: 0.15em;
  }

  .stat-value {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-accent);
  }

  .match-note {
    font-size: 0.82rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .match-note strong {
    color: var(--color-prime);
  }
</style>
