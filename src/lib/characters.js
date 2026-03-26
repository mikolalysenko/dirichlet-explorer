import { gcd, coprimeResidues, totient, multiplicativeOrder } from './math-utils.js';

// Complex number utilities
export function complexMul(a, b) {
  return [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
}

export function complexAbs(z) {
  return Math.sqrt(z[0] * z[0] + z[1] * z[1]);
}

export function complexAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

export function rootOfUnity(k, n) {
  const angle = (2 * Math.PI * k) / n;
  return [Math.cos(angle), Math.sin(angle)];
}

// Find the structure of (Z/qZ)* as a product of cyclic groups
// Returns generators and their orders
function groupStructure(q) {
  const residues = coprimeResidues(q);
  const phi = residues.length;
  if (phi === 0) return { generators: [], orders: [], residues };
  if (phi === 1) return { generators: [1], orders: [1], residues };

  // Find generators for the cyclic decomposition
  // For simplicity, we decompose into cyclic factors
  const generators = [];
  const orders = [];
  const generated = new Set([1]);

  // Greedy: find element of maximal order not in generated subgroup
  let remaining = phi;
  while (generated.size < phi) {
    let bestG = -1;
    let bestOrd = 0;
    for (const g of residues) {
      if (generated.has(g)) continue;
      const ord = multiplicativeOrder(g, q);
      if (ord > bestOrd) {
        bestOrd = ord;
        bestG = g;
      }
    }
    if (bestG === -1) break;
    generators.push(bestG);
    orders.push(bestOrd);

    // Expand generated set
    const newElements = [];
    const powers = [1];
    let cur = bestG;
    for (let i = 1; i < bestOrd; i++) {
      powers.push(cur);
      cur = (cur * bestG) % q;
    }
    for (const existing of [...generated]) {
      for (const p of powers) {
        newElements.push((existing * p) % q);
      }
    }
    for (const e of newElements) generated.add(e);
    remaining = phi - generated.size;
  }

  return { generators, orders, residues };
}

// Enumerate all Dirichlet characters mod q
// Returns array of character objects, each with a values map: n -> [re, im]
export function dirichletCharacters(q) {
  if (q <= 1) {
    return [{
      values: new Map([[1, [1, 0]]]),
      label: '\u03C7\u2080',
      isPrincipal: true,
      index: 0
    }];
  }

  const { generators, orders, residues } = groupStructure(q);
  const phi = residues.length;

  // Build discrete log table: for each residue, express as product of generator powers
  // residue = g1^e1 * g2^e2 * ... mod q
  const dlog = new Map();

  // Generate all combinations of generator powers
  function enumerate(idx, current, exponents) {
    if (idx === generators.length) {
      dlog.set(current, [...exponents]);
      return;
    }
    const g = generators[idx];
    const ord = orders[idx];
    let pow = current;
    for (let e = 0; e < ord; e++) {
      exponents[idx] = e;
      enumerate(idx + 1, pow, exponents);
      pow = (pow * g) % q;
    }
  }

  if (generators.length > 0) {
    enumerate(0, 1, new Array(generators.length).fill(0));
  } else {
    dlog.set(1, []);
  }

  // Enumerate all character indices: each character is determined by
  // choosing k_i in [0, orders[i]) for each generator
  const characters = [];
  const numChars = orders.reduce((a, b) => a * b, 1);

  function enumerateChars(idx, charIndices) {
    if (idx === generators.length) {
      // Build character values
      const values = new Map();
      for (let n = 0; n < q; n++) {
        if (gcd(n, q) > 1) {
          values.set(n, [0, 0]);
        } else {
          const exps = dlog.get(n % q);
          if (!exps) {
            values.set(n, [0, 0]);
            continue;
          }
          let val = [1, 0];
          for (let i = 0; i < generators.length; i++) {
            const root = rootOfUnity(charIndices[i] * exps[i], orders[i]);
            val = complexMul(val, root);
          }
          // Clean up tiny floating point errors
          if (Math.abs(val[0]) < 1e-10) val[0] = 0;
          if (Math.abs(val[1]) < 1e-10) val[1] = 0;
          values.set(n, val);
        }
      }

      const isPrincipal = charIndices.every(k => k === 0);
      const charIdx = characters.length;
      characters.push({
        values,
        label: isPrincipal ? '\u03C7\u2080' : '\u03C7' + subscriptDigits(charIdx),
        isPrincipal,
        index: charIdx
      });
      return;
    }

    for (let k = 0; k < orders[idx]; k++) {
      charIndices[idx] = k;
      enumerateChars(idx + 1, charIndices);
    }
  }

  enumerateChars(0, new Array(generators.length).fill(0));

  // Re-label characters nicely
  characters.forEach((ch, i) => {
    ch.label = i === 0 ? '\u03C7\u2080' : `\u03C7${subscriptDigits(i)}`;
    ch.index = i;
  });

  return characters;
}

function subscriptDigits(n) {
  const subscripts = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089';
  return String(n).split('').map(d => subscripts[parseInt(d)]).join('');
}

// Evaluate a character at n (returns [re, im])
export function evalCharacter(char, n) {
  const q = char.values.size;
  const key = ((n % q) + q) % q;
  return char.values.get(key) || [0, 0];
}

// Return the group structure, discrete log table, and character frequency indices
// needed for continuous sinusoidal evaluation of characters.
//
// For each character chi_k, the value at a coprime residue n is:
//   chi_k(n) = product_i  exp(2*pi*i * freqs[k][i] * dlog(n)[i] / orders[i])
//
// The continuous extension replaces the integer dlog with a continuous parameter.
export function characterContinuousData(q) {
  if (q <= 1) {
    return {
      generators: [1], orders: [1], residues: [1],
      dlog: new Map([[1, [0]]]),
      charFreqs: [[0]]
    };
  }

  const { generators, orders, residues } = groupStructure(q);
  const phi = residues.length;

  // Rebuild the dlog table
  const dlog = new Map();
  function enumerate(idx, current, exponents) {
    if (idx === generators.length) {
      dlog.set(current, [...exponents]);
      return;
    }
    const g = generators[idx];
    const ord = orders[idx];
    let pow = current;
    for (let e = 0; e < ord; e++) {
      exponents[idx] = e;
      enumerate(idx + 1, pow, exponents);
      pow = (pow * g) % q;
    }
  }
  if (generators.length > 0) {
    enumerate(0, 1, new Array(generators.length).fill(0));
  } else {
    dlog.set(1, []);
  }

  // Enumerate character frequency indices
  const charFreqs = [];
  function enumerateFreqs(idx, indices) {
    if (idx === generators.length) {
      charFreqs.push([...indices]);
      return;
    }
    for (let k = 0; k < orders[idx]; k++) {
      indices[idx] = k;
      enumerateFreqs(idx + 1, indices);
    }
  }
  enumerateFreqs(0, new Array(generators.length).fill(0));

  return { generators, orders, residues, dlog, charFreqs };
}

// Evaluate a character continuously.
// Given character frequency indices freqs[], group orders[], and a continuous
// "phase vector" t[] (one per generator), compute:
//   product_i  exp(2*pi*i * freqs[i] * t[i] / orders[i])
export function evalCharacterContinuous(freqs, orders, t) {
  let re = 1, im = 0;
  for (let i = 0; i < freqs.length; i++) {
    const angle = (2 * Math.PI * freqs[i] * t[i]) / orders[i];
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const newRe = re * c - im * s;
    const newIm = re * s + im * c;
    re = newRe;
    im = newIm;
  }
  return [re, im];
}
