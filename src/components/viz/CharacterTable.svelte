<script>
  import { dirichletCharacters } from '../../lib/characters.js';
  import { coprimeResidues } from '../../lib/math-utils.js';

  export let q = 5;
  export let highlightChar = -1;
  export let highlightResidue = -1;

  $: characters = dirichletCharacters(q);
  $: residues = coprimeResidues(q);

  const charColors = [
    'var(--color-char-0)',
    'var(--color-char-1)',
    'var(--color-char-2)',
    'var(--color-char-3)',
    'var(--color-char-4)',
    'var(--color-char-5)',
  ];

  function formatComplex(z) {
    const [re, im] = z;
    const r = Math.round(re * 1000) / 1000;
    const i = Math.round(im * 1000) / 1000;
    if (Math.abs(i) < 0.001) return r.toString();
    if (Math.abs(r) < 0.001) {
      if (Math.abs(i - 1) < 0.001) return 'i';
      if (Math.abs(i + 1) < 0.001) return '-i';
      return i.toFixed(2) + 'i';
    }
    const sign = i > 0 ? '+' : '';
    const iStr = Math.abs(i - 1) < 0.001 ? '' : Math.abs(i + 1) < 0.001 ? '-' : i.toFixed(1);
    return `${r}${sign}${iStr}i`;
  }

  // Arrow on unit circle for a complex value
  function arrowAngle(z) {
    return Math.atan2(z[1], z[0]);
  }

  const arrowR = 12;
</script>

<div class="char-table-wrapper">
  <table class="char-table">
    <thead>
      <tr>
        <th></th>
        {#each residues as r}
          <th
            class:highlighted={r === highlightResidue}
            on:click={() => highlightResidue = highlightResidue === r ? -1 : r}
          >
            {r}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each characters as chi, idx}
        <tr
          class:highlighted={idx === highlightChar}
          on:click={() => highlightChar = highlightChar === idx ? -1 : idx}
        >
          <td class="char-label" style="color: {charColors[idx % charColors.length]}">
            {chi.label}
          </td>
          {#each residues as r}
            {@const val = chi.values.get(r) || [0, 0]}
            <td class:cell-highlighted={idx === highlightChar || r === highlightResidue}>
              <div class="cell-content">
                <svg width={arrowR * 2 + 4} height={arrowR * 2 + 4} viewBox="0 0 {arrowR * 2 + 4} {arrowR * 2 + 4}">
                  <circle
                    cx={arrowR + 2}
                    cy={arrowR + 2}
                    r={arrowR}
                    fill="none"
                    stroke="var(--color-border-light)"
                    stroke-width="0.5"
                  />
                  {#if val[0] !== 0 || val[1] !== 0}
                    {@const angle = arrowAngle(val)}
                    <line
                      x1={arrowR + 2}
                      y1={arrowR + 2}
                      x2={arrowR + 2 + arrowR * Math.cos(angle)}
                      y2={arrowR + 2 - arrowR * Math.sin(angle)}
                      stroke={charColors[idx % charColors.length]}
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <circle
                      cx={arrowR + 2 + arrowR * Math.cos(angle)}
                      cy={arrowR + 2 - arrowR * Math.sin(angle)}
                      r="2"
                      fill={charColors[idx % charColors.length]}
                    />
                  {/if}
                </svg>
                <span class="val-text">{formatComplex(val)}</span>
              </div>
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .char-table-wrapper {
    overflow-x: auto;
  }

  .char-table {
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 0.8rem;
    margin: 0 auto;
  }

  th, td {
    padding: 0.4em 0.6em;
    text-align: center;
    border: 1px solid var(--color-border-light);
    cursor: pointer;
    transition: background 0.15s ease;
  }

  th {
    background: var(--color-bg-alt);
    font-weight: 500;
    font-size: 0.85rem;
  }

  th.highlighted {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }

  tr.highlighted td {
    background: rgba(99, 102, 241, 0.06);
  }

  .cell-highlighted {
    background: rgba(99, 102, 241, 0.08);
  }

  .char-label {
    font-weight: 600;
    white-space: nowrap;
  }

  .cell-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .val-text {
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }
</style>
