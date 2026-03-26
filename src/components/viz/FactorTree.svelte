<script>
  import { isPrime } from '../../lib/primes.js';

  export let startNumber = 60;

  // Immutable tree: array of nodes with parent references
  // Each node: { id, value, parentId, side }
  // We store them flat and derive layout from structure
  let nodes = [];
  let nextId = 0;

  $: {
    startNumber;
    resetTree();
  }

  function resetTree() {
    nextId = 0;
    nodes = [{ id: nextId++, value: startNumber, parentId: -1, side: null }];
  }

  function smallestFactor(n) {
    if (n <= 1) return n;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) return d;
    }
    return n;
  }

  function hasChildren(nodeId) {
    return nodes.some(n => n.parentId === nodeId);
  }

  function split(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || isPrime(node.value) || node.value <= 1 || hasChildren(nodeId)) return;
    const f = smallestFactor(node.value);
    nodes = [
      ...nodes,
      { id: nextId++, value: f, parentId: nodeId, side: 'left' },
      { id: nextId++, value: node.value / f, parentId: nodeId, side: 'right' }
    ];
  }

  // Build a tree structure for layout from the flat list
  function buildLayoutTree(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const children = nodes.filter(n => n.parentId === nodeId);
    const left = children.find(c => c.side === 'left');
    const right = children.find(c => c.side === 'right');
    return {
      ...node,
      leftChild: left ? buildLayoutTree(left.id) : null,
      rightChild: right ? buildLayoutTree(right.id) : null,
      hasKids: children.length > 0
    };
  }

  function layoutNode(treeNode, depth = 0, xMin = 0) {
    const hGap = 50;
    const vGap = 60;

    if (!treeNode) return null;

    if (!treeNode.leftChild && !treeNode.rightChild) {
      return { ...treeNode, x: xMin, y: depth * vGap, width: 44 };
    }

    const leftLayout = layoutNode(treeNode.leftChild, depth + 1, xMin);
    const rightLayout = layoutNode(treeNode.rightChild, depth + 1, xMin + (leftLayout ? leftLayout.width : 0) + hGap);
    const totalWidth = (leftLayout ? leftLayout.width : 0) + hGap + (rightLayout ? rightLayout.width : 0);
    const lx = leftLayout ? leftLayout.x : xMin;
    const rx = rightLayout ? rightLayout.x : xMin;
    const x = (lx + rx) / 2;

    return { ...treeNode, x, y: depth * vGap, width: totalWidth, leftLayout, rightLayout };
  }

  function collectNodes(layout, list = []) {
    if (!layout) return list;
    list.push(layout);
    if (layout.leftLayout) collectNodes(layout.leftLayout, list);
    if (layout.rightLayout) collectNodes(layout.rightLayout, list);
    return list;
  }

  function collectEdges(layout, list = []) {
    if (!layout) return list;
    if (layout.leftLayout) {
      list.push({ x1: layout.x, y1: layout.y, x2: layout.leftLayout.x, y2: layout.leftLayout.y });
      collectEdges(layout.leftLayout, list);
    }
    if (layout.rightLayout) {
      list.push({ x1: layout.x, y1: layout.y, x2: layout.rightLayout.x, y2: layout.rightLayout.y });
      collectEdges(layout.rightLayout, list);
    }
    return list;
  }

  // Root is always id 0
  $: rootTree = buildLayoutTree(0);
  $: layout = rootTree ? layoutNode(rootTree) : null;
  $: displayNodes = layout ? collectNodes(layout) : [];
  $: displayEdges = layout ? collectEdges(layout) : [];

  $: treeDepth = (() => {
    function depth(l) {
      if (!l) return 0;
      return 1 + Math.max(depth(l.leftLayout), depth(l.rightLayout));
    }
    return depth(layout);
  })();

  $: svgWidth = layout ? layout.width + 80 : 200;
  $: svgHeight = Math.max(80, treeDepth * 60 + 60);
  $: offsetX = displayNodes.length > 0 ? 40 - Math.min(...displayNodes.map(n => n.x)) : 40;

  function canSplit(node) {
    return !isPrime(node.value) && !node.hasKids && node.value > 1;
  }

  function autoSplitAll() {
    // Split all splittable nodes iteratively
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of nodes) {
        if (!isPrime(node.value) && node.value > 1 && !hasChildren(node.id)) {
          const f = smallestFactor(node.value);
          nodes = [
            ...nodes,
            { id: nextId++, value: f, parentId: node.id, side: 'left' },
            { id: nextId++, value: node.value / f, parentId: node.id, side: 'right' }
          ];
          changed = true;
          break; // restart iteration since nodes changed
        }
      }
    }
  }
