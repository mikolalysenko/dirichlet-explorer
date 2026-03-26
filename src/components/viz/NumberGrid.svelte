<script>
  import { isPrime } from '../../lib/primes.js';
  import { gcd } from '../../lib/math-utils.js';

  export let q = 6;
  export let maxN = 120;
  export let highlightResidue = -1;
  export let showPrimesOnly = false;

  const cellSize = 38;
  const padding = 2;

  $: numRows = Math.ceil(maxN / q);
  $: width = q * (cellSize + padding) + padding;
  $: height = numRows * (cellSize + padding) + padding + 30;

  $: cells = Array.from({ length: maxN }, (_, i) => {
    const n = i + 1;
    const col = ((n - 1) % q);
    const row = Math.floor((n - 1) / q);
    const residue = n % q;
    const prime = isPrime(n);
    const coprime = gcd(residue === 0 ? q : residue, q) === 1;
    const highlighted = highlightResidue >= 0 && (n % q === highlightResidue % q);
    return { n, col, row, residue, prime, coprime, highlighted };
  });

  function getCellColor(cell) {
    if (showPrimesOnly && !cell.prime) return 'var(--color-bg-alt)';
    if (cell.highlighted && cell.prime) return 'var(--color-prime)';
    if (cell.highlighted) return 'var(--color-accent-light)';
    if (cell.prime) return 'var(--color-prime-bg)';
    return 'white';
  }

  function getTextColor(cell) {
    if (showPrimesOnly && !cell.prime) return 'var(--color-border)';
    if (cell.highlighted && cell.prime) return 'white';
    if (cell.prime) return 'var(--color-prime)';
    return 'var(--color-text-muted)';
  }
</script>

<div class="grid-wrapper">
  <svg {width} {height} viewBox="0 0 {width} {height}">
    <!-- Column headers showing residue mod q -->
    {#each Array(q) as _, c}
      <text
        x={padding + c * (cellSize + padding) + cellSize / 2}
        y={16}
        text-anchor="middle"
        font-size="11"
        font-family="var(--font-mono)"
        fill={gcd(c + 1 > q ? 0 : (c + 1) % q || q, q) === 1 ? 'var(--color-accent)' : 'var(--color-text-light)'}
      >
        {(c + 1) % q === 0 ? 0 : (c + 1) % q}
      </text>
    {/each}

    <!-- Grid cells -->
    {#each cells as cell}
      <g transform="translate({padding + cell.col * (cellSize + padding)}, {28 + padding + cell.row * (cellSize + padding)})">
        <rect
          width={cellSize}
          height={cellSize}
          rx="4"
          fill={getCellColor(cell)}
          stroke={cell.highlighted ? 'var(--color-accent)' : 'var(--color-border-light)'}
          stroke-width={cell.highlighted ? 1.5 : 0.5}
        />
        <text
          x={cellSize / 2}
          y={cellSize / 2 + 1}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={cell.n >= 100 ? '10' : '12'}
          font-family="var(--font-mono)"
          font-weight={cell.prime ? '600' : '400'}
          fill={getTextColor(cell)}
        >
          {cell.n}
        </text>
      </g>
    {/each}
  </svg>
</div>

<style>
  .grid-wrapper {
    overflow-x: auto;
    display: flex;
    justify-content: center;
  }

  svg {
    max-width: 100%;
  }

  rect {
    transition: fill 0.2s ease, stroke 0.2s ease;
  }

  text {
    transition: fill 0.2s ease;
    user-select: none;
  }
</style>
