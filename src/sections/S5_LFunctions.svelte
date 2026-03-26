<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import LFunctionPlot from '../components/viz/LFunctionPlot.svelte';
  import EulerProductViz from '../components/viz/EulerProductViz.svelte';
  import EulerSieveViz from '../components/viz/EulerSieveViz.svelte';
  import { zetaPartial } from '../lib/lfunctions.js';
  import { listPrimes } from '../lib/primes.js';

  let sValue = 2.0;
  let numTerms = 50;
  let eulerS = 2;
  let eulerPrimes = 5;
  let plotQ = 5;
  let plotS = 2.0;

  $: harmonicSum = zetaPartial(1, numTerms).toFixed(3);
  $: primes20 = listPrimes(50);
  $: primeSumTerms = primes20.slice(0, Math.min(numTerms, primes20.length));
  $: primeSum = primeSumTerms.reduce((s, p) => s + 1 / p, 0).toFixed(3);

  // Bar chart data for harmonic series
  $: harmonicBars = Array.from({ length: Math.min(numTerms, 30) }, (_, i) => ({
    n: i + 1,
    value: 1 / (i + 1)
  }));

  // Bar chart for 1/n^s
  $: sBars = Array.from({ length: 20 }, (_, i) => ({
    n: i + 1,
    value: Math.pow(i + 1, -sValue)
  }));

  $: sSumRaw = zetaPartial(sValue, 5000);
  $: sSum = sValue <= 1.0
    ? '∞'
    : sSumRaw > 1000
      ? sSumRaw.toFixed(0)
      : sSumRaw > 100
        ? sSumRaw.toFixed(1)
        : sSumRaw.toFixed(4);
</script>

