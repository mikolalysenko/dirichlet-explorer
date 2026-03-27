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

  // ── Visualization 1: Complex character contradiction ──────────
  // Show 1/(s-1) [pole], (s-1)^2 [double zero], and (s-1) [net] near s=1
  let contradictionS = 1.5;

  const cPlotW = 500;
  const cPlotH = 220;
  const cM = { left: 50, right: 15, top: 15, bottom: 35 };
  const cPW = cPlotW - cM.left - cM.right;
  const cPH = cPlotH - cM.top - cM.bottom;

  $: cXScale = (s) => cM.left + ((s - 1) / 1.5) * cPW; // s from 1 to 2.5
  // Fixed y-axis focused on the 0–3 range so the blue (s-1) curve and the ≥1 line
  // are the visual focus. The red pole curve shoots off the top — that's the point.
  const cYMax = 3;
  $: cYScale = (v) => cM.top + cPH - (v / cYMax) * cPH;

  // Curve data for the contradiction plot
  $: cCurves = (() => {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const s = 1.005 + (i / 120) * 1.495; // 1.005 to 2.5
      const pole = 1 / (s - 1);
      const dblZero = (s - 1) * (s - 1);
      const net = (s - 1); // (s-1)^2 / (s-1)
      pts.push({ s, pole, dblZero, net });
    }
    return pts;
  })();

  $: cPolePath = cCurves.map((p, i) => `${i === 0 ? 'M' : 'L'}${cXScale(p.s)},${cYScale(Math.min(p.pole, cYMax))}`).join(' ');
  $: cNetPath = cCurves.map((p, i) => `${i === 0 ? 'M' : 'L'}${cXScale(p.s)},${cYScale(p.net)}`).join(' ');

  $: cCurrentPole = 1 / Math.max(0.01, contradictionS - 1);
  $: cCurrentNet = contradictionS - 1;

  // ── Visualization 2: Real character — ζ(s)L(s,χ) divergence ──
  // Compute ζ(s)*L(s,χ_real) via partial sums with non-negative coefficients
  import { zetaPartial } from '../lib/lfunctions.js';
  import { gcd } from '../lib/math-utils.js';

  // Find the real non-principal character (if any)
  $: realCharIdx = characters.findIndex(c => {
    if (c.isPrincipal) return false;
    const vals = [...c.values.values()];
    return vals.every(v => Math.abs(v[1]) < 0.01);
  });

  // Compute ζ(s)*L(s,χ) for the real character via direct product
  $: realProdCurve = (() => {
    const chi = realCharIdx >= 0 ? characters[realCharIdx] : null;
    if (!chi) return [];
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const s = 0.55 + (i / 100) * 3.45; // 0.55 to 4
      // Compute sum of d_chi(n)/n^s where d_chi(n) = sum_{d|n} chi(d)
      // This equals ζ(s)*L(s,chi) and has non-negative coefficients
      let sum = 0;
      const N = 2000;
      for (let n = 1; n <= N; n++) {
        // d_chi(n) = sum of chi(d) for d dividing n
        let dchi = 0;
        for (let d = 1; d * d <= n; d++) {
          if (n % d === 0) {
            const chiD = chi.values.get(d % q) || [0, 0];
            dchi += chiD[0];
            if (d !== n / d) {
              const chiD2 = chi.values.get((n / d) % q) || [0, 0];
              dchi += chiD2[0];
            }
          }
        }
        sum += dchi * Math.pow(n, -s);
      }
      pts.push({ s, value: sum });
    }
    return pts;
  })();

  // Partial sums for the lower bound: just Σ 1/m^{2s} for coprime m
  $: lowerBoundCurve = (() => {
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const s = 0.55 + (i / 100) * 3.45;
      let sum = 0;
      for (let m = 1; m <= 500; m++) {
        if (gcd(m, q) === 1) sum += Math.pow(m, -2 * s);
      }
      pts.push({ s, value: sum });
    }
    return pts;
  })();

  const rPlotW = 550;
  const rPlotH = 240;
  const rM = { left: 50, right: 15, top: 15, bottom: 35 };
  const rPW = rPlotW - rM.left - rM.right;
  const rPH = rPlotH - rM.top - rM.bottom;

  let realS = 1.5;

  $: rXScale = (s) => rM.left + ((s - 0.5) / 3.5) * rPW;
  $: rYMax = (() => {
    const atS = realProdCurve.find(p => Math.abs(p.s - Math.max(realS, 0.55)) < 0.04);
    return Math.max(5, (atS ? atS.value : 5) * 1.3);
  })();
  $: rYScale = (v) => rM.top + rPH - (Math.min(v, rYMax) / rYMax) * rPH;

  $: realProdPath = realProdCurve.map((p, i) => `${i === 0 ? 'M' : 'L'}${rXScale(p.s)},${rYScale(p.value)}`).join(' ');
  $: lowerBoundPath = lowerBoundCurve.map((p, i) => `${i === 0 ? 'M' : 'L'}${rXScale(p.s)},${rYScale(p.value)}`).join(' ');

  $: realCurrentVal = (() => {
    const p = realProdCurve.find(p => Math.abs(p.s - Math.max(realS, 0.55)) < 0.04);
    return p ? p.value : 0;
  })();
  $: lowerCurrentVal = (() => {
    const p = lowerBoundCurve.find(p => Math.abs(p.s - Math.max(realS, 0.55)) < 0.04);
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

  <Callout>
    <p><strong>Vocabulary — poles and zeros:</strong> A <strong>pole</strong> is a point where a function
    blows up to infinity (like <Tex tex={String.raw`\frac{1}{s-1}`} /> at <Tex tex="s = 1" />).
    A <strong>zero</strong> is where it hits 0 (like <Tex tex="(s-1)" /> at <Tex tex="s = 1" />).
    When you multiply functions, poles and zeros can cancel: a pole times a zero gives something finite.</p>
  </Callout>

  <p>We know the product <Tex tex={String.raw`\prod_\chi L(s,\chi)`} /> has exactly <strong>one pole</strong>
  at <Tex tex="s = 1" />, coming from the principal character <Tex tex="\chi_0" />.
  Now suppose some complex character <Tex tex="\chi_1" /> had <Tex tex="L(1, \chi_1) = 0" />.
  Since <Tex tex="\chi_1" /> is complex, its conjugate <Tex tex={String.raw`\overline{\chi_1}`} /> is a
  <em>different</em> character, and it would also have <Tex tex={String.raw`L(1, \overline{\chi_1}) = 0`} />.
  That gives <strong>two zeros</strong> against just one pole.</p>

  <p>Near <Tex tex="s = 1" />, the product would behave like:</p>

  <Tex display tex={String.raw`\underbrace{\frac{1}{s-1}}_{\text{1 pole}} \times \underbrace{(s-1)^2}_{\text{2 zeros}} \times (\text{finite}) = (s-1) \times (\text{finite}) \to 0`} />

  <p>The blue curve below shows this net result — drag <Tex tex="s" /> toward 1 and watch it
  drop below the gold ≥ 1 line:</p>

  <div class="viz-container">
    <h4>What would happen if <Tex tex="L(1, \chi_1) = 0" />?</h4>
    <Slider label="s" bind:value={contradictionS} min={1.01} max={2.5} step={0.01} format={v => v.toFixed(2)} />

    <svg viewBox="0 0 {cPlotW} {cPlotH}" preserveAspectRatio="xMidYMid meet" class="contradiction-plot">
      <defs>
        <clipPath id="c-clip"><rect x={cM.left} y={cM.top} width={cPW} height={cPH} /></clipPath>
      </defs>

      <!-- y=1 lower bound -->
      <line x1={cM.left} y1={cYScale(1)} x2={cPlotW - cM.right} y2={cYScale(1)}
        stroke="var(--color-prime)" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.6" />
      <text x={cPlotW - cM.right + 2} y={cYScale(1)} font-size="9" font-family="var(--font-mono)"
        fill="var(--color-prime)" dominant-baseline="central">≥ 1</text>

      <!-- y=0 -->
      <line x1={cM.left} y1={cYScale(0)} x2={cPlotW - cM.right} y2={cYScale(0)}
        stroke="var(--color-border)" stroke-width="0.5" />

      <!-- Axes -->
      <line x1={cM.left} y1={cM.top} x2={cM.left} y2={cM.top + cPH} stroke="var(--color-border)" stroke-width="1" />
      <line x1={cM.left} y1={cM.top + cPH} x2={cPlotW - cM.right} y2={cM.top + cPH} stroke="var(--color-border)" stroke-width="1" />
      <text x={cPlotW / 2} y={cPlotH - 4} text-anchor="middle" font-size="10" fill="var(--color-text-muted)">s</text>

      <!-- s=1 marker -->
      <line x1={cXScale(1)} y1={cM.top} x2={cXScale(1)} y2={cM.top + cPH}
        stroke="var(--color-prime)" stroke-width="1" stroke-dasharray="3,3" opacity="0.4" />
      <text x={cXScale(1)} y={cM.top + cPH + 12} text-anchor="middle" font-size="8"
        font-family="var(--font-mono)" fill="var(--color-prime)">s = 1</text>

      <g clip-path="url(#c-clip)">
        <!-- Net result: (s-1) → 0 (the hypothetical product behavior) -->
        <path d={cNetPath} fill="none" stroke="var(--color-accent)" stroke-width="2.5" />
      </g>

      <!-- Current s marker -->
      <line x1={cXScale(contradictionS)} y1={cM.top} x2={cXScale(contradictionS)} y2={cM.top + cPH}
        stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4,3" opacity="0.3" />

      <!-- Current value dot -->
      <circle cx={cXScale(contradictionS)} cy={cYScale(cCurrentNet)} r="5" fill="var(--color-accent)" stroke="white" stroke-width="2" />

      <!-- Shaded violation region below y=1 -->
      <rect x={cM.left} y={cYScale(1)} width={cPW} height={cYScale(0) - cYScale(1)}
        fill="#ef4444" opacity="0.05" />
    </svg>

    <div class="contradiction-readout">
      <span class="c-item" style="color: var(--color-accent)">
        Product ≈ (s−1) = <strong>{cCurrentNet.toFixed(3)}</strong>
        {#if cCurrentNet < 1}
          <span class="c-tag violation">{'<'} 1 — violates the lower bound!</span>
        {:else}
          <span class="c-tag" style="background: rgba(34,197,94,0.1); color: #22c55e">≥ 1 ✓</span>
        {/if}
      </span>
    </div>
  </div>

  <div class="tug-of-war">
    <div class="tow-side pole-side">
      <div class="tow-label">1 pole from <Tex tex="\chi_0" /></div>
      <div class="tow-arrow">&#x2191; Pushes UP</div>
    </div>
    <div class="tow-vs">vs</div>
    <div class="tow-side zero-side">
      <div class="tow-label">2 zeros from <Tex tex={String.raw`\chi_1, \overline{\chi_1}`} /></div>
      <div class="tow-arrow">&#x2193; Pushes DOWN</div>
    </div>
  </div>

  <p>Two zeros overpower one pole: the product is forced toward 0, dropping below 1.
  But we proved the product is <strong>always &ge; 1</strong>. <strong>Contradiction!</strong>
  So no complex character can have <Tex tex="L(1, \chi) = 0" />.</p>

  <Callout type="insight">
    <p><strong>For complex characters:</strong> <Tex tex="L(1, \chi) \neq 0" /> because a zero
    always comes in a conjugate pair — two zeros against one pole. The product
    would be forced below 1, contradicting the non-negative coefficient lower bound.</p>
  </Callout>

  <h3>The subtle case: real characters</h3>

  <p>A <strong>real character</strong> equals its own conjugate (<Tex tex={String.raw`\chi = \overline{\chi}`} />),
  so a zero would only count once — exactly matching the one pole.
  The product argument alone isn't enough!</p>

  <p>Dirichlet needed a subtler idea. Consider just <Tex tex={String.raw`\zeta(s) \cdot L(s, \chi)`} />
  for a real character <Tex tex="\chi" />. This product also has non-negative coefficients
  (because for a real character, each prime contributes either <Tex tex={String.raw`(1-p^{-s})^{-2}`} /> if
  <Tex tex={String.raw`\chi(p)=1`} />, or <Tex tex={String.raw`(1-p^{-2s})^{-1}`} /> if
  <Tex tex={String.raw`\chi(p)=-1`} /> — both have non-negative series expansions).</p>

  <p>If <Tex tex="L(1, \chi) = 0" />, the zero would cancel the pole from <Tex tex="\zeta" />,
  making the product analytic (well-behaved with no singularities) for all <Tex tex="s > 0" />.
  There is a theorem called <strong>Landau's theorem</strong> that says: a Dirichlet series with
  non-negative coefficients must have a singularity at the boundary of its region of convergence.
  If the product is analytic for all <Tex tex="s > 0" />, then the series would have to converge for
  all <Tex tex="s > 0" />.</p>

  <p>But the non-negative coefficients include terms <Tex tex={String.raw`1/m^{2s}`} /> for every
  integer <Tex tex="m" /> coprime to <Tex tex="q" />.
  As <Tex tex={String.raw`s \to 1/2`} />, the sum <Tex tex={String.raw`\sum 1/m^{2s} \to \sum 1/m = \infty`} />.
  Drag the slider below to see it:</p>

  {#if realCharIdx >= 0}
    <div class="viz-container">
      <h4>ζ(s)·L(s, {characters[realCharIdx]?.label}) — diverges at s = 1/2</h4>
      <Slider label="s" bind:value={realS} min={0.55} max={3} step={0.01} format={v => v.toFixed(2)} />

      <svg viewBox="0 0 {rPlotW} {rPlotH}" preserveAspectRatio="xMidYMid meet" class="contradiction-plot">
        <defs>
          <clipPath id="r-clip"><rect x={rM.left} y={rM.top} width={rPW} height={rPH} /></clipPath>
        </defs>

        <!-- s=1 and s=1/2 markers -->
        <line x1={rXScale(1)} y1={rM.top} x2={rXScale(1)} y2={rM.top + rPH}
          stroke="var(--color-border)" stroke-width="1" stroke-dasharray="3,3" opacity="0.4" />
        <text x={rXScale(1)} y={rM.top - 4} text-anchor="middle" font-size="8" font-family="var(--font-mono)" fill="var(--color-text-light)">s=1</text>

        <line x1={rXScale(0.5)} y1={rM.top} x2={rXScale(0.5)} y2={rM.top + rPH}
          stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6" />
        <text x={rXScale(0.5)} y={rM.top - 4} text-anchor="middle" font-size="8" font-family="var(--font-mono)" fill="#ef4444" font-weight="600">s=½ (diverges!)</text>

        <!-- Axes -->
        <line x1={rM.left} y1={rM.top} x2={rM.left} y2={rM.top + rPH} stroke="var(--color-border)" stroke-width="1" />
        <line x1={rM.left} y1={rM.top + rPH} x2={rPlotW - rM.right} y2={rM.top + rPH} stroke="var(--color-border)" stroke-width="1" />
        <text x={rPlotW / 2} y={rPlotH - 4} text-anchor="middle" font-size="10" fill="var(--color-text-muted)">s</text>

        <g clip-path="url(#r-clip)">
          <!-- Lower bound: Σ 1/m^{2s} (dashed) -->
          <path d={lowerBoundPath} fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.5" />

          <!-- ζ(s)·L(s,χ) curve -->
          <path d={realProdPath} fill="none" stroke="var(--color-accent)" stroke-width="2.5" />
        </g>

        <!-- Current s marker -->
        <line x1={rXScale(realS)} y1={rM.top} x2={rXScale(realS)} y2={rM.top + rPH}
          stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4,3" opacity="0.3" />

        <!-- Value dot -->
        {#if realCurrentVal < rYMax}
          <circle cx={rXScale(realS)} cy={rYScale(realCurrentVal)} r="5" fill="var(--color-accent)" stroke="white" stroke-width="2" />
        {/if}
      </svg>

      <div class="contradiction-readout">
        <span class="c-item" style="color: var(--color-accent)">ζ(s)·L(s,χ) = <strong>{realCurrentVal > 10000 ? '∞' : realCurrentVal.toFixed(2)}</strong></span>
        <span class="c-item" style="color: #ef4444">lower bound Σ1/m²ˢ = {lowerCurrentVal > 10000 ? '∞' : lowerCurrentVal.toFixed(2)}
          {#if realS < 0.7}
            <span class="c-tag violation">exploding → contradiction!</span>
          {/if}
        </span>
      </div>
    </div>
  {/if}

  <p>A convergent series can't sum to infinity — <strong>contradiction!</strong></p>

  <Callout>
    <p><strong>In short:</strong> If <Tex tex="L(1, \chi) = 0" /> for a real character, then
    <Tex tex={String.raw`\zeta(s) L(s, \chi)`} /> would be analytic everywhere for <Tex tex="s > 0" />
    (Landau's theorem would force convergence there), but the series provably diverges
    at <Tex tex="s = 1/2" />. That's a contradiction.
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
</style>