</script>

<div class="tree-wrapper">
  <div class="tree-controls">
    <button class="auto-btn" on:click={autoSplitAll}>Split all</button>
    <button class="auto-btn reset-btn" on:click={resetTree}>Reset</button>
  </div>
  <svg width={svgWidth} height={svgHeight} viewBox="0 0 {svgWidth} {svgHeight}">
    <g transform="translate({offsetX}, 24)">
      {#each displayEdges as edge}
        <line
          x1={edge.x1} y1={edge.y1}
          x2={edge.x2} y2={edge.y2}
          stroke="var(--color-border)"
          stroke-width="1.5"
        />
      {/each}

      {#each displayNodes as node}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <g
          transform="translate({node.x}, {node.y})"
          on:click={() => canSplit(node) && split(node.id)}
          style="cursor: {canSplit(node) ? 'pointer' : 'default'}"
          role={canSplit(node) ? 'button' : undefined}
        >
          <circle
            r="20"
            fill={isPrime(node.value) ? 'var(--color-prime-bg)' : node.hasKids ? 'var(--color-bg-alt)' : 'white'}
            stroke={isPrime(node.value) ? 'var(--color-prime)' : canSplit(node) ? 'var(--color-accent)' : 'var(--color-border)'}
            stroke-width={canSplit(node) ? 2 : 1.5}
          />
          <text
            text-anchor="middle"
            dominant-baseline="central"
            font-size={node.value >= 1000 ? '9' : node.value >= 100 ? '11' : '14'}
            font-family="var(--font-mono)"
            font-weight={isPrime(node.value) ? '700' : '400'}
            fill={isPrime(node.value) ? 'var(--color-prime)' : 'var(--color-text)'}
          >
            {node.value}
          </text>
          {#if canSplit(node)}
            <text
              y="32"
              text-anchor="middle"
              font-size="9"
              fill="var(--color-accent)"
              font-weight="500"
            >
              click
            </text>
          {/if}
        </g>
      {/each}
    </g>
  </svg>

  {#if displayNodes.length > 1}
    {@const leaves = displayNodes.filter(n => isPrime(n.value))}
    {#if leaves.length > 0 && leaves.every(n => isPrime(n.value)) && !displayNodes.some(n => canSplit(n))}
      <div class="factorization">
        {startNumber} = {leaves.map(n => n.value).sort((a, b) => a - b).join(' × ')}
      </div>
    {/if}
  {/if}
</div>

<style>
  .tree-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-x: auto;
  }

  .tree-controls {
    display: flex;
    gap: 0.5em;
    margin-bottom: 0.5em;
  }

  .auto-btn {
    font-family: var(--font-serif);
    font-size: 0.8rem;
    padding: 0.3em 0.8em;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: white;
    cursor: pointer;
    color: var(--color-text-muted);
    transition: all 0.15s ease;
  }

  .auto-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .reset-btn:hover {
    border-color: var(--color-prime);
    color: var(--color-prime);
  }

  svg {
    max-width: 100%;
    height: auto;
  }

  circle {
    transition: fill 0.2s ease, stroke 0.2s ease;
  }

  .factorization {
    margin-top: 0.5em;
    font-family: var(--font-mono);
    font-size: 0.95rem;
    color: var(--color-prime);
    font-weight: 600;
    padding: 0.4em 1em;
    background: var(--color-prime-bg);
    border-radius: 8px;
  }
</style>
