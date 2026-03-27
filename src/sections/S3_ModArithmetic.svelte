<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import ModClock from '../components/viz/ModClock.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { gcd, coprimeResidues, totient } from '../lib/math-utils.js';

  let q = 12;
  let inputN = 25;

  $: residues = coprimeResidues(q);
  $: phi = totient(q);

  // Multiplication table
  let showOnlyCoprime = false;
  let hoverCell = null; // { a, b }

  $: tableEntries = (() => {
    const entries = showOnlyCoprime ? residues : Array.from({ length: q - 1 }, (_, i) => i + 1);
    return entries;
  })();

  $: mulResult = hoverCell ? (hoverCell.a * hoverCell.b) % q : null;

  function cellColor(a, b) {
    const product = (a * b) % q;
    const aCop = gcd(a, q) === 1;
    const bCop = gcd(b, q) === 1;
    const pCop = gcd(product, q) === 1;

    if (hoverCell && hoverCell.a === a && hoverCell.b === b) return 'var(--color-accent)';
    if (!aCop || !bCop) return 'var(--color-bg-alt)';
    if (product === 1) return 'var(--color-prime-bg)'; // identity — highlight inverses
    if (pCop) return 'var(--color-accent-light)';
    return 'white';
  }

  function textColor(a, b) {
    if (hoverCell && hoverCell.a === a && hoverCell.b === b) return 'white';
    const product = (a * b) % q;
    if (product === 1) return 'var(--color-prime)';
    if (gcd(a, q) !== 1 || gcd(b, q) !== 1) return 'var(--color-text-light)';
    return 'var(--color-text)';
  }
</script>

