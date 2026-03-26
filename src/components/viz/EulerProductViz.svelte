<script>
  import { isPrime, listPrimes } from '../../lib/primes.js';

  export let s = 2;
  export let numPrimes = 5;

  $: primes = listPrimes(50).slice(0, numPrimes);

  // For each prime p, show the geometric series 1 + 1/p^s + 1/p^(2s) + ...
  // = 1/(1 - p^{-s})
  $: factors = primes.map(p => {
    const term = Math.pow(p, -s);
    const factor = 1 / (1 - term);
    const terms = [];
    let power = 1;
    for (let k = 0; k < 5; k++) {
      terms.push({ k, value: power, label: k === 0 ? '1' : `1/${p}${k > 1 ? `^${k * (s === Math.round(s) ? s : s.toFixed(1))}` : `^${s === Math.round(s) ? s : s.toFixed(1)}`}` });
      power *= term;
    }
    return { p, factor, terms, term };
  });

  $: product = factors.reduce((acc, f) => acc * f.factor, 1);

  // Compare with partial sum of 1/n^s
  $: partialSum = (() => {
    let sum = 0;
    for (let n = 1; n <= 100; n++) {
      sum += Math.pow(n, -s);
    }
    return sum;
  })();

  const barWidth = 80;
  const barGap = 12;
  const height = 200;
  const maxBarH = 160;

  $: svgWidth = (barWidth + barGap) * factors.length + barGap + 120;
</script>

<div class="euler-wrapper">
  <div class="product-display">
    <div class="product-factors">
      {#each factors as f, i}
        <span class="factor">
          <span class="frac">
            <span class="num">1</span>
            <span class="den">1 - 1/{f.p}<sup>{s === Math.round(s) ? s : s.toFixed(1)}</sup></span>
          </span>
          {#if i < factors.length - 1}
            <span class="times">&times;</span>
          {/if}
        </span>
      {/each}
      <span class="times">&middot;&middot;&middot;</span>
    </div>
  </div>

  <!-- Bar chart showing each factor's contribution -->
  <svg width={svgWidth} height={height} viewBox="0 0 {svgWidth} {height}">
    {#each factors as f, i}
      {@const barH = Math.min(maxBarH, (f.factor / Math.max(...factors.map(x => x.factor))) * maxBarH)}
      <g transform="translate({barGap + i * (barWidth + barGap)}, 0)">
        <rect
          x="0" y={height - 30 - barH}
          width={barWidth} height={barH}
          fill="var(--color-accent-light)"
          stroke="var(--color-accent)"
          stroke-width="1"
          rx="4"
        />
        <text
          x={barWidth / 2} y={height - 30 - barH - 8}
          text-anchor="middle"
          font-size="12" font-family="var(--font-mono)"
          font-weight="600"
          fill="var(--color-accent)"
        >
          {f.factor.toFixed(3)}
        </text>
        <text
          x={barWidth / 2} y={height - 10}
          text-anchor="middle"
          font-size="13" font-family="var(--font-mono)"
          fill="var(--color-text)"
        >
          p = {f.p}
        </text>
      </g>
    {/each}

    <!-- Product result -->
    {#each [Math.min(maxBarH, (product / Math.max(...factors.map(x => x.factor), product)) * maxBarH)] as prodH}
    <g transform="translate({barGap + factors.length * (barWidth + barGap) + 20}, 0)">
      <rect
        x="0" y={height - 30 - prodH}
        width={barWidth} height={prodH}
        fill="var(--color-prime-bg)"
        stroke="var(--color-prime)"
        stroke-width="1.5"
        rx="4"
      />
      <text
        x={barWidth / 2} y={height - 30 - prodH - 8}
        text-anchor="middle"
        font-size="12" font-family="var(--font-mono)"
        font-weight="700"
        fill="var(--color-prime)"
      >
        {product.toFixed(3)}
      </text>
      <text
        x={barWidth / 2} y={height - 10}
        text-anchor="middle"
        font-size="11" font-family="var(--font-mono)"
        fill="var(--color-text-muted)"
      >
        product
      </text>
    </g>
    {/each}
  </svg>

  <div class="comparison">
    <span>Product of first {numPrimes} factors: <strong>{product.toFixed(4)}</strong></span>
    <span>Sum of 1/n<sup>{s === Math.round(s) ? s : s.toFixed(1)}</sup> (100 terms): <strong>{partialSum.toFixed(4)}</strong></span>
  </div>
</div>

<style>
  .euler-wrapper {
    text-align: center;
  }

  .product-display {
    margin-bottom: 1em;
  }

  .product-factors {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  .factor {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  .frac {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    vertical-align: middle;
    line-height: 1.2;
  }

  .num {
    border-bottom: 1px solid var(--color-text);
    padding: 0 0.3em;
  }

  .den {
    padding: 0 0.3em;
    font-size: 0.8em;
  }

  .times {
    color: var(--color-text-muted);
  }

  svg {
    max-width: 100%;
    height: auto;
  }

  .comparison {
    display: flex;
    flex-direction: column;
    gap: 0.3em;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-top: 0.5em;
  }

  .comparison strong {
    color: var(--color-text);
  }
</style>
