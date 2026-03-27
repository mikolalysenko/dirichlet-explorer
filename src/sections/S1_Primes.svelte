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

  // Format BigInt with digit separators (no truncation, no Number conversion)
  function formatBig(n) {
    const s = n.toString();
    // Add comma separators manually to avoid Number() overflow
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  $: productStr = formatBig(productBig);
  $: plusOneStr = formatBig(plusOneBig);
  $: numDigits = productBig.toString().length;
  $: isHuge = numDigits > 20;
  $: isAbsurd = numDigits > 100;

  // Track shake animation
  let shaking = false;
  function triggerShake() {
    shaking = true;
    setTimeout(() => shaking = false, 600);
  }

  // Fast factorization for Euclid's construction.
  // Key insight: product+1 is coprime to all primes in our list, so we
  // only trial-divide by primes NOT in the list. We use the precomputed
  // sieve (primes up to 100k) which is more than enough — if a cofactor
  // remains above 100k², it must be prime.
  const trialPrimes = listPrimes(100000);

  function factorizeSmart(n, knownPrimes) {
    const known = new Set(knownPrimes.map(p => BigInt(p)));
    const factors = [];

    for (const p of trialPrimes) {
      const bp = BigInt(p);
      if (bp * bp > n) break;
      if (known.has(bp)) continue; // skip primes in our list (can't divide product+1)
      while (n % bp === 0n) {
        factors.push(p);
        n = n / bp;
      }
    }
    // If anything remains, it's a prime larger than our trial limit
    if (n > 1n) {
      // Safe to convert to Number if it fits, otherwise keep as string
      factors.push(n <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(n) : n);
    }
    return factors;
  }

  $: plusOneFactors = factorizeSmart(plusOneBig, euclidPrimes);

  function formatFactor(f) {
    return formatBig(typeof f === 'bigint' ? f : BigInt(f));
  }

  $: newPrime = plusOneFactors.find(f => {
    const num = typeof f === 'bigint' ? Number(f) : f;
    return !euclidPrimes.includes(num);
  });

  $: newPrimeIsBig = newPrime != null && String(newPrime).length > 6;

  $: canAddMore = newPrime != null && (typeof newPrime !== 'bigint' || newPrime <= BigInt(Number.MAX_SAFE_INTEGER));

  function addPrime() {
    if (newPrime == null) return;
    if (typeof newPrime === 'bigint' && newPrime > BigInt(Number.MAX_SAFE_INTEGER)) {
      triggerShake();
      return; // too big to add — the point is already made!
    }
    const num = typeof newPrime === 'bigint' ? Number(newPrime) : newPrime;
    if (!euclidPrimes.includes(num)) {
      euclidPrimes = [...euclidPrimes, num].sort((a, b) => a - b);
      if (numDigits > 30) triggerShake();
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

  <div class="viz-container euclid-box" class:shaking>
    <h4>Euclid's argument in action</h4>
    <p>Your "complete" list of primes: <strong class="prime-number">{euclidPrimes.join(' × ')}</strong></p>
    <p class="big-number-line">Product: <span class="number big-num">{euclidPrimes.join(' × ')} = {productStr}</span></p>
    <p class="big-number-line">Product + 1 = <span class="number big-num">{plusOneStr}</span></p>
    <p>
      None of your listed primes divide this evenly!
      {#if plusOneFactors.length > 0}
        Its prime factors are: <strong class="prime-number">{plusOneFactors.map(formatFactor).join(', ')}</strong>
        {#if newPrimeIsBig}
          <span class="big-prime-note">(that's a big prime!)</span>
        {/if}
      {/if}
    </p>
    {#if newPrime && canAddMore}
      <button class="add-prime-btn" on:click={addPrime}>
        Add {formatFactor(newPrime)} to the list and try again
      </button>
    {:else if newPrime && !canAddMore}
      <button class="add-prime-btn" on:click={triggerShake}>
        The new prime has {String(newPrime).length} digits — we could keep going forever!
      </button>
    {/if}
    {#if isAbsurd}
      <p class="easter-egg">
        The numbers are now so large that writing them out would fill a book.
        And yet... there are always more primes. Always.
      </p>
    {:else if isHuge}
      <p class="huge-note">
        These numbers have {numDigits} digits — far beyond what any calculator can handle.
        But Euclid's argument doesn't care how big they get!
      </p>
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

  .big-number-line {
    overflow-wrap: anywhere;
    word-break: break-all;
    line-height: 1.4;
  }

  .big-num {
    font-size: 0.8em;
    font-family: var(--font-mono);
  }

  .big-prime-note {
    font-size: 0.8rem;
    color: var(--color-text-light);
    font-style: italic;
  }

  .huge-note {
    font-size: 0.85rem;
    color: var(--color-accent);
    font-style: italic;
    text-align: center;
    margin-top: 0.5em;
  }

  .easter-egg {
    font-size: 0.9rem;
    color: var(--color-prime);
    font-weight: 500;
    text-align: center;
    margin-top: 0.5em;
    font-style: italic;
  }

  .euclid-box {
    transition: transform 0.1s ease;
  }

  .euclid-box.shaking {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10% { transform: translateX(-6px) rotate(-1deg); }
    20% { transform: translateX(5px) rotate(1deg); }
    30% { transform: translateX(-4px) rotate(-0.5deg); }
    40% { transform: translateX(4px) rotate(0.5deg); }
    50% { transform: translateX(-3px); }
    60% { transform: translateX(2px); }
    70% { transform: translateX(-1px); }
  }

  /* density plot styles are in the PrimeDensityPlot component */
</style>
