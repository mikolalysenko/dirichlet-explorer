<script>
  import { onMount, onDestroy } from 'svelte';
  import { dirichletCharacters, complexAbs } from '../../lib/characters.js';
  import { coprimeResidues, gcd } from '../../lib/math-utils.js';
  import { isPrime } from '../../lib/primes.js';

  export let q = 7;
  export let maxN = 60;

  $: characters = dirichletCharacters(q);
  $: residues = coprimeResidues(q);

  // Evaluate each character at every integer from 1..maxN
  $: waveforms = characters.map((chi, idx) => {
    const points = [];
    for (let n = 1; n <= maxN; n++) {
      const val = chi.values.get(((n % q) + q) % q) || [0, 0];
      points.push({ n, re: val[0], im: val[1], coprime: gcd(n, q) === 1, prime: isPrime(n) });
    }
    return { chi, points, index: idx };
  });

  const charColors = [
    '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7'
  ];

  // Waveform plot dimensions
  const waveW = 700;
  const waveH = 100;
  const waveMargin = { left: 50, right: 15, top: 8, bottom: 20 };
  const waveInner = waveW - waveMargin.left - waveMargin.right;
  const waveInnerH = waveH - waveMargin.top - waveMargin.bottom;

  $: xScale = (n) => waveMargin.left + ((n - 1) / (maxN - 1)) * waveInner;
  $: yScale = (v) => waveMargin.top + waveInnerH / 2 - v * (waveInnerH / 2) * 0.9;

  // Phasor wheel dimensions
  const phasorSize = 160;
  const phasorCx = phasorSize / 2;
  const phasorCy = phasorSize / 2;
  const phasorR = phasorSize / 2 - 20;

  // Animation state
  let animN = 1;
  let playing = false;
  let animFrame;
  let lastTime = 0;
  const speed = 400; // ms per step

  function tick(time) {
    if (!playing) return;
    if (time - lastTime > speed) {
      lastTime = time;
      animN = animN >= maxN ? 1 : animN + 1;
    }
    animFrame = requestAnimationFrame(tick);
  }

  function togglePlay() {
    playing = !playing;
    if (playing) {
      lastTime = performance.now();
      animFrame = requestAnimationFrame(tick);
    }
  }

  onDestroy(() => {
    if (animFrame) cancelAnimationFrame(animFrame);
  });

  // Current phasor values at animN
  $: currentPhasors = characters.map((chi, idx) => {
    const val = chi.values.get(((animN % q) + q) % q) || [0, 0];
    return { chi, re: val[0], im: val[1], color: charColors[idx % charColors.length], index: idx };
  });

  // Waveform path (Re part) with stems at each integer
  function wavePath(waveform, part) {
    const pts = waveform.points.filter(p => p.coprime);
    if (pts.length === 0) return '';
    return pts.map((p, i) => {
      const x = xScale(p.n);
      const y = yScale(part === 're' ? p.re : p.im);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }

  // Continuous interpolated path for smoother look
  function smoothWavePath(waveform, part) {
    const pts = [];
    for (let n = 1; n <= maxN; n++) {
      const val = waveform.chi.values.get(((n % q) + q) % q) || [0, 0];
      const coprime = gcd(n, q) === 1;
      if (coprime) {
        pts.push({ n, v: part === 're' ? val[0] : val[1] });
      }
    }
    if (pts.length === 0) return '';
    // Draw as step function with smooth transitions
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const x = xScale(pts[i].n);
      const y = yScale(pts[i].v);
      if (i === 0) {
        d += `M${x},${y}`;
      } else {
        // Horizontal step to midpoint, then vertical
        const prevX = xScale(pts[i - 1].n);
        const midX = (prevX + x) / 2;
        const prevY = yScale(pts[i - 1].v);
        d += ` L${midX},${prevY} L${midX},${y} L${x},${y}`;
      }
    }
    return d;
  }
</script>

<div class="phasor-viz">
  <!-- Animated phasor wheels -->
  <div class="phasor-section">
    <div class="phasor-header">
      <h4>Character phasors at n = {animN}
        {#if gcd(animN, q) === 1}
          <span class="coprime-tag">coprime to {q}</span>
        {:else}
          <span class="zero-tag">shares factor with {q} → all zero</span>
        {/if}
      </h4>
      <div class="play-controls">
        <button class="play-btn" on:click={togglePlay}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <input type="range" bind:value={animN} min={1} max={maxN} class="n-slider" />
        <span class="n-label">{animN}</span>
      </div>
    </div>

    <div class="phasor-wheels">
      {#each currentPhasors as phasor}
        <div class="phasor-wheel">
          <svg width={phasorSize} height={phasorSize} viewBox="0 0 {phasorSize} {phasorSize}">
            <!-- Unit circle -->
            <circle cx={phasorCx} cy={phasorCy} r={phasorR} fill="none" stroke="var(--color-border-light)" stroke-width="0.75" />
            <!-- Axes -->
            <line x1={phasorCx - phasorR} y1={phasorCy} x2={phasorCx + phasorR} y2={phasorCy} stroke="var(--color-border-light)" stroke-width="0.5" />
            <line x1={phasorCx} y1={phasorCy - phasorR} x2={phasorCx} y2={phasorCy + phasorR} stroke="var(--color-border-light)" stroke-width="0.5" />

            <!-- Trail: show previous values as fading dots -->
            {#each Array(Math.min(q, 8)) as _, k}
              {@const prevN = animN - k - 1}
              {#if prevN >= 1}
                {@const prevVal = phasor.chi.values.get(((prevN % q) + q) % q) || [0, 0]}
                {#if gcd(prevN, q) === 1}
                  <circle
                    cx={phasorCx + prevVal[0] * phasorR}
                    cy={phasorCy - prevVal[1] * phasorR}
                    r="3"
                    fill={phasor.color}
                    opacity={0.15 + 0.08 * (8 - k)}
                  />
                {/if}
              {/if}
            {/each}

            <!-- Phasor arrow -->
            {#if gcd(animN, q) === 1}
              <line
                x1={phasorCx} y1={phasorCy}
                x2={phasorCx + phasor.re * phasorR}
                y2={phasorCy - phasor.im * phasorR}
                stroke={phasor.color}
                stroke-width="2.5"
                stroke-linecap="round"
              />
              <circle
                cx={phasorCx + phasor.re * phasorR}
                cy={phasorCy - phasor.im * phasorR}
                r="5"
                fill={phasor.color}
                stroke="white"
                stroke-width="1.5"
              />
            {:else}
              <!-- Zero: dot at origin -->
              <circle cx={phasorCx} cy={phasorCy} r="4" fill="var(--color-border)" stroke="white" stroke-width="1" />
            {/if}
          </svg>
          <div class="phasor-label" style="color: {phasor.color}">{phasor.chi.label}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Waveform plots -->
  <div class="waveform-section">
    <h4>Character waveforms — real part of χ(n) as n varies</h4>
    <p class="wave-note">Each character oscillates at a different "frequency." The principal character χ₀ is constant (flat line at 1 for coprime n). Others oscillate — just like Fourier harmonics.</p>

    {#each waveforms as waveform}
      <div class="waveform-row">
        <svg viewBox="0 0 {waveW} {waveH}" preserveAspectRatio="xMidYMid meet" class="waveform-svg">
          <!-- Zero line -->
          <line
            x1={waveMargin.left} y1={yScale(0)}
            x2={waveW - waveMargin.right} y2={yScale(0)}
            stroke="var(--color-border-light)" stroke-width="0.5"
          />
          <!-- +1 / -1 lines -->
          <line x1={waveMargin.left} y1={yScale(1)} x2={waveW - waveMargin.right} y2={yScale(1)} stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="3,3" />
          <line x1={waveMargin.left} y1={yScale(-1)} x2={waveW - waveMargin.right} y2={yScale(-1)} stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="3,3" />

          <!-- Y-axis labels -->
          <text x={waveMargin.left - 4} y={yScale(1)} text-anchor="end" dominant-baseline="central" font-size="8" font-family="var(--font-mono)" fill="var(--color-text-light)">1</text>
          <text x={waveMargin.left - 4} y={yScale(-1)} text-anchor="end" dominant-baseline="central" font-size="8" font-family="var(--font-mono)" fill="var(--color-text-light)">-1</text>

          <!-- Character label -->
          <text x={8} y={waveH / 2} dominant-baseline="central" font-size="12" font-family="var(--font-mono)" font-weight="600"
            fill={charColors[waveform.index % charColors.length]}>
            {waveform.chi.label}
          </text>

          <!-- Step-function waveform (Re part) -->
          <path
            d={smoothWavePath(waveform, 're')}
            fill="none"
            stroke={charColors[waveform.index % charColors.length]}
            stroke-width="1.8"
            opacity="0.85"
          />

          <!-- Dots at each coprime n -->
          {#each waveform.points as p}
            {#if p.coprime}
              <circle
                cx={xScale(p.n)}
                cy={yScale(p.re)}
                r={p.prime ? 3.5 : 2}
                fill={p.prime ? 'var(--color-prime)' : charColors[waveform.index % charColors.length]}
                opacity={p.prime ? 1 : 0.6}
              />
            {/if}
          {/each}

          <!-- Im part as dashed line if present -->
          {#if waveform.points.some(p => p.coprime && Math.abs(p.im) > 0.01)}
            <path
              d={smoothWavePath(waveform, 'im')}
              fill="none"
              stroke={charColors[waveform.index % charColors.length]}
              stroke-width="1"
              stroke-dasharray="4,3"
              opacity="0.45"
            />
          {/if}

          <!-- Current n marker -->
          {#if animN >= 1 && animN <= maxN}
            <line
              x1={xScale(animN)} y1={waveMargin.top}
              x2={xScale(animN)} y2={waveH - waveMargin.bottom}
              stroke="var(--color-text)" stroke-width="0.75" opacity="0.3"
            />
          {/if}

          <!-- X-axis ticks -->
          {#each waveform.points.filter(p => p.n % 10 === 0 || p.n === 1) as p}
            <text x={xScale(p.n)} y={waveH - 4} text-anchor="middle" font-size="7" font-family="var(--font-mono)" fill="var(--color-text-light)">
              {p.n}
            </text>
          {/each}
        </svg>
      </div>
    {/each}

    <div class="wave-legend">
      <span class="legend-item"><span class="legend-line solid"></span> Real part Re(χ(n))</span>
      <span class="legend-item"><span class="legend-line dashed"></span> Imaginary part Im(χ(n))</span>
      <span class="legend-item"><span class="legend-dot prime"></span> Prime n</span>
    </div>
  </div>
</div>

<style>
  .phasor-viz {
    width: 100%;
  }

  .phasor-section {
    margin-bottom: 2em;
  }

  .phasor-header h4 {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 0.5em;
  }

  .coprime-tag {
    font-size: 0.75rem;
    background: var(--color-accent-light);
    color: var(--color-accent);
    padding: 0.15em 0.5em;
    border-radius: 4px;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    margin-left: 0.3em;
  }

  .zero-tag {
    font-size: 0.75rem;
    background: var(--color-bg-alt);
    color: var(--color-text-light);
    padding: 0.15em 0.5em;
    border-radius: 4px;
    text-transform: none;
    letter-spacing: 0;
    margin-left: 0.3em;
  }

  .play-controls {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-bottom: 0.5em;
  }

  .play-btn {
    font-family: var(--font-serif);
    font-size: 0.85rem;
    padding: 0.3em 1em;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .play-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .n-slider {
    flex: 1;
    max-width: 300px;
  }

  .n-label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-accent);
    font-weight: 600;
    min-width: 30px;
    text-align: right;
  }

  .phasor-wheels {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3em;
    justify-content: center;
  }

  .phasor-wheel {
    text-align: center;
  }

  .phasor-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 600;
    margin-top: -0.3em;
  }

  .waveform-section h4 {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    margin-bottom: 0.3em;
  }

  .wave-note {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5em;
  }

  .waveform-row {
    margin-bottom: -0.3em;
  }

  .waveform-svg {
    width: 100%;
    height: auto;
  }

  .wave-legend {
    display: flex;
    gap: 1.2em;
    justify-content: center;
    margin-top: 0.5em;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

  .legend-line {
    width: 16px;
    height: 2px;
    border-radius: 1px;
  }

  .legend-line.solid {
    background: var(--color-char-0);
  }

  .legend-line.dashed {
    background: repeating-linear-gradient(90deg, var(--color-char-0) 0 4px, transparent 4px 7px);
    opacity: 0.5;
  }

  .legend-dot.prime {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--color-prime);
  }

  circle, line {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
</style>
