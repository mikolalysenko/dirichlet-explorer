<script>
  import { onMount, onDestroy } from 'svelte';
  import { dirichletCharacters, characterContinuousData } from '../../lib/characters.js';
  import { coprimeResidues, gcd } from '../../lib/math-utils.js';
  import { isPrime } from '../../lib/primes.js';

  export let q = 7;
  export let maxN = 60;

  $: characters = dirichletCharacters(q);
  $: residues = coprimeResidues(q);
  $: phi = residues.length;
  $: contData = characterContinuousData(q);

  const charColors = [
    '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7'
  ];

  // ─── Continuous evaluation ────────────────────────────────────
  function evalContinuous(charIdx, x) {
    const freqs = contData.charFreqs[charIdx];
    if (!freqs) return [1, 0];
    let re = 1, im = 0;
    for (let i = 0; i < freqs.length; i++) {
      const angle = 2 * Math.PI * freqs[i] * x / contData.orders[i];
      const c = Math.cos(angle), s = Math.sin(angle);
      const nre = re * c - im * s;
      const nim = re * s + im * c;
      re = nre;
      im = nim;
    }
    return [re, im];
  }

  // ─── Smooth animation ─────────────────────────────────────────
  // animT is a continuous float: 0 to q, cycling. This drives everything.
  let animT = 0;
  let playing = false;
  let animFrame;
  let prevTime = 0;
  const cyclesPerSecond = 0.15; // how fast we sweep through one period [0, q]

  function tick(time) {
    if (!playing) return;
    if (prevTime > 0) {
      const dt = (time - prevTime) / 1000; // seconds
      animT = (animT + dt * cyclesPerSecond * q) % q;
    }
    prevTime = time;
    animFrame = requestAnimationFrame(tick);
  }

  function togglePlay() {
    playing = !playing;
    if (playing) {
      prevTime = 0;
      animFrame = requestAnimationFrame(tick);
    }
  }

  function handleSlider(e) {
    animT = parseFloat(e.target.value);
  }

  onDestroy(() => {
    if (animFrame) cancelAnimationFrame(animFrame);
  });

  // Current phasor values at continuous animT for each character
  $: currentPhasors = characters.map((chi, idx) => {
    const [re, im] = evalContinuous(idx, animT);
    return { chi, re, im, color: charColors[idx % charColors.length], index: idx };
  });

  // For the display label, show the nearest integer and coprimality
  $: nearestN = Math.round(animT) || 1;
  $: displayT = animT.toFixed(2);

  // ─── Phasor wheel dimensions ──────────────────────────────────
  const phasorSize = 160;
  const phasorCx = phasorSize / 2;
  const phasorCy = phasorSize / 2;
  const phasorR = phasorSize / 2 - 20;

  // ─── Phasor strip dimensions ──────────────────────────────────
  const stripW = 700;
  const stripH = 80;
  const stripMargin = { left: 50, right: 15, top: 6, bottom: 18 };
  const stripInnerW = stripW - stripMargin.left - stripMargin.right;
  const stripInnerH = stripH - stripMargin.top - stripMargin.bottom;
  const arrowLen = stripInnerH * 0.42;

  $: stripXScale = (x) => stripMargin.left + (x / q) * stripInnerW;
  $: stripCy = stripMargin.top + stripInnerH / 2;

  // Cursor position on the strips
  $: cursorPx = stripXScale(animT);

  // ─── Precompute strip paths (don't recompute per frame) ───────
  function phasorTrailPath(charIdx) {
    const numSamples = 200;
    const points = [];
    for (let i = 0; i <= numSamples; i++) {
      const x = (i / numSamples) * q;
      const [re, im] = evalContinuous(charIdx, x);
      points.push({ px: stripXScale(x), re, im });
    }
    return points;
  }

  const numArrows = 40;
</script>

