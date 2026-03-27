<script>
  import Section from '../components/layout/Section.svelte';
  import Tex from '../components/Tex.svelte';
  import Callout from '../components/ui/Callout.svelte';
  import FactorTree from '../components/viz/FactorTree.svelte';
  import PrimeDensityPlot from '../components/viz/PrimeDensityPlot.svelte';
  import Slider from '../components/ui/Slider.svelte';
  import { isPrime, listPrimes } from '../lib/primes.js';
  import { factorize } from '../lib/math-utils.js';

  let treeNumber = 60;
  let euclidPrimes = [2, 3, 5];
  let densityMax = 10000;

  // Use BigInt to avoid overflow for large products
  $: productBig = euclidPrimes.reduce((a, b) => a * BigInt(b), 1n);
  $: plusOneBig = productBig + 1n;
  $: productStr = productBig.toLocaleString();
  $: plusOneStr = plusOneBig.toLocaleString();

  // Factorize using BigInt-safe trial division
  function factorizeBig(n) {
    const factors = [];
    let d = 2n;
    while (d * d <= n) {
      while (n % d === 0n) {
        factors.push(Number(d));
        n = n / d;
      }
      d++;
    }
    if (n > 1n) factors.push(Number(n));
    return factors;
  }

  $: plusOneFactors = factorizeBig(plusOneBig);
  $: newPrime = plusOneFactors.find(f => !euclidPrimes.includes(f));

  function addPrime() {
    if (newPrime && !euclidPrimes.includes(newPrime)) {
      euclidPrimes = [...euclidPrimes, newPrime].sort((a, b) => a - b);
    }
  }
</script>

<Section id="primes" title="Primes — The Atoms of Numbers" subtitle="Every whole number is built from primes, and there are infinitely many of them.">

  <p>A <strong>prime number</strong> is a whole number greater than 1 that can only be divided evenly
  by 1 and itself. The first few primes are: <span class="prime-number">2, 3, 5, 7, 11, 13, 17, 19, 23, ...</span></p>

  <p>Why "atoms"? Because every whole number can be broken down into a product of primes,
  and that breakdown is <em>unique</em>. For example, <span class="number">60 = 2 &times; 2 &times; 3 &times; 5</span>.
  Try clicking the numbers below to break them apart:</p>

  <div class="viz-container">
    <h4>Factor Tree — click numbers to split them</h4>
    <div class="slider-row">
      <label>Number:</label>
      <input type="number" bind:value={treeNumber} min="2" max="500" class="number-input" />
    </div>
    <FactorTree startNumber={treeNumber} />
  </div>

  <Callout type="insight">
    <p><strong>The Fundamental Theorem of Arithmetic:</strong> Every whole number greater than 1
    can be written as a product of primes in <em>exactly one way</em> (ignoring order).
    For example, 60 = 2 × 2 × 3 × 5 — and there is no other way to factor it.
    This uniqueness is the foundation for everything that follows. It's the reason the
    Euler product works (Section 5), and it's why primes truly are the "atoms" of numbers.</p>
  </Callout>

  <h3>Are there infinitely many primes?</h3>

  <p>Yes! This was proven over 2,000 years ago by the Greek mathematician <strong>Euclid</strong>.
  His argument is wonderfully clever:</p>

  <Callout type="insight">
    <p><strong>Euclid's Argument:</strong> Suppose you think you have a complete list of all primes.
    Multiply them all together and add 1. None of the primes on your list can divide this new number
    evenly (there's always a remainder of 1). So this new number must have a prime factor
    not on your list — contradiction! There must always be more primes.</p>
  </Callout>

  <div class="viz-container">
    <h4>Euclid's argument in action</h4>
    <p>Your "complete" list of primes: <strong class="prime-number">{euclidPrimes.join(' × ')}</strong></p>
    <p>Product: <span class="number">{euclidPrimes.join(' × ')} = {productStr}</span></p>
    <p>Product + 1 = <span class="number">{plusOneStr}</span></p>
    <p>
      None of your listed primes divide {plusOneStr} evenly!
      {#if plusOneFactors.length > 0}
        Its prime factors are: <strong class="prime-number">{plusOneFactors.join(', ')}</strong>
      {/if}
    </p>
    {#if newPrime}
      <button class="add-prime-btn" on:click={addPrime}>
        Add {newPrime} to the list and try again
      </button>
    {/if}
  </div>

  <h3>Primes thin out, but never stop</h3>

  <p>As numbers get bigger, primes become rarer. But they never disappear entirely.
  The gold curve below shows the <em>fraction</em> of numbers up to <em>n</em> that are prime.
  It keeps dropping — but never reaches zero. Hover to see exact counts.</p>

  <p>Remarkably, there's a simple prediction for how fast primes thin out: near <em>n</em>,
  about <strong>1 out of every ln(<em>n</em>)</strong> numbers is prime (where ln is the natural logarithm).
  This is the <strong>Prime Number Theorem</strong>, and you can see the predicted curve
  (dashed blue) closely tracking the real data.</p>

  <div class="viz-container">
    <h4>Prime density — what fraction of numbers up to n are prime?</h4>
    <Slider label="Range" bind:value={densityMax} min={100} max={100000} step={100}
      format={v => v >= 1000 ? (v/1000) + 'k' : v} />
    <PrimeDensityPlot maxN={densityMax} />
  </div>

  <Callout>
    <p><strong>The big question:</strong> Primes are infinite — but are they spread out <em>evenly</em>?
    What if we only look at certain kinds of numbers? That's what we'll explore next.</p>
  </Callout>

</Section>

<style>
  .number-input {
    font-family: var(--font-mono);
    font-size: 0.9rem;
    width: 80px;
    padding: 0.3em 0.5em;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    text-align: center;
  }

  .add-prime-btn {
    font-family: var(--font-serif);
    font-size: 0.95rem;
    padding: 0.5em 1.2em;
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    margin-top: 0.5em;
    transition: background 0.15s ease;
  }

  .add-prime-btn:hover {
    background: #1d4ed8;
  }

  /* density plot styles are in the PrimeDensityPlot component */
</style>
