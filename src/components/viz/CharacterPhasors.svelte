<script>
  import { onDestroy } from 'svelte';
  import { dirichletCharacters } from '../../lib/characters.js';
  import { coprimeResidues, gcd } from '../../lib/math-utils.js';
  import { isPrime } from '../../lib/primes.js';

  export let q = 7;
  export let maxN = 60;

  $: characters = dirichletCharacters(q);
  $: residues = coprimeResidues(q);
  $: phi = residues.length;

  // Evaluate each character at every integer from 1..maxN
  $: waveforms = characters.map((chi, idx) => {
    const points = [];
    for (let n = 1; n <= maxN; n++) {
      const val = chi.values.get(((n % q) + q) % q) || [0, 0];
      points.push({ n, re: val[0], im: val[1], coprime: gcd(n, q) === 1, prime: isPrime(n) });
    }
    return { chi, points, index: idx };
  });

  // Build the coprime sequence with sequential index
  $: coprimeSeq = (() => {
    const seq = [];
    for (let n = 1; n <= maxN; n++) {
      if (gcd(n, q) === 1) {
        seq.push({ n, idx: seq.length, prime: isPrime(n) });
      }
    }
    return seq;
  })();

  // For each character, get its values at the coprime sequence points.
  // These are periodic with period phi(q). The continuous interpolation
  // uses trigonometric (Fourier) interpolation: since the character values
  // ARE a single Fourier mode on the group, the exact interpolant through
  // one period is a sinusoid. We reconstruct it via DFT interpolation.
  //
  // For one period of phi values y_0..y_{phi-1}, the trig interpolant at
  // fractional position t (0 <= t < phi) is:
  //   y(t) = (1/phi) * sum_{k=0}^{phi-1} Y_k * exp(2*pi*i*k*t/phi)
  // where Y_k = sum_{j=0}^{phi-1} y_j * exp(-2*pi*i*k*j/phi) is the DFT.
  //
  // But since each character IS a single frequency, this simplifies enormously.
  // We just precompute the DFT of one period and evaluate.

  function trigInterp(samples, t) {
    // samples: array of [re, im] of length phi
    // t: continuous index (0 = first sample, 1 = second, etc.)
    // Returns interpolated [re, im]
    const N = samples.length;
    if (N === 0) return [0, 0];
    if (N === 1) return samples[0];

    // Direct evaluation of trig interpolation (Dirichlet kernel form):
    // y(t) = (1/N) * sum_{j=0}^{N-1} y_j * D_N(t - j)
    // where D_N(x) = sum_{k=0}^{N-1} exp(2*pi*i*k*x/N) = sin(pi*x) / sin(pi*x/N) * exp(i*pi*x*(N-1)/N)
    // For real + imaginary parts, we use the real Dirichlet kernel:
    // D_N(x) = sin(N*pi*x/N) / sin(pi*x/N) when x is not integer = N when x is integer
    // Actually the periodic sinc (Dirichlet kernel) for even/odd N differs.
    //
    // Simpler: just evaluate the DFT formula directly.
    let re = 0, im = 0;
    for (let k = 0; k < N; k++) {
      // Compute DFT coefficient Y_k
      let Yre = 0, Yim = 0;
      for (let j = 0; j < N; j++) {
        const angle = -2 * Math.PI * k * j / N;
        const c = Math.cos(angle), s = Math.sin(angle);
        Yre += samples[j][0] * c - samples[j][1] * s;
        Yim += samples[j][0] * s + samples[j][1] * c;
      }
      // Multiply by exp(2*pi*i*k*t/N) / N
      const angle2 = 2 * Math.PI * k * t / N;
      const c2 = Math.cos(angle2), s2 = Math.sin(angle2);
      re += (Yre * c2 - Yim * s2) / N;
      im += (Yre * s2 + Yim * c2) / N;
    }
    return [re, im];
  }

  // For each character, extract one period of samples (at the coprime residues)
  $: periodSamples = characters.map(chi => {
    return residues.map(r => chi.values.get(r) || [0, 0]);
  });

  // Precompute DFT coefficients for each character (avoid recomputing per curve point)
  $: dftCoeffs = periodSamples.map(samples => {
    const N = samples.length;
    const coeffs = [];
    for (let k = 0; k < N; k++) {
      let Yre = 0, Yim = 0;
      for (let j = 0; j < N; j++) {
        const angle = -2 * Math.PI * k * j / N;
        Yre += samples[j][0] * Math.cos(angle) - samples[j][1] * Math.sin(angle);
        Yim += samples[j][0] * Math.sin(angle) + samples[j][1] * Math.cos(angle);
      }
      coeffs.push([Yre, Yim]);
    }
    return coeffs;
  });

  // Fast trig interpolation using precomputed DFT
  function trigInterpFast(coeffs, N, t) {
    let re = 0, im = 0;
    for (let k = 0; k < N; k++) {
      const angle = 2 * Math.PI * k * t / N;
      const c = Math.cos(angle), s = Math.sin(angle);
      re += (coeffs[k][0] * c - coeffs[k][1] * s) / N;
      im += (coeffs[k][0] * s + coeffs[k][1] * c) / N;
    }
    return [re, im];
  }

  // Generate continuous curve for a character.
  // x-axis = integer n, but the sinusoid is parameterized by the sequential
  // coprime index. Between coprime integers we interpolate the index linearly
  // in x-space, and evaluate the trig interpolant at the fractional index.
  function continuousSinePath(charIdx, part) {
    const coeffs = dftCoeffs[charIdx];
    if (!coeffs || coprimeSeq.length < 2) return '';
    const N = phi;
    const samplesPerSegment = 16;
    const points = [];

    for (let k = 0; k < coprimeSeq.length - 1; k++) {
      const n0 = coprimeSeq[k].n;
      const n1 = coprimeSeq[k + 1].n;
      const t0 = k; // sequential index of first point
      const t1 = k + 1;

      for (let s = 0; s <= samplesPerSegment; s++) {
        if (s === samplesPerSegment && k < coprimeSeq.length - 2) continue;
        const frac = s / samplesPerSegment;
        const x = n0 + (n1 - n0) * frac;
        const t = t0 + (t1 - t0) * frac;
        const val = trigInterpFast(coeffs, N, t);
        points.push({ x, y: part === 're' ? val[0] : val[1] });
      }
    }

    if (points.length === 0) return '';
    return points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${xScale(p.x)},${yScale(p.y)}`
    ).join(' ');
  }

  const charColors = [
    '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7'
  ];

  // Waveform plot dimensions
  const waveW = 700;
  const waveH = 110;
  const waveMargin = { left: 50, right: 15, top: 8, bottom: 22 };
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
  const speed = 400;

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
            <circle cx={phasorCx} cy={phasorCy} r={phasorR} fill="none" stroke="var(--color-border-light)" stroke-width="0.75" />
            <line x1={phasorCx - phasorR} y1={phasorCy} x2={phasorCx + phasorR} y2={phasorCy} stroke="var(--color-border-light)" stroke-width="0.5" />
            <line x1={phasorCx} y1={phasorCy - phasorR} x2={phasorCx} y2={phasorCy + phasorR} stroke="var(--color-border-light)" stroke-width="0.5" />

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
              <circle cx={phasorCx} cy={phasorCy} r="4" fill="var(--color-border)" stroke="white" stroke-width="1" />
            {/if}
          </svg>
          <div class="phasor-label" style="color: {phasor.color}">{phasor.chi.label}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Continuous sinusoidal waveform plots -->
  <div class="waveform-section">
    <h4>Continuous character waveforms</h4>
    <p class="wave-note">
      Each character is a complex exponential sampled at the coprime integers — just like a
      Fourier harmonic. The smooth curve is the exact trigonometric interpolation through the
      sample points; the dots mark the integer values.
      <span class="prime-note">Gold dots = primes.</span>
    </p>

    {#each waveforms as waveform, idx}
      <div class="waveform-row">
        <svg viewBox="0 0 {waveW} {waveH}" preserveAspectRatio="xMidYMid meet" class="waveform-svg">
          <!-- Gridlines -->
          <line x1={waveMargin.left} y1={yScale(0)} x2={waveW - waveMargin.right} y2={yScale(0)} stroke="var(--color-border-light)" stroke-width="0.5" />
          <line x1={waveMargin.left} y1={yScale(1)} x2={waveW - waveMargin.right} y2={yScale(1)} stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="3,3" />
          <line x1={waveMargin.left} y1={yScale(-1)} x2={waveW - waveMargin.right} y2={yScale(-1)} stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="3,3" />

          <text x={waveMargin.left - 4} y={yScale(1)} text-anchor="end" dominant-baseline="central" font-size="8" font-family="var(--font-mono)" fill="var(--color-text-light)">1</text>
          <text x={waveMargin.left - 4} y={yScale(-1)} text-anchor="end" dominant-baseline="central" font-size="8" font-family="var(--font-mono)" fill="var(--color-text-light)">-1</text>
          <text x={waveMargin.left - 4} y={yScale(0)} text-anchor="end" dominant-baseline="central" font-size="8" font-family="var(--font-mono)" fill="var(--color-text-light)">0</text>

          <text x={8} y={waveH / 2} dominant-baseline="central" font-size="12" font-family="var(--font-mono)" font-weight="600"
            fill={charColors[idx % charColors.length]}>
            {waveform.chi.label}
          </text>

          <!-- Continuous sinusoidal curve (Re part) -->
          <path
            d={continuousSinePath(idx, 're')}
            fill="none"
            stroke={charColors[idx % charColors.length]}
            stroke-width="1.5"
            opacity="0.5"
          />

          <!-- Continuous sinusoidal curve (Im part, if complex) -->
          {#if waveform.points.some(p => p.coprime && Math.abs(p.im) > 0.01)}
            <path
              d={continuousSinePath(idx, 'im')}
              fill="none"
              stroke={charColors[idx % charColors.length]}
              stroke-width="1"
              stroke-dasharray="5,3"
              opacity="0.3"
            />
          {/if}

          <!-- Stem lines from zero to each coprime integer value -->
          {#each waveform.points as p}
            {#if p.coprime}
              <line
                x1={xScale(p.n)} y1={yScale(0)}
                x2={xScale(p.n)} y2={yScale(p.re)}
                stroke={charColors[idx % charColors.length]}
                stroke-width="0.7"
                opacity="0.25"
              />
            {/if}
          {/each}

          <!-- Sample dots at each coprime n -->
          {#each waveform.points as p}
            {#if p.coprime}
              <circle
                cx={xScale(p.n)}
                cy={yScale(p.re)}
                r={p.prime ? 4 : 2.5}
                fill={p.prime ? 'var(--color-prime)' : charColors[idx % charColors.length]}
                stroke={p.prime ? 'var(--color-prime)' : 'white'}
                stroke-width={p.prime ? 0 : 0.75}
              />
            {/if}
          {/each}

          <!-- Current n marker -->
          {#if animN >= 1 && animN <= maxN}
            <line
              x1={xScale(animN)} y1={waveMargin.top}
              x2={xScale(animN)} y2={waveH - waveMargin.bottom}
              stroke="var(--color-text)" stroke-width="0.75" opacity="0.25"
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
      <span class="legend-item"><span class="legend-line solid"></span> Re(χ) continuous</span>
      <span class="legend-item"><span class="legend-line dashed"></span> Im(χ) continuous</span>
      <span class="legend-item"><span class="legend-dot sample"></span> Integer sample</span>
      <span class="legend-item"><span class="legend-dot prime"></span> Prime</span>
    </div>
  </div>
</div>

<style>
  .phasor-viz { width: 100%; }
  .phasor-section { margin-bottom: 2em; }
  .phasor-header h4 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.5em; }
  .coprime-tag { font-size: 0.75rem; background: var(--color-accent-light); color: var(--color-accent); padding: 0.15em 0.5em; border-radius: 4px; text-transform: none; letter-spacing: 0; font-weight: 500; margin-left: 0.3em; }
  .zero-tag { font-size: 0.75rem; background: var(--color-bg-alt); color: var(--color-text-light); padding: 0.15em 0.5em; border-radius: 4px; text-transform: none; letter-spacing: 0; margin-left: 0.3em; }
  .play-controls { display: flex; align-items: center; gap: 0.6em; margin-bottom: 0.5em; }
  .play-btn { font-family: var(--font-serif); font-size: 0.85rem; padding: 0.3em 1em; border: 1px solid var(--color-border); border-radius: 6px; background: white; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
  .play-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .n-slider { flex: 1; max-width: 300px; }
  .n-label { font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-accent); font-weight: 600; min-width: 30px; text-align: right; }
  .phasor-wheels { display: flex; flex-wrap: wrap; gap: 0.3em; justify-content: center; }
  .phasor-wheel { text-align: center; }
  .phasor-label { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; margin-top: -0.3em; }
  .waveform-section h4 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin-bottom: 0.3em; }
  .wave-note { font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.8em; }
  .prime-note { color: var(--color-prime); font-weight: 500; }
  .waveform-row { margin-bottom: -0.3em; }
  .waveform-svg { width: 100%; height: auto; }
  .wave-legend { display: flex; gap: 1.2em; justify-content: center; margin-top: 0.5em; font-size: 0.75rem; color: var(--color-text-muted); flex-wrap: wrap; }
  .legend-item { display: flex; align-items: center; gap: 0.3em; }
  .legend-line { width: 18px; height: 2px; border-radius: 1px; }
  .legend-line.solid { background: var(--color-char-0); opacity: 0.6; }
  .legend-line.dashed { background: repeating-linear-gradient(90deg, var(--color-char-0) 0 5px, transparent 5px 8px); opacity: 0.4; }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; }
  .legend-dot.sample { background: var(--color-char-0); }
  .legend-dot.prime { background: var(--color-prime); }
  circle, line { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
</style>
