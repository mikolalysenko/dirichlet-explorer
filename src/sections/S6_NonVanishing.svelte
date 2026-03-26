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

  // Compute the product of all L-functions at s
  $: productValues = (() => {
    const sVals = [];
    for (let s = 1.05; s <= 4; s += 0.05) {
      sVals.push(s);
    }

    return sVals.map(s => {
      let product = [1, 0];
      for (const chi of characters) {
        const l = lFunction(s, chi, 1000);
        product = complexMul(product, l);
      }
      return { s, value: product[0] };
    });
  })();

  $: currentProduct = (() => {
    let product = [1, 0];
    for (const chi of characters) {
      const l = lFunction(sValue, chi, 1000);
      product = complexMul(product, l);
    }
    return product[0];
  })();

  // Visualize the tug of war
  $: characterContributions = characters.map((chi, i) => {
    const l = lFunction(sValue, chi, 1000);
    return {
      label: chi.label,
      value: l[0],
      isPrincipal: chi.isPrincipal,
      logValue: chi.isPrincipal ? Math.log(complexAbs(l)) : Math.log(Math.max(0.01, complexAbs(l)))
    };
  });

  const plotWidth = 600;
  const plotHeight = 200;
  const margin = { left: 50, right: 20, top: 20, bottom: 40 };
  const pw = plotWidth - margin.left - margin.right;
  const ph = plotHeight - margin.top - margin.bottom;

  $: yMax = Math.max(5, ...productValues.map(v => Math.min(20, v.value)));
  $: xScale = (s) => margin.left + ((s - 1.05) / (4 - 1.05)) * pw;
  $: yScale = (v) => margin.top + ph - (Math.min(v, yMax) / yMax) * ph;

  const charColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444'];
</script>

