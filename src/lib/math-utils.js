export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function areCoprime(a, b) {
  return gcd(a, b) === 1;
}

export function totient(n) {
  let result = 0;
  for (let i = 1; i <= n; i++) {
    if (areCoprime(i, n)) result++;
  }
  return result;
}

export function modpow(base, exp, mod) {
  let result = 1;
  base = ((base % mod) + mod) % mod;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % mod;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

export function multiplicativeOrder(a, n) {
  if (gcd(a, n) !== 1) return -1;
  let order = 1;
  let current = a % n;
  while (current !== 1) {
    current = (current * a) % n;
    order++;
    if (order > n) return -1;
  }
  return order;
}

export function coprimeResidues(q) {
  const residues = [];
  for (let i = 1; i < q; i++) {
    if (areCoprime(i, q)) residues.push(i);
  }
  return residues;
}

export function smallestPrimitiveRoot(q) {
  const phi = totient(q);
  for (let g = 2; g < q; g++) {
    if (areCoprime(g, q) && multiplicativeOrder(g, q) === phi) {
      return g;
    }
  }
  return -1;
}

export function factorize(n) {
  if (n <= 1) return [];
  const factors = [];
  let d = 2;
  while (d * d <= n) {
    while (n % d === 0) {
      factors.push(d);
      n = Math.floor(n / d);
    }
    d++;
  }
  if (n > 1) factors.push(n);
  return factors;
}
