<script>
  import { onMount } from 'svelte';

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 24;
  const gap = 20;
  const totalW = size * 3 + gap * 2;
  const totalH = size + 50;

  // Circle centers in SVG coordinates
  const centers = [
    { x: cx, y: cy },                     // a
    { x: size + gap + cx, y: cy },         // b
    { x: 2 * (size + gap) + cx, y: cy },   // product
  ];

  let angleA = Math.PI / 3;
  let angleB = Math.PI / 4;
  let conjugateA = false;
  let conjugateB = false;

  $: aRe = Math.cos(conjugateA ? -angleA : angleA);
  $: aIm = Math.sin(conjugateA ? -angleA : angleA);
  $: bRe = Math.cos(conjugateB ? -angleB : angleB);
  $: bIm = Math.sin(conjugateB ? -angleB : angleB);

  $: pRe = aRe * bRe - aIm * bIm;
  $: pIm = aRe * bIm + aIm * bRe;

  $: aDeg = Math.round(Math.atan2(aIm, aRe) * 180 / Math.PI);
  $: bDeg = Math.round(Math.atan2(bIm, bRe) * 180 / Math.PI);
  $: pDeg = Math.round(Math.atan2(pIm, pRe) * 180 / Math.PI);

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
    const ai = Math.abs(i);
    const iStr = Math.abs(ai - 1) < 0.005 ? '' : ai.toFixed(2);
    return `${r}${sign}${iStr}i`;
  }

  // Drag state
  let dragging = null; // 'a' | 'b' | null
  let svgEl;

  function svgPoint(clientX, clientY) {
    if (!svgEl) return { x: 0, y: 0 };
    const pt = svgEl.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  function updateAngle(clientX, clientY) {
    if (!dragging) return;
    const pt = svgPoint(clientX, clientY);
    const idx = dragging === 'a' ? 0 : 1;
    const dx = pt.x - centers[idx].x;
    const dy = -(pt.y - centers[idx].y); // SVG y is flipped vs math
    const angle = Math.atan2(dy, dx);
    if (dragging === 'a') angleA = conjugateA ? -angle : angle;
    else angleB = conjugateB ? -angle : angle;
  }

  function onPointerDown(which, e) {
    dragging = which;
    svgEl?.setPointerCapture?.(e.pointerId);
    updateAngle(e.clientX, e.clientY);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault();
    updateAngle(e.clientX, e.clientY);
  }

  function onPointerUp(e) {
    if (dragging) {
      svgEl?.releasePointerCapture?.(e.pointerId);
    }
    dragging = null;
  }

  // Data for the three circles
  $: circles = [
    { re: aRe, im: aIm, color: '#6366f1', label: 'a', deg: aDeg, draggable: 'a' },
    { re: bRe, im: bIm, color: '#ec4899', label: 'b', deg: bDeg, draggable: 'b' },
    { re: pRe, im: pIm, color: '#14b8a6', label: 'a × b', deg: pDeg, draggable: null },
  ];
</script>

<div class="complex-mul">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <svg
    bind:this={svgEl}
    viewBox="0 0 {totalW} {totalH}"
    preserveAspectRatio="xMidYMid meet"
    class="complex-svg"
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
    on:pointerleave={onPointerUp}
  >
    {#each circles as c, i}
      {@const ctr = centers[i]}
      {@const tipX = ctr.x + c.re * R}
      {@const tipY = ctr.y - c.im * R}
      <g>
        <!-- Unit circle -->
        <circle cx={ctr.x} cy={ctr.y} r={R} fill="none" stroke="var(--color-border-light)" stroke-width="0.75" />
        <!-- Axes -->
        <line x1={ctr.x - R} y1={ctr.y} x2={ctr.x + R} y2={ctr.y} stroke="var(--color-border-light)" stroke-width="0.5" />
        <line x1={ctr.x} y1={ctr.y - R} x2={ctr.x} y2={ctr.y + R} stroke="var(--color-border-light)" stroke-width="0.5" />
        <text x={ctr.x + R + 3} y={ctr.y - 3} font-size="7" font-family="var(--font-mono)" fill="var(--color-text-light)">Re</text>
        <text x={ctr.x + 3} y={ctr.y - R - 3} font-size="7" font-family="var(--font-mono)" fill="var(--color-text-light)">Im</text>

        <!-- Projection lines -->
        <line x1={tipX} y1={tipY} x2={tipX} y2={ctr.y}
          stroke={c.color} stroke-width="0.7" stroke-dasharray="2,2" opacity="0.35" />
        <line x1={tipX} y1={tipY} x2={ctr.x} y2={tipY}
          stroke={c.color} stroke-width="0.7" stroke-dasharray="2,2" opacity="0.35" />

        <!-- Arrow -->
        <line x1={ctr.x} y1={ctr.y} x2={tipX} y2={tipY}
          stroke={c.color} stroke-width="2.5" stroke-linecap="round" />

        <!-- Draggable tip (or static for product) -->
        {#if c.draggable}
          <circle
            cx={tipX} cy={tipY} r="8"
            fill={c.color} stroke="white" stroke-width="2"
            style="cursor: grab; touch-action: none;"
            on:pointerdown={(e) => onPointerDown(c.draggable, e)}
          />
        {:else}
          <circle cx={tipX} cy={tipY} r="5"
            fill={c.color} stroke="white" stroke-width="1.5" />
        {/if}

        <!-- Label -->
        <text x={ctr.x} y={10} text-anchor="middle" font-size="11"
          font-family="var(--font-mono)" font-weight="600" fill={c.color}>
          {c.label}
        </text>

        <!-- Rectangular form -->
        <text x={ctr.x} y={size + 16} text-anchor="middle" font-size="9"
          font-family="var(--font-mono)" fill={c.color}>
          {formatComplex(c.re, c.im)}
        </text>
        <!-- Angle -->
        <text x={ctr.x} y={size + 28} text-anchor="middle" font-size="8"
          font-family="var(--font-mono)" fill="var(--color-text-light)">
          {c.deg}°
        </text>
      </g>

      <!-- × and = between circles -->
      {#if i === 0}
        <text x={size + gap / 2} y={cy + 5} text-anchor="middle" font-size="18"
          font-family="var(--font-mono)" fill="var(--color-text-light)">×</text>
      {/if}
      {#if i === 1}
        <text x={2 * size + gap * 1.5} y={cy + 5} text-anchor="middle" font-size="18"
          font-family="var(--font-mono)" fill="var(--color-text-light)">=</text>
      {/if}
    {/each}

    <!-- Angle sum -->
    <text x={totalW / 2} y={totalH - 4} text-anchor="middle" font-size="9"
      font-family="var(--font-mono)" fill="var(--color-text-muted)">
      {aDeg}° + {bDeg}° = {pDeg}° {Math.abs(aDeg + bDeg - pDeg) > 1 && Math.abs(aDeg + bDeg - pDeg) < 359 ? '(mod 360°)' : ''}
    </text>
  </svg>

  <div class="conj-row">
    <label class="conj-toggle">
      <input type="checkbox" bind:checked={conjugateA} />
      <span style="color: #6366f1">conjugate a</span> (flip Im)
    </label>
    <label class="conj-toggle">
      <input type="checkbox" bind:checked={conjugateB} />
      <span style="color: #ec4899">conjugate b</span> (flip Im)
    </label>
  </div>
</div>

<style>
  .complex-mul { width: 100%; }

  .complex-svg {
    width: 100%;
    height: auto;
    max-width: 620px;
    display: block;
    margin: 0 auto;
    touch-action: none;
  }

  .conj-row {
    display: flex;
    gap: 1.5em;
    justify-content: center;
    margin-top: 0.3em;
    flex-wrap: wrap;
  }

  .conj-toggle {
    font-size: 0.78rem;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 0.3em;
    cursor: pointer;
  }

  .conj-toggle input { cursor: pointer; }
</style>
