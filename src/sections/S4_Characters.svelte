<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import CharacterTable from '../components/viz/CharacterTable.svelte';
  import CharacterPhasors from '../components/viz/CharacterPhasors.svelte';
  import ComplexMultiply from '../components/viz/ComplexMultiply.svelte';
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

  <p>Dirichlet's answer required a new idea: using <strong>arrows</strong> instead of ordinary numbers.</p>

  <h3>A quick detour: arrows on a circle</h3>

  <p>You know numbers on a number line. But we can also represent a number as an <strong>arrow</strong>
  from the center of a circle — with a <em>direction</em> (angle) and a <em>length</em>.</p>

  <p>On the <strong>unit circle</strong> (radius 1), every arrow has length 1 — only the direction matters.
  An arrow at 0° points right — this represents the number <strong>1</strong>.
  An arrow at 180° points left — this is <strong>−1</strong>.
  An arrow at 90° points up, and 270° points down.</p>

  <p>Here's the key: <strong>you multiply arrows by adding their angles.</strong>
  An arrow at 90° times an arrow at 90° gives an arrow at 180° (that's <em>i</em> × <em>i</em> = −1).
  An arrow at 120° times itself three times goes 120° + 120° + 120° = 360° = back to the start (the number 1).</p>

  <p>Mathematicians call these arrows <strong>complex numbers on the unit circle</strong>, and write
  them as <Tex tex={String.raw`e^{i\theta}`} /> where <Tex tex={String.raw`\theta`} /> is the angle.
  But you can just think of them as <em>arrows that you multiply by adding angles</em>.</p>

  <p>Try it — drag the arrow tips on the two input circles below. The product on the right
  updates instantly. Notice how the product's angle is always the sum of the two input angles.
  The <em>conjugate</em> checkbox flips an arrow across the horizontal axis (negates the imaginary part)
  — this is important later for the character "filter."</p>

  <div class="viz-container">
    <h4>Complex multiplication — drag the arrows</h4>
    <ComplexMultiply />
  </div>

  <h3>Characters: labeling residues with arrows</h3>

  <p>Dirichlet's invention was a set of special functions called <strong>characters</strong>.
  Each character assigns an <em>arrow</em> (a point on the unit circle)
  to every coprime residue. The arrows obey a crucial rule:</p>

  <Tex display tex="\chi(a \cdot b) = \chi(a) \cdot \chi(b)" />

  <p>The character of a product equals the product of the characters — that is, the <em>angles add</em>.
  This <em>multiplicativity</em> is what connects characters to primes (since primes are all about multiplication).</p>

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

  <h3>Characters as rotating phasors</h3>

  <p>Each character is a <strong>complex exponential</strong> — a phasor that rotates around the
  unit circle as you sweep the input <Tex tex="x" /> from 0 to <Tex tex="q" />:</p>

  <Tex display tex={String.raw`\chi_k(x) = e^{2\pi i \cdot a_k \cdot x / q}`} />

  <p>The <strong>principal character</strong> <Tex tex="\chi_0" /> has frequency 0, so its phasor
  points right (value 1) everywhere. Each successive character has a higher frequency <Tex tex="a_k" />,
  so the phasor spins faster. The strips below show this — the arrows are the phasor at each
  point along the x-axis, and the traces show the real and imaginary parts of the swept signal.
  At the coprime integer residues (tick marks), the arrow hits the exact character value.</p>

  <div class="viz-container">
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

  <Tex display tex={String.raw`\frac{1}{\varphi(q)} \sum_\chi \overline{\chi(a)} \, \chi(m) = \begin{cases} 1 & \text{if } m \equiv a \pmod{q} \\ 0 & \text{otherwise} \end{cases}`} />

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
    <p><strong>What the filter gives us:</strong> The extraction formula is a perfect sieve —
    given <em>any</em> sum over all integers, it can pick out just the terms where
    the integer is in one specific residue class. Feed it a sum that "detects" primes,
    and you get a sum over primes in exactly one column.</p>
    <p>But we need that prime-detecting sum. Where does it come from?
    That's the next piece of the puzzle: <strong>L-functions</strong>,
    which connect sums over integers to products over primes.</p>
  </Callout>

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
