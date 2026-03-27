<script>
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 24;

  // Two input complex numbers (angles in radians)
  let angleA = Math.PI / 3;   // 60°
  let angleB = Math.PI / 4;   // 45°
  let conjugateA = false;
  let conjugateB = false;

  // Dragging state
  let dragging = null; // 'a' or 'b'

  $: aRe = Math.cos(angleA) * (conjugateA ? 1 : 1);
  $: aIm = Math.sin(angleA) * (conjugateA ? -1 : 1);
  $: bRe = Math.cos(angleB) * (conjugateB ? 1 : 1);
  $: bIm = Math.sin(angleB) * (conjugateB ? -1 : 1);

  // Product: (aRe + aIm*i) * (bRe + bIm*i)
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

  function startDrag(which, e) {
    dragging = which;
    handleDrag(e);
  }

  function handleDrag(e) {
    if (!dragging) return;
    const svg = e.currentTarget.closest ? e.currentTarget.closest('svg') : e.target.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    // Determine which circle we're in based on dragging target
    const circleIdx = dragging === 'a' ? 0 : dragging === 'b' ? 1 : -1;
    if (circleIdx < 0) return;
    // Each circle's center in viewport coords
    const svgW = rect.width;
    const totalW = size * 3 + 40; // 3 circles + gaps
    const scale = svgW / totalW;
    const circleCxPx = rect.left + (circleIdx * (size + 20) + cx) * scale;
    const circleCyPx = rect.top + cy * scale;
    const dx = e.clientX - circleCxPx;
    const dy = e.clientY - circleCyPx;
    const angle = Math.atan2(-dy, dx); // SVG y is flipped
    if (dragging === 'a') angleA = conjugateA ? -angle : angle;
    else if (dragging === 'b') angleB = conjugateB ? -angle : angle;
  }

  function stopDrag() {
    dragging = null;
  }

  // Handle touch
  function handleTouch(e) {
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleDrag({ clientX: touch.clientX, clientY: touch.clientY, currentTarget: e.currentTarget, target: e.target });
  }

  function drawCircle(cxOff, re, im, color, label, deg) {
    const x = cxOff + cx;
    const y = cy;
    const tipX = x + re * R;
    const tipY = y - im * R;
    return { x, y, tipX, tipY, re, im, color, label, deg };
  }

  $: circA = drawCircle(0, aRe, aIm, '#6366f1', 'a', aDeg);
  $: circB = drawCircle(size + 20, bRe, bIm, '#ec4899', 'b', bDeg);
  $: circP = drawCircle(2 * (size + 20), pRe, pIm, '#14b8a6', 'a × b', pDeg);

  const totalW = size * 3 + 40;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="complex-mul"
  on:mousemove={handleDrag}
  on:mouseup={stopDrag}
  on:mouseleave={stopDrag}
  on:touchmove={handleTouch}
  on:touchend={stopDrag}
  role="application"
