<script>
  import { isPrime } from '../../lib/primes.js';
  import { gcd, coprimeResidues, totient } from '../../lib/math-utils.js';

  export let q = 5;
  export let maxN = 1000;

  $: residues = coprimeResidues(q);
  $: phi = residues.length;

  $: counts = (() => {
    const c = {};
    for (const r of residues) c[r] = 0;
    for (let n = 2; n <= maxN; n++) {
      if (isPrime(n)) {
        const r = n % q;
        if (r in c) c[r]++;
      }
    }
    return residues.map(r => ({ residue: r, count: c[r] }));
  })();

  $: totalPrimes = counts.reduce((s, c) => s + c.count, 0);
  $: maxCount = Math.max(...counts.map(c => c.count));
  $: expectedFraction = 1 / phi;

  const width = 500;
  const height = 260;
  const margin = { left: 50, right: 20, top: 20, bottom: 50 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  $: barWidth = Math.min(50, plotW / counts.length - 8);
  $: xOffset = (plotW - counts.length * (barWidth + 8)) / 2;
</script>

<div class="equi-wrapper">
  <svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
    <!-- Expected line -->
    {#each [maxCount > 0 ? (expectedFraction * totalPrimes / maxCount) * plotH : 0] as expectedH}
    <line
      x1={margin.left}
      y1={margin.top + plotH - expectedH}
      x2={width - margin.right}
      y2={margin.top + plotH - expectedH}
      stroke="var(--color-prime)"
      stroke-width="1"
      stroke-dasharray="5,3"
      opacity="0.6"
    />
    <text
      x={width - margin.right + 2}
      y={margin.top + plotH - expectedH}
      font-size="9"
      font-family="var(--font-mono)"
      fill="var(--color-prime)"
      dominant-baseline="central"
    >
      1/φ({q})
    </text>
    {/each}

    <!-- Bars -->
    {#each counts as c, i}
      {@const barH = maxCount > 0 ? (c.count / maxCount) * plotH : 0}
      {@const x = margin.left + xOffset + i * (barWidth + 8)}
      <rect
        {x}
        y={margin.top + plotH - barH}
        width={barWidth}
        height={barH}
        fill="var(--color-accent-light)"
        stroke="var(--color-accent)"
        stroke-width="1"
        rx="3"
      />
      <text
        x={x + barWidth / 2}
        y={margin.top + plotH - barH - 6}
        text-anchor="middle"
        font-size="10"
        font-family="var(--font-mono)"
        fill="var(--color-accent)"
        font-weight="500"
      >
        {c.count}
      </text>
      <text
        x={x + barWidth / 2}
        y={height - margin.bottom + 15}
        text-anchor="middle"
        font-size="11"
        font-family="var(--font-mono)"
        fill="var(--color-text)"
      >
        {c.residue}
      </text>
      <!-- Percentage -->
      <text
        x={x + barWidth / 2}
        y={height - margin.bottom + 28}
        text-anchor="middle"
        font-size="9"
        font-family="var(--font-mono)"
        fill="var(--color-text-light)"
      >
        {totalPrimes > 0 ? (c.count / totalPrimes * 100).toFixed(1) : 0}%
      </text>
    {/each}

    <!-- Y-axis -->
    <line
      x1={margin.left} y1={margin.top}
      x2={margin.left} y2={margin.top + plotH}
      stroke="var(--color-border)" stroke-width="1"
    />

    <!-- X-axis -->
    <line
      x1={margin.left} y1={margin.top + plotH}
      x2={width - margin.right} y2={margin.top + plotH}
      stroke="var(--color-border)" stroke-width="1"
    />

    <text
      x={width / 2}
      y={height - 3}
      text-anchor="middle"
      font-size="11"
      fill="var(--color-text-muted)"
    >
      residue mod {q}
    </text>
  </svg>

  <p class="equi-note">
    Primes up to {maxN}: <strong>{totalPrimes}</strong> total.
    Expected per class: <strong>{(totalPrimes / phi).toFixed(1)}</strong> ({(100 / phi).toFixed(1)}% each).
  </p>
</div>

<style>
  .equi-wrapper {
    text-align: center;
  }

  svg {
    width: 100%;
    max-width: 500px;
    height: auto;
  }

  .equi-note {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.5em;
  }

  .equi-note strong {
    color: var(--color-text);
  }
</style>
