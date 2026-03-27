<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import LFunctionPlot from '../components/viz/LFunctionPlot.svelte';
  import EulerProductViz from '../components/viz/EulerProductViz.svelte';
  import EulerSieveViz from '../components/viz/EulerSieveViz.svelte';
  import EulerMultiplyViz from '../components/viz/EulerMultiplyViz.svelte';
  import GeometricSeriesViz from '../components/viz/GeometricSeriesViz.svelte';
  import { zetaPartial } from '../lib/lfunctions.js';
  import { listPrimes } from '../lib/primes.js';

  let sValue = 2.0;
  let numTerms = 50;
  let eulerS = 2;
  let eulerPrimes = 5;
  let plotQ = 5;
  let plotS = 2.0;
  let primesOnly = false;

  $: allPrimes = listPrimes(200);
  $: primeSet = new Set(allPrimes);

  // Harmonic / prime reciprocal bars
  $: harmonicBars = (() => {
    const bars = [];
    for (let n = 1; n <= numTerms; n++) {
      if (primesOnly && !primeSet.has(n)) continue;
      bars.push({ n, value: 1 / n, isPrime: primeSet.has(n) });
    }
    return bars;
  })();
  $: harmonicMax = harmonicBars.length > 0 ? Math.max(...harmonicBars.map(b => b.value)) : 1;
  $: harmonicSum = harmonicBars.reduce((s, b) => s + b.value, 0);

  // S-dial bars
  $: sBars = (() => {
    const bars = [];
    for (let n = 1; n <= 30; n++) {
      if (primesOnly && !primeSet.has(n)) continue;
      bars.push({ n, value: Math.pow(n, -sValue), isPrime: primeSet.has(n) });
    }
    return bars;
  })();
  $: sMax = sBars.length > 0 ? Math.max(...sBars.map(b => b.value)) : 1;

  $: sSumRaw = (() => {
    if (sValue <= 1.0) return Infinity;
    let sum = 0;
    for (let n = 1; n <= 5000; n++) {
      if (primesOnly && !primeSet.has(n) && n > 200) continue;
      if (primesOnly && !primeSet.has(n)) continue;
      sum += Math.pow(n, -sValue);
    }
    return sum;
  })();
  $: sSum = !isFinite(sSumRaw)
    ? '∞'
    : sSumRaw > 1000
      ? sSumRaw.toFixed(0)
      : sSumRaw > 100
        ? sSumRaw.toFixed(1)
        : sSumRaw.toFixed(4);

  // SVG chart dimensions
  const chartW = 660;
  const chartH = 160;
  const chartM = { left: 8, right: 8, top: 4, bottom: 18 };
  const chartInnerH = chartH - chartM.top - chartM.bottom;
</script>

