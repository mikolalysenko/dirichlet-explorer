<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import CharacterTable from '../components/viz/CharacterTable.svelte';
  import CharacterPhasors from '../components/viz/CharacterPhasors.svelte';
  import OrthogonalityViz from '../components/viz/OrthogonalityViz.svelte';
  import OrthogonalityAnimated from '../components/viz/OrthogonalityAnimated.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { coprimeResidues, totient } from '../lib/math-utils.js';

  let q = 5;
  let targetResidue = 2;
  let phasorMaxN = 60;

  $: residues = coprimeResidues(q);
  $: phi = totient(q);
</script>

<Section id="characters" title="Secret Signals — Dirichlet Characters" subtitle="The 'radio tuners' that let us isolate one column of primes at a time.">

  <p>Imagine that every column in our number grid is a different radio station, all
  broadcasting at once. You hear a jumble of noise. How do you tune into just one station?</p>

  <p>Dirichlet's brilliant invention was a set of special functions called <strong>characters</strong>.
  Each character assigns a "label" (a number on the unit circle in the complex plane)
  to every coprime residue. The labels obey a crucial rule:</p>

  <Tex display tex="\chi(a \cdot b) = \chi(a) \cdot \chi(b)" />

  <p>The character of a product equals the product of the characters. This <em>multiplicativity</em>
  is what connects characters to primes (since primes are all about multiplication).</p>

  <div class="viz-container">
    <h4>Character table for mod {q}</h4>
    <Slider label="Modulus (q)" bind:value={q} min={2} max={10} />

    <p class="table-note">Each cell shows a character value as an arrow on the unit circle.
    Arrows pointing right = 1, left = -1, up = <em>i</em>, down = -<em>i</em>.
    Click a row or column to highlight it.</p>

    <CharacterTable {q} />

    <p class="table-note">There are exactly <Tex tex="\varphi({q}) = {phi}" /> characters
    modulo {q} — one for each coprime residue class. The first character <Tex tex="\chi_0" /> (the "principal character")
    assigns 1 to everything. The others are more interesting.</p>
  </div>

  <h3>Characters as oscillating signals</h3>

  <p>Think of each character as a signal that oscillates as you sweep through the integers.
  The <strong>principal character</strong> <Tex tex="\chi_0" /> is the "DC component" — a flat signal
  at 1 for every coprime number. The other characters oscillate at different frequencies, just
  like the harmonics in a Fourier decomposition.</p>

  <p>Press play to watch the character phasors rotate on the complex plane as <Tex tex="n" /> advances.
  The waveforms below show each character's real part (solid) and imaginary part (dashed) as a function of <Tex tex="n" />.
  Notice how the non-principal characters oscillate while <Tex tex="\chi_0" /> stays flat.</p>

  <div class="viz-container">
    <Slider label="Range" bind:value={phasorMaxN} min={20} max={120} step={10} format={v => `n = 1..${v}`} />
    <CharacterPhasors {q} maxN={phasorMaxN} />
  </div>

  <p>At numbers that share a factor with <Tex tex="q" />, every character gives zero — these numbers
  are invisible to the character system. At coprime numbers, the phasors rotate by specific
  angles determined by the character. This periodic rotation is the key to the filtering trick below.</p>

  <h3>The magic of orthogonality</h3>

  <p>Here's where the radio analogy really works. Characters have a <em>cancellation property</em>:
  if you take all the characters, evaluate them at some number <Tex tex="m" />,
  apply the right "tuning weights," and add them up, something amazing happens:</p>

  <ul>
    <li>If <Tex tex="m" /> equals your target residue <Tex tex="a" />, all the arrows line up and you get <strong>1</strong>.</li>
    <li>If <Tex tex="m" /> is anything else, the arrows point in different directions and <strong>cancel to 0</strong>.</li>
  </ul>

  <Tex display tex="\frac{'{1}'}{'{\\varphi(q)}'} \sum_\chi \overline{'{\\chi(a)}'} \, \chi(m) = \begin{'{cases}'} 1 & \text{'{if }'} m \equiv a \pmod{'{q}'} \\ 0 & \text{'{otherwise}'} \end{'{cases}'}" />

  <p>This is the <strong>extraction formula</strong> — Dirichlet's radio tuner! Watch it in action:</p>

  <div class="viz-container">
    <h4>Orthogonality — the character filter</h4>
    <Slider label="Modulus (q)" bind:value={q} min={3} max={7} />

    <div class="target-picker">
      <label>Target residue (a):</label>
      <div class="target-buttons">
        {#each residues as r}
          <button
            class:active={targetResidue === r}
            on:click={() => targetResidue = r}
          >
            {r}
          </button>
        {/each}
      </div>
    </div>

    <p class="ortho-note">For each residue <Tex tex="m" />, we sum the weighted character values.
    The colored arrows are the individual character contributions. The dot at the end shows the total.
    Only the target residue <Tex tex="a = {targetResidue}" /> gets a nonzero result!</p>

    <OrthogonalityViz {q} {targetResidue} />
  </div>

  <h3>The inner product — step by step</h3>

  <p>To really see orthogonality in action, pick any two characters and watch their
  <strong>inner product</strong> build up term by term. For each coprime residue <Tex tex="r" />,
  we multiply one character's value by the conjugate of the other, then accumulate.
  If the characters are the same, the arrows all point right and sum to 1.
  If they're different, the arrows spiral around and cancel to 0.</p>

  <div class="viz-container">
    <h4>Animated inner product</h4>
    <OrthogonalityAnimated {q} />
  </div>

  <Callout type="insight">
    <p><strong>The power of the filter:</strong> By summing over all characters with the right
    weights, we can write a formula that picks out <em>exactly</em> the primes in one column:</p>
    <Tex display tex="\sum_{'\\substack{p \\text{ prime} \\\\ p \\equiv a \\pmod{q}}'} \frac{'{1}'}{'{p^s}'} = \frac{'{1}'}{'{\\varphi(q)}'} \sum_\chi \overline{'{\\chi(a)}'} \sum_p \frac{'{\\chi(p)}'}{'{p^s}'}" />
    <p>The left side is what we want (primes in one column). The right side breaks it into
    pieces — one for each character — that we can analyze separately.</p>
  </Callout>

  <p>Now we have our lens. But to actually use it, we need to connect characters to a
  "machine" that detects primes. That machine is the <strong>L-function</strong>.</p>

</Section>

<style>
  .table-note {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin: 0.5em 0;
  }

  .target-picker {
    display: flex;
    align-items: center;
    gap: 0.8em;
    margin: 0.5em 0;
  }

  .target-picker label {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .target-buttons {
    display: flex;
    gap: 0.3em;
  }

  .target-buttons button {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    width: 36px;
    height: 36px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .target-buttons button:hover {
    border-color: var(--color-accent);
  }

  .target-buttons button.active {
    background: var(--color-prime);
    color: white;
    border-color: var(--color-prime);
    font-weight: 600;
  }

  .ortho-note {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5em;
  }

  ul {
    margin: 0.5em 0 0.5em 1.5em;
  }

  li {
    margin-bottom: 0.3em;
  }
</style>
