<script>
  import { sieve } from '../../lib/primes.js';

  export let maxN = 10000;

  // Precompute cumulative prime count up to 100k
  const LIMIT = 100000;
  const isPrimeArr = sieve(LIMIT);
  const piCache = new Int32Array(LIMIT + 1); // π(n)
  {
    let count = 0;
    for (let i = 0; i <= LIMIT; i++) {
      if (isPrimeArr[i]) count++;
      piCache[i] = count;
    }
  }

  function pi(n) {
    return piCache[Math.min(n, LIMIT)];
  }

  // Generate sample points (log-spaced for smooth curve at all scales)
  $: samples = (() => {
    const pts = [];
    const logMin = Math.log(10);
    const logMax = Math.log(Math.min(maxN, LIMIT));
    const numPts = 300;
    for (let i = 0; i <= numPts; i++) {
      const n = Math.round(Math.exp(logMin + (logMax - logMin) * i / numPts));
      if (n < 2) continue;
      const density = pi(n) / n;
      const approx = 1 / Math.log(n);
      pts.push({ n, density, approx });
    }
    // Deduplicate (log spacing can round to same n)
    const seen = new Set();
    return pts.filter(p => {
      if (seen.has(p.n)) return false;
      seen.add(p.n);
      return true;
    });
  })();

  // Chart dimensions
  const W = 680;
  const H = 300;
  const margin = { left: 55, right: 20, top: 20, bottom: 45 };
  const pw = W - margin.left - margin.right;
  const ph = H - margin.top - margin.bottom;

  // Scales
  $: xMin = 10;
  $: xMax = Math.min(maxN, LIMIT);
  $: xScale = (n) => margin.left + (Math.log(n) - Math.log(xMin)) / (Math.log(xMax) - Math.log(xMin)) * pw;
  $: yMax = 0.35;
  $: yScale = (v) => margin.top + ph - (v / yMax) * ph;

  // Paths
  $: densityPath = samples.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xScale(p.n)},${yScale(p.density)}`
  ).join(' ');

  $: approxPath = samples.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xScale(p.n)},${yScale(p.approx)}`
  ).join(' ');

  // X-axis ticks (powers of 10)
  $: xTicks = (() => {
    const ticks = [];
    for (let p = 1; p <= 5; p++) {
      const v = Math.pow(10, p);
      if (v >= xMin && v <= xMax) ticks.push(v);
    }
    return ticks;
  })();

  // Y-axis ticks
  const yTicks = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];

  // Hover state
  let hoverN = null;
  let hoverX = 0;

  function handleMouseMove(e) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * W;
    // Invert x scale
    const logN = Math.log(xMin) + (mx - margin.left) / pw * (Math.log(xMax) - Math.log(xMin));
    const n = Math.round(Math.exp(logN));
    if (n >= 2 && n <= LIMIT) {
      hoverN = n;
      hoverX = xScale(n);
    } else {
      hoverN = null;
    }
  }

  function handleMouseLeave() {
    hoverN = null;
  }

  $: hoverDensity = hoverN ? pi(hoverN) / hoverN : 0;
  $: hoverApprox = hoverN ? 1 / Math.log(hoverN) : 0;
  $: hoverPiN = hoverN ? pi(hoverN) : 0;

  function formatN(n) {
    return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : n.toString();
  }
</script>

<div class="density-plot">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svg
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="xMidYMid meet"
    class="plot-svg"
    on:mousemove={handleMouseMove}
    on:mouseleave={handleMouseLeave}
  >
    <!-- Grid -->
    {#each yTicks as tick}
      <line x1={margin.left} y1={yScale(tick)} x2={W - margin.right} y2={yScale(tick)}
        stroke="var(--color-border-light)" stroke-width="0.5" />
      <text x={margin.left - 6} y={yScale(tick)} text-anchor="end" dominant-baseline="central"
        font-size="10" font-family="var(--font-mono)" fill="var(--color-text-light)">
        {(tick * 100).toFixed(0)}%
      </text>
    {/each}

    {#each xTicks as tick}
      <line x1={xScale(tick)} y1={margin.top} x2={xScale(tick)} y2={margin.top + ph}
        stroke="var(--color-border-light)" stroke-width="0.5" />
      <text x={xScale(tick)} y={H - margin.bottom + 18} text-anchor="middle"
        font-size="10" font-family="var(--font-mono)" fill="var(--color-text-light)">
        {formatN(tick)}
      </text>
    {/each}

    <!-- Axes -->
    <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + ph}
      stroke="var(--color-border)" stroke-width="1" />
    <line x1={margin.left} y1={margin.top + ph} x2={W - margin.right} y2={margin.top + ph}
      stroke="var(--color-border)" stroke-width="1" />

    <!-- Axis labels -->
    <text x={W / 2} y={H - 4} text-anchor="middle" font-size="12" fill="var(--color-text-muted)">n</text>
    <text x={12} y={H / 2} text-anchor="middle" font-size="11" fill="var(--color-text-muted)"
      transform="rotate(-90, 12, {H / 2})">fraction prime</text>

    <!-- 1/ln(n) curve (theoretical) -->
    <path d={approxPath} fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-dasharray="6,3" opacity="0.6" />

    <!-- π(n)/n curve (actual) -->
    <path d={densityPath} fill="none" stroke="var(--color-prime)" stroke-width="2.5" />

    <!-- Hover line -->
    {#if hoverN}
      <line x1={hoverX} y1={margin.top} x2={hoverX} y2={margin.top + ph}
        stroke="var(--color-text)" stroke-width="1" opacity="0.3" />
      <circle cx={hoverX} cy={yScale(hoverDensity)} r="4"
        fill="var(--color-prime)" stroke="white" stroke-width="1.5" />
      <circle cx={hoverX} cy={yScale(hoverApprox)} r="3"
        fill="var(--color-accent)" stroke="white" stroke-width="1" />
    {/if}
  </svg>

  <!-- Legend and hover readout -->
  <div class="legend-row">
    <span class="legend-item">
      <span class="legend-swatch actual"></span>
      π(n)/n — actual prime fraction
    </span>
    <span class="legend-item">
      <span class="legend-swatch approx"></span>
      1/ln(n) — predicted by Prime Number Theorem
    </span>
  </div>

  {#if hoverN}
    <div class="hover-readout">
      At <strong class="number">n = {hoverN.toLocaleString()}</strong>:
      <strong class="prime-number">{hoverPiN.toLocaleString()}</strong> primes
      ({(hoverDensity * 100).toFixed(1)}% of numbers),
      predicted: {(hoverApprox * 100).toFixed(1)}%
    </div>
  {:else}
    <div class="hover-readout muted">Hover over the chart to see values</div>
  {/if}
</div>

<style>
  .density-plot { width: 100%; }

  .plot-svg {
    width: 100%;
    height: auto;
    cursor: crosshair;
  }

  .legend-row {
    display: flex;
    gap: 1.5em;
    justify-content: center;
    margin-top: 0.3em;
    font-size: 0.78rem;
    color: var(--color-text-muted);
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4em;
  }

  .legend-swatch {
    width: 20px;
    height: 3px;
    border-radius: 1.5px;
  }

  .legend-swatch.actual {
    background: var(--color-prime);
  }

  .legend-swatch.approx {
    background: var(--color-accent);
    background: repeating-linear-gradient(90deg, var(--color-accent) 0 6px, transparent 6px 9px);
  }

  .hover-readout {
    text-align: center;
    font-size: 0.85rem;
    margin-top: 0.4em;
    min-height: 1.4em;
  }

  .hover-readout.muted {
    color: var(--color-text-light);
    font-style: italic;
  }
</style>