<Section id="lfunctions" title="The Prime-Counting Machine" subtitle="L-functions: the tool that connects sums over numbers to products over primes.">

  <h3>Infinite sums that grow forever</h3>

  <p>Consider adding up the fractions <Tex tex={String.raw`\frac{1}{1} + \frac{1}{2} + \frac{1}{3} + \frac{1}{4} + \cdots`} />
  This is the <em>harmonic series</em>. Each term gets smaller, but the sum grows
  without bound — it eventually exceeds any number you can name!</p>

  <div class="viz-container">
    <h4>The harmonic series — it never stops growing</h4>
    <Slider label="# of terms" bind:value={numTerms} min={5} max={100} step={5} format={v => v} />

    <div class="chart-toggle">
      <button class:active={!primesOnly} on:click={() => primesOnly = false}>All numbers (1/n)</button>
      <button class:active={primesOnly} on:click={() => primesOnly = true}>Primes only (1/p)</button>
    </div>

    <svg viewBox="0 0 {chartW} {chartH}" preserveAspectRatio="xMidYMid meet" class="bar-svg">
      {#each harmonicBars as bar, i}
        {@const barW = Math.max(2, (chartW - chartM.left - chartM.right) / harmonicBars.length - 1.5)}
        {@const barH = (bar.value / harmonicMax) * chartInnerH}
        {@const x = chartM.left + i * ((chartW - chartM.left - chartM.right) / harmonicBars.length)}
        {@const y = chartM.top + chartInnerH - barH}
        <rect
          {x} {y} width={barW} height={barH}
          fill={bar.isPrime ? 'var(--color-prime-bg)' : 'var(--color-accent-light)'}
          stroke={bar.isPrime ? 'var(--color-prime)' : 'var(--color-accent)'}
          stroke-width="0.5"
          rx="1"
        />
        {#if harmonicBars.length <= 40 || bar.n % 5 === 0 || bar.n === 1}
          <text
            x={x + barW / 2} y={chartH - 3}
            text-anchor="middle" font-size={harmonicBars.length > 50 ? '5' : '7'}
            font-family="var(--font-mono)"
            fill={bar.isPrime ? 'var(--color-prime)' : 'var(--color-text-light)'}
            font-weight={bar.isPrime ? '600' : '400'}
          >{bar.n}</text>
        {/if}
      {/each}
    </svg>

    <p class="sum-display">
      {#if primesOnly}
        Sum of 1/p for primes up to {numTerms}: <strong>{harmonicSum.toFixed(3)}</strong>
      {:else}
        Sum of first {numTerms} terms: <strong>{harmonicSum.toFixed(3)}</strong>
      {/if}
      <span class="note">(slowly but surely heading to infinity)</span>
    </p>
  </div>

  <p>Here's a remarkable fact Euler discovered: <strong>the sum of <Tex tex="1/p" /> over just
  the primes also goes to infinity</strong>. Toggle "Primes only" above to see it —
  the bars are sparser, the sum grows more slowly, but it never stops.
  This is another way to prove there are infinitely many primes.</p>

  <h3>The s-dial: controlling the speed</h3>

  <p>What if instead of <Tex tex="1/n" />, we use <Tex tex="1/n^s" /> for some number <Tex tex="s" />?
  When <Tex tex="s" /> is large, the terms shrink fast and the sum converges (settles down to a finite value).
  When <Tex tex="s" /> is close to 1, the terms shrink slowly and the sum grows huge.
  At <Tex tex="s = 1" /> and below, the sum diverges — it heads to infinity.</p>

  <div class="viz-container">
    <h4>The s-dial — turn it to control convergence</h4>
    <Slider label="s" bind:value={sValue} min={0.5} max={4} step={0.01} format={v => v.toFixed(2)} />

    <svg viewBox="0 0 {chartW} {chartH}" preserveAspectRatio="xMidYMid meet" class="bar-svg">
      {#each sBars as bar, i}
        {@const barW = Math.max(2, (chartW - chartM.left - chartM.right) / sBars.length - 1.5)}
        {@const barH = sMax > 0 ? (bar.value / sMax) * chartInnerH : 0}
        {@const x = chartM.left + i * ((chartW - chartM.left - chartM.right) / sBars.length)}
        {@const y = chartM.top + chartInnerH - barH}
        <rect
          {x} {y} width={barW} height={barH}
          fill={bar.isPrime ? 'var(--color-prime-bg)' : 'var(--color-prime-bg)'}
          stroke="var(--color-prime)"
          stroke-width="0.5"
          rx="1"
        />
        {#if sBars.length <= 30 || bar.n % 5 === 0}
          <text
            x={x + barW / 2} y={chartH - 3}
            text-anchor="middle" font-size="7"
            font-family="var(--font-mono)"
            fill="var(--color-text-light)"
          >{bar.n}</text>
        {/if}
      {/each}
    </svg>

    <p class="sum-display">
      <Tex tex={`\\sum 1/${primesOnly ? 'p' : 'n'}^{${sValue === Math.round(sValue) ? sValue : sValue.toFixed(2)}}`} /> ≈ <strong>{sSum}</strong>
      {#if sValue <= 1.0}
        <span class="note explosion">Diverges! (s ≤ 1)</span>
      {:else if sValue < 1.1}
        <span class="note explosion">Enormous — approaching the pole</span>
      {:else if sValue < 1.5}
        <span class="note">Large but finite</span>
      {:else}
        <span class="note">Nicely convergent</span>
      {/if}
    </p>
  </div>

  <p>The function <Tex tex="\zeta(s) = \sum_n 1/n^s" /> is called the <strong>Riemann zeta function</strong>.
  It has a "pole" (explosion) at <Tex tex="s = 1" />: the sum diverges for <Tex tex="s \le 1" />
  and converges for <Tex tex="s > 1" />. The closer <Tex tex="s" /> gets to 1 from above, the larger
  the sum becomes.</p>

  <h3>Euler's miracle: sums equal products</h3>

  <p>Here's Euler's astonishing discovery from 1737. The sum over <em>all</em> numbers can be rewritten
  as a <em>product</em> over just the <em>primes</em>:</p>

  <Tex display tex={String.raw`\sum_{n=1}^{\infty} \frac{1}{n^s} = \prod_{p \text{ prime}} \frac{1}{1 - p^{-s}}`} />

  <p>This is remarkable — the left side adds up a term for every integer, while the right
  side only involves primes. Why are they equal? Let's prove it step by step.</p>

  <h4>Step 1: A geometric series for each prime</h4>

  <p>The key ingredient is the <strong>geometric series formula</strong>:</p>

  <Tex display tex={String.raw`1 + r + r^2 + r^3 + \cdots = \frac{1}{1-r} \qquad \text{(when } |r| < 1\text{)}`} />

  <p>Why does this work? Here's a slick trick. Call the sum <strong>S</strong>. If you multiply
  <strong>S</strong> by <strong>r</strong>, you get the same series shifted over by one position.
  Subtract: every term cancels except the first one, giving <Tex tex="S - rS = 1" />,
  so <Tex tex={String.raw`S = \frac{1}{1-r}`} />.</p>

  <div class="viz-container">
    <h4>The geometric series — drag r to see it converge</h4>
    <GeometricSeriesViz r={0.5} />
  </div>

  <p>For a prime <Tex tex="p" />, plugging in <Tex tex={String.raw`r = 1/p^s`} /> gives:</p>

  <Tex display tex={String.raw`\frac{1}{1 - p^{-s}} = 1 + \frac{1}{p^s} + \frac{1}{p^{2s}} + \frac{1}{p^{3s}} + \cdots`} />

  <p>Each factor in the Euler product is just a geometric series for one prime!</p>

  <h4>Step 2: Multiply two geometric series</h4>

  <p>Now multiply the series for <Tex tex="p = 2" /> and <Tex tex="p = 3" />:</p>

  <Tex display tex={String.raw`\left(1 + \frac{1}{2^s} + \frac{1}{4^s} + \frac{1}{8^s} + \cdots\right)\left(1 + \frac{1}{3^s} + \frac{1}{9^s} + \frac{1}{27^s} + \cdots\right)`} />

  <p>When you expand this product, each term picks one power of 2 and one power of 3, giving
  <Tex tex={String.raw`\frac{1}{(2^a \cdot 3^b)^s}`} /> for every choice of <Tex tex={String.raw`a \ge 0, b \ge 0`} />.
  The numbers <Tex tex={String.raw`2^a \cdot 3^b`} /> are exactly the integers whose only prime factors
  are 2 and 3: <span class="number">1, 2, 3, 4, 6, 8, 9, 12, 16, 18, 24, 27, ...</span></p>

  <p>Crucially, each integer appears <strong>exactly once</strong>, because the exponents <Tex tex="(a, b)" /> are unique — this is the fundamental theorem of arithmetic!</p>

  <p>Try it below — add primes one at a time and see how the multiplication table expands.
  The columns are the terms you already have; the rows are powers of the new prime.
  Each cell is one product. The sorted list at the bottom shows every integer generated.</p>

  <div class="viz-container">
    <h4>Multiplying geometric series — add primes step by step</h4>
    <EulerMultiplyViz />
  </div>

  <h4>Step 3: Keep multiplying — every integer appears</h4>

  <p>Each new prime you multiply in generates all the integers that use that prime as a factor.
  After including all primes, every positive integer is generated exactly once.
  Use the buttons below to add primes one at a time and watch the grid fill up:</p>

  <div class="viz-container">
    <h4>The Euler sieve — adding primes one by one</h4>
    <Slider label="s" bind:value={eulerS} min={1.2} max={4} step={0.1} format={v => v.toFixed(1)} />
    <EulerSieveViz s={eulerS} maxN={36} />
  </div>

  <Callout type="insight">
    <p><strong>Why this matters:</strong> The Euler product rewrites a sum over <em>all integers</em>
    as a product over <em>just the primes</em>. This means the primes completely control the sum.
    If you understand the primes, you understand <Tex tex={String.raw`\zeta(s)`} />.
    Taking logarithms gives <Tex tex={String.raw`\log \zeta(s) \approx \sum_p 1/p^s`} /> —
    a direct link between the behavior of zeta near <Tex tex="s = 1" /> and the
    distribution of primes.</p>
  </Callout>

  <div class="viz-container">
    <h4>Each prime's contribution to the product</h4>
    <Slider label="s" bind:value={eulerS} min={1.2} max={4} step={0.1} format={v => v.toFixed(1)} />
    <Slider label="# primes" bind:value={eulerPrimes} min={1} max={10} />
    <EulerProductViz s={eulerS} numPrimes={eulerPrimes} />
  </div>

  <h3>L-functions: why weight by characters?</h3>

  <p>We now have two powerful tools:</p>
  <ul>
    <li>The <strong>Euler product</strong> connects <Tex tex={String.raw`\sum 1/n^s`} /> to primes.</li>
    <li>The <strong>character filter</strong> can pick out one residue class from all integers.</li>
  </ul>

  <p>Our goal is to count primes in one column — primes <Tex tex={String.raw`p \equiv a \pmod{q}`} />.
  The character filter does this by weighting each number <Tex tex="n" /> by the arrow <Tex tex={String.raw`\overline{\chi(a)} \chi(n)`} />,
  summed over all characters. So we naturally want to study sums like:</p>

  <Tex display tex={String.raw`\sum_{n=1}^{\infty} \frac{\chi(n)}{n^s}`} />

  <p>This is not a random definition — it's <em>exactly what you're forced to consider</em>
  when you plug the character filter into the zeta machinery. We give it a name:
  the <strong>Dirichlet L-function</strong>:</p>

  <Tex display tex={String.raw`L(s, \chi) = \sum_{n=1}^{\infty} \frac{\chi(n)}{n^s}`} />

  <p>Now here's the payoff: because characters are multiplicative
  (<Tex tex={String.raw`\chi(ab) = \chi(a)\chi(b)`} />), the same Euler product argument works.
  Each term <Tex tex={String.raw`\chi(n)/n^s`} /> factors over the prime factorization of <Tex tex="n" />,
  so the sum over all <Tex tex="n" /> becomes a product over primes:</p>

  <Tex display tex={String.raw`L(s, \chi) = \prod_{p} \frac{1}{1 - \chi(p) \, p^{-s}}`} />

  <p>This is the same miracle as before, but now each prime's factor is twisted by the
  character value <Tex tex={String.raw`\chi(p)`} /> — an arrow on the unit circle. Different
  characters weight the primes differently, and that's what lets us isolate one column.</p>

  <p>Here's what the L-functions look like for all characters mod <Tex tex="q" />.
  Drag the <Tex tex="s" /> slider toward 1 and watch what happens:</p>

  <div class="viz-container">
    <h4>L-functions for all characters mod {plotQ}</h4>
    <Slider label="Modulus (q)" bind:value={plotQ} min={3} max={8} />
    <Slider label="s" bind:value={plotS} min={1.05} max={4} step={0.05} format={v => v.toFixed(2)} />
    <LFunctionPlot q={plotQ} sValue={plotS} />
  </div>

  <h4>What happens at <Tex tex="s = 1" />?</h4>

  <p>The plot reveals a dramatic difference. The <strong>principal character</strong> <Tex tex="\chi_0" />
  (which assigns 1 to everything coprime to <Tex tex="q" />) rockets upward as <Tex tex="s \to 1" /> —
  its L-function is essentially the zeta function, so it <em>blows up</em>.
  (Because <Tex tex="\chi_0(n) = 1" /> for coprime <Tex tex="n" />, the sum is nearly
  <Tex tex="\zeta(s)" />, just missing a few terms. Removing finitely many Euler factors doesn't
  prevent the divergence.)</p>

  <p>But all the other curves stay calm. For non-principal characters, the arrows <Tex tex="\chi(n)" /> point in different directions
  and partially cancel. Within each period of <Tex tex="q" /> consecutive integers, the character
  values sum to zero — so the weighted sum doesn't pile up. The L-function stays
  <strong>finite</strong> at <Tex tex="s = 1" />.</p>

  <h3>From L-functions to counting primes</h3>

  <p>Now we connect everything. The Euler product lets us take logarithms, and the character
  filter lets us isolate one residue class. Here's the derivation in three steps:</p>

  <p><strong>Step 1: Take the log of the Euler product.</strong>
  Since <Tex tex={String.raw`L(s,\chi) = \prod_p \frac{1}{1-\chi(p)/p^s}`} />, taking logs turns the product into a sum:</p>

  <Tex display tex={String.raw`\log L(s, \chi) = \sum_{p} \sum_{k=1}^{\infty} \frac{\chi(p)^k}{k \, p^{ks}} \approx \sum_{p} \frac{\chi(p)}{p^s}`} />

  <p>(The <Tex tex="k \ge 2" /> terms are small and stay bounded — only the <Tex tex="k=1" /> terms matter.)</p>

  <p><strong>Step 2: Apply the character filter.</strong>
  Multiply both sides by <Tex tex={String.raw`\overline{\chi(a)} / \varphi(q)`} /> and sum over all characters <Tex tex="\chi" />:</p>

  <Tex display tex={String.raw`\frac{1}{\varphi(q)} \sum_{\chi} \overline{\chi(a)} \log L(s,\chi) \approx \frac{1}{\varphi(q)} \sum_{\chi} \overline{\chi(a)} \sum_{p} \frac{\chi(p)}{p^s}`} />

  <p><strong>Step 3: Swap the sums and use orthogonality.</strong>
  On the right side, for each prime <Tex tex="p" />, the inner sum
  <Tex tex={String.raw`\sum_{\chi} \overline{\chi(a)}\chi(p) / \varphi(q)`} /> is exactly the
  extraction formula from the characters section — it equals 1 when
  <Tex tex={String.raw`p \equiv a \pmod{q}`} /> and 0 otherwise. So:</p>

  <Tex display tex={String.raw`\frac{1}{\varphi(q)} \sum_{\chi} \overline{\chi(a)} \log L(s,\chi) \approx \sum_{\substack{p \equiv a \pmod{q}}} \frac{1}{p^s}`} />

  <Callout type="insight">
    <p><strong>The key formula:</strong> The sum of <Tex tex={String.raw`1/p^s`} /> over primes in one column
    equals a weighted combination of <Tex tex={String.raw`\log L(s, \chi)`} /> over all characters.
    As <Tex tex="s \to 1" />, the principal term <Tex tex={String.raw`\log L(s, \chi_0)`} /> diverges
    (because <Tex tex={String.raw`L(s,\chi_0)`} /> has a pole). The other terms stay bounded
    <strong>as long as <Tex tex={String.raw`L(1, \chi) \neq 0`} /></strong> — because
    <Tex tex={String.raw`\log L(s,\chi)`} /> stays finite when <Tex tex={String.raw`L(1,\chi)`} /> is a nonzero finite number.
    So the whole sum diverges — meaning <strong>infinitely many primes</strong> in every coprime column!</p>
    <p>Everything hinges on one question: can <Tex tex={String.raw`L(1, \chi)`} /> ever be zero?</p>
  </Callout>

</Section>

<style>
  .bar-svg {
    width: 100%;
    height: auto;
    margin: 0.5em 0;
  }

  .chart-toggle {
    display: flex;
    gap: 0.4em;
    margin-bottom: 0.3em;
  }

  .chart-toggle button {
    font-family: var(--font-serif);
    font-size: 0.78rem;
    padding: 0.3em 0.8em;
    border: 1.5px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--color-text-muted);
  }

  .chart-toggle button:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .chart-toggle button.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
    font-weight: 600;
  }

  .sum-display {
    text-align: center;
    font-size: 1rem;
  }

  .sum-display strong {
    font-family: var(--font-mono);
    color: var(--color-accent);
    font-size: 1.1rem;
  }

  .note {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-left: 0.3em;
  }

  .explosion {
    color: var(--color-prime);
    font-weight: 600;
  }
</style>
