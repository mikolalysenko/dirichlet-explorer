<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import ProofMap from '../components/viz/ProofMap.svelte';
  import EquidistributionViz from '../components/viz/EquidistributionViz.svelte';
  import NumberLine from '../components/viz/NumberLine.svelte';
  import { gcd, coprimeResidues, totient } from '../lib/math-utils.js';
  import { primesInProgression } from '../lib/primes.js';

  let equiQ = 5;
  let equiMax = 1000;
  let sandboxQ = 7;
  let sandboxA = 1;

  $: sandboxResidues = coprimeResidues(sandboxQ);
  $: {
    if (!sandboxResidues.includes(sandboxA)) {
      sandboxA = sandboxResidues[0] || 1;
    }
  }
  $: sandboxPrimes = primesInProgression(sandboxA, sandboxQ, 500);
</script>

<Section id="conclusion" title="The Full Picture" subtitle="Putting all the pieces together — and seeing something beautiful.">

  <h3>The proof map</h3>

  <p>Here's how every concept we've built connects to prove Dirichlet's theorem.
  Click any box to jump back to that section.</p>

  <div class="viz-container">
    <ProofMap />
  </div>

  <h3>The argument in one paragraph</h3>

  <Callout type="insight">
    <p>Using <strong>Dirichlet characters</strong> and their <strong>orthogonality</strong>,
    we write the sum of <Tex tex="1/p^s" /> over primes in one residue class as a weighted
    combination of <Tex tex="\log L(s, \chi)" /> over all characters. The <strong>principal character's</strong>
    L-function has a pole at <Tex tex="s=1" />, making its contribution blow up.
    The <strong>non-principal characters'</strong> L-functions are all finite and nonzero at
    <Tex tex="s=1" /> (proved using the product trick and the non-negative series argument), so they stay bounded.
    The blowup from the principal character overwhelms everything else, forcing the
    sum over primes to diverge — proving there are <strong>infinitely many primes</strong>
    in every coprime residue class.</p>
  </Callout>

  <h3>The equidistribution bonus</h3>

  <p>The proof gives us something extra. The key formula says:</p>

  <Tex display tex={String.raw`\sum_{\substack{p \equiv a \pmod{q}}} \frac{1}{p^s} = \frac{1}{\varphi(q)} \log\frac{1}{s-1} + \text{bounded terms}`} />

  <p>The divergent part — <Tex tex={String.raw`\frac{1}{\varphi(q)} \log \frac{1}{s-1}`} /> — is the <strong>same</strong>
  for every coprime residue <Tex tex="a" />, because it comes entirely from the principal character
  <Tex tex="\chi_0" />, which doesn't depend on <Tex tex="a" />. The non-principal characters contribute
  bounded terms that become negligible compared to the divergence. So in the limit, each residue
  class gets exactly <Tex tex={String.raw`1/\varphi(q)`} /> of the total "prime weight" — the primes are
  <strong>equally distributed</strong> among all <Tex tex={String.raw`\varphi(q)`} /> coprime residue classes.</p>

  <p>Watch the histogram below as you increase the range — the bars become more and more equal!</p>

  <div class="viz-container">
    <h4>Equidistribution of primes mod {equiQ}</h4>
    <Slider label="Modulus (q)" bind:value={equiQ} min={3} max={12} />
    <Slider label="Primes up to" bind:value={equiMax} min={100} max={10000} step={100} format={v => v.toLocaleString()} />
    <EquidistributionViz q={equiQ} maxN={equiMax} />
  </div>

  <h3>Explore more</h3>

  <p>Play with different starting values and step sizes. Every valid combination produces
  infinitely many primes!</p>

  <div class="viz-container">
    <h4>Prime progression sandbox</h4>
    <Slider label="Step size (q)" bind:value={sandboxQ} min={2} max={20} />

    <div class="a-picker">
      <label>Start (a):</label>
      <div class="a-buttons">
        {#each sandboxResidues as r}
          <button
            class:active={sandboxA === r}
            on:click={() => sandboxA = r}
          >
            {r}
          </button>
        {/each}
      </div>
    </div>

    <NumberLine maxN={300} highlightProgression={{ a: sandboxA, q: sandboxQ }} />

    <p class="sandbox-stats">
      Primes ≡ {sandboxA} (mod {sandboxQ}) up to 500: <strong class="prime-number">{sandboxPrimes.length}</strong>
      {#if sandboxPrimes.length > 0}
        <br>First few: <span class="number">{sandboxPrimes.slice(0, 15).join(', ')}{sandboxPrimes.length > 15 ? ', ...' : ''}</span>
      {/if}
    </p>
  </div>

  <h3>Historical note</h3>

  <p><strong>Peter Gustav Lejeune Dirichlet</strong> proved this theorem in 1837, when he was 32 years old.
  To do it, he invented <em>Dirichlet characters</em> and <em>L-functions</em> — tools that
  became foundational to modern number theory.</p>

  <p>His work opened the door to many of the deepest results in mathematics:</p>

  <ul>
    <li>The <strong>Prime Number Theorem</strong> (1896) — primes near <Tex tex="N" /> occur with density <Tex tex="1/\ln N" /></li>
    <li>The <strong>Riemann Hypothesis</strong> (still unsolved!) — about the zeros of <Tex tex="\zeta(s)" /></li>
    <li>The <strong>Green-Tao Theorem</strong> (2004) — primes contain arithmetic progressions of any length</li>
  </ul>

  <Callout>
    <p>What started as a question about patterns in primes led to the creation of entirely
    new branches of mathematics. The tools Dirichlet built are still being used — and
    extended — nearly 200 years later. That's the power of a beautiful proof.</p>
  </Callout>

</Section>

<style>
  .a-picker {
    display: flex;
    align-items: center;
    gap: 0.8em;
    margin: 0.5em 0;
  }

  .a-picker label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    min-width: 80px;
    white-space: nowrap;
  }

  .a-buttons {
    display: flex;
    gap: 0.3em;
    flex-wrap: wrap;
  }

  .a-buttons button {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .a-buttons button:hover {
    border-color: var(--color-accent);
  }

  .a-buttons button.active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
    font-weight: 600;
  }

  .sandbox-stats {
    text-align: center;
    margin-top: 0.5em;
  }

  ul {
    margin: 0.5em 0 1em 1.5em;
  }

  li {
    margin-bottom: 0.3em;
  }
</style>
