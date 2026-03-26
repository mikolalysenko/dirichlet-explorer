<script>
  import { gcd } from '../../lib/math-utils.js';
  import { isPrime } from '../../lib/primes.js';

  export let q = 12;
  export let highlightN = -1;
  export let showCoprime = true;
  export let showPrimes = false;
  export let operationResult = -1;

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;

  $: positions = Array.from({ length: q }, (_, i) => {
    const angle = (2 * Math.PI * i) / q - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const coprime = gcd(i, q) === 1 || i === 0;
    return { i, x, y, angle, coprime: i === 0 ? false : gcd(i, q) === 1 };
  });

  $: highlightResidue = highlightN >= 0 ? ((highlightN % q) + q) % q : -1;
  $: operationResidue = operationResult >= 0 ? ((operationResult % q) + q) % q : -1;

  $: handAngle = highlightResidue >= 0
    ? (2 * Math.PI * highlightResidue) / q - Math.PI / 2
    : null;

  function posColor(pos) {
    if (pos.i === operationResidue && operationResidue >= 0) return 'var(--color-char-2)';
    if (pos.i === highlightResidue) return 'var(--color-accent)';
    if (showCoprime && pos.coprime) return 'var(--color-accent-light)';
    return 'white';
  }

  function posStroke(pos) {
    if (pos.i === highlightResidue || pos.i === operationResidue) return 'var(--color-accent)';
    if (showCoprime && pos.coprime) return 'var(--color-accent)';
    return 'var(--color-border)';
  }
</script>

<div class="clock-wrapper">
  <svg width={size} height={size} viewBox="0 0 {size} {size}">
    <!-- Clock circle -->
    <circle {cx} {cy} r={radius} fill="none" stroke="var(--color-border)" stroke-width="1.5" />

    <!-- Positions -->
    {#each positions as pos}
      <circle
        cx={pos.x}
        cy={pos.y}
        r="18"
        fill={posColor(pos)}
        stroke={posStroke(pos)}
        stroke-width="1.5"
      />
      <text
        x={pos.x}
        y={pos.y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size="13"
        font-family="var(--font-mono)"
        font-weight={pos.i === highlightResidue ? '700' : '400'}
        fill={pos.i === highlightResidue ? 'white' : 'var(--color-text)'}
      >
        {pos.i}
      </text>
    {/each}

    <!-- Hand -->
    {#if handAngle !== null}
      <line
        x1={cx}
        y1={cy}
        x2={cx + (radius - 25) * Math.cos(handAngle)}
        y2={cy + (radius - 25) * Math.sin(handAngle)}
        stroke="var(--color-accent)"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <circle {cx} {cy} r="5" fill="var(--color-accent)" />
    {/if}
  </svg>
</div>

<style>
  .clock-wrapper {
    display: flex;
    justify-content: center;
  }

  circle, line {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  text {
    transition: fill 0.2s ease;
    user-select: none;
  }
</style>
