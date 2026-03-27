<script>
  import { dirichletCharacters, complexAbs } from '../../lib/characters.js';
  import { lFunction } from '../../lib/lfunctions.js';

  export let q = 5;
  export let sValue = 2.0;
  export let showAllCharacters = true;

  const width = 700;
  const height = 350;
  const margin = { left: 55, right: 20, top: 20, bottom: 45 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  $: characters = dirichletCharacters(q);

  // Precompute L(s, chi) for a dense range of s values down to near 1
  const sMin = 1.005;
  const sMax = 4;
  const numPoints = 120;

  const charColors = [
    '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7'
  ];

  $: curves = (() => {
    const chars = dirichletCharacters(q);
    // Use more points near s=1 where things change fast (log spacing)
    const sVals = Array.from({ length: numPoints }, (_, i) => {
      const t = i / (numPoints - 1); // 0 to 1
      // Log-spaced: more density near sMin
      return sMin + (sMax - sMin) * (t * t); // quadratic: denser near sMin
    });

    return chars.map((chi, idx) => {
      const points = sVals.map(s => {
        const val = lFunction(s, chi, 2000);
        return { s, re: val[0], im: val[1] };
      });
      return { chi, points, color: charColors[idx % charColors.length], index: idx };
    });
  })();

  // Adaptive y-axis: scale to always show the principal character's value at current s
  // No cap — let it go to 1000+ so the blowup is dramatic
  $: principalAtS = (() => {
    if (sValue <= 1.0) return 1000;
    const chi0 = characters.find(c => c.isPrincipal);
    if (!chi0) return 5;
    const val = lFunction(Math.max(sValue, sMin), chi0, 2000);
    return Math.abs(val[0]);
  })();

  $: yMax = Math.max(3, principalAtS * 1.4);

  $: xScale = (s) => margin.left + ((s - sMin) / (sMax - sMin)) * plotW;
  $: yScale = (v) => margin.top + plotH - ((v + 1) / (yMax + 1)) * plotH;

  // Reactive path generation — recalculates when yMax changes
  $: pathDatas = curves.map(curve => {
    return curve.points.map((p, i) => {
      const x = xScale(p.s);
      const y = yScale(p.re);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  });

  // Current s marker values
  $: currentValues = curves.map(c => {
    const s = Math.max(sValue, sMin);
    const val = lFunction(s, c.chi, 2000);
    return { label: c.chi.label, re: val[0], im: val[1], color: c.color, isPrincipal: c.chi.isPrincipal };
  });

  // Adaptive Y-axis ticks
  $: yTicks = (() => {
    const step = yMax > 50 ? 20 : yMax > 20 ? 5 : yMax > 8 ? 2 : 1;
    const ticks = [];
    for (let v = 0; v <= yMax; v += step) ticks.push(v);
    if (ticks[0] !== -1 && yMax < 20) ticks.unshift(-1);
    return ticks;
  })();

  // X-axis ticks
  $: xTicks = [1, 1.5, 2, 2.5, 3, 3.5, 4].filter(s => s >= sMin);
</script>

<div class="plot-wrapper">
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
        font-size="10" font-family="var(--font-mono)"
        fill="var(--color-text-light)"
      >
        {tick}
      </text>
    {/each}

    {#each xTicks as s}
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
    <text x={width / 2} y={height - 5} text-anchor="middle" font-size="13" fill="var(--color-text-muted)">s</text>
    <text x={15} y={height / 2} text-anchor="middle" font-size="13" fill="var(--color-text-muted)"
      transform="rotate(-90, 15, {height / 2})">L(s, χ)</text>

    <!-- s=1 pole marker -->
    <line
      x1={xScale(1)} y1={margin.top}
      x2={xScale(1)} y2={margin.top + plotH}
      stroke="var(--color-prime)" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"
    />
    <text x={xScale(1)} y={margin.top - 5} text-anchor="middle"
      font-size="9" font-family="var(--font-mono)" fill="var(--color-prime)" font-weight="600">
      s = 1 (pole)
    </text>

    <!-- Clip path for the plot area -->
    <defs>
      <clipPath id="plot-clip-{q}">
        <rect x={margin.left} y={margin.top} width={plotW} height={plotH} />
      </clipPath>
    </defs>

    <!-- Curves (clipped to plot area) -->
    <g clip-path="url(#plot-clip-{q})">
      {#each curves as curve, idx}
        {#if showAllCharacters || curve.chi.isPrincipal}
          <path
            d={pathDatas[idx]}
            fill="none"
            stroke={curve.color}
            stroke-width={curve.chi.isPrincipal ? 2.5 : 1.5}
            opacity={curve.chi.isPrincipal ? 1 : 0.7}
          />
        {/if}
      {/each}
    </g>

    <!-- Current s vertical line -->
    {#if sValue >= sMin && sValue <= sMax}
      <line
        x1={xScale(sValue)} y1={margin.top}
        x2={xScale(sValue)} y2={margin.top + plotH}
        stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4,3"
        opacity="0.4"
      />
    {/if}

    <!-- Current value markers (clipped) -->
    <g clip-path="url(#plot-clip-{q})">
      {#each currentValues as cv}
        {#if showAllCharacters || cv.isPrincipal}
          <circle
            cx={xScale(Math.max(sValue, sMin))}
            cy={yScale(cv.re)}
            r="5"
            fill={cv.color}
            stroke="white"
            stroke-width="2"
          />
        {/if}
      {/each}
    </g>
  </svg>

  <!-- Legend -->
  <div class="legend">
    {#each currentValues as cv}
      {#if showAllCharacters || cv.isPrincipal}
        <span class="legend-item">
          <span class="legend-swatch" style="background: {cv.color}"></span>
          <span class="legend-label">{cv.label}</span>
          <span class="legend-value">
            = {Math.abs(cv.re) > 1000 ? '∞' : cv.re.toFixed(2)}
          </span>
        </span>
      {/if}
    {/each}
  </div>
</div>

<style>
  .plot-wrapper { width: 100%; }
  svg { width: 100%; height: auto; }
  .legend { display: flex; flex-wrap: wrap; gap: 0.8em; justify-content: center; margin-top: 0.5em; font-family: var(--font-mono); font-size: 0.75rem; }
  .legend-item { display: flex; align-items: center; gap: 0.3em; }
  .legend-swatch { width: 12px; height: 3px; border-radius: 2px; }
  .legend-label { color: var(--color-text-muted); }
  .legend-value { color: var(--color-text); font-weight: 500; }
</style>
