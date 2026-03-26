<script>
  const nodes = [
    { id: 'primes', label: 'Primes are\ninfinite', x: 300, y: 30, section: 'primes', color: '#f59e0b' },
    { id: 'progressions', label: 'Primes in\nprogressions?', x: 300, y: 110, section: 'progressions', color: '#f59e0b' },
    { id: 'modular', label: 'Modular\narithmetic', x: 100, y: 200, section: 'modular', color: '#6366f1' },
    { id: 'characters', label: 'Dirichlet\ncharacters', x: 300, y: 200, section: 'characters', color: '#6366f1' },
    { id: 'orthogonality', label: 'Orthogonality\n= filter', x: 500, y: 200, section: 'characters', color: '#6366f1' },
    { id: 'lfunctions', label: 'L-functions\nL(s, χ)', x: 200, y: 310, section: 'lfunctions', color: '#14b8a6' },
    { id: 'euler', label: 'Euler product\n↔ primes', x: 400, y: 310, section: 'lfunctions', color: '#14b8a6' },
    { id: 'extraction', label: 'Sum over primes\nin one class', x: 300, y: 400, section: 'lfunctions', color: '#14b8a6' },
    { id: 'principal', label: 'Principal χ₀\n→ diverges', x: 150, y: 490, section: 'nonvanishing', color: '#ec4899' },
    { id: 'nonvanishing', label: 'L(1,χ) ≠ 0\nfor χ ≠ χ₀', x: 450, y: 490, section: 'nonvanishing', color: '#ec4899' },
    { id: 'conclusion', label: '∞ many primes\nin each class!', x: 300, y: 570, section: 'conclusion', color: '#d4880f' },
  ];

  const edges = [
    ['primes', 'progressions'],
    ['progressions', 'modular'],
    ['progressions', 'characters'],
    ['modular', 'characters'],
    ['characters', 'orthogonality'],
    ['characters', 'lfunctions'],
    ['orthogonality', 'extraction'],
    ['lfunctions', 'euler'],
    ['euler', 'extraction'],
    ['extraction', 'principal'],
    ['extraction', 'nonvanishing'],
    ['principal', 'conclusion'],
    ['nonvanishing', 'conclusion'],
  ];

  const nodeMap = {};
  nodes.forEach(n => nodeMap[n.id] = n);

  function scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<div class="proof-map-wrapper">
  <svg viewBox="0 0 600 620" preserveAspectRatio="xMidYMid meet">
    <!-- Edges -->
    {#each edges as [from, to]}
      {@const a = nodeMap[from]}
      {@const b = nodeMap[to]}
      <line
        x1={a.x} y1={a.y + 20}
        x2={b.x} y2={b.y - 20}
        stroke="var(--color-border)"
        stroke-width="1.5"
        marker-end="url(#arrowhead)"
      />
    {/each}

    <!-- Arrow marker -->
    <defs>
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="var(--color-border)" />
      </marker>
    </defs>

    <!-- Nodes -->
    {#each nodes as node}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <g
        transform="translate({node.x}, {node.y})"
        on:click={() => scrollToSection(node.section)}
        style="cursor: pointer"
      >
        <rect
          x="-65" y="-22"
          width="130" height="44"
          rx="10"
          fill="white"
          stroke={node.color}
          stroke-width="2"
        />
        {#each node.label.split('\n') as line, i}
          <text
            text-anchor="middle"
            y={i * 15 - (node.label.split('\n').length - 1) * 7.5 + 2}
            font-size="11"
            font-family="var(--font-serif)"
            font-weight="500"
            fill="var(--color-text)"
          >
            {line}
          </text>
        {/each}
      </g>
    {/each}
  </svg>
</div>

<style>
  .proof-map-wrapper {
    display: flex;
    justify-content: center;
  }

  svg {
    width: 100%;
    max-width: 600px;
    height: auto;
  }

  g:hover rect {
    filter: brightness(0.97);
    stroke-width: 2.5;
  }
</style>
