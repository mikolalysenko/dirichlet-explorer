<script>
  import { onDestroy } from 'svelte';
  import { dirichletCharacters, complexAdd, complexMul } from '../../lib/characters.js';
  import { coprimeResidues } from '../../lib/math-utils.js';

  export let q = 5;

  $: characters = dirichletCharacters(q);
  $: residues = coprimeResidues(q);
  $: phi = residues.length;

  let chiA = 0;
  let chiB = 1;

  // Clamp indices when q changes
  $: {
    if (chiA >= characters.length) chiA = 0;
    if (chiB >= characters.length) chiB = Math.min(1, characters.length - 1);
  }

  const charColors = [
    '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444',
    '#06b6d4', '#84cc16', '#f97316', '#a855f7'
  ];

  // Compute each term: chi_A(r) * conj(chi_B(r)) for each coprime residue r
  $: terms = residues.map(r => {
    const vA = characters[chiA]?.values.get(r) || [0, 0];
    const vB = characters[chiB]?.values.get(r) || [0, 0];
    // conj(chi_B(r))
    const conjB = [vB[0], -vB[1]];
    // product = chi_A(r) * conj(chi_B(r))
    const product = complexMul(vA, conjB);
    // Normalize by phi(q)
    return { r, raw: product, term: [product[0] / phi, product[1] / phi], vA, vB, conjB };
  });

  // Partial sums — cumulative
  $: partialSums = (() => {
    const sums = [{ re: 0, im: 0 }];
    let s = [0, 0];
    for (const t of terms) {
      s = complexAdd(s, t.term);
      sums.push({ re: s[0], im: s[1] });
    }
    return sums;
  })();

  $: finalSum = partialSums[partialSums.length - 1];
  $: isOrthogonal = Math.abs(finalSum.re) < 0.01 && Math.abs(finalSum.im) < 0.01;

  // Animation: step through residues one at a time
  let step = 0; // 0 = none shown, phi = all shown
  let playing = false;
  let animFrame;
  let lastTime = 0;
  const speed = 600; // ms per step

  $: maxStep = residues.length;

  // Reset step when characters or q change
  $: {
    chiA; chiB; q;
    step = 0;
    playing = false;
  }

  function tick(time) {
    if (!playing) return;
    if (time - lastTime > speed) {
      lastTime = time;
      if (step < maxStep) {
        step++;
      } else {
        playing = false;
      }
    }
    animFrame = requestAnimationFrame(tick);
  }

  function togglePlay() {
    if (step >= maxStep) step = 0;
    playing = !playing;
    if (playing) {
      lastTime = performance.now();
      animFrame = requestAnimationFrame(tick);
    }
  }

  function reset() {
    step = 0;
    playing = false;
  }

  function showAll() {
    step = maxStep;
    playing = false;
  }

  onDestroy(() => {
    if (animFrame) cancelAnimationFrame(animFrame);
  });

  // Main complex plane dimensions
  const planeSize = 300;
  const planeCx = planeSize / 2;
  const planeCy = planeSize / 2;
  const planeScale = 100;

  // Side panel: term breakdown dimensions
  const termW = 320;
  const termRowH = 34;

  function formatComplex(re, im) {
    const r = Math.round(re * 100) / 100;
    const i = Math.round(im * 100) / 100;
    if (Math.abs(i) < 0.005) return `${r}`;
    if (Math.abs(r) < 0.005) {
      if (Math.abs(i - 1) < 0.005) return 'i';
      if (Math.abs(i + 1) < 0.005) return '−i';
      return `${i}i`;
    }
    const sign = i > 0 ? ' + ' : ' − ';
    const absI = Math.abs(i);
    const iStr = Math.abs(absI - 1) < 0.005 ? '' : absI.toString();
    return `${r}${sign}${iStr}i`;
  }

  function formatComplexShort(z) {
    return formatComplex(z[0], z[1]);
  }
</script>

