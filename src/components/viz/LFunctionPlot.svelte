<script>
  import { dirichletCharacters, complexAbs } from '../../lib/characters.js';
  import { lFunction } from '../../lib/lfunctions.js';
  import { onMount } from 'svelte';

  export let q = 5;
  export let sValue = 2.0;
  export let showAllCharacters = true;

  const width = 700;
  const height = 350;
  const margin = { left: 55, right: 20, top: 20, bottom: 45 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  $: characters = dirichletCharacters(q);

  // Precompute L(s, chi) for a range of s values
  const sMin = 1.02;
  const sMax = 4;
  const numPoints = 80;
  let curves = [];
  let computing = true;

  const charColors = [
    '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7'
  ];

  $: {
    q;
    computeCurves();
  }

  function computeCurves() {
    computing = true;
    const chars = dirichletCharacters(q);
    const sVals = Array.from({ length: numPoints }, (_, i) =>
      sMin + (sMax - sMin) * (i / (numPoints - 1))
    );

    curves = chars.map((chi, idx) => {
      const points = sVals.map(s => {
        const val = lFunction(s, chi, 2000);
        return { s, re: val[0], im: val[1], abs: complexAbs(val) };
      });
      return { chi, points, color: charColors[idx % charColors.length], index: idx };
    });
    computing = false;
  }

  // Scale functions
  $: yMax = Math.min(12, Math.max(3, ...curves.flatMap(c => c.points.map(p => Math.abs(p.re)))));
  $: xScale = (s) => margin.left + ((s - sMin) / (sMax - sMin)) * plotW;
  $: yScale = (v) => margin.top + plotH - ((v + 1) / (yMax + 1)) * plotH;

  function pathData(points) {
    return points.map((p, i) => {
      const x = xScale(p.s);
      const y = yScale(Math.max(-1, Math.min(yMax, p.re)));
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }

  // Current s marker
  $: currentValues = curves.map(c => {
    const val = lFunction(sValue, c.chi, 2000);
    return { label: c.chi.label, re: val[0], im: val[1], color: c.color, isPrincipal: c.chi.isPrincipal };
  });

  // Y-axis ticks
  $: yTicks = Array.from({ length: Math.ceil(yMax) + 2 }, (_, i) => i - 1).filter(v => v >= -1 && v <= yMax);
</script>

<div class="plot-wrapper">
  {#if computing}
    <p style="text-align:center; color: var(--color-text-muted);">Computing...</p>
  {:else}
    <svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
      <!-- Grid lines -->
      {#each yTicks as tick}
        <line
          x1={margin.left} y1={yScale(tick)}
          x2={width - margin.right} y2={yScale(tick)}
          stroke="var(--color-border-light)" stroke-width="0.5"
        />
        <text
          x={margin.left - 8} y={yScale(tick)}
          text-anchor="end" dominant-baseline="central"
          font-size="11" font-family="var(--font-mono)"
          fill="var(--color-text-light)"
        >
          {tick}
        </text>
      {/each}

      <!-- X-axis ticks -->
      {#each [1, 1.5, 2, 2.5, 3, 3.5, 4] as s}
        <line
          x1={xScale(s)} y1={margin.top}
          x2={xScale(s)} y2={margin.top + plotH}
          stroke="var(--color-border-light)" stroke-width="0.5"
        />
        <text
          x={xScale(s)} y={height - margin.bottom + 18}
          text-anchor="middle"
          font-size="11" font-family="var(--font-mono)"
          fill="var(--color-text-light)"
        >
          {s}
        </text>
      {/each}

      <!-- Axes -->
      <line
        x1={margin.left} y1={yScale(0)}
        x2={width - margin.right} y2={yScale(0)}
        stroke="var(--color-border)" stroke-width="1"
      />
      <line
        x1={margin.left} y1={margin.top}
        x2={margin.left} y2={margin.top + plotH}
        stroke="var(--color-border)" stroke-width="1"
      />

      <!-- Axis labels -->
      <text
        x={width / 2} y={height - 5}
        text-anchor="middle" font-size="13" fill="var(--color-text-muted)"
      >s</text>
      <text
        x={15} y={height / 2}
        text-anchor="middle" font-size="13" fill="var(--color-text-muted)"
        transform="rotate(-90, 15, {height / 2})"
      >L(s, χ)</text>

      <!-- Curves -->
      {#each curves as curve}
        {#if showAllCharacters || curve.chi.isPrincipal}
          <path
            d={pathData(curve.points)}
            fill="none"
            stroke={curve.color}
            stroke-width={curve.chi.isPrincipal ? 2.5 : 1.5}
            opacity={curve.chi.isPrincipal ? 1 : 0.7}
          />
        {/if}
      {/each}

      <!-- Current s vertical line -->
      {#if sValue >= sMin && sValue <= sMax}
        <line
          x1={xScale(sValue)} y1={margin.top}
          x2={xScale(sValue)} y2={margin.top + plotH}
          stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4,3"
          opacity="0.4"
        />
      {/if}

      <!-- Current value markers -->
      {#each currentValues as cv}
        {#if (showAllCharacters || cv.isPrincipal) && cv.re > -1 && cv.re < yMax}
          <circle
            cx={xScale(sValue)}
            cy={yScale(cv.re)}
            r="4"
            fill={cv.color}
            stroke="white"
            stroke-width="1.5"
          />
        {/if}
      {/each}
    </svg>

    <!-- Legend -->
    <div class="legend">
      {#each currentValues as cv, i}
        {#if showAllCharacters || cv.isPrincipal}
          <span class="legend-item">
            <span class="legend-swatch" style="background: {cv.color}"></span>
            <span class="legend-label">{cv.label}</span>
            <span class="legend-value">= {cv.re.toFixed(2)}</span>
          </span>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .plot-wrapper {
    width: 100%;
  }

  svg {
    width: 100%;
    height: auto;
  }

  path {
    transition: opacity 0.2s ease;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em;
    justify-content: center;
    margin-top: 0.5em;
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

  .legend-swatch {
    width: 12px;
    height: 3px;
    border-radius: 2px;
  }

  .legend-label {
    color: var(--color-text-muted);
  }

  .legend-value {
    color: var(--color-text);
    font-weight: 500;
  }
</style>
