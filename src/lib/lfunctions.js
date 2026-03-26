import { evalCharacter, complexAdd, complexMul, complexAbs } from './characters.js';

// Compute L(s, chi) for real s > 1 by partial summation
// Returns [re, im]
export function lFunction(s, character, numTerms = 10000) {
  let sum = [0, 0];
  const q = character.values.size;
  for (let n = 1; n <= numTerms; n++) {
    const chi = evalCharacter(character, n);
    if (chi[0] === 0 && chi[1] === 0) continue;
    const weight = Math.pow(n, -s);
    sum = complexAdd(sum, [chi[0] * weight, chi[1] * weight]);
  }
  return sum;
}

// Compute L(s, chi) for a range of s values (more efficient: reuse character evaluations)
export function lFunctionRange(sValues, character, numTerms = 5000) {
  const q = character.values.size;
  const results = sValues.map(() => [0, 0]);

  for (let n = 1; n <= numTerms; n++) {
    const chi = evalCharacter(character, n);
    if (chi[0] === 0 && chi[1] === 0) continue;
    for (let i = 0; i < sValues.length; i++) {
      const weight = Math.pow(n, -sValues[i]);
      results[i] = complexAdd(results[i], [chi[0] * weight, chi[1] * weight]);
    }
  }
  return results;
}

// Compute partial sum of 1/n^s
export function zetaPartial(s, numTerms) {
  let sum = 0;
  for (let n = 1; n <= numTerms; n++) {
    sum += Math.pow(n, -s);
  }
  return sum;
}

// Compute partial sum of 1/p^s (sum over primes only)
export function primeZetaPartial(s, primes) {
  let sum = 0;
  for (const p of primes) {
    sum += Math.pow(p, -s);
  }
  return sum;
}

// Compute the product of all L-functions at s (real s > 1)
export function productOfLFunctions(s, characters, numTerms = 5000) {
  let product = [1, 0];
  for (const chi of characters) {
    const l = lFunction(s, chi, numTerms);
    product = complexMul(product, l);
  }
  return product;
}