<div class="ortho-anim">
  <!-- Character picker -->
  <div class="char-picker">
    <div class="picker-row">
      <span class="picker-label">χ<sub>i</sub> :</span>
      {#each characters as chi, i}
        <button
          class="char-btn"
          class:active={chiA === i}
          style="--btn-color: {charColors[i % charColors.length]}"
          on:click={() => chiA = i}
        >
          {chi.label}
        </button>
      {/each}
    </div>
    <div class="picker-row">
      <span class="picker-label">χ<sub>j</sub> :</span>
      {#each characters as chi, i}
        <button
          class="char-btn"
          class:active={chiB === i}
          style="--btn-color: {charColors[i % charColors.length]}"
          on:click={() => chiB = i}
        >
          {chi.label}
        </button>
      {/each}
    </div>
    <div class="picker-summary">
      Computing &nbsp;⟨{characters[chiA]?.label}, {characters[chiB]?.label}⟩ =
      (1/φ({q})) Σ<sub>r</sub> {characters[chiA]?.label}(r) · <span style="text-decoration: overline">{characters[chiB]?.label}(r)</span>
      {#if chiA === chiB}
        <span class="expect-tag match">same → expect 1</span>
      {:else}
        <span class="expect-tag ortho">different → expect 0</span>
      {/if}
    </div>
  </div>

  <div class="anim-body">
    <!-- Complex plane showing cumulative sum -->
    <div class="plane-panel">
      <svg width={planeSize} height={planeSize} viewBox="0 0 {planeSize} {planeSize}">
        <!-- Grid -->
        <circle cx={planeCx} cy={planeCy} r={planeScale} fill="none" stroke="var(--color-border-light)" stroke-width="0.5" />
        <circle cx={planeCx} cy={planeCy} r={planeScale * 0.5} fill="none" stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="3,3" />
        <line x1={0} y1={planeCy} x2={planeSize} y2={planeCy} stroke="var(--color-border-light)" stroke-width="0.5" />
        <line x1={planeCx} y1={0} x2={planeCx} y2={planeSize} stroke="var(--color-border-light)" stroke-width="0.5" />

        <!-- Axis labels -->
        <text x={planeSize - 6} y={planeCy - 6} font-size="9" font-family="var(--font-mono)" fill="var(--color-text-light)" text-anchor="end">Re</text>
        <text x={planeCx + 6} y={12} font-size="9" font-family="var(--font-mono)" fill="var(--color-text-light)">Im</text>
        <text x={planeCx + planeScale + 2} y={planeCy + 12} font-size="8" font-family="var(--font-mono)" fill="var(--color-text-light)">1</text>

        <!-- Arrow chain: each term as a colored arrow from previous partial sum -->
        {#each terms as t, i}
          {#if i < step}
            {@const from = partialSums[i]}
            {@const to = partialSums[i + 1]}
            <!-- Arrow line -->
            <line
              x1={planeCx + from.re * planeScale}
              y1={planeCy - from.im * planeScale}
              x2={planeCx + to.re * planeScale}
              y2={planeCy - to.im * planeScale}
              stroke={charColors[i % charColors.length]}
              stroke-width="2.5"
              stroke-linecap="round"
              opacity="0.8"
            />
            <!-- Arrowhead dot -->
            <circle
              cx={planeCx + to.re * planeScale}
              cy={planeCy - to.im * planeScale}
              r="3"
              fill={charColors[i % charColors.length]}
            />
            <!-- Residue label near midpoint -->
            {@const mx = planeCx + (from.re + to.re) / 2 * planeScale}
            {@const my = planeCy - (from.im + to.im) / 2 * planeScale}
            <text
              x={mx + 6} y={my - 6}
              font-size="8"
              font-family="var(--font-mono)"
              fill={charColors[i % charColors.length]}
              opacity="0.7"
            >
              r={t.r}
            </text>
          {/if}
        {/each}

        <!-- Current partial sum endpoint (large dot) -->
        {#if step > 0}
          {@const cur = partialSums[step]}
          <circle
            cx={planeCx + cur.re * planeScale}
            cy={planeCy - cur.im * planeScale}
            r="6"
            fill={isOrthogonal && step === maxStep ? 'var(--color-text-light)' : 'var(--color-prime)'}
            stroke="white"
            stroke-width="2"
          />
        {/if}

        <!-- Origin dot -->
        <circle cx={planeCx} cy={planeCy} r="2.5" fill="var(--color-text-muted)" />

        <!-- Result label -->
        {#if step === maxStep}
          <text
            x={planeCx}
            y={planeSize - 8}
            text-anchor="middle"
            font-size="13"
            font-family="var(--font-mono)"
            font-weight="700"
            fill={isOrthogonal ? 'var(--color-text-light)' : 'var(--color-prime)'}
          >
            = {formatComplex(finalSum.re, finalSum.im)}
            {isOrthogonal ? ' (orthogonal!)' : ''}
          </text>
        {/if}
      </svg>

      <!-- Playback controls -->
      <div class="controls">
        <button class="ctrl-btn" on:click={togglePlay}>
          {playing ? '⏸' : '▶'}
        </button>
        <button class="ctrl-btn" on:click={reset}>⏮</button>
        <button class="ctrl-btn" on:click={showAll}>⏭</button>
        <input type="range" bind:value={step} min={0} max={maxStep} class="step-slider" />
        <span class="step-label">{step}/{maxStep}</span>
      </div>
    </div>

    <!-- Term-by-term breakdown table -->
    <div class="terms-panel">
      <div class="terms-header">
        <span class="th-r">r</span>
        <span class="th-val">{characters[chiA]?.label}(r)</span>
        <span class="th-val"><span style="text-decoration: overline">{characters[chiB]?.label}(r)</span></span>
        <span class="th-product">product / φ</span>
        <span class="th-sum">running sum</span>
      </div>
      <div class="terms-list">
        {#each terms as t, i}
          <div
            class="term-row"
            class:active={i < step}
            class:current={i === step - 1}
            style="--row-color: {charColors[i % charColors.length]}"
          >
            <span class="td-r">{t.r}</span>
            <span class="td-val">{formatComplexShort(t.vA)}</span>
            <span class="td-val">{formatComplexShort(t.conjB)}</span>
            <span class="td-product">
              <!-- Small arrow showing this term's contribution -->
              <svg width="24" height="24" viewBox="0 0 24 24">
                <line x1="12" y1="12" x2={12 + t.term[0] * 10} y2={12 - t.term[1] * 10}
                  stroke={charColors[i % charColors.length]} stroke-width="2" stroke-linecap="round" />
                <circle cx={12 + t.term[0] * 10} cy={12 - t.term[1] * 10} r="1.5"
                  fill={charColors[i % charColors.length]} />
              </svg>
              <span class="product-text">{formatComplexShort(t.term)}</span>
            </span>
            <span class="td-sum">
              {#if i < step}
                {formatComplex(partialSums[i + 1].re, partialSums[i + 1].im)}
              {:else}
                —
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .ortho-anim {
    width: 100%;
  }

  .char-picker {
    margin-bottom: 1.2em;
  }

  .picker-row {
    display: flex;
    align-items: center;
    gap: 0.3em;
    margin-bottom: 0.4em;
    flex-wrap: wrap;
  }

  .picker-label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-text-muted);
    min-width: 32px;
  }

  .char-btn {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    padding: 0.25em 0.5em;
    border: 1.5px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--btn-color);
  }

  .char-btn:hover {
    border-color: var(--btn-color);
  }

  .char-btn.active {
    background: var(--btn-color);
    border-color: var(--btn-color);
    color: white;
    font-weight: 600;
  }

  .picker-summary {
    font-size: 0.82rem;
    color: var(--color-text-muted);
    margin-top: 0.2em;
    font-family: var(--font-mono);
  }

  .expect-tag {
    font-size: 0.72rem;
    padding: 0.1em 0.5em;
    border-radius: 4px;
    margin-left: 0.3em;
    font-weight: 600;
  }

  .expect-tag.match {
    background: var(--color-prime-bg);
    color: var(--color-prime);
  }

  .expect-tag.ortho {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }

  .anim-body {
    display: flex;
    gap: 1.2em;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .plane-panel {
    flex-shrink: 0;
  }

  .plane-panel svg {
    border: 1px solid var(--color-border-light);
    border-radius: 10px;
    background: white;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 0.4em;
    margin-top: 0.5em;
  }

  .ctrl-btn {
    font-size: 0.9rem;
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .ctrl-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .step-slider {
    flex: 1;
    max-width: 120px;
  }

  .step-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--color-text-muted);
    min-width: 36px;
    text-align: right;
  }

  .terms-panel {
    flex: 1;
    min-width: 260px;
    max-width: 380px;
  }

  .terms-header {
    display: flex;
    gap: 0;
    font-family: var(--font-mono);
    font-size: 0.68rem;
    color: var(--color-text-light);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--color-border-light);
    padding-bottom: 0.3em;
    margin-bottom: 0.2em;
  }

  .th-r { width: 28px; text-align: center; }
  .th-val { width: 58px; text-align: center; }
  .th-product { width: 100px; text-align: center; }
  .th-sum { flex: 1; text-align: right; }

  .terms-list {
    max-height: 280px;
    overflow-y: auto;
  }

  .term-row {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0.15em 0;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--color-text-light);
    border-radius: 4px;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
  }

  .term-row.active {
    color: var(--color-text);
  }

  .term-row.current {
    background: rgba(99, 102, 241, 0.05);
    border-left-color: var(--row-color);
  }

  .td-r { width: 28px; text-align: center; font-weight: 500; }
  .td-val { width: 58px; text-align: center; }

  .td-product {
    width: 100px;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .product-text {
    font-size: 0.68rem;
  }

  .td-sum {
    flex: 1;
    text-align: right;
    font-weight: 500;
    padding-right: 0.3em;
  }

  .term-row.current .td-sum {
    color: var(--row-color);
    font-weight: 700;
  }
</style>