>
  <svg viewBox="0 0 {totalW} {size + 50}" preserveAspectRatio="xMidYMid meet" class="complex-svg">
    {#each [circA, circB, circP] as c, i}
      {@const isInput = i < 2}
      {@const which = i === 0 ? 'a' : i === 1 ? 'b' : null}
      <g>
        <!-- Unit circle -->
        <circle cx={c.x} cy={c.y} r={R} fill="none" stroke="var(--color-border-light)" stroke-width="0.75" />
        <!-- Axes -->
        <line x1={c.x - R} y1={c.y} x2={c.x + R} y2={c.y} stroke="var(--color-border-light)" stroke-width="0.5" />
        <line x1={c.x} y1={c.y - R} x2={c.x} y2={c.y + R} stroke="var(--color-border-light)" stroke-width="0.5" />
        <!-- Axis labels -->
        <text x={c.x + R + 3} y={c.y - 3} font-size="7" font-family="var(--font-mono)" fill="var(--color-text-light)">Re</text>
        <text x={c.x + 3} y={c.y - R - 3} font-size="7" font-family="var(--font-mono)" fill="var(--color-text-light)">Im</text>

        <!-- Angle arc -->
        {#if Math.abs(c.deg) > 2}
          {@const arcR = R * 0.3}
          {@const startAngle = 0}
          {@const endAngle = -Math.atan2(c.im, c.re)}
          {@const sweep = endAngle > 0 ? 0 : 1}
          <path
            d="M{c.x + arcR},{c.y} A{arcR},{arcR} 0 {Math.abs(c.deg) > 180 ? 1 : 0},{sweep} {c.x + Math.cos(-endAngle) * arcR},{c.y + Math.sin(-endAngle) * arcR}"
            fill="none" stroke={c.color} stroke-width="1" opacity="0.4"
          />
        {/if}

        <!-- Projection lines (dotted) -->
        <line x1={c.tipX} y1={c.tipY} x2={c.tipX} y2={c.y}
          stroke={c.color} stroke-width="0.7" stroke-dasharray="2,2" opacity="0.35" />
        <line x1={c.tipX} y1={c.tipY} x2={c.x} y2={c.tipY}
          stroke={c.color} stroke-width="0.7" stroke-dasharray="2,2" opacity="0.35" />

        <!-- Arrow -->
        <line x1={c.x} y1={c.y} x2={c.tipX} y2={c.tipY}
          stroke={c.color} stroke-width="2.5" stroke-linecap="round" />

        <!-- Draggable tip -->
        <circle cx={c.tipX} cy={c.tipY} r={isInput ? 7 : 5}
          fill={c.color} stroke="white" stroke-width="2"
          style="cursor: {isInput ? 'grab' : 'default'}"
          on:mousedown={isInput ? (e) => startDrag(which, e) : undefined}
          on:touchstart={isInput ? (e) => { e.preventDefault(); startDrag(which, e.touches[0]); } : undefined}
        />

        <!-- Label above -->
        <text x={c.x} y={8} text-anchor="middle" font-size="11"
          font-family="var(--font-mono)" font-weight="600" fill={c.color}>
          {c.label}
        </text>

        <!-- Coordinates below -->
        <text x={c.x} y={size + 16} text-anchor="middle" font-size="9"
          font-family="var(--font-mono)" fill={c.color}>
          {formatComplex(c.re, c.im)}
        </text>
        <text x={c.x} y={size + 28} text-anchor="middle" font-size="8"
          font-family="var(--font-mono)" fill="var(--color-text-light)">
          {c.deg}°
        </text>
      </g>

      <!-- × and = signs between circles -->
      {#if i === 0}
        <text x={size + 10} y={cy + 4} text-anchor="middle" font-size="18"
          font-family="var(--font-mono)" fill="var(--color-text-light)">×</text>
      {/if}
      {#if i === 1}
        <text x={2 * size + 30} y={cy + 4} text-anchor="middle" font-size="18"
          font-family="var(--font-mono)" fill="var(--color-text-light)">=</text>
      {/if}
    {/each}

    <!-- Angle sum annotation -->
    <text x={totalW / 2} y={size + 44} text-anchor="middle" font-size="9"
      font-family="var(--font-mono)" fill="var(--color-text-muted)">
      {aDeg}° + {bDeg}° = {pDeg}°
      {#if Math.abs((aDeg + bDeg) - pDeg) > 1 && Math.abs((aDeg + bDeg) - pDeg - 360) > 1 && Math.abs((aDeg + bDeg) - pDeg + 360) > 1}
        (mod 360°)
      {/if}
    </text>
  </svg>

  <!-- Conjugate toggles -->
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
  .complex-mul {
    width: 100%;
    touch-action: none;
  }

  .complex-svg {
    width: 100%;
    height: auto;
    max-width: 620px;
    display: block;
    margin: 0 auto;
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

  .conj-toggle input {
    cursor: pointer;
  }
</style>
