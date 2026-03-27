<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { dirichletCharacters, complexAbs, complexMul, characterContinuousData } from '../lib/characters.js';
  import { lFunction } from '../lib/lfunctions.js';

  let q = 5;
  let sValue = 1.5;

  $: characters = dirichletCharacters(q);
  $: contData = characterContinuousData(q);

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

  // ── Real character: Euler factor visualization ──────────────
  import { zetaPartial } from '../lib/lfunctions.js';
  import { gcd, coprimeResidues } from '../lib/math-utils.js';

  $: residues = coprimeResidues(q);
  import { listPrimes } from '../lib/primes.js';

  // Classify all characters: principal, complex pairs, real
  $: charClassification = (() => {
    const principal = [];
    const complexPairs = [];
    const real = [];
    const used = new Set();

    for (let i = 0; i < characters.length; i++) {
      const chi = characters[i];
      if (chi.isPrincipal) { principal.push({ chi, idx: i }); used.add(i); continue; }
      if (used.has(i)) continue;

      const vals = [...chi.values.values()];
      const isReal = vals.every(v => Math.abs(v[1]) < 0.01);

      if (isReal) {
        real.push({ chi, idx: i });
        used.add(i);
      } else {
        // Find conjugate
        let conjIdx = -1;
        for (let j = i + 1; j < characters.length; j++) {
          if (used.has(j)) continue;
          const chiJ = characters[j];
          // Check if chiJ is the conjugate of chi
          let isConj = true;
          for (const [k, v] of chi.values) {
            const vj = chiJ.values.get(k) || [0, 0];
            if (Math.abs(v[0] - vj[0]) > 0.01 || Math.abs(v[1] + vj[1]) > 0.01) { isConj = false; break; }
          }
          if (isConj) { conjIdx = j; break; }
        }
        if (conjIdx >= 0) {
          complexPairs.push({ chi1: chi, chi2: characters[conjIdx], idx1: i, idx2: conjIdx });
          used.add(i);
          used.add(conjIdx);
        } else {
          // Odd case — treat as real
          real.push({ chi, idx: i });
          used.add(i);
        }
      }
    }
    return { principal, complexPairs, real };
  })();

  $: realCharacters = charClassification.real;

  // Coefficients for the grid
  const numCoeffs = 36;
  $: coeffData = (() => {
    const chi = realCharIdx >= 0 ? characters[realCharIdx] : null;
    if (!chi) return [];
    const coeffs = [];
    let runningSum = 0;
    for (let n = 1; n <= numCoeffs; n++) {
      let an = 0;
      for (let d = 1; d <= n; d++) {
        if (n % d === 0) {
          an += chi.values.get(d % q)?.[0] ?? 0;
        }
      }
      an = Math.round(an);
      runningSum += an;
      coeffs.push({ n, an, runningSum });
    }
    return coeffs;
  })();

  $: coeffTotal = coeffData.length > 0 ? coeffData[coeffData.length - 1].runningSum : 0;

  $: realCharIdx = realCharacters.length > 0 ? realCharacters[0].idx : -1;
  let selectedRealCharIdx = 0;
  $: {
    if (selectedRealCharIdx >= realCharacters.length) selectedRealCharIdx = 0;
    realCharIdx = realCharacters[selectedRealCharIdx]?.idx ?? -1;
  }

  // For each small prime, show the Euler factor and its series expansion
  $: realChar = realCharIdx >= 0 ? characters[realCharIdx] : null;
  $: eulerFactors = (() => {
    if (!realChar) return [];
    const primes = listPrimes(20);
    return primes.map(p => {
      const chiP = realChar.values.get(p % q)?.[0] ?? 0;
      // chiP is +1, -1, or 0
      const terms = [];
      if (chiP === 1) {
        // 1/(1-x)^2 where x = 1/p^s → coefficients are (k+1) * x^k
        for (let k = 0; k < 5; k++) {
          terms.push({ power: k, coeff: k + 1, label: k === 0 ? `1` : `${k + 1}/${p}${k > 1 ? superscriptDigits(k) + 'ˢ' : 'ˢ'}` });
        }
      } else if (chiP === -1) {
        // 1/(1-x^2) where x = 1/p^s → coefficients are 1 at even powers
        for (let k = 0; k < 5; k++) {
          terms.push({ power: k * 2, coeff: 1, label: k === 0 ? `1` : `1/${p}${superscriptDigits(k * 2) + 'ˢ'}` });
        }
      }
      return { p, chiP, terms, type: chiP === 1 ? '1/(1−x)²' : chiP === -1 ? '1/(1−x²)' : 'skip' };
    }).filter(f => f.chiP !== 0);
  })();

  // Strip constants for character sorting visualization
  const stripW = 400;
  const stripH = 36;
  const stripML = 40;
  const stripMR = 8;
  const stripInner = stripW - stripML - stripMR;
  const stripCyS = stripH / 2;
  const arrowRS = 12;
  $: sxFn = (x) => stripML + (x / q) * stripInner;

  const supD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function superscriptDigits(n) {
    return String(n).split('').map(d => supD[parseInt(d)]).join('');
  }

  // ── Landau's theorem visualization ─────────────────────────────
  let landauMode = 'nonneg'; // 'nonneg' or 'alternating'
  let landauN = 200;

  // d(n) = number of divisors of n (non-negative coefficients, ζ(s)²)
  function numDivisors(n) {
    let count = 0;
    for (let d = 1; d * d <= n; d++) {
      if (n % d === 0) { count++; if (d !== n / d) count++; }
    }
    return count;
  }

  // Compute partial sums for a range of s values
  $: landauCurves = (() => {
    const sVals = [];
    for (let i = 0; i <= 80; i++) sVals.push(0.5 + (i / 80) * 2.5); // 0.5 to 3

    // Multiple N values to show convergence
    const nValues = [20, 50, 100, Math.min(landauN, 500)];

    return nValues.map(N => {
      const pts = sVals.map(s => {
        let sum = 0;
        for (let n = 1; n <= N; n++) {
          const coeff = landauMode === 'nonneg' ? numDivisors(n) : Math.pow(-1, n + 1);
          sum += coeff * Math.pow(n, -s);
        }
        return { s, value: sum };
      });
      return { N, pts };
    });
  })();

  const lPlotW = 520;
  const lPlotH = 220;
  const lM = { left: 50, right: 15, top: 15, bottom: 30 };
  const lPW = lPlotW - lM.left - lM.right;
  const lPH = lPlotH - lM.top - lM.bottom;

  $: lXScale = (s) => lM.left + ((s - 0.5) / 2.5) * lPW;

  $: lYMax = (() => {
    const maxVal = Math.max(...landauCurves.flatMap(c => c.pts.filter(p => p.s > 0.7).map(p => Math.abs(p.value))));
    return Math.min(30, Math.max(5, maxVal * 1.1));
  })();
  $: lYMin = landauMode === 'alternating' ? -1 : 0;
  $: lYScale = (v) => lM.top + lPH - ((v - lYMin) / (lYMax - lYMin)) * lPH;

  function lPath(pts) {
    const segs = [];
    let cur = [];
    for (const p of pts) {
      if (!isFinite(p.value) || Math.abs(p.value) > lYMax * 2) {
        if (cur.length > 1) segs.push(cur);
        cur = [];
      } else {
        cur.push(p);
      }
    }
    if (cur.length > 1) segs.push(cur);
    return segs.map(seg =>
      seg.map((p, i) => `${i === 0 ? 'M' : 'L'}${lXScale(p.s)},${lYScale(p.value)}`).join(' ')
    );
  }

  const lAlphas = [0.2, 0.35, 0.55, 1.0];

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
  <Tex tex="s = 1" /> (for non-principal characters). Now we need to prove this can't happen.
  The argument is a proof by contradiction: <strong>assume</strong> some <Tex tex="L(1, \chi) = 0" />,
  then show this leads to an impossibility.</p>

  <h3>A product that can never be small</h3>

  <p>The key tool: take all the L-functions and multiply them together into one big product
  <Tex tex={String.raw`\prod_\chi L(s, \chi)`} />. This product has a crucial property:
  for real <Tex tex="s > 1" />, it is <strong>always at least 1</strong>.</p>

  <Callout>
    <p><strong>Why ≥ 1?</strong> Using the Euler product and character orthogonality, the log of this
    product simplifies to a sum that only counts prime powers <Tex tex={String.raw`p^k \equiv 1 \pmod{q}`} />,
    each with a positive weight. A sum of non-negative terms is non-negative,
    so <Tex tex={String.raw`\log \prod \ge 0`} />, which means <Tex tex={String.raw`\prod \ge e^0 = 1`} />.</p>
  </Callout>

  <p>The product also has exactly <strong>one pole</strong> at <Tex tex="s = 1" /> (from the principal
  character <Tex tex="\chi_0" />, whose L-function is essentially <Tex tex={String.raw`\zeta(s)`} />).
  Every other character's L-function is finite at <Tex tex="s = 1" />.
  The question is: can any of them be <em>zero</em>?</p>

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

  <h3>Sorting the characters</h3>

  <p>To handle all characters, we split them into groups based on their values.
  Change <Tex tex="q" /> to see how the sorting changes:</p>

  <div class="viz-container">
    <h4>Characters mod {q} — sorted by type</h4>
    <Slider label="Modulus (q)" bind:value={q} min={3} max={12} />

    <!-- Unified strip renderer for any character -->
    {#snippet charStrip(chi, color, chiIdx)}
      <svg viewBox="0 0 {stripW} {stripH}" preserveAspectRatio="xMidYMid meet" class="char-strip">
        <!-- Center line -->
        <line x1={stripML} y1={stripCyS} x2={stripW - stripMR} y2={stripCyS} stroke="var(--color-border-light)" stroke-width="0.5" />
        <!-- ±1 guides -->
        <line x1={stripML} y1={stripCyS - arrowRS} x2={stripW - stripMR} y2={stripCyS - arrowRS} stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="2,3" />
        <line x1={stripML} y1={stripCyS + arrowRS} x2={stripW - stripMR} y2={stripCyS + arrowRS} stroke="var(--color-border-light)" stroke-width="0.3" stroke-dasharray="2,3" />
        <!-- Label -->
        <text x={4} y={stripCyS} dominant-baseline="central" font-size="10" font-family="var(--font-mono)" font-weight="600" fill={color}>{chi.label}</text>
        <!-- Continuous traces (Im solid, Re dashed) -->
        {#each [Array.from({length: 100}, (_, i) => {
          const x = (i / 99) * q;
          const freqs = contData.charFreqs[chiIdx];
          let re = 1, im = 0;
          if (freqs) {
            for (let j = 0; j < freqs.length; j++) {
              const angle = 2 * Math.PI * freqs[j] * x / contData.orders[j];
              const c = Math.cos(angle), s = Math.sin(angle);
              const nre = re * c - im * s;
              im = re * s + im * c;
              re = nre;
            }
          }
          return { x: sxFn(x), re, im };
        })] as contPts}
          <path d={contPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${stripCyS - p.im * arrowRS}`).join(' ')}
            fill="none" stroke={color} stroke-width="1" opacity="0.3" />
          <path d={contPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${stripCyS - p.re * arrowRS}`).join(' ')}
            fill="none" stroke={color} stroke-width="1" opacity="0.15" stroke-dasharray="2,2" />
        {/each}
        <!-- Discrete phasor arrows at coprime residues -->
        {#each residues as r}
          {@const v = chi.values.get(r) || [0, 0]}
          {@const px = sxFn(r)}
          <line x1={px} y1={stripCyS} x2={px + v[0] * arrowRS * 0.5} y2={stripCyS - v[1] * arrowRS * 0.5}
            stroke={color} stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
          <circle cx={px + v[0] * arrowRS * 0.5} cy={stripCyS - v[1] * arrowRS * 0.5}
            r="2" fill={color} />
          <!-- Tick mark -->
          <line x1={px} y1={stripCyS + arrowRS + 1} x2={px} y2={stripCyS + arrowRS + 4}
            stroke="var(--color-text-light)" stroke-width="0.5" />
          <text x={px} y={stripH - 1} text-anchor="middle" font-size="5" font-family="var(--font-mono)" fill="var(--color-text-light)">{r}</text>
        {/each}
      </svg>
    {/snippet}

    <!-- Principal -->
    <div class="char-sort-section">
      <div class="css-header principal-header">
        <span class="css-title">Principal character <Tex tex="\chi_0" /></span>
        <span class="css-tag">→ pole at s = 1</span>
      </div>
      {#each charClassification.principal as p}
        {@render charStrip(p.chi, '#d4880f', p.idx)}
      {/each}
      <p class="css-explain">Flat line at +1 for all coprime residues. Its L-function ≈ ζ(s) → pole at s=1.</p>
    </div>

    <!-- Complex pairs -->
    {#if charClassification.complexPairs.length > 0}
      <div class="char-sort-section">
        <div class="css-header complex-header">
          <span class="css-title">Complex conjugate pairs</span>
          <span class="css-tag">→ Case 1: two zeros beat one pole</span>
        </div>
        {#each charClassification.complexPairs as pair}
          <div class="css-pair-block">
            {@render charStrip(pair.chi1, '#6366f1', pair.idx1)}
            <div class="css-conj-arrow">↕ conjugate (mirrored)</div>
            {@render charStrip(pair.chi2, '#8b5cf6', pair.idx2)}
          </div>
        {/each}
        <p class="css-explain">Each pair has mirrored waves. If one has L(1,χ) = 0, the other does too — giving 2 zeros against 1 pole.</p>
      </div>
    {/if}

    <!-- Real characters -->
    <div class="char-sort-section">
      <div class="css-header real-header">
        <span class="css-title">Real characters</span>
        <span class="css-tag">→ Case 2: needs Landau's theorem</span>
      </div>
      {#if charClassification.real.length > 0}
        {#each charClassification.real as rc}
          {@render charStrip(rc.chi, '#22c55e', rc.idx)}
        {/each}
        <p class="css-explain">Only ±1 values — equals its own conjugate, so a zero counts only once. The counting argument fails.</p>
      {:else}
        <p class="css-explain">No real non-principal characters for q = {q}. Try q = 4, 5, or 8.</p>
      {/if}
    </div>
  </div>

  <h3>Case 1: Complex characters — two zeros beat one pole</h3>

  <Callout>
    <p><strong>Poles and zeros:</strong> A <strong>pole</strong> at <Tex tex="s = 1" /> means the function
    blows up like <Tex tex={String.raw`\frac{1}{s-1}`} />. A <strong>zero</strong> means it vanishes
    like <Tex tex="(s-1)" />. When you multiply functions, poles and zeros combine — they can
    cancel each other. Play with the widget below to build intuition:</p>
  </Callout>

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

  <h3>Case 2: Real characters — a subtler trap</h3>

  <p>Set 1 pole and 1 zero in the playground above — they cancel, the product stays finite.
  No contradiction! A <strong>real character</strong> satisfies
  <Tex tex={String.raw`\chi = \overline{\chi}`} />, so a zero gives only <em>one</em> zero against
  the one pole. The counting argument doesn't work. We need a completely different idea.</p>

  <h4>A series that can only count up</h4>

  <p>Consider just <Tex tex={String.raw`\zeta(s) \cdot L(s, \chi)`} /> for a real character.
  When you expand this as a series <Tex tex={String.raw`\sum a_n/n^s`} />, the coefficient
  <Tex tex={String.raw`a_n`} /> equals the sum <Tex tex={String.raw`\sum_{d | n} \chi(d)`} /> — add up the
  character values at every divisor of <Tex tex="n" />.</p>

  <p>Since a real character only takes the values +1, −1, and 0, this sum is always a whole
  number. And it turns out that for real characters, <strong>these sums are always ≥ 0</strong>.
  You can verify it below — every coefficient is non-negative:</p>

  <div class="viz-container">
    <h4>The coefficients of ζ(s)·L(s, χ) — all non-negative</h4>

    <div class="coeff-controls">
      <Slider label="q" bind:value={q} min={3} max={12} />
      {#if realCharacters.length > 0}
        <div class="coeff-char-picker">
          <span class="coeff-control-label">Character:</span>
          {#each realCharacters as rc, i}
            <button class="csg-chip real" class:active={selectedRealCharIdx === i}
              on:click={() => selectedRealCharIdx = i}>
              {rc.chi.label}
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if realCharacters.length > 0 && coeffData.length > 0}
      <div class="coeff-table">
        <div class="coeff-header-row">
          <span class="coeff-hdr">n</span>
          {#each coeffData as c}
            <span class="coeff-hdr">{c.n}</span>
          {/each}
        </div>
        <div class="coeff-data-row">
          <span class="coeff-row-label">a<sub>n</sub></span>
          {#each coeffData as c}
            <span class="coeff-data" class:zero={c.an === 0}>{c.an}</span>
          {/each}
        </div>
        <div class="coeff-sum-row">
          <span class="coeff-row-label">Σ</span>
          {#each coeffData as c}
            <span class="coeff-sum">{c.runningSum}</span>
          {/each}
        </div>
      </div>
      <p class="ef-conclusion">
        Every <strong>a<sub>n</sub> ≥ 0</strong> — the running sum (bottom row) can only grow.
        Total after {numCoeffs} terms: <strong>{coeffTotal}</strong>.
        This is the property that Landau's theorem exploits.
      </p>
    {:else}
      <p class="ef-conclusion">No real non-principal characters for q = {q}. Try q = 4, 5, or 8.</p>
    {/if}
  </div>

  <h4>The trap snaps shut — Landau's theorem</h4>

  <p>Normally, <Tex tex={String.raw`\zeta(s) \cdot L(s, \chi)`} /> has a pole at <Tex tex="s = 1" />.
  The series converges for <Tex tex="s > 1" /> and the pole is the boundary — the wall where
  it stops converging. That's fine.</p>

  <p>But <strong>if <Tex tex="L(1, \chi) = 0" /></strong>, the zero cancels the pole. No wall.
  The function is smooth for all <Tex tex="s > 0" />.
  For a non-negative series, that's a disaster:</p>

  <Callout>
    <p><strong>Landau's theorem:</strong> If a series <Tex tex={String.raw`\sum a_n / n^s`} /> has all
    non-negative coefficients (<Tex tex={String.raw`a_n \ge 0`} />), then the boundary where
    it stops converging <em>must</em> be a singularity of the function.</p>
    <p><strong>Why?</strong> Think about it intuitively: with non-negative terms, the partial sums
    can only grow. The series can't "accidentally" diverge at some point where the function
    is perfectly smooth — there's no cancellation between terms that could cause a hidden blowup.
    If the function is well-behaved at some point, the series must converge there too.
    The <em>only</em> thing that can stop a non-negative series from converging is an actual
    singularity (pole or branch point) in the function.</p>
    <p>So: <strong>no singularity → the series converges everywhere to the right.</strong></p>
  </Callout>

  <p>Try it below. Toggle between non-negative coefficients (which hit a wall at the singularity)
  and alternating signs (which sneak past it):</p>

  <div class="viz-container">
    <h4>Landau's theorem — why non-negative series can't sneak past a singularity</h4>

    <div class="landau-controls">
      <div class="chart-toggle">
        <button class:active={landauMode === 'nonneg'} on:click={() => landauMode = 'nonneg'}>
          Non-negative (d(n), like ζ²)
        </button>
        <button class:active={landauMode === 'alternating'} on:click={() => landauMode = 'alternating'}>
          Alternating ((−1)ⁿ⁺¹)
        </button>
      </div>
      <Slider label="Max terms" bind:value={landauN} min={20} max={500} step={10} format={v => v} />
    </div>

    <svg viewBox="0 0 {lPlotW} {lPlotH}" preserveAspectRatio="xMidYMid meet" class="landau-plot">
      <defs>
        <clipPath id="l-clip"><rect x={lM.left} y={lM.top} width={lPW} height={lPH} /></clipPath>
      </defs>

      <!-- s=1 singularity marker -->
      <line x1={lXScale(1)} y1={lM.top} x2={lXScale(1)} y2={lM.top + lPH}
        stroke="var(--color-prime)" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.5" />
      <text x={lXScale(1)} y={lM.top - 4} text-anchor="middle" font-size="8"
        font-family="var(--font-mono)" fill="var(--color-prime)" font-weight="600">
        singularity
      </text>

      <!-- y=0 line -->
      {#if lYMin < 0}
        <line x1={lM.left} y1={lYScale(0)} x2={lPlotW - lM.right} y2={lYScale(0)}
          stroke="var(--color-border)" stroke-width="0.5" />
      {/if}

      <!-- Axes -->
      <line x1={lM.left} y1={lM.top} x2={lM.left} y2={lM.top + lPH} stroke="var(--color-border)" stroke-width="1" />
      <line x1={lM.left} y1={lM.top + lPH} x2={lPlotW - lM.right} y2={lM.top + lPH} stroke="var(--color-border)" stroke-width="1" />
      <text x={lPlotW / 2} y={lPlotH - 4} text-anchor="middle" font-size="10" fill="var(--color-text-muted)">s</text>

      <!-- Convergence zone labels -->
      <text x={lXScale(2)} y={lM.top + 14} text-anchor="middle" font-size="8"
        fill="#22c55e" font-family="var(--font-mono)">converges ✓</text>
      {#if landauMode === 'nonneg'}
        <text x={lXScale(0.75)} y={lM.top + 14} text-anchor="middle" font-size="8"
          fill="#ef4444" font-family="var(--font-mono)">diverges ✗</text>
      {:else}
        <text x={lXScale(0.75)} y={lM.top + 14} text-anchor="middle" font-size="8"
          fill="#22c55e" font-family="var(--font-mono)">still converges!</text>
      {/if}

      <!-- Curves for different N values (lighter = fewer terms) -->
      <g clip-path="url(#l-clip)">
        {#each landauCurves as curve, ci}
          {#each lPath(curve.pts) as seg}
            <path d={seg} fill="none"
              stroke={landauMode === 'nonneg' ? 'var(--color-accent)' : '#14b8a6'}
              stroke-width={ci === landauCurves.length - 1 ? 2.5 : 1.5}
              opacity={lAlphas[ci]} />
          {/each}
        {/each}
      </g>
    </svg>

    <div class="landau-readout">
      {#if landauMode === 'nonneg'}
        <p><strong>Non-negative coefficients:</strong> The partial sums march upward monotonically.
        At <Tex tex="s = 1" /> (the singularity), they explode — and there's <em>no way</em> to extend
        past it. The series is trapped behind the wall.</p>
      {:else}
        <p><strong>Alternating signs:</strong> The partial sums oscillate and can settle down
        <em>even at s = 1 and below</em>, where ζ(s) has a pole. The cancellation between
        positive and negative terms lets the series "reach past" the singularity.</p>
      {/if}
    </div>
  </div>

  <p>By Landau's theorem, our non-negative series would be forced to converge for
  <em>all</em> <Tex tex="s > 0" />. But look at what's hiding inside it:</p>

  <h4>The explosion at s = ½</h4>

  <p>The series contains terms <Tex tex={String.raw`1/m^{2s}`} /> for every coprime <Tex tex="m" />
  (from the squared Euler factors where <Tex tex={String.raw`\chi(p) = 1`} />).
  At <Tex tex="s = 1/2" />, this becomes <Tex tex={String.raw`\sum 1/m`} /> — the harmonic series,
  which we already know diverges! Drag <Tex tex="s" /> toward ½ to see it blow up:</p>

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

  .euler-factor-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
    justify-content: center;
    margin-bottom: 0.8em;
  }

  .euler-factor-card {
    border-radius: 8px;
    padding: 0.5em 0.7em;
    min-width: 140px;
    max-width: 180px;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    text-align: center;
  }

  .euler-factor-card.plus {
    background: rgba(34, 197, 94, 0.06);
    border: 1.5px solid #22c55e;
  }

  .euler-factor-card.minus {
    background: rgba(59, 130, 246, 0.06);
    border: 1.5px solid #3b82f6;
  }

  .ef-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.3em;
    font-size: 0.75rem;
  }

  .ef-prime { font-weight: 700; }
  .euler-factor-card.plus .ef-chi { color: #22c55e; font-weight: 600; }
  .euler-factor-card.minus .ef-chi { color: #3b82f6; font-weight: 600; }

  .ef-formula {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-bottom: 0.3em;
  }

  .ef-terms {
    display: flex;
    flex-wrap: wrap;
    gap: 0.15em;
    justify-content: center;
    font-size: 0.65rem;
    color: var(--color-text);
    margin-bottom: 0.2em;
  }

  .ef-term.muted { color: var(--color-text-light); }

  .ef-verdict {
    font-size: 0.7rem;
    color: #22c55e;
  }

  .ef-conclusion {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-align: center;
  }

  .coeff-table {
    overflow-x: auto;
    margin: 0.5em 0;
    font-family: var(--font-mono);
    font-size: 0.68rem;
  }

  .coeff-header-row, .coeff-data-row, .coeff-sum-row {
    display: grid;
    grid-template-columns: 24px repeat(36, 1fr);
    gap: 0;
    min-width: max-content;
  }

  .coeff-header-row {
    border-bottom: 1px solid var(--color-border-light);
  }

  .coeff-hdr {
    text-align: center;
    padding: 0.15em 0;
    color: var(--color-text-light);
    font-size: 0.6rem;
  }

  .coeff-row-label {
    font-weight: 600;
    color: var(--color-text-muted);
    text-align: right;
    padding-right: 0.3em;
    font-size: 0.65rem;
  }

  .coeff-data {
    text-align: center;
    padding: 0.2em 0;
    font-weight: 700;
    color: var(--color-accent);
    background: rgba(37, 99, 235, 0.05);
    border-right: 1px solid rgba(0,0,0,0.03);
  }

  .coeff-data.zero {
    color: var(--color-text-light);
    background: none;
    font-weight: 400;
  }

  .coeff-sum-row {
    border-top: 1.5px solid var(--color-border);
  }

  .coeff-sum {
    text-align: center;
    padding: 0.15em 0;
    color: var(--color-prime);
    font-size: 0.6rem;
    font-weight: 500;
  }

  .coeff-char-picker {
    display: flex;
    align-items: center;
    gap: 0.3em;
  }

  .coeff-controls {
    display: flex;
    align-items: center;
    gap: 0.4em;
    margin-bottom: 0.6em;
    flex-wrap: wrap;
  }

  .coeff-control-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .char-sort {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em;
    justify-content: center;
  }

  .char-sort-group {
    padding: 0.6em 0.8em;
    border-radius: 10px;
    min-width: 120px;
    text-align: center;
  }

  .principal-group { background: rgba(212, 136, 15, 0.08); border: 1.5px solid var(--color-prime); }
  .complex-group { background: rgba(99, 102, 241, 0.06); border: 1.5px solid #6366f1; }
  .real-group { background: rgba(34, 197, 94, 0.06); border: 1.5px solid #22c55e; }

  .csg-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 0.4em;
  }

  .principal-group .csg-label { color: var(--color-prime); }
  .complex-group .csg-label { color: #6366f1; }
  .real-group .csg-label { color: #22c55e; }

  .csg-chip {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    padding: 0.2em 0.5em;
    border-radius: 5px;
    font-weight: 600;
    cursor: default;
    border: none;
    background: transparent;
  }

  .csg-chip.principal { color: var(--color-prime); background: rgba(212, 136, 15, 0.12); }
  .csg-chip.complex { color: #6366f1; background: rgba(99, 102, 241, 0.1); }
  .csg-chip.real { color: #22c55e; background: rgba(34, 197, 94, 0.1); cursor: pointer; }
  .csg-chip.real.active { background: #22c55e; color: white; }

  .csg-pair {
    display: flex;
    align-items: center;
    gap: 0.2em;
    justify-content: center;
    margin-bottom: 0.2em;
  }

  .csg-conj { color: #6366f1; font-size: 0.8rem; }

  .csg-note {
    font-size: 0.68rem;
    color: var(--color-text-light);
    margin-top: 0.3em;
    font-style: italic;
  }

  .char-sort-section {
    margin-bottom: 1em;
    border-radius: 10px;
    padding: 0.6em 0.8em;
    background: white;
  }

  .css-header {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-bottom: 0.4em;
    flex-wrap: wrap;
  }

  .css-title { font-weight: 600; font-size: 0.9rem; }
  .css-tag {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    padding: 0.15em 0.5em;
    border-radius: 4px;
  }

  .principal-header { border-left: 4px solid var(--color-prime); padding-left: 0.6em; }
  .principal-header .css-title { color: var(--color-prime); }
  .principal-header .css-tag { background: var(--color-prime-bg); color: var(--color-prime); }

  .complex-header { border-left: 4px solid #6366f1; padding-left: 0.6em; }
  .complex-header .css-title { color: #6366f1; }
  .complex-header .css-tag { background: rgba(99, 102, 241, 0.1); color: #6366f1; }

  .real-header { border-left: 4px solid #22c55e; padding-left: 0.6em; }
  .real-header .css-title { color: #22c55e; }
  .real-header .css-tag { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

  .css-pair-block {
    margin: 0.4em 0;
    padding: 0.4em 0.5em;
    border: 1.5px solid rgba(99, 102, 241, 0.25);
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.03);
  }

  .css-pair-row {
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0.2em 0;
  }

  .css-chi-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 700;
    min-width: 28px;
  }

  .css-values {
    display: flex;
    gap: 0.2em;
    flex-wrap: wrap;
    align-items: center;
  }

  .css-val {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .css-val.real-val {
    padding: 0.1em 0.3em;
    border-radius: 3px;
    font-weight: 600;
    font-size: 0.75rem;
  }

  .css-val.plus { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
  .css-val.minus { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

  .css-conj-arrow {
    text-align: center;
    font-size: 0.65rem;
    color: #8b5cf6;
    margin: 0.1em 0 0.1em 28px;
  }

  .css-explain {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin: 0.3em 0 0;
  }

  .char-strip {
    width: 100%;
    height: auto;
    display: block;
    margin: -0.1em 0;
  }

  .landau-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    align-items: center;
    margin-bottom: 0.5em;
  }

  .landau-plot { width: 100%; height: auto; }

  .landau-readout {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-align: center;
    margin-top: 0.3em;
  }

  .landau-readout p { margin: 0; }

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