<Section id="modular" title="Remainder Clocks" subtitle="Numbers that wrap around — the language of patterns.">

  <p>Imagine a clock, but instead of 12 hours, it has <Tex tex="q" /> positions.
  When you count past <Tex tex="q" />, you wrap back to the start.
  The number 25 on a 12-hour clock? That's position 1 (since 25 = 2×12 + <strong>1</strong>).</p>

  <p>This is <strong>modular arithmetic</strong> — the math of remainders. We write
  <Tex tex="25 \equiv 1 \pmod{12}" /> and say "25 is congruent to 1 mod 12."
  Each position on the clock is a <strong>residue class</strong> — the set of all numbers
  that land on that position. The "1" class contains 1, 13, 25, 37, ...
  (all numbers with remainder 1 when divided by 12).</p>

  <div class="viz-container">
    <h4>The mod-{q} clock</h4>
    <Slider label="Clock size (q)" bind:value={q} min={3} max={16} />

    <Slider label="Number" bind:value={inputN} min={-50} max={200} step={1} format={v => v} />
    <p class="mod-result">
      <span class="number">{inputN}</span> ≡ <strong class="number">{((inputN % q) + q) % q}</strong> (mod {q})
    </p>

    <ModClock {q} highlightN={inputN} showCoprime={true} />

    <div class="coprime-info">
      <p>The <span style="color: var(--color-accent)">blue-highlighted</span> positions are the ones <strong>coprime</strong> to {q}:
      they share no common factor with {q}.</p>
      <p>Coprime positions: <strong>{residues.join(', ')}</strong> — that's <Tex tex="\varphi({q}) = {phi}" />.</p>
    </div>
  </div>

  <h3>The multiplication table</h3>

  <p>When you multiply two coprime positions on the clock, you <em>always</em> land on another coprime position.
  The table below shows every product mod {q}. Toggle to show only the coprime entries — that's
  the <strong>group</strong> hiding inside.</p>

  <p><strong>Why closure works:</strong> Suppose <Tex tex="a" /> and <Tex tex="b" /> both share no factor with <Tex tex="q" />.
  If some prime <Tex tex="p" /> divided both <Tex tex="a \cdot b" /> and <Tex tex="q" />,
  then <Tex tex="p" /> would have to divide <Tex tex="a" /> or <Tex tex="b" />
  (primes can't divide a product without dividing at least one factor).
  That contradicts coprimality. So <Tex tex="a \cdot b" /> stays coprime to <Tex tex="q" />.</p>

  <div class="viz-container">
    <h4>Multiplication table mod {q}</h4>

    <div class="table-toggle">
      <button class:active={!showOnlyCoprime} on:click={() => showOnlyCoprime = false}>All entries</button>
      <button class:active={showOnlyCoprime} on:click={() => showOnlyCoprime = true}>Coprime only (the group)</button>
    </div>

    <div class="mul-table-scroll">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <table class="mul-table" on:mouseleave={() => hoverCell = null}>
        <thead>
          <tr>
            <th class="corner">×</th>
            {#each tableEntries as b}
              <th class:coprime-header={gcd(b, q) === 1} class:hover-col={hoverCell && hoverCell.b === b}>{b}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each tableEntries as a}
            <tr>
              <th class:coprime-header={gcd(a, q) === 1} class:hover-row={hoverCell && hoverCell.a === a}>{a}</th>
              {#each tableEntries as b}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <td
                  style="background: {cellColor(a, b)}; color: {textColor(a, b)}"
                  on:mouseenter={() => hoverCell = { a, b }}
                >
                  {(a * b) % q}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if hoverCell}
      <p class="table-readout">
        <span class="number">{hoverCell.a}</span> × <span class="number">{hoverCell.b}</span>
        ≡ <strong class="number">{mulResult}</strong> (mod {q})
        {#if mulResult === 1}
          — <span class="inverse-note">inverse pair!</span>
        {/if}
        {#if gcd(hoverCell.a, q) === 1 && gcd(hoverCell.b, q) === 1}
          {#if gcd(mulResult, q) === 1}
            <span class="closure-note">coprime × coprime = coprime ✓</span>
          {/if}
        {/if}
      </p>
    {:else}
      <p class="table-readout muted">Hover over the table to see products</p>
    {/if}

    {#if showOnlyCoprime}
      <p class="group-note">
        This {phi}×{phi} table is the <strong>multiplication table of the group</strong>
        <Tex tex={String.raw`(\mathbb{Z}/${q}\mathbb{Z})^{\times}`} />.
        Notice: every row and column contains each coprime residue exactly once
        (it's a <em>Latin square</em>). The <span class="inverse-note">gold cells</span> show
        inverse pairs where the product is 1.
      </p>
    {/if}
  </div>

  <Callout type="insight">
    <p><strong>Key insight:</strong> The coprime remainders modulo <Tex tex="q" /> form a
    <strong>group</strong> under multiplication. This means they have four nice properties:
    (1) multiplying two coprime remainders gives another coprime remainder (closure),
    (2) the number 1 acts as an identity (<Tex tex="1 \cdot a = a" />),
    (3) every element has an inverse (some <Tex tex="b" /> where <Tex tex="a \cdot b \equiv 1" /> mod <Tex tex="q" />),
    and (4) multiplication is associative.
    This group structure is exactly what Dirichlet used to build his prime-detecting tool.</p>
  </Callout>

  <p>The coprime residues don't just have nice multiplication — they have a hidden
  <em>frequency structure</em> that lets us tune into individual columns. That's what we'll discover next.</p>

</Section>

<style>
  .mod-result {
    font-family: var(--font-mono);
    font-size: 0.95rem;
    text-align: center;
    margin: 0.3em 0 0.8em;
    color: var(--color-text-muted);
  }

  .mod-result strong {
    color: var(--color-accent);
    font-size: 1.1rem;
  }

  .coprime-info {
    margin-top: 1em;
    padding: 0.8em;
    background: var(--color-bg-alt);
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .coprime-info p {
    margin-bottom: 0.3em;
  }

  .table-toggle {
    display: flex;
    gap: 0.4em;
    margin-bottom: 0.8em;
  }

  .table-toggle button {
    font-family: var(--font-serif);
    font-size: 0.8rem;
    padding: 0.35em 0.9em;
    border: 1.5px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
    color: var(--color-text-muted);
  }

  .table-toggle button:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .table-toggle button.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
    font-weight: 600;
  }

  .mul-table-scroll {
    overflow-x: auto;
    margin-bottom: 0.5em;
  }

  .mul-table {
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    margin: 0 auto;
    user-select: none;
  }

  .mul-table th, .mul-table td {
    width: 32px;
    height: 28px;
    text-align: center;
    border: 1px solid var(--color-border-light);
    padding: 0;
    transition: background 0.1s ease;
  }

  .mul-table th {
    background: var(--color-bg-alt);
    font-weight: 600;
    color: var(--color-text-muted);
    font-size: 0.75rem;
  }

  .mul-table th.coprime-header {
    color: var(--color-accent);
  }

  .mul-table th.hover-row,
  .mul-table th.hover-col {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }

  .mul-table .corner {
    color: var(--color-text-light);
    font-size: 0.9rem;
  }

  .mul-table td {
    cursor: default;
    font-weight: 500;
  }

  .table-readout {
    text-align: center;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    margin: 0.3em 0;
    min-height: 1.3em;
  }

  .table-readout.muted {
    color: var(--color-text-light);
    font-style: italic;
    font-family: var(--font-serif);
  }

  .inverse-note {
    color: var(--color-prime);
    font-weight: 600;
  }

  .closure-note {
    color: var(--color-accent);
    font-size: 0.78rem;
    margin-left: 0.3em;
  }

  .group-note {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    text-align: center;
    margin-top: 0.3em;
  }
</style>
