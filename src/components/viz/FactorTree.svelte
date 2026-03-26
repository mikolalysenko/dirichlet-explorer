<script>
  import { isPrime } from '../../lib/primes.js';

  export let startNumber = 60;

  // Flat node list — immutable updates for Svelte 5 reactivity
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

  function split(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    if (isPrime(node.value) || node.value <= 1) return;
    if (nodes.some(n => n.parentId === nodeId)) return; // already split
    const f = smallestFactor(node.value);
    nodes = [
      ...nodes,
      { id: nextId++, value: f, parentId: nodeId, side: 'left' },
      { id: nextId++, value: node.value / f, parentId: nodeId, side: 'right' }
    ];
  }

  function autoSplitAll() {
    let current = nodes;
    let id = nextId;
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of current) {
        if (!isPrime(node.value) && node.value > 1 && !current.some(n => n.parentId === node.id)) {
          const f = smallestFactor(node.value);
          current = [
            ...current,
            { id: id++, value: f, parentId: node.id, side: 'left' },
            { id: id++, value: node.value / f, parentId: node.id, side: 'right' }
          ];
          changed = true;
          break;
        }
      }
    }
    nextId = id;
    nodes = current;
  }

  // Derive everything from nodes — all in one reactive block for correct tracking
  $: treeData = (() => {
    // Build tree structure from flat list
    function buildTree(nodeId) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return null;
      const children = nodes.filter(n => n.parentId === nodeId);
      const left = children.find(c => c.side === 'left');
      const right = children.find(c => c.side === 'right');
      return {
        ...node,
        leftChild: left ? buildTree(left.id) : null,
        rightChild: right ? buildTree(right.id) : null,
        hasKids: children.length > 0
      };
    }

    function doLayout(treeNode, depth = 0, xMin = 0) {
      const hGap = 50, vGap = 60;
      if (!treeNode) return null;
      if (!treeNode.leftChild && !treeNode.rightChild) {
        return { ...treeNode, x: xMin, y: depth * vGap, w: 44 };
      }
      const ll = doLayout(treeNode.leftChild, depth + 1, xMin);
      const rl = doLayout(treeNode.rightChild, depth + 1, xMin + (ll ? ll.w : 0) + hGap);
      const w = (ll ? ll.w : 0) + hGap + (rl ? rl.w : 0);
      return { ...treeNode, x: ((ll ? ll.x : xMin) + (rl ? rl.x : xMin)) / 2, y: depth * vGap, w, ll, rl };
    }

    function flatNodes(l, out = []) {
      if (!l) return out;
      out.push(l);
      flatNodes(l.ll, out);
      flatNodes(l.rl, out);
      return out;
    }

    function flatEdges(l, out = []) {
      if (!l) return out;
      if (l.ll) { out.push({ x1: l.x, y1: l.y, x2: l.ll.x, y2: l.ll.y }); flatEdges(l.ll, out); }
      if (l.rl) { out.push({ x1: l.x, y1: l.y, x2: l.rl.x, y2: l.rl.y }); flatEdges(l.rl, out); }
      return out;
    }

    function treeDepth(l) {
      if (!l) return 0;
      return 1 + Math.max(treeDepth(l.ll), treeDepth(l.rl));
    }

    const root = buildTree(0);
    const layout = root ? doLayout(root) : null;
    const dn = layout ? flatNodes(layout) : [];
    const de = layout ? flatEdges(layout) : [];
    const d = treeDepth(layout);
    const svgW = layout ? layout.w + 80 : 200;
    const svgH = Math.max(80, d * 60 + 60);
    const ox = dn.length > 0 ? 40 - Math.min(...dn.map(n => n.x)) : 40;

    // Leaves for factorization display
    const allSplit = !dn.some(n => canSplitNode(n));
    const leaves = dn.filter(n => isPrime(n.value)).map(n => n.value).sort((a, b) => a - b);

    return { displayNodes: dn, displayEdges: de, svgWidth: svgW, svgHeight: svgH, offsetX: ox, leaves, allSplit };
  })();

  function canSplitNode(node) {
    return !isPrime(node.value) && !node.hasKids && node.value > 1;
  }
</script>

<div class="tree-wrapper">
  <div class="tree-controls">
    <button class="auto-btn" on:click={autoSplitAll}>Split all</button>
    <button class="auto-btn reset-btn" on:click={resetTree}>Reset</button>
  </div>
  <svg width={treeData.svgWidth} height={treeData.svgHeight} viewBox="0 0 {treeData.svgWidth} {treeData.svgHeight}">
    <g transform="translate({treeData.offsetX}, 24)">
      {#each treeData.displayEdges as edge}
        <line
          x1={edge.x1} y1={edge.y1}
          x2={edge.x2} y2={edge.y2}
          stroke="var(--color-border)"
          stroke-width="1.5"
        />
      {/each}

      {#each treeData.displayNodes as node (node.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <g
          transform="translate({node.x}, {node.y})"
          on:click={() => { if (canSplitNode(node)) split(node.id); }}
          style="cursor: {canSplitNode(node) ? 'pointer' : 'default'}"
          role={canSplitNode(node) ? 'button' : undefined}
        >
          <circle
            r="20"
            fill={isPrime(node.value) ? 'var(--color-prime-bg)' : node.hasKids ? 'var(--color-bg-alt)' : 'white'}
            stroke={isPrime(node.value) ? 'var(--color-prime)' : canSplitNode(node) ? 'var(--color-accent)' : 'var(--color-border)'}
            stroke-width={canSplitNode(node) ? 2 : 1.5}
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
          {#if canSplitNode(node)}
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

  {#if treeData.allSplit && treeData.leaves.length > 1}
    <div class="factorization">
      {startNumber} = {treeData.leaves.join(' × ')}
    </div>
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