<Section id="lfunctions" title="The Prime-Counting Machine" subtitle="L-functions: the tool that connects sums over numbers to products over primes.">

  <h3>Infinite sums that grow forever</h3>

  <p>Consider adding up the fractions <Tex tex={String.raw`\frac{1}{1} + \frac{1}{2} + \frac{1}{3} + \frac{1}{4} + \cdots`} />
  This is the <em>harmonic series</em>. Each term gets smaller, but the sum grows
  without bound — it eventually exceeds any number you can name!</p>

  <div class="viz-container">
    <h4>The harmonic series — it never stops growing</h4>
    <Slider label="# of terms" bind:value={numTerms} min={5} max={100} step={5} format={v => v} />

    <div class="bar-chart">
      {#each harmonicBars as bar}
        <div class="bar-col">
          <div class="bar" style="height: {bar.value * 150}px"></div>
          {#if bar.n <= 10 || bar.n % 5 === 0}
            <span class="bar-n">{bar.n}</span>
          {/if}
        </div>
      {/each}
    </div>

    <p class="sum-display">Sum of first {numTerms} terms: <strong>{harmonicSum}</strong>
    <span class="note">(slowly but surely heading to infinity)</span></p>
  </div>

  <p>Here's the remarkable fact that Euler discovered: <strong>the sum of <Tex tex="1/p" /> over just
  the primes also goes to infinity</strong>. It grows much more slowly, but it never stops.
  This is another way to prove there are infinitely many primes.</p>

  <h3>The s-dial: controlling the speed</h3>

  <p>What if instead of <Tex tex="1/n" />, we use <Tex tex="1/n^s" /> for some number <Tex tex="s" />?
  When <Tex tex="s" /> is large, the terms shrink fast and the sum converges (settles down to a finite value).
  When <Tex tex="s" /> is close to 1, the terms shrink slowly and the sum grows huge.
  At <Tex tex="s = 1" /> and below, the sum diverges — it heads to infinity.</p>

  <div class="viz-container">
    <h4>The s-dial — turn it to control convergence</h4>
    <Slider label="s" bind:value={sValue} min={0.5} max={4} step={0.01} format={v => v.toFixed(2)} />

    <div class="bar-chart">
      {#each sBars as bar}
        <div class="bar-col">
          <div class="bar s-bar" style="height: {Math.min(bar.value * 150, 160)}px"></div>
          <span class="bar-n">{bar.n}</span>
        </div>
      {/each}
    </div>

    <p class="sum-display">
      <Tex tex={`\\sum 1/n^{${sValue === Math.round(sValue) ? sValue : sValue.toFixed(2)}}`} /> ≈ <strong>{sSum}</strong>
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

  <p>Remember the geometric series formula: <Tex tex={String.raw`1 + r + r^2 + r^3 + \cdots = \frac{1}{1-r}`} /> when <Tex tex="|r| < 1" />.
  For a prime <Tex tex="p" />, plugging in <Tex tex={String.raw`r = 1/p^s`} /> gives:</p>

  <Tex display tex={String.raw`\frac{1}{1 - p^{-s}} = 1 + \frac{1}{p^s} + \frac{1}{p^{2s}} + \frac{1}{p^{3s}} + \cdots`} />

  <p>Each factor on the right side of the Euler product is an infinite sum over powers of one prime.</p>

  <h4>Step 2: Multiply two geometric series</h4>

  <p>Now multiply the series for <Tex tex="p = 2" /> and <Tex tex="p = 3" />:</p>

  <Tex display tex={String.raw`\left(1 + \frac{1}{2^s} + \frac{1}{4^s} + \frac{1}{8^s} + \cdots\right)\left(1 + \frac{1}{3^s} + \frac{1}{9^s} + \frac{1}{27^s} + \cdots\right)`} />

  <p>When you expand this product, each term picks one power of 2 and one power of 3, giving
  <Tex tex={String.raw`\frac{1}{(2^a \cdot 3^b)^s}`} /> for every choice of <Tex tex={String.raw`a \ge 0, b \ge 0`} />.
  The numbers <Tex tex={String.raw`2^a \cdot 3^b`} /> are exactly the integers whose only prime factors
  are 2 and 3: <span class="number">1, 2, 3, 4, 6, 8, 9, 12, 16, 18, 24, 27, ...</span></p>

  <p>Crucially, each integer appears <strong>exactly once</strong>, because the exponents <Tex tex="(a, b)" /> are unique — this is the fundamental theorem of arithmetic!</p>

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

  <h3>L-functions: the character-weighted machine</h3>

  <p>Now we combine our two ideas. Instead of summing <Tex tex="1/n^s" />,
  we weight each term by a character value <Tex tex="\chi(n)" />:</p>

  <Tex display tex={String.raw`L(s, \chi) = \sum_{n=1}^{\infty} \frac{\chi(n)}{n^s}`} />

  <p>Because characters are multiplicative, the Euler product still works:</p>

  <Tex display tex={String.raw`L(s, \chi) = \prod_{p} \frac{1}{1 - \chi(p) \, p^{-s}}`} />

  <p>The crucial difference: for the <strong>principal character</strong> <Tex tex="\chi_0" />
  (which assigns 1 to everything coprime to <Tex tex="q" />), the L-function is essentially
  the zeta function — it <em>blows up</em> at <Tex tex="s = 1" />.
  For all other characters, the L-function stays <strong>finite</strong> at <Tex tex="s = 1" />.</p>

  <div class="viz-container">
    <h4>L-functions for all characters mod {plotQ}</h4>
    <Slider label="Modulus (q)" bind:value={plotQ} min={3} max={8} />
    <Slider label="s" bind:value={plotS} min={1.05} max={4} step={0.05} format={v => v.toFixed(2)} />
    <LFunctionPlot q={plotQ} sValue={plotS} />
  </div>

  <Callout type="insight">
    <p><strong>The key formula:</strong> Using the character filter from the last section:</p>
    <Tex display tex={String.raw`\sum_{\substack{p \equiv a \pmod{q}}} \frac{1}{p^s} = \frac{1}{\varphi(q)} \sum_\chi \overline{\chi(a)} \log L(s, \chi) + O(1)`} />
    <p>As <Tex tex="s \to 1" />, the principal term <Tex tex="\log L(s, \chi_0)" /> diverges (heads to infinity).
    The other terms stay bounded <strong>as long as <Tex tex="L(1, \chi) \neq 0" /></strong>.
    So the whole sum diverges — meaning infinitely many primes in every coprime column!</p>
    <p>Everything hinges on one question: can <Tex tex="L(1, \chi)" /> ever be zero?</p>
  </Callout>

</Section>

<style>
  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 170px;
    margin: 1em 0 0.5em;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--color-border-light);
    overflow-x: auto;
  }

  .bar-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 16px;
    flex: 1;
  }

  .bar {
    background: var(--color-accent-light);
    border: 1px solid var(--color-accent);
    border-radius: 2px 2px 0 0;
    width: 100%;
    transition: height 0.3s ease;
  }

  .s-bar {
    background: var(--color-prime-bg);
    border-color: var(--color-prime);
  }

  .bar-n {
    font-family: var(--font-mono);
    font-size: 0.55rem;
    color: var(--color-text-light);
    margin-top: 3px;
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
