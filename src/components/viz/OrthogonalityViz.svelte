<script>
  import { dirichletCharacters, complexAdd } from '../../lib/characters.js';
  import { coprimeResidues } from '../../lib/math-utils.js';

  export let q = 5;
  export let targetResidue = 1;

  $: characters = dirichletCharacters(q);
  $: residues = coprimeResidues(q);

  // For a given residue m, compute sum_chi chi_bar(targetResidue) * chi(m) / phi(q)
  // This should be 1 if m === targetResidue, 0 otherwise
  $: phi = residues.length;

  // Show the individual arrows for each character at a given residue
  $: arrowsPerResidue = residues.map(m => {
    const arrows = characters.map(chi => {
      const chiTarget = chi.values.get(targetResidue) || [0, 0];
      const chiM = chi.values.get(m) || [0, 0];
      // chi_bar(target) * chi(m)
      const conjugateTarget = [chiTarget[0], -chiTarget[1]];
      const product = [
        conjugateTarget[0] * chiM[0] - conjugateTarget[1] * chiM[1],
        conjugateTarget[0] * chiM[1] + conjugateTarget[1] * chiM[0]
      ];
      return [product[0] / phi, product[1] / phi];
    });

    // Cumulative sum for drawing
    const cumulative = [];
    let sum = [0, 0];
    for (const arrow of arrows) {
      const start = [...sum];
      sum = complexAdd(sum, arrow);
      cumulative.push({ start, end: [...sum], arrow });
    }

    return { m, arrows, cumulative, total: sum };
  });

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const scale = 55;

  const charColors = [
    'var(--color-char-0)',
    'var(--color-char-1)',
    'var(--color-char-2)',
    'var(--color-char-3)',
    'var(--color-char-4)',
    'var(--color-char-5)',
  ];
</script>

<div class="ortho-grid">
  {#each arrowsPerResidue as { m, cumulative, total }}
    <div class="ortho-cell" class:is-target={m === targetResidue}>
      <div class="cell-label">m = {m}</div>
      <svg width={size} height={size} viewBox="0 0 {size} {size}">
        <!-- Unit circle -->
        <circle {cx} {cy} r={scale} fill="none" stroke="var(--color-border-light)" stroke-width="0.5" />
        <line x1={cx - scale - 5} y1={cy} x2={cx + scale + 5} y2={cy} stroke="var(--color-border-light)" stroke-width="0.5" />
        <line x1={cx} y1={cy - scale - 5} x2={cx} y2={cy + scale + 5} stroke="var(--color-border-light)" stroke-width="0.5" />

        <!-- Arrows (cumulative) -->
        {#each cumulative as seg, i}
          <line
            x1={cx + seg.start[0] * scale}
            y1={cy - seg.start[1] * scale}
            x2={cx + seg.end[0] * scale}
            y2={cy - seg.end[1] * scale}
            stroke={charColors[i % charColors.length]}
            stroke-width="2"
            stroke-linecap="round"
            opacity="0.8"
          />
          <circle
            cx={cx + seg.end[0] * scale}
            cy={cy - seg.end[1] * scale}
            r="2.5"
            fill={charColors[i % charColors.length]}
          />
        {/each}

        <!-- Total marker -->
        <circle
          cx={cx + total[0] * scale}
          cy={cy - total[1] * scale}
          r="5"
          fill={Math.abs(total[0]) > 0.5 || Math.abs(total[1]) > 0.5 ? 'var(--color-prime)' : 'var(--color-text-light)'}
          stroke="white"
          stroke-width="1.5"
        />
      </svg>
      <div class="cell-result" class:nonzero={Math.abs(total[0]) > 0.01 || Math.abs(total[1]) > 0.01}>
        {Math.abs(total[0]) > 0.01 || Math.abs(total[1]) > 0.01
          ? `= ${Math.round(total[0] * 100) / 100}`
          : '= 0'}
      </div>
    </div>
  {/each}
</div>

<style>
  .ortho-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em;
    justify-content: center;
  }

  .ortho-cell {
    text-align: center;
    border: 1px solid var(--color-border-light);
    border-radius: 8px;
    padding: 0.5em;
    background: white;
    transition: all 0.2s ease;
  }

  .ortho-cell.is-target {
    border-color: var(--color-prime);
    background: var(--color-prime-bg);
  }

  .cell-label {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-bottom: 0.3em;
  }

  .cell-result {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-text-light);
    margin-top: 0.3em;
  }

  .cell-result.nonzero {
    color: var(--color-prime);
    font-weight: 700;
  }
</style>