<Section id="nonvanishing" title="The Heart of the Proof" subtitle="Why L(1, χ) can never be zero — the final piece of the puzzle.">

  <p>We've established that Dirichlet's theorem is true <em>if</em> no L-function vanishes at
  <Tex tex="s = 1" /> (for non-principal characters). Now we need to prove this can't happen.</p>

  <p>This is the deepest part of the proof. The argument is a beautiful proof by contradiction.</p>

  <h3>The product trick</h3>

  <p>Take all the L-functions and multiply them together:</p>

  <Tex display tex="\prod_\chi L(s, \chi)" />

  <p>This product has a remarkable property: when you expand it as a sum <Tex tex="\sum a_n / n^s" />,
  all the coefficients <Tex tex="a_n" /> are <strong>non-negative</strong>. Why? Because the orthogonality
  of characters means this product only "counts" prime powers that are
  <Tex tex="\equiv 1 \pmod{'{q}'}" /> — and counting is always non-negative!</p>

  <p>Since all coefficients are non-negative and the first coefficient is 1, the product is
  <strong>always at least 1</strong> for real <Tex tex="s > 1" />.</p>

  <div class="viz-container">
    <h4>Product of all L-functions mod {q}</h4>
    <Slider label="Modulus (q)" bind:value={q} min={3} max={7} />
    <Slider label="s" bind:value={sValue} min={1.05} max={4} step={0.05} format={v => v.toFixed(2)} />

    <svg viewBox="0 0 {plotWidth} {plotHeight}" preserveAspectRatio="xMidYMid meet" class="product-plot">
      <!-- y=1 line -->
      <line
        x1={margin.left} y1={yScale(1)}
        x2={plotWidth - margin.right} y2={yScale(1)}
        stroke="var(--color-prime)" stroke-width="1" stroke-dasharray="5,3" opacity="0.5"
      />
      <text x={margin.left - 5} y={yScale(1)} text-anchor="end" dominant-baseline="central"
        font-size="10" font-family="var(--font-mono)" fill="var(--color-prime)">1</text>

      <!-- Axes -->
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={margin.top + ph}
        stroke="var(--color-border)" stroke-width="1" />
      <line x1={margin.left} y1={margin.top + ph} x2={plotWidth - margin.right} y2={margin.top + ph}
        stroke="var(--color-border)" stroke-width="1" />
      <text x={plotWidth / 2} y={plotHeight - 5} text-anchor="middle" font-size="11" fill="var(--color-text-muted)">s</text>

      <!-- Product curve -->
      <path
        d={productValues.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(v.s)},${yScale(Math.max(0, v.value))}`).join(' ')}
        fill="none" stroke="var(--color-accent)" stroke-width="2.5"
      />

      <!-- Current s marker -->
      <line x1={xScale(sValue)} y1={margin.top} x2={xScale(sValue)} y2={margin.top + ph}
        stroke="var(--color-text)" stroke-width="1" stroke-dasharray="4,3" opacity="0.3" />
      <circle cx={xScale(sValue)} cy={yScale(Math.max(0, Math.min(yMax, currentProduct)))}
        r="5" fill="var(--color-accent)" stroke="white" stroke-width="2" />
    </svg>

    <p class="product-value">
      <Tex tex="\prod_\chi L({sValue.toFixed(2)}, \chi)" /> = <strong>{currentProduct.toFixed(3)}</strong>
      {#if currentProduct >= 0.99}
        <span class="check-yes">&ge; 1 &#10003;</span>
      {/if}
    </p>
  </div>

  <h3>The contradiction for complex characters</h3>

  <p>The principal character <Tex tex="\chi_0" /> contributes a <strong>pole</strong> (explosion) at
  <Tex tex="s = 1" /> — one simple pole pushing the product toward infinity.</p>

  <p>Now suppose some complex character <Tex tex="\chi_1" /> had <Tex tex="L(1, \chi_1) = 0" />.
  Since <Tex tex="\chi_1" /> is complex, its conjugate <Tex tex="\overline{'{\\chi_1}'}" /> is a
  different character, and it would also have <Tex tex="L(1, \overline{'{\\chi_1}'}) = 0" />.
  That's <strong>two zeros</strong>.</p>

  <div class="tug-of-war">
    <div class="tow-side pole-side">
      <div class="tow-label">1 pole from <Tex tex="\chi_0" /></div>
      <div class="tow-arrow">&#x2191; Pushes UP</div>
    </div>
    <div class="tow-vs">vs</div>
    <div class="tow-side zero-side">
      <div class="tow-label">2 zeros from <Tex tex="\chi_1, \overline{'{\\chi_1}'}" /></div>
      <div class="tow-arrow">&#x2193; Pushes DOWN</div>
    </div>
  </div>

  <p>Two zeros beat one pole: the product would be forced to zero or negative near <Tex tex="s = 1" />.
  But we proved the product is <strong>always &ge; 1</strong>. Contradiction!</p>

  <Callout type="insight">
    <p><strong>For complex characters:</strong> <Tex tex="L(1, \chi) \neq 0" /> because a zero
    would always come in pairs (with the conjugate), creating two zeros that overpower
    the single pole — impossible when the product must stay &ge; 1.</p>
  </Callout>

  <h3>The subtle case: real characters</h3>

  <p>A <strong>real character</strong> equals its own conjugate (<Tex tex="\chi = \overline{'{\\chi}'}" />),
  so a zero would only count once — exactly matching the one pole.
  The product argument alone isn't enough!</p>

  <p>Dirichlet needed a subtler idea. Consider just <Tex tex="\zeta(s) \cdot L(s, \chi)" />
  for a real character <Tex tex="\chi" />. This product also has non-negative coefficients.
  If <Tex tex="L(1, \chi) = 0" />, the zero would cancel the pole from <Tex tex="\zeta" />,
  making the product analytic (well-behaved) everywhere for <Tex tex="s > 0" />.</p>

  <p>But here's the catch: the non-negative coefficients include terms like
  <Tex tex="1/m^{'{2s}'}" /> for every integer <Tex tex="m" /> coprime to <Tex tex="q" />.
  As <Tex tex="s \to 1/2" />, these terms alone diverge to infinity.
  A well-behaved function can't diverge — <strong>contradiction</strong>!</p>

  <Callout>
    <p><strong>In short:</strong> If <Tex tex="L(1, \chi) = 0" /> for a real character, then
    <Tex tex="\zeta(s) L(s, \chi)" /> would have to be both "well-behaved" (analytic)
    and "explosive" (divergent) at <Tex tex="s = 1/2" />. That's impossible.
    So <Tex tex="L(1, \chi) \neq 0" /> for real characters too.</p>
  </Callout>

  <p>And with that, every piece is in place. Let's see the full picture.</p>

</Section>

<style>
  .product-plot {
    width: 100%;
    height: auto;
  }

  .product-value {
    text-align: center;
    font-size: 1rem;
    margin-top: 0.5em;
  }

  .product-value strong {
    font-family: var(--font-mono);
    color: var(--color-accent);
    font-size: 1.1rem;
  }

  .check-yes {
    color: #22c55e;
    font-weight: 600;
    margin-left: 0.3em;
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
</style>
