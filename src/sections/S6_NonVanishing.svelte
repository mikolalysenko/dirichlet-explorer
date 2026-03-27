<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { dirichletCharacters, complexAbs } from '../lib/characters.js';
  import { lFunction } from '../lib/lfunctions.js';
  import { complexMul } from '../lib/characters.js';

  let q = 5;
  let sValue = 1.5;

  $: characters = dirichletCharacters(q);

  const sMin = 1.005;
  const sMaxPlot = 4;
  const numPts = 100;

  // Compute curves for each individual L-function AND the product
  $: curveData = (() => {
    const chars = dirichletCharacters(q);
    const sVals = Array.from({ length: numPts }, (_, i) => {
      const t = i / (numPts - 1);
      return sMin + (sMaxPlot - sMin) * (t * t); // denser near sMin
    });

    const individual = chars.map((chi, idx) => {
      const points = sVals.map(s => ({ s, value: lFunction(s, chi, 1000)[0] }));
      return { chi, points, idx };
    });

    const productPts = sVals.map((s, si) => {
      let prod = 1;
      for (const c of individual) prod *= c.points[si].value;
      return { s, value: prod };
    });

    return { individual, productPts };
  })();

  // Current values at sValue
  $: currentIndividual = characters.map((chi, i) => {
    const l = lFunction(Math.max(sValue, sMin), chi, 1000);
    return { label: chi.label, value: l[0], isPrincipal: chi.isPrincipal, idx: i };
  });

  $: currentProduct = currentIndividual.reduce((p, c) => p * c.value, 1);

  // Adaptive y-axis: track the product at current s
  $: yMax = Math.max(5, currentProduct * 1.3);

  const plotWidth = 680;
  const plotHeight = 240;
  const margin = { left: 55, right: 20, top: 20, bottom: 40 };
  const pw = plotWidth - margin.left - margin.right;
  const ph = plotHeight - margin.top - margin.bottom;

  $: xScale = (s) => margin.left + ((s - sMin) / (sMaxPlot - sMin)) * pw;
  $: yScale = (v) => margin.top + ph - (v / yMax) * ph;

  // Reactive path data
  $: productPath = curveData.productPts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${xScale(p.s)},${yScale(p.value)}`
  ).join(' ');

  $: individualPaths = curveData.individual.map(c =>
    c.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(p.s)},${yScale(p.value)}`).join(' ')
  );

  // Y-axis ticks
  $: yTicks = (() => {
    const step = yMax > 50 ? 20 : yMax > 20 ? 5 : yMax > 8 ? 2 : 1;
    const ticks = [];
    for (let v = 0; v <= yMax; v += step) ticks.push(v);
    return ticks;
  })();

  const charColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];

  // ── Visualization 1: Pole/zero playground ──────────────────────
  let numPoles = 1;
  let numZeros = 0;

  const pzPlotW = 560;
  const pzPlotH = 240;
  const pzM = { left: 50, right: 15, top: 15, bottom: 35 };
  const pzPW = pzPlotW - pzM.left - pzM.right;
  const pzPH = pzPlotH - pzM.top - pzM.bottom;

  // Y range zoomed out
  const pzYMin = -4;
  const pzYMaxV = 12;

  const pzXMin = -0.5;
  const pzXMax = 3;
  $: pzXScale = (s) => pzM.left + ((s - pzXMin) / (pzXMax - pzXMin)) * pzPW;
  $: pzYScale = (v) => pzM.top + pzPH - ((v - pzYMin) / (pzYMaxV - pzYMin)) * pzPH;

  $: pzExp = numZeros - numPoles;

  // Generate points, but split into left (s<1) and right (s>1) segments
  // to avoid drawing a line through the asymptote at s=1
  function evalPZ(s, exp) {
    const d = s - 1;
    if (Math.abs(d) < 0.003) return null; // gap at the asymptote
    if (d > 0) return Math.pow(d, exp);
    return Math.pow(Math.abs(d), exp) * (exp % 2 === 0 ? 1 : -1);
  }

  $: pzSegments = (() => {
    const exp = pzExp;
    const segments = [];
    let current = [];
    for (let i = 0; i <= 400; i++) {
      const s = pzXMin + (i / 400) * (pzXMax - pzXMin);
      const val = evalPZ(s, exp);
      if (val === null || !isFinite(val) || Math.abs(val) > 200) {
        // Break the segment
        if (current.length > 1) segments.push(current);
        current = [];
      } else {
        current.push({ s, value: val });
      }
    }
    if (current.length > 1) segments.push(current);
    return segments;
  })();

  $: pzPaths = pzSegments.map(seg =>
    seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${pzXScale(p.s)},${pzYScale(p.value)}`).join(' ')
  );

  $: pzBehavior = (() => {
    if (pzExp > 0) return { label: '→ 0', color: '#3b82f6' };
    if (pzExp < 0) return { label: '→ ∞', color: '#ef4444' };
    return { label: '→ finite', color: '#22c55e' };
  })();

  const supDigitsLocal = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function pzFormulaText(poles, zeros) {
    const exp = zeros - poles;
    if (exp === 0) return 'f(s) ~ constant';
    if (exp > 0) return `f(s) ~ (s−1)${exp > 1 ? supDigitsLocal[exp] : ''}`;
    if (exp === -1) return 'f(s) ~ 1/(s−1)';
    return `f(s) ~ 1/(s−1)${supDigitsLocal[-exp]}`;
  }

  // ── Visualization 2: Real character — two scenarios ─────────
  import { zetaPartial } from '../lib/lfunctions.js';
  import { gcd } from '../lib/math-utils.js';

  $: realCharIdx = characters.findIndex(c => {
    if (c.isPrincipal) return false;
    const vals = [...c.values.values()];
    return vals.every(v => Math.abs(v[1]) < 0.01);
  });

  let realS = 1.5;

  // Compute ζ(s)·L(s,χ) and the lower bound Σ 1/m^{2s} at sampled points
  // Use simple multiplication: zetaPartial * lFunction
  $: realCurveData = (() => {
    const chi = realCharIdx >= 0 ? characters[realCharIdx] : null;
    if (!chi) return { reality: [], hypothetical: [], lowerBound: [] };

    const reality = []; // ζ(s)·L(s,χ) for s > 1 (has pole)
    const hypothetical = []; // same function but extended past s=1 (if pole cancelled)
    const lowerBound = []; // Σ 1/m^{2s} for coprime m

    for (let i = 0; i <= 150; i++) {
      const s = 0.52 + (i / 150) * 3.48;
      const zeta = zetaPartial(Math.max(s, 1.001), 3000);
      const l = lFunction(Math.max(s, 1.001), chi, 2000)[0];
      const prod = zeta * l;

      // Lower bound
      let lb = 0;
      for (let m = 1; m <= 300; m++) {
        if (gcd(m, q) === 1) lb += Math.pow(m, -2 * s);
      }

      if (s > 1.01) reality.push({ s, value: prod });
      hypothetical.push({ s, value: s > 1.01 ? prod : lb * 1.1 }); // approximate extension
      lowerBound.push({ s, value: lb });
    }
    return { reality, hypothetical, lowerBound };
  })();

  const rW = 280;
  const rH = 200;
  const rM = { left: 40, right: 10, top: 12, bottom: 30 };
  const rPW = rW - rM.left - rM.right;
  const rPH = rH - rM.top - rM.bottom;

  $: rXScale = (s) => rM.left + ((s - 0.4) / 3.6) * rPW;

  // Adaptive y-axis based on current s
  $: rYMax = (() => {
    const lb = realCurveData.lowerBound.find(p => Math.abs(p.s - Math.max(realS, 0.52)) < 0.03);
    const rv = realCurveData.reality.find(p => Math.abs(p.s - Math.max(realS, 1.02)) < 0.03);
    return Math.max(8, Math.max(lb ? lb.value : 5, rv ? rv.value : 5) * 1.3);
  })();
  $: rYScale = (v) => rM.top + rPH - (v / rYMax) * rPH;

  function rPath(pts) {
    // Split at large values to avoid asymptote lines
    const segs = [];
    let cur = [];
    for (const p of pts) {
      if (!isFinite(p.value) || p.value > rYMax * 3 || p.value < -rYMax) {
        if (cur.length > 1) segs.push(cur);
        cur = [];
      } else {
        cur.push(p);
      }
    }
    if (cur.length > 1) segs.push(cur);
    return segs.map(seg =>
      seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${rXScale(p.s)},${rYScale(p.value)}`).join(' ')
    );
  }

  $: realityPaths = rPath(realCurveData.reality);
  $: lowerBoundPaths = rPath(realCurveData.lowerBound);

  $: currentLB = (() => {
    const p = realCurveData.lowerBound.find(p => Math.abs(p.s - Math.max(realS, 0.52)) < 0.03);
    return p ? p.value : 0;
  })();
