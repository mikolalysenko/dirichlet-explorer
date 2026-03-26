<script>
  import { isPrime } from '../../lib/primes.js';

  export let maxN = 100;
  export let highlightProgression = null; // { a, q }
  export let showLabels = true;

  const width = 900;
  const height = 80;
  const margin = { left: 20, right: 20, top: 15, bottom: 25 };
  const innerW = width - margin.left - margin.right;

  $: scale = (n) => margin.left + (n / maxN) * innerW;
  $: numbers = Array.from({ length: maxN }, (_, i) => i + 1);

  $: inProgression = (n) => {
    if (!highlightProgression) return false;
    const { a, q } = highlightProgression;
    return ((n - a) % q === 0) && n >= a;
  };

  function dotColor(n) {
    const inProg = inProgression(n);
    const prime = isPrime(n);
    if (inProg && prime) return 'var(--color-prime)';
    if (inProg) return 'var(--color-accent)';
    if (prime) return 'var(--color-prime-bg)';
    return 'var(--color-border)';
  }

  function dotRadius(n) {
    if (inProgression(n) && isPrime(n)) return 5;
    if (isPrime(n)) return 3.5;
    return 2;
  }
</script>

<div class="number-line-wrapper">
  <svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet">
    <!-- Axis line -->
    <line
      x1={margin.left}
      y1={margin.top + 15}
      x2={width - margin.right}
      y2={margin.top + 15}
      stroke="var(--color-border)"
      stroke-width="1"
    />

    <!-- Number dots -->
    {#each numbers as n}
      <circle
        cx={scale(n)}
        cy={margin.top + 15}
        r={dotRadius(n)}
        fill={dotColor(n)}
        opacity={inProgression(n) || isPrime(n) ? 1 : 0.4}
      />
      {#if showLabels && (isPrime(n) && inProgression(n))}
        <text
          x={scale(n)}
          y={margin.top + 35}
          text-anchor="middle"
          font-size="10"
          font-family="var(--font-mono)"
          fill="var(--color-prime)"
          font-weight="600"
        >
          {n}
        </text>
      {/if}
    {/each}

    <!-- Tick marks for multiples of 10 -->
    {#each numbers.filter(n => n % 10 === 0) as n}
      <line
        x1={scale(n)} y1={margin.top + 19}
        x2={scale(n)} y2={margin.top + 24}
        stroke="var(--color-border)"
        stroke-width="1"
      />
      <text
        x={scale(n)}
        y={height - 5}
        text-anchor="middle"
        font-size="10"
        font-family="var(--font-mono)"
        fill="var(--color-text-light)"
      >
        {n}
      </text>
    {/each}
  </svg>
</div>

<style>
  .number-line-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  svg {
    width: 100%;
    height: auto;
  }

  circle {
    transition: all 0.3s ease;
  }
</style>
