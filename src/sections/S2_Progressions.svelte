<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import NumberGrid from '../components/viz/NumberGrid.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { gcd, coprimeResidues, totient } from '../lib/math-utils.js';

  let q = 6;
  let highlightResidue = 1;

  $: residues = coprimeResidues(q);
  $: phi = totient(q);

  // When q changes, reset highlight to first coprime residue
  $: {
    q;
    const cr = coprimeResidues(q);
    if (!cr.includes(highlightResidue)) {
      highlightResidue = cr[0] || 1;
    }
  }
</script>

<Section id="progressions" title="Patterns in Primes" subtitle="What happens when we look for primes in evenly-spaced sequences?">

  <p>An <strong>arithmetic progression</strong> is a sequence of numbers with a constant step size.
  For example, starting at 3 and stepping by 4 gives: <span class="number">3, 7, 11, 15, 19, 23, ...</span></p>

  <p>Here's a powerful way to see them: arrange all numbers in a grid with
  <Tex tex="q" /> columns. Each column contains numbers that share the same <strong>remainder</strong> when divided by <Tex tex="q" />.
  Mathematicians call each column a <strong>residue class</strong> — it's the set of all numbers
  with a given remainder. For example, with <Tex tex="q = 6" />, the "remainder 1" class
  is {'{'}1, 7, 13, 19, 25, ...{'}'} — all numbers that leave remainder 1 when divided by 6.
  The primes are highlighted — notice which columns they appear in!</p>

  <div class="viz-container">
    <h4>Number grid — primes in the columns of mod q</h4>
    <Slider label="Columns (q)" bind:value={q} min={2} max={12} />

    <div class="residue-picker">
      <label>Highlight column:</label>
      <div class="residue-buttons">
        {#each Array(q) as _, i}
          {@const r = (i + 1) % q === 0 ? q : (i + 1) % q}
          {@const isCoprime = gcd(r, q) === 1}
          <button
            class:active={highlightResidue === r}
            class:coprime={isCoprime}
            class:not-coprime={!isCoprime}
            on:click={() => highlightResidue = r}
          >
            {r % q}
          </button>
        {/each}
      </div>
    </div>

    <NumberGrid {q} maxN={q * 15} {highlightResidue} />

    <div class="column-info">
      {#if gcd(highlightResidue, q) === 1}
        <p>Column <strong>{highlightResidue}</strong> shares no common factor with {q} — it <span class="prime-number">can contain primes</span>!</p>
      {:else}
        <p>Column <strong>{highlightResidue}</strong> shares a factor of <strong>{gcd(highlightResidue, q)}</strong> with {q} — every number here is divisible by {gcd(highlightResidue, q)}, so <em>no primes</em> (except possibly {gcd(highlightResidue, q)} itself).</p>
      {/if}
    </div>
  </div>

  <h3>The key observation</h3>

  <p>Look at the grid carefully. Primes only appear in the columns where the column number
  shares <strong>no common factor</strong> with <Tex tex="q" />. Mathematicians say these numbers
  are <strong>coprime</strong> to <Tex tex="q" />.</p>

  <Callout>
    <p><strong>Why some columns can never have primes:</strong> If a column's remainder shares a
    factor <Tex tex="d > 1" /> with <Tex tex="q" />, then <em>every</em> number in that column is divisible
    by <Tex tex="d" />. Why? Because all numbers in the column differ by multiples of <Tex tex="q" />,
    and <Tex tex="d" /> divides <Tex tex="q" />, so they all have the same remainder when divided
    by <Tex tex="d" />. A number divisible by <Tex tex="d > 1" /> can only be prime if it equals <Tex tex="d" /> itself.
    So these columns are essentially prime-free.</p>
  </Callout>

  <h3>Counting the coprime columns: Euler's totient function</h3>

  <p>How many "prime-friendly" columns are there? We need to count the numbers from 1 to <Tex tex="q" />
  that share no factor with <Tex tex="q" />. This count is called <strong>Euler's totient function</strong>,
  written <Tex tex={String.raw`\varphi(q)`} />.</p>

  <div class="totient-viz">
    <div class="totient-row">
      {#each Array(q) as _, i}
        {@const n = i + 1}
        {@const cop = gcd(n, q) === 1}
        <div class="totient-cell" class:coprime={cop} class:not-coprime={!cop}>
          <span class="totient-n">{n}</span>
          {#if !cop && n < q}
            <span class="totient-factor">{gcd(n, q)} | {q}</span>
          {/if}
        </div>
      {/each}
    </div>
    <p class="totient-summary">
      <Tex tex={String.raw`\varphi(${q})`} /> = <strong>{phi}</strong>
      — the numbers <strong class="prime-number">{residues.join(', ')}</strong> share no factor with {q}.
    </p>
  </div>

  <p>Try changing <Tex tex="q" /> with the slider above and watch how <Tex tex={String.raw`\varphi(q)`} /> changes.
  When <Tex tex="q" /> is prime, almost every number is coprime to it
  (<Tex tex={String.raw`\varphi(q) = q - 1`} />).
  When <Tex tex="q" /> has many factors, fewer columns survive.</p>

  <Callout type="insight">
    <p><strong>Dirichlet's Theorem:</strong> If your starting number <Tex tex="a" /> and step size <Tex tex="q" />
    share no common factor (they are <em>coprime</em>), then the sequence <Tex tex="a, a+q, a+2q, a+3q, \ldots" />
    contains <strong>infinitely many primes</strong>.</p>
    <p>Even more amazingly, the primes are spread <em>approximately equally</em> among all the coprime columns!</p>
  </Callout>

  <p>This might seem obvious from the grid — the primes look pretty evenly scattered.
  But <em>proving</em> this is incredibly hard. You can't just check finitely many numbers;
  you need to show it works forever. Dirichlet had to invent entirely new mathematics
  to do it. Let's see how.</p>

</Section>

<style>
  .residue-picker {
    display: flex;
    align-items: center;
    gap: 0.8em;
    margin: 0.5em 0;
    flex-wrap: wrap;
  }

  .residue-picker label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .residue-buttons {
    display: flex;
    gap: 0.25em;
    flex-wrap: wrap;
  }

  .residue-buttons button {
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

  .residue-buttons button.coprime {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .residue-buttons button.not-coprime {
    color: var(--color-text-light);
    opacity: 0.6;
  }

  .residue-buttons button.active {
    background: var(--color-accent);
    color: white;
    border-color: var(--color-accent);
    font-weight: 600;
  }

  .column-info {
    margin-top: 0.5em;
    font-size: 0.9rem;
    padding: 0.5em;
    border-radius: 6px;
    background: var(--color-bg-alt);
  }

  .column-info p {
    margin: 0;
  }

  .totient-viz {
    margin: 1em 0;
    padding: 1em;
    background: white;
    border: 1px solid var(--color-border-light);
    border-radius: 10px;
  }

  .totient-row {
    display: flex;
    gap: 0.35em;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 0.6em;
  }

  .totient-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 42px;
    height: 48px;
    border-radius: 8px;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .totient-cell.coprime {
    background: var(--color-accent-light);
    border: 2px solid var(--color-accent);
  }

  .totient-cell.not-coprime {
    background: var(--color-bg-alt);
    border: 1.5px solid var(--color-border-light);
    opacity: 0.5;
  }

  .totient-n {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .totient-cell.coprime .totient-n {
    color: var(--color-accent);
  }

  .totient-cell.not-coprime .totient-n {
    color: var(--color-text-light);
  }

  .totient-factor {
    font-family: var(--font-mono);
    font-size: 0.5rem;
    color: var(--color-text-light);
  }

  .totient-summary {
    text-align: center;
    font-size: 0.9rem;
    margin: 0;
  }
</style>
