<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import ModClock from '../components/viz/ModClock.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { gcd, coprimeResidues, totient } from '../lib/math-utils.js';

  let q = 12;
  let inputN = 25;
  let opA = 5;
  let opB = 7;
  let operation = 'multiply';

  $: residues = coprimeResidues(q);
  $: phi = totient(q);
  $: opResult = operation === 'multiply'
    ? (opA * opB) % q
    : (opA + opB) % q;
</script>

<Section id="modular" title="Remainder Clocks" subtitle="Numbers that wrap around — the language of patterns.">

  <p>Imagine a clock, but instead of 12 hours, it has <Tex tex="q" /> positions.
  When you count past <Tex tex="q" />, you wrap back to the start.
  The number 25 on a 12-hour clock? That's position 1 (since 25 = 2×12 + <strong>1</strong>).</p>

  <p>This is <strong>modular arithmetic</strong> — the math of remainders. We write
  <Tex tex="25 \equiv 1 \pmod{12}" /> and say "25 is congruent to 1 mod 12."</p>

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

  <h3>Clock arithmetic</h3>

  <p>You can add and multiply on the clock — just do the operation and take the remainder.
  Something magical happens with the coprime positions: when you multiply two coprime positions,
  you <em>always</em> land on another coprime position!</p>

  <p><strong>Why?</strong> Suppose <Tex tex="a" /> and <Tex tex="b" /> both share no factor with <Tex tex="q" />.
  Could their product <Tex tex="a \cdot b" /> share a factor with <Tex tex="q" />?
  If some prime <Tex tex="p" /> divided both <Tex tex="a \cdot b" /> and <Tex tex="q" />,
  then <Tex tex="p" /> would have to divide <Tex tex="a" /> or <Tex tex="b" />
  (that's what primes do — they can't divide a product without dividing at least one factor).
  But that contradicts <Tex tex="a" /> and <Tex tex="b" /> being coprime to <Tex tex="q" />.
  So <Tex tex="a \cdot b" /> must be coprime to <Tex tex="q" /> too.</p>

  <div class="viz-container">
    <h4>Multiply on the clock</h4>

    <div class="op-controls">
      <div class="op-row">
        <input type="number" bind:value={opA} min={1} max={q - 1} class="number-input" />
        <select bind:value={operation} class="op-select">
          <option value="multiply">×</option>
          <option value="add">+</option>
        </select>
        <input type="number" bind:value={opB} min={1} max={q - 1} class="number-input" />
        <span class="op-equals">≡</span>
        <span class="op-result number">{opResult}</span>
        <span class="op-mod">(mod {q})</span>
      </div>
      <div class="coprime-check">
        {#if gcd(opA, q) === 1 && gcd(opB, q) === 1}
          <span class="check-yes">Both inputs are coprime to {q}, and the result ({opResult}) is {gcd(opResult, q) === 1 ? 'also coprime!' : 'too.'}</span>
        {:else}
          <span class="check-no">At least one input shares a factor with {q}.</span>
        {/if}
      </div>
    </div>

    <ModClock {q} highlightN={opA} operationResult={opResult} showCoprime={true} />
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

  .number-input {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    width: 60px;
    padding: 0.3em 0.5em;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    text-align: center;
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

  .op-controls {
    margin-bottom: 1em;
  }

  .op-row {
    display: flex;
    align-items: center;
    gap: 0.5em;
    flex-wrap: wrap;
    margin-bottom: 0.5em;
  }

  .op-select {
    font-family: var(--font-mono);
    font-size: 1rem;
    padding: 0.3em;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: white;
  }

  .op-equals {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    color: var(--color-text-muted);
  }

  .op-result {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--color-accent);
  }

  .op-mod {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-text-light);
  }

  .coprime-check {
    font-size: 0.85rem;
  }

  .check-yes {
    color: var(--color-accent);
  }

  .check-no {
    color: var(--color-text-muted);
  }
</style>
