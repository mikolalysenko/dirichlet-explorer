export function sieve(max) {
  const isPrime = new Uint8Array(max + 1);
  isPrime.fill(1);
  isPrime[0] = 0;
  isPrime[1] = 0;
  for (let i = 2; i * i <= max; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= max; j += i) {
        isPrime[j] = 0;
      }
    }
  }
  return isPrime;
}

const SIEVE_LIMIT = 100000;
const IS_PRIME = sieve(SIEVE_LIMIT);

export function isPrime(n) {
  if (n < 2) return false;
  if (n <= SIEVE_LIMIT) return IS_PRIME[n] === 1;
  // Trial division for larger numbers
  if (n % 2 === 0) return false;
  if (n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export function listPrimes(max) {
  const s = max <= SIEVE_LIMIT ? IS_PRIME : sieve(max);
  const primes = [];
  for (let i = 2; i <= max; i++) {
    if (s[i]) primes.push(i);
  }
  return primes;
}

export function primesInProgression(a, q, max) {
  const primes = [];
  for (let n = a; n <= max; n += q) {
    if (n > 1 && isPrime(n)) primes.push(n);
  }
  return primes;
}