</script>

<Section id="nonvanishing" title="The Heart of the Proof" subtitle="Why L(1, χ) can never be zero — the final piece of the puzzle.">

  <p>We've established that Dirichlet's theorem is true <em>if</em> no L-function vanishes at
  <Tex tex="s = 1" /> (for non-principal characters). Now we need to prove this can't happen.</p>

  <p>This is the deepest part of the proof. The argument is a beautiful proof by contradiction.</p>

  <h3>The product trick</h3>

  <p>Take all the L-functions and multiply them together:</p>

  <Tex display tex="\prod_\chi L(s, \chi)" />

  <p>This product has a remarkable property: when you take its logarithm using the Euler product, you get:</p>

  <Tex display tex={String.raw`\log \prod_\chi L(s,\chi) = \sum_p \sum_{k \ge 1} \frac{1}{k \, p^{ks}} \sum_\chi \chi(p^k)`} />

  <p>By the orthogonality of characters, the inner sum <Tex tex={String.raw`\sum_\chi \chi(p^k)`} /> equals
  <Tex tex={String.raw`\varphi(q)`} /> when <Tex tex={String.raw`p^k \equiv 1 \pmod{q}`} />, and 0 otherwise.
  So the log is a sum of <strong>non-negative</strong> terms — it's counting (with weights) prime
  powers that are congruent to 1 mod <Tex tex="q" />. Since the log is non-negative,
  the product itself is <Tex tex={String.raw`\ge e^0 = 1`} />.</p>

  <p>In other words: all the "coefficients" in the Dirichlet series expansion of this product
  are non-negative, the first coefficient is 1, so the product is
  <strong>always at least 1</strong> for real <Tex tex="s > 1" />.</p>

  <div class="viz-container">
    <h4>Product of all L-functions mod {q}</h4>
    <Slider label="Modulus (q)" bind:value={q} min={3} max={7} />
    <Slider label="s" bind:value={sValue} min={1.0} max={4} step={0.01} format={v => v.toFixed(2)} />

    <svg viewBox="0 0 {plotWidth} {plotHeight}" preserveAspectRatio="xMidYMid meet" class="product-plot">
      <defs>
        <clipPath id="prod-clip-{q}">
          <rect x={margin.left} y={margin.top} width={pw} height={ph} />
        </clipPath>
      </defs>

      <!-- Grid -->
      {#each yTicks as tick}
        <line x1={margin.left} y1={yScale(tick)} x2={plotWidth - margin.right} y2={yScale(tick)}
          stroke="var(--color-border-light)" stroke-width="0.5" />
        <text x={margin.left - 6} y={yScale(tick)} text-anchor="end" dominant-baseline="central"
          font-size="9" font-family="var(--font-mono)" fill="var(--color-text-light)">{tick}</text>
      {/each}

      <!-- y=1 line -->
      <line x1={margin.left} y1={yScale(1)} x2={plotWidth - margin.right} y2={yScale(1)}
        stroke="var(--color-prime)" stroke-width="1" stroke-dasharray="5,3" opacity="0.5" />

      <!-- s=1 pole marker -->
      <line x1={xScale(1)} y1={margin.top} x2={xScale(1)} y2={margin.top + ph}
        stroke="var(--color-prime)" stroke-width="1" stroke-dasharray="4,3" opacity="0.4" />
      <text x={xScale(1)} y={margin.top - 5} text-anchor="middle"
        font-size="8" font-family="var(--font-mono)" fill="var(--color-prime)">s=1</text>

      <!-- Axes -->
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + ph}
        stroke="var(--color-border)" stroke-width="1" />
      <line x1={margin.left} y1={margin.top + ph} x2={plotWidth - margin.right} y2={margin.top + ph}
        stroke="var(--color-border)" stroke-width="1" />
      <text x={plotWidth / 2} y={plotHeight - 5} text-anchor="middle" font-size="11" fill="var(--color-text-muted)">s</text>

      <!-- Clipped curves -->
      <g clip-path="url(#prod-clip-{q})">
        <!-- Individual L-function curves (thin, colored) -->
        {#each individualPaths as path, i}
          <path d={path} fill="none"
            stroke={charColors[i % charColors.length]}
            stroke-width="1.2" opacity="0.4" />
        {/each}

        <!-- Product curve (thick) -->
        <path d={productPath} fill="none" stroke="var(--color-accent)" stroke-width="2.5" />

        <!-- Current value markers -->
        {#each currentIndividual as cv, i}
          <circle cx={xScale(Math.max(sValue, sMin))} cy={yScale(cv.value)}
            r="3" fill={charColors[i % charColors.length]} stroke="white" stroke-width="1" />
        {/each}
        <circle cx={xScale(Math.max(sValue, sMin))} cy={yScale(currentProduct)}
          r="5" fill="var(--color-accent)" stroke="white" stroke-width="2" />
      </g>

      <!-- Current s marker -->
      <line x1={xScale(Math.max(sValue, sMin))} y1={margin.top} x2={xScale(Math.max(sValue, sMin))} y2={margin.top + ph}
        stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4,3" opacity="0.3" />
    </svg>

    <!-- Value readout: product + individual contributions -->
    <div class="product-readout">
      <div class="product-main">
        <Tex tex={String.raw`\prod_\chi L(${sValue.toFixed(2)}, \chi)`} /> = <strong>{currentProduct > 10000 ? '∞' : currentProduct.toFixed(2)}</strong>
        {#if currentProduct >= 0.99}
          <span class="check-yes">&ge; 1 &#10003;</span>
        {/if}
      </div>
      <div class="individual-values">
        {#each currentIndividual as cv, i}
          <span class="indiv-val" style="color: {charColors[i % charColors.length]}">
            {cv.label} = {Math.abs(cv.value) > 10000 ? '∞' : cv.value.toFixed(2)}
            {#if cv.isPrincipal && sValue < 1.3}
              <span class="pole-tag">↑ pole</span>
            {/if}
          </span>
        {/each}
      </div>
    </div>
  </div>

  <h3>The contradiction for complex characters</h3>

  <p>A <strong>pole</strong> at <Tex tex="s = 1" /> means the function blows up like <Tex tex={String.raw`\frac{1}{s-1}`} />.
  A <strong>zero</strong> means it vanishes like <Tex tex="(s-1)" />. When you multiply functions,
  their poles and zeros combine. Try adding poles and zeros below to see what happens
  to the product near <Tex tex="s = 1" />:</p>

  <div class="viz-container">
    <h4>Pole/zero playground — what happens near s = 1?</h4>

    <div class="pz-controls">
      <div class="pz-group">
        <span class="pz-label" style="color: #ef4444">Poles:</span>
        <button class="pz-btn" on:click={() => numPoles = Math.max(0, numPoles - 1)}>−</button>
        <span class="pz-count">{numPoles}</span>
        <button class="pz-btn" on:click={() => numPoles = Math.min(4, numPoles + 1)}>+</button>
      </div>
      <div class="pz-group">
        <span class="pz-label" style="color: #3b82f6">Zeros:</span>
        <button class="pz-btn" on:click={() => numZeros = Math.max(0, numZeros - 1)}>−</button>
        <span class="pz-count">{numZeros}</span>
        <button class="pz-btn" on:click={() => numZeros = Math.min(4, numZeros + 1)}>+</button>
      </div>
      <span class="pz-formula">{pzFormulaText(numPoles, numZeros)}</span>
      <span class="pz-result" style="color: {pzBehavior.color}"><strong>{pzBehavior.label}</strong></span>
    </div>

    <svg viewBox="0 0 {pzPlotW} {pzPlotH}" preserveAspectRatio="xMidYMid meet" class="contradiction-plot">
      <defs>
        <clipPath id="pz-clip"><rect x={pzM.left} y={pzM.top} width={pzPW} height={pzPH} /></clipPath>
      </defs>

      <!-- Horizontal grid lines -->
      {#each [-4, -2, 0, 1, 2, 4, 6, 8, 10, 12] as tick}
        {#if tick >= pzYMin && tick <= pzYMaxV}
          <line x1={pzM.left} y1={pzYScale(tick)} x2={pzPlotW - pzM.right} y2={pzYScale(tick)}
            stroke={tick === 1 ? 'var(--color-prime)' : 'var(--color-border-light)'}
            stroke-width={tick === 1 ? 1.5 : 0.5}
            stroke-dasharray={tick === 1 ? '5,3' : 'none'}
            opacity={tick === 1 ? 0.6 : 0.5} />
          <text x={pzM.left - 6} y={pzYScale(tick)} text-anchor="end" dominant-baseline="central"
            font-size="9" font-family="var(--font-mono)"
            fill={tick === 1 ? 'var(--color-prime)' : 'var(--color-text-light)'}>
            {tick}{tick === 1 ? ' ≥1' : ''}
          </text>
        {/if}
      {/each}

      <!-- Axes -->
      <line x1={pzM.left} y1={pzYScale(0)} x2={pzPlotW - pzM.right} y2={pzYScale(0)}
        stroke="var(--color-border)" stroke-width="1" />
      <line x1={pzXScale(0)} y1={pzM.top} x2={pzXScale(0)} y2={pzM.top + pzPH}
        stroke="var(--color-border)" stroke-width="0.5" opacity="0.3" />
      <text x={pzPlotW / 2} y={pzPlotH - 4} text-anchor="middle" font-size="10" fill="var(--color-text-muted)">s</text>

      <!-- s=1 marker -->
      <line x1={pzXScale(1)} y1={pzM.top} x2={pzXScale(1)} y2={pzM.top + pzPH}
        stroke="var(--color-prime)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
      <text x={pzXScale(1)} y={pzM.top + pzPH + 12} text-anchor="middle" font-size="8"
        font-family="var(--font-mono)" fill="var(--color-prime)">s = 1</text>

      <!-- Shaded violation region: below y=1, right of s=1 -->
      <rect x={pzXScale(1)} y={pzYScale(1)} width={pzXScale(pzXMax) - pzXScale(1)} height={pzYScale(0) - pzYScale(1)}
        fill="#ef4444" opacity="0.04" />

      <g clip-path="url(#pz-clip)">
        {#each pzPaths as path}
          <path d={path} fill="none" stroke={pzBehavior.color} stroke-width="2.5" />
        {/each}
      </g>
    </svg>

    <p class="pz-hint">
      {#if numPoles === 1 && numZeros === 0}
        <strong>This is our starting point:</strong> 1 pole from χ₀. The product blows up at s=1 — that's fine, it's still ≥ 1.
      {:else if numPoles === 1 && numZeros === 1}
        1 pole, 1 zero: they cancel. The product approaches a finite value. No contradiction — this is the <em>real character</em> case (harder!).
      {:else if numPoles === 1 && numZeros === 2}
        <strong>1 pole, 2 zeros: the zeros win!</strong> The product → 0, dropping below the ≥ 1 line. <strong style="color: #ef4444">Contradiction!</strong> This is the complex character case.
      {:else if numZeros > numPoles}
        More zeros than poles: the product → 0. It drops below 1. <strong style="color: #ef4444">Contradiction!</strong>
      {:else if numPoles > numZeros}
        More poles than zeros: the product → ∞. Still ≥ 1, so no contradiction.
      {:else}
        Poles and zeros balanced: the product stays finite at s=1.
      {/if}
    </p>
  </div>

  <p>Now here's the key: we know the product has <strong>exactly 1 pole</strong> (from <Tex tex="\chi_0" />).
  If a complex character <Tex tex="\chi_1" /> had <Tex tex="L(1, \chi_1) = 0" />,
  its conjugate <Tex tex={String.raw`\overline{\chi_1}`} /> would also have
  <Tex tex={String.raw`L(1, \overline{\chi_1}) = 0`} />.
  For a <em>complex</em> (non-real) character, <Tex tex={String.raw`\chi_1 \neq \overline{\chi_1}`} /> — they
  assign different arrows to the same residues — so these are two <em>separate</em> characters
  in the product, giving <strong>2 zeros vs 1 pole</strong> — try setting that
  in the playground above. The product drops below 1. <strong>Contradiction!</strong></p>

  <Callout type="insight">
    <p><strong>For complex characters:</strong> <Tex tex="L(1, \chi) \neq 0" /> because a zero
    always comes in a conjugate pair — two zeros against one pole. The product
    would be forced below 1, contradicting the non-negative coefficient lower bound.</p>
  </Callout>

  <h3>The subtle case: real characters</h3>

  <p>Try setting 1 pole and 1 zero in the playground above. They cancel — the product
  stays finite. No contradiction! A <strong>real character</strong> equals its own conjugate
  (<Tex tex={String.raw`\chi = \overline{\chi}`} />), so a zero gives only <em>one</em> zero, not two.
  We need a different argument.</p>

  <h4>Step 1: A new product with non-negative coefficients</h4>

  <p>Consider just <Tex tex={String.raw`\zeta(s) \cdot L(s, \chi)`} /> for a real character.
  At each prime in the Euler product, this gives either:</p>

  <ul class="real-cases">
    <li>If <Tex tex={String.raw`\chi(p) = +1`} />: the factor is
    <Tex tex={String.raw`\frac{1}{(1-p^{-s})^2}`} /> — a <em>squared</em> geometric series (all terms positive)</li>
    <li>If <Tex tex={String.raw`\chi(p) = -1`} />: the factor is
    <Tex tex={String.raw`\frac{1}{1-p^{-2s}}`} /> — a geometric series in <Tex tex={String.raw`p^{-2s}`} /> (also all positive)</li>
  </ul>

  <p>So this product, written as <Tex tex={String.raw`\sum a_n / n^s`} />, has all
  <Tex tex={String.raw`a_n \ge 0`} />. This is the key property.</p>

  <h4>Step 2: The trap</h4>

  <p>Normally, <Tex tex={String.raw`\zeta(s) \cdot L(s, \chi)`} /> has a pole at <Tex tex="s = 1" />
  (from <Tex tex={String.raw`\zeta`} />). The series <Tex tex={String.raw`\sum a_n/n^s`} /> converges for
  <Tex tex="s > 1" /> and diverges at <Tex tex="s = 1" />. That's fine — the pole is the boundary.</p>

  <p>But <strong>if <Tex tex="L(1, \chi) = 0" /></strong>, the zero would cancel the pole.
  The function would be smooth (no singularity) for all <Tex tex="s > 0" />.
  <strong>Landau's theorem</strong> says: if a Dirichlet series <Tex tex={String.raw`\sum a_n/n^s`} /> has all
  <Tex tex={String.raw`a_n \ge 0`} />, and the function it defines has no singularities for <Tex tex="s > \sigma" />,
  then the series converges for all <Tex tex="s > \sigma" />.
  So with no singularity anywhere for <Tex tex="s > 0" />, the series would converge for <em>all</em> <Tex tex="s > 0" />.</p>

  <h4>Step 3: The explosion at s = ½</h4>

  <p>But wait — look at what's hiding in the series. When <Tex tex={String.raw`\chi(p) = 1`} />,
  the squared factor <Tex tex={String.raw`1/(1-p^{-s})^2`} /> includes the term <Tex tex={String.raw`1/p^{2s}`} />.
  Multiplying across all such primes, the series contains <Tex tex={String.raw`1/m^{2s}`} /> for
  every coprime <Tex tex="m" />. At <Tex tex="s = 1/2" />, this becomes
  <Tex tex={String.raw`\sum 1/m`} /> — the harmonic series, which diverges!
  Drag <Tex tex="s" /> toward ½ to see it blow up:</p>

  {#if realCharIdx >= 0}
    <div class="viz-container">
      <h4>The lower bound Σ 1/m²ˢ explodes at s = ½</h4>
      <Slider label="s" bind:value={realS} min={0.52} max={3} step={0.01} format={v => v.toFixed(2)} />

      <div class="real-plots">
        <!-- Left: Reality (pole at s=1) -->
        <div class="real-plot-panel">
          <div class="real-plot-label">Reality: pole at s=1</div>
          <svg viewBox="0 0 {rW} {rH}" preserveAspectRatio="xMidYMid meet" class="contradiction-plot">
            <defs><clipPath id="r-clip-l"><rect x={rM.left} y={rM.top} width={rPW} height={rPH} /></clipPath></defs>
            <line x1={rXScale(1)} y1={rM.top} x2={rXScale(1)} y2={rM.top + rPH} stroke="var(--color-prime)" stroke-width="1" stroke-dasharray="3,3" opacity="0.5" />
            <text x={rXScale(1)} y={rH - rM.bottom + 14} text-anchor="middle" font-size="7" font-family="var(--font-mono)" fill="var(--color-prime)">s=1 (pole)</text>
            <line x1={rM.left} y1={rM.top + rPH} x2={rW - rM.right} y2={rM.top + rPH} stroke="var(--color-border)" stroke-width="1" />
            <line x1={rM.left} y1={rM.top} x2={rM.left} y2={rM.top + rPH} stroke="var(--color-border)" stroke-width="1" />
            <g clip-path="url(#r-clip-l)">
              {#each realityPaths as path}
                <path d={path} fill="none" stroke="var(--color-accent)" stroke-width="2" />
              {/each}
            </g>
            <text x={rW / 2} y={rM.top + 14} text-anchor="middle" font-size="8" fill="var(--color-text-muted)">
              ζ(s)·L(s,χ) — converges for s {'>'} 1
            </text>
          </svg>
        </div>

        <!-- Right: Hypothetical (if L(1,χ)=0, pole cancelled) -->
        <div class="real-plot-panel">
          <div class="real-plot-label" style="color: #ef4444">If L(1,χ) = 0: no pole</div>
          <svg viewBox="0 0 {rW} {rH}" preserveAspectRatio="xMidYMid meet" class="contradiction-plot">
            <defs><clipPath id="r-clip-r"><rect x={rM.left} y={rM.top} width={rPW} height={rPH} /></clipPath></defs>
            <!-- s=1/2 danger zone -->
            <rect x={rM.left} y={rM.top} width={rXScale(0.5) - rM.left} height={rPH} fill="#ef4444" opacity="0.04" />
            <line x1={rXScale(0.5)} y1={rM.top} x2={rXScale(0.5)} y2={rM.top + rPH} stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.7" />
            <text x={rXScale(0.5)} y={rH - rM.bottom + 14} text-anchor="middle" font-size="7" font-family="var(--font-mono)" fill="#ef4444" font-weight="600">s=½ → ∞!</text>
            <line x1={rXScale(1)} y1={rM.top} x2={rXScale(1)} y2={rM.top + rPH} stroke="var(--color-border)" stroke-width="0.5" stroke-dasharray="3,3" opacity="0.3" />
            <line x1={rM.left} y1={rM.top + rPH} x2={rW - rM.right} y2={rM.top + rPH} stroke="var(--color-border)" stroke-width="1" />
            <line x1={rM.left} y1={rM.top} x2={rM.left} y2={rM.top + rPH} stroke="var(--color-border)" stroke-width="1" />
            <g clip-path="url(#r-clip-r)">
              {#each lowerBoundPaths as path}
                <path d={path} fill="none" stroke="#ef4444" stroke-width="2" />
              {/each}
            </g>
            <!-- Current s marker -->
            <line x1={rXScale(realS)} y1={rM.top} x2={rXScale(realS)} y2={rM.top + rPH} stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4,3" opacity="0.3" />
            {#if currentLB < rYMax}
              <circle cx={rXScale(realS)} cy={rYScale(currentLB)} r="4" fill="#ef4444" stroke="white" stroke-width="1.5" />
            {/if}
            <text x={rW / 2} y={rM.top + 14} text-anchor="middle" font-size="8" fill="#ef4444">
              "should converge" but Σ1/m²ˢ → ∞
            </text>
          </svg>
        </div>
      </div>

      <div class="contradiction-readout">
        <span class="c-item" style="color: #ef4444">
          Σ 1/m²ˢ at s={realS.toFixed(2)}: <strong>{currentLB > 10000 ? '∞' : currentLB.toFixed(1)}</strong>
          {#if realS < 0.65}
            <span class="c-tag violation">diverging → contradiction!</span>
          {/if}
        </span>
      </div>
    </div>
  {/if}

  <Callout>
    <p><strong>The contradiction:</strong> If <Tex tex="L(1, \chi) = 0" />, Landau's theorem forces
    <Tex tex={String.raw`\sum a_n/n^s`} /> to converge for all <Tex tex="s > 0" />. But the lower bound
    <Tex tex={String.raw`\sum 1/m^{2s}`} /> diverges at <Tex tex="s = 1/2" />. A convergent series can't
    have a divergent subseries. <strong>Contradiction!</strong>
    So <Tex tex="L(1, \chi) \neq 0" /> for real characters too.</p>
  </Callout>

  <p>And with that, every piece is in place. Let's see the full picture.</p>

</Section>

<style>
  .product-plot { width: 100%; height: auto; }

  .product-readout { text-align: center; margin-top: 0.5em; }

  .product-main {
    font-size: 1rem;
    margin-bottom: 0.3em;
  }

  .product-main strong {
    font-family: var(--font-mono);
    color: var(--color-accent);
    font-size: 1.1rem;
  }

  .check-yes {
    color: #22c55e;
    font-weight: 600;
    margin-left: 0.3em;
  }

  .individual-values {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  .indiv-val { font-weight: 500; }

  .pole-tag {
    font-size: 0.65rem;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    padding: 0.05em 0.3em;
    border-radius: 3px;
    margin-left: 0.2em;
  }

  .tug-of-war {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5em;
    margin: 1.5em 0;
    padding: 1.5em;
    background: var(--color-bg-alt);
    border-radius: 12px;
  }

  .tow-side {
    text-align: center;
    padding: 1em;
    border-radius: 8px;
    min-width: 160px;
  }

  .pole-side {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid #ef4444;
  }

  .zero-side {
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid #3b82f6;
  }

  .tow-label {
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.3em;
  }

  .tow-arrow {
    font-size: 1.2rem;
    font-weight: 700;
  }

  .pole-side .tow-arrow {
    color: #ef4444;
  }

  .zero-side .tow-arrow {
    color: #3b82f6;
  }

  .tow-vs {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--color-text-muted);
  }

  .contradiction-plot { width: 100%; height: auto; }

  .contradiction-readout {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    justify-content: center;
    margin-top: 0.4em;
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }

  .c-item { display: flex; align-items: center; gap: 0.3em; }

  .c-tag {
    font-size: 0.65rem;
    padding: 0.1em 0.4em;
    border-radius: 4px;
    font-weight: 600;
    margin-left: 0.2em;
  }

  .c-tag.pole { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
  .c-tag.violation { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

  .real-cases { margin: 0.5em 0 0.5em 1.5em; font-size: 0.95rem; }
  .real-cases li { margin-bottom: 0.3em; }

  .real-plots {
    display: flex;
    gap: 1em;
    justify-content: center;
    flex-wrap: wrap;
    margin: 0.5em 0;
  }

  .real-plot-panel {
    flex: 1;
    min-width: 250px;
    max-width: 320px;
  }

  .real-plot-label {
    font-size: 0.78rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: 0.2em;
    color: var(--color-text-muted);
  }

  .pz-controls {
    display: flex;
    align-items: center;
    gap: 1.2em;
    margin-bottom: 0.8em;
    flex-wrap: wrap;
  }

  .pz-group {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

  .pz-label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .pz-btn {
    font-family: var(--font-mono);
    font-size: 1rem;
    width: 28px;
    height: 28px;
    border: 1.5px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  }

  .pz-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

  .pz-count {
    font-family: var(--font-mono);
    font-size: 1rem;
    font-weight: 700;
    min-width: 16px;
    text-align: center;
  }

  .pz-formula {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .pz-hint {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-align: center;
    margin-top: 0.3em;
  }
</style>
