<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import LFunctionPlot from '../components/viz/LFunctionPlot.svelte';
  import EulerProductViz from '../components/viz/EulerProductViz.svelte';
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

  $: sSum = zetaPartial(sValue, 1000).toFixed(4);
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
  When <Tex tex="s" /> is close to 1, the terms shrink slowly and the sum explodes.</p>

  <div class="viz-container">
    <h4>The s-dial — turn it to control convergence</h4>
    <Slider label="s" bind:value={sValue} min={1.01} max={4} step={0.01} format={v => v.toFixed(2)} />

    <div class="bar-chart">
      {#each sBars as bar}
        <div class="bar-col">
          <div class="bar s-bar" style="height: {bar.value * 150}px"></div>
          <span class="bar-n">{bar.n}</span>
        </div>
      {/each}
    </div>

    <p class="sum-display">
      <Tex tex={`\\sum 1/n^{${sValue === Math.round(sValue) ? sValue : sValue.toFixed(2)}}`} /> ≈ <strong>{sSum}</strong>
      {#if sValue < 1.1}
        <span class="note explosion">Exploding!</span>
      {:else if sValue < 1.5}
        <span class="note">Large but finite</span>
      {:else}
        <span class="note">Nicely convergent</span>
      {/if}
    </p>
  </div>

  <p>The function <Tex tex="\zeta(s) = \sum_n 1/n^s" /> is called the <strong>Riemann zeta function</strong>.
  It has a "pole" (explosion) at <Tex tex="s = 1" />, where the harmonic series diverges.</p>

  <h3>Euler's miracle: sums equal products</h3>

  <p>Here's Euler's astonishing discovery. The sum over <em>all</em> numbers can be rewritten
  as a <em>product</em> over just the primes:</p>

  <Tex display tex={String.raw`\sum_{n=1}^{\infty} \frac{1}{n^s} = \prod_{p \text{ prime}} \frac{1}{1 - p^{-s}}`} />

  <p>This works because every number has a unique prime factorization. When you expand
  the product, you generate every number exactly once!</p>

  <div class="viz-container">
    <h4>The Euler product — each prime contributes a factor</h4>
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