<div class="phasor-viz">
  <!-- Animated phasor wheels -->
  <div class="phasor-section">
    <div class="phasor-header">
      <h4>Character phasors at x = {displayT}</h4>
      <div class="play-controls">
        <button class="play-btn" on:click={togglePlay}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <input
          type="range"
          value={animT}
          on:input={handleSlider}
          min={0}
          max={q}
          step={0.01}
          class="n-slider"
        />
        <span class="n-label">{displayT}</span>
      </div>
    </div>

    <div class="phasor-wheels">
      {#each currentPhasors as phasor}
        <div class="phasor-wheel">
          <svg width={phasorSize} height={phasorSize} viewBox="0 0 {phasorSize} {phasorSize}">
            <!-- Unit circle -->
            <circle cx={phasorCx} cy={phasorCy} r={phasorR} fill="none" stroke="var(--color-border-light)" stroke-width="0.75" />
            <line x1={phasorCx - phasorR} y1={phasorCy} x2={phasorCx + phasorR} y2={phasorCy} stroke="var(--color-border-light)" stroke-width="0.5" />
            <line x1={phasorCx} y1={phasorCy - phasorR} x2={phasorCx} y2={phasorCy + phasorR} stroke="var(--color-border-light)" stroke-width="0.5" />

            <!-- Trail: show the full orbit path on the unit circle -->
            {#each Array(60) as _, k}
              {@const t = (k / 60) * q}
              {@const [tre, tim] = evalContinuous(phasor.index, t)}
              <circle
                cx={phasorCx + tre * phasorR}
                cy={phasorCy - tim * phasorR}
                r="1"
                fill={phasor.color}
                opacity="0.12"
              />
            {/each}

            <!-- Phasor arrow (smooth, no transition) -->
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
          </svg>
          <div class="phasor-label" style="color: {phasor.color}">{phasor.chi.label}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Phasor sweep strips -->
  <div class="waveform-section">
    <h4>Phasor sweep — χ(x) as x varies continuously from 0 to {q}</h4>
    <p class="wave-note">
      Each character is <em>e</em><sup>2πi·a·x/{q}</sup> for some frequency <em>a</em>.
      The arrows show the complex value at each coprime integer residue.
      The vertical line tracks the animated position.
      <span class="prime-note">Gold = prime.</span>
    </p>

    {#each characters as chi, idx}
      {@const trail = phasorTrailPath(idx)}
      {@const color = charColors[idx % charColors.length]}
      <div class="strip-row">
        <svg viewBox="0 0 {stripW} {stripH}" preserveAspectRatio="xMidYMid meet" class="strip-svg">
          <!-- Center line -->
          <line x1={stripMargin.left} y1={stripCy} x2={stripW - stripMargin.right} y2={stripCy}
            stroke="var(--color-border-light)" stroke-width="0.5" />
          <!-- ±1 guides -->
          <line x1={stripMargin.left} y1={stripCy - arrowLen} x2={stripW - stripMargin.right} y2={stripCy - arrowLen}
            stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="2,3" />
          <line x1={stripMargin.left} y1={stripCy + arrowLen} x2={stripW - stripMargin.right} y2={stripCy + arrowLen}
            stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="2,3" />

          <!-- Character label -->
          <text x={8} y={stripCy} dominant-baseline="central" font-size="12"
            font-family="var(--font-mono)" font-weight="600" fill={color}>
            {chi.label}
          </text>

          <!-- Im trace -->
          <path
            d={trail.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px},${stripCy - p.im * arrowLen}`).join(' ')}
            fill="none" stroke={color} stroke-width="1.2" opacity="0.35"
          />

          <!-- Re trace -->
          <path
            d={trail.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.px},${stripCy - p.re * arrowLen}`).join(' ')}
            fill="none" stroke={color} stroke-width="1.2" opacity="0.2" stroke-dasharray="3,2"
          />

          <!-- Discrete coprime residue phasor arrows -->
          {#each residues as r}
            {@const val = chi.values.get(r) || [0, 0]}
            {@const px = stripXScale(r)}
            {@const isPrm = isPrime(r) && r > 1}
            <line
              x1={px} y1={stripCy}
              x2={px + val[0] * arrowLen * 0.6} y2={stripCy - val[1] * arrowLen * 0.6}
              stroke={isPrm ? 'var(--color-prime)' : color}
              stroke-width="2"
              stroke-linecap="round"
              opacity="0.9"
            />
            <circle
              cx={px + val[0] * arrowLen * 0.6}
              cy={stripCy - val[1] * arrowLen * 0.6}
              r={isPrm ? 3.5 : 2.5}
              fill={isPrm ? 'var(--color-prime)' : color}
              stroke="white" stroke-width="0.75"
            />
            <!-- Tick -->
            <line x1={px} y1={stripCy + arrowLen + 2} x2={px} y2={stripCy + arrowLen + 7}
              stroke="var(--color-text-muted)" stroke-width="0.75" />
            <text x={px} y={stripH - 2} text-anchor="middle"
              font-size="7" font-family="var(--font-mono)"
              fill={isPrm ? 'var(--color-prime)' : 'var(--color-text-light)'}
              font-weight={isPrm ? '600' : '400'}>
              {r}
            </text>
          {/each}

          <!-- Non-coprime ticks -->
          {#each Array(q) as _, n}
            {#if n > 0 && gcd(n, q) !== 1}
              <line x1={stripXScale(n)} y1={stripCy + arrowLen + 2} x2={stripXScale(n)} y2={stripCy + arrowLen + 5}
                stroke="var(--color-border)" stroke-width="0.5" />
              <text x={stripXScale(n)} y={stripH - 2} text-anchor="middle"
                font-size="6" font-family="var(--font-mono)" fill="var(--color-border)" opacity="0.5">
                {n}
              </text>
            {/if}
          {/each}

          <!-- *** Animated cursor line *** -->
          <line
            x1={cursorPx} y1={stripMargin.top}
            x2={cursorPx} y2={stripH - stripMargin.bottom}
            stroke="var(--color-text)" stroke-width="1.2" opacity="0.45"
          />
          <!-- Cursor dot showing current value on Im trace -->
          {#each [evalContinuous(idx, animT)] as curVal}
          <circle
            cx={cursorPx}
            cy={stripCy - curVal[1] * arrowLen}
            r="3.5"
            fill={color}
            stroke="white" stroke-width="1"
          />
          {/each}
        </svg>
      </div>
    {/each}

    <div class="wave-legend">
      <span class="legend-item"><span class="legend-line solid"></span> Im(χ) trace</span>
      <span class="legend-item"><span class="legend-line dashed"></span> Re(χ) trace</span>
      <span class="legend-item"><span class="legend-arrow"></span> Phasor at coprime residue</span>
      <span class="legend-item"><span class="legend-dot prime"></span> Prime</span>
    </div>
  </div>
</div>

<style>
  .phasor-viz { width: 100%; }
  .phasor-section { margin-bottom: 2em; }
  .phasor-header h4 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.5em; }
  .play-controls { display: flex; align-items: center; gap: 0.6em; margin-bottom: 0.5em; }
  .play-btn { font-family: var(--font-serif); font-size: 0.85rem; padding: 0.3em 1em; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
  .play-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .n-slider { flex: 1; max-width: 300px; }
  .n-label { font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-accent); font-weight: 600; min-width: 40px; text-align: right; }
  .phasor-wheels { display: flex; flex-wrap: wrap; gap: 0.3em; justify-content: center; }
  .phasor-wheel { text-align: center; }
  .phasor-label { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; margin-top: -0.3em; }
  .waveform-section h4 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.3em; }
  .wave-note { font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.8em; }
  .prime-note { color: var(--color-prime); font-weight: 500; }
  .strip-row { margin-bottom: -0.2em; }
  .strip-svg { width: 100%; height: auto; }
  .wave-legend { display: flex; gap: 1.2em; justify-content: center; margin-top: 0.5em; font-size: 0.75rem; color: var(--color-text-muted); flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 0.3em; }
  .legend-line { width: 18px; height: 2px; border-radius: 1px; }
  .legend-line.solid { background: var(--color-char-0); opacity: 0.4; }
  .legend-line.dashed { background: repeating-linear-gradient(90deg, var(--color-char-0) 0 3px, transparent 3px 5px); opacity: 0.3; }
  .legend-arrow { width: 14px; height: 2px; background: var(--color-char-0); border-radius: 1px; position: relative; }
  .legend-arrow::after { content: ''; position: absolute; right: -2px; top: -2px; width: 6px; height: 6px; border-radius: 50%; background: var(--color-char-0); }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; }
  .legend-dot.prime { background: var(--color-prime); }
</style>
