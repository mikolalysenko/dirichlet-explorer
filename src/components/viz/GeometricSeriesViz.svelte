<script>
  export let r = 0.5;

  let numTerms = 6;

  $: terms = Array.from({ length: numTerms }, (_, k) => Math.pow(r, k));
  $: partialSum = terms.reduce((s, t) => s + t, 0);
  $: closedForm = Math.abs(r) < 1 ? 1 / (1 - r) : Infinity;
  $: converges = Math.abs(r) < 1;

  // For the visual proof: show S and r*S aligned, with cancellation
  $: proofTerms = Array.from({ length: numTerms + 1 }, (_, k) => Math.pow(r, k));

  // Bar widths: each term as a fraction of the total (geometric stacking)
  const barW = 500;
  const barH = 28;
  const gap = 3;

  $: maxVal = converges ? closedForm : partialSum;
  $: scale = (v) => (v / maxVal) * barW;
</script>

<div class="geo-viz">
  <div class="controls">
    <div class="slider-row">
      <label>r =</label>
      <input type="range" bind:value={r} min={0.05} max={0.95} step={0.01} class="r-slider" />
      <span class="r-value">{r.toFixed(2)}</span>
    </div>
    <div class="slider-row">
      <label>terms:</label>
      <input type="range" bind:value={numTerms} min={2} max={12} step={1} class="r-slider" />
      <span class="r-value">{numTerms}</span>
    </div>
  </div>

  <!-- Visual: stacked bars showing each term -->
  <div class="bars-section">
    <svg viewBox="0 0 {barW + 60} {barH + 20}" preserveAspectRatio="xMidYMid meet" class="bar-svg">
      <!-- Stacked bars for partial sum -->
      {#each terms as t, i}
        {@const x = scale(terms.slice(0, i).reduce((s, v) => s + v, 0))}
        {@const w = scale(t)}
        <rect
          x={x} y={2} width={Math.max(w, 0.5)} height={barH}
          fill={`hsl(${220 + i * 15}, 70%, ${60 + i * 3}%)`}
          stroke="white" stroke-width="0.5" rx="2"
        />
        {#if w > 14}
          <text x={x + w / 2} y={barH / 2 + 4} text-anchor="middle"
            font-size="8" font-family="var(--font-mono)" fill="white" font-weight="500">
            r{i > 0 ? '⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ'.split('')[i] || `${String(i).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')}` : ''}
          </text>
        {/if}
      {/each}
      <!-- Closed form marker -->
      {#if converges}
        <line x1={scale(closedForm)} y1={0} x2={scale(closedForm)} y2={barH + 4}
          stroke="var(--color-prime)" stroke-width="1.5" stroke-dasharray="3,2" />
        <text x={scale(closedForm) + 4} y={barH + 14} font-size="8"
          font-family="var(--font-mono)" fill="var(--color-prime)" font-weight="600">
          1/(1−r) = {closedForm.toFixed(3)}
        </text>
      {/if}
    </svg>
  </div>

  <!-- The algebraic trick -->
  <div class="proof-section">
    <p class="proof-title">Why does this work?</p>
    <p class="proof-text">Call the sum <strong>S</strong>. Multiply it by <strong>r</strong>:</p>
    <div class="proof-lines">
      <div class="proof-line">
        <span class="proof-lhs">S</span>
        <span class="proof-eq">=</span>
        <span class="proof-rhs">
          {#each terms as _, i}
            <span class="proof-term">{i > 0 ? ' + ' : ''}r{#if i > 0}{'⁰¹²³⁴⁵⁶⁷⁸⁹ⁱ'[i] || ''}{:else}⁰{/if}</span>
          {/each}
          <span class="proof-term muted"> + ···</span>
        </span>
      </div>
      <div class="proof-line">
        <span class="proof-lhs">r·S</span>
        <span class="proof-eq">=</span>
        <span class="proof-rhs">
          <span class="proof-term cancel">&nbsp;&nbsp;&nbsp;</span>
          {#each terms as _, i}
            <span class="proof-term">{i > 0 ? ' + ' : '  '}r{'⁰¹²³⁴⁵⁶⁷⁸⁹'[i + 1] || ''}</span>
          {/each}
          <span class="proof-term muted"> + ···</span>
        </span>
      </div>
      <div class="proof-separator"></div>
      <div class="proof-line result">
        <span class="proof-lhs">S − r·S</span>
        <span class="proof-eq">=</span>
        <span class="proof-rhs">
          <span class="proof-term highlight">1</span>
          <span class="proof-term muted"> (everything else cancels!)</span>
        </span>
      </div>
      <div class="proof-line result">
        <span class="proof-lhs">S(1 − r)</span>
        <span class="proof-eq">=</span>
        <span class="proof-rhs"><span class="proof-term highlight">1</span></span>
      </div>
      <div class="proof-line result final">
        <span class="proof-lhs">S</span>
        <span class="proof-eq">=</span>
        <span class="proof-rhs"><span class="proof-term highlight">1 / (1 − r)</span></span>
      </div>
    </div>
  </div>

  <div class="readout">
    Partial sum ({numTerms} terms): <strong>{partialSum.toFixed(4)}</strong>
    {#if converges}
      &nbsp;→&nbsp; exact: <strong class="exact">{closedForm.toFixed(4)}</strong>
    {/if}
  </div>
</div>

<style>
  .geo-viz { width: 100%; }

  .controls {
    display: flex;
    gap: 1.5em;
    margin-bottom: 0.5em;
    flex-wrap: wrap;
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 0.4em;
  }

  .slider-row label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-text-muted);
    min-width: 40px;
  }

  .r-slider { width: 140px; }

  .r-value {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-accent);
    font-weight: 600;
    min-width: 32px;
  }

  .bars-section { margin-bottom: 0.8em; }

  .bar-svg { width: 100%; height: auto; }

  .proof-section {
    background: var(--color-bg-alt);
    border-radius: 8px;
    padding: 0.7em 1em;
    margin-bottom: 0.5em;
  }

  .proof-title {
    font-weight: 600;
    font-size: 0.85rem;
    margin-bottom: 0.3em;
  }

  .proof-text {
    font-size: 0.82rem;
    color: var(--color-text-muted);
    margin-bottom: 0.4em;
  }

  .proof-lines {
    font-family: var(--font-mono);
    font-size: 0.78rem;
  }

  .proof-line {
    display: flex;
    align-items: baseline;
    margin-bottom: 0.15em;
  }

  .proof-lhs {
    min-width: 55px;
    text-align: right;
    font-weight: 600;
    color: var(--color-text-muted);
  }

  .proof-eq {
    padding: 0 0.5em;
    color: var(--color-text-light);
  }

  .proof-rhs {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
  }

  .proof-term {
    white-space: nowrap;
  }

  .proof-term.cancel {
    opacity: 0;
  }

  .proof-term.muted {
    color: var(--color-text-light);
  }

  .proof-term.highlight {
    color: var(--color-prime);
    font-weight: 700;
  }

  .proof-separator {
    border-top: 1.5px solid var(--color-border);
    margin: 0.25em 0;
    width: 100%;
  }

  .proof-line.result .proof-lhs {
    color: var(--color-accent);
  }

  .proof-line.final .proof-term.highlight {
    font-size: 0.9rem;
  }

  .readout {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .readout strong {
    font-family: var(--font-mono);
    color: var(--color-accent);
  }

  .readout .exact {
    color: var(--color-prime);
  }
</style>
