# Dirichlet's Prime Number Theorem — An Explorable Explanation

An interactive, visual guide to one of the most beautiful theorems in mathematics: **Dirichlet's theorem on primes in arithmetic progressions**.

**[Live demo](https://mikolalysenko.github.io/dirichlet-explorer/)**

## What is this?

If you pick any starting number and step size that share no common factor, the sequence contains infinitely many primes — and they're spread equally among all valid starting points. Dirichlet proved this in 1837 by inventing entirely new mathematics.

This explorable explanation breaks the proof down into 8 sections with 20+ interactive visualizations, making it accessible to a motivated middle school student.

## Sections

0. **Hook** — pick a progression, watch primes appear
1. **Primes** — factor trees, Euclid's argument, prime density
2. **Arithmetic Progressions** — the mod-q grid, coprimality, Euler's totient
3. **Modular Arithmetic** — remainder clocks, multiplication tables, group structure
4. **Dirichlet Characters** — complex arrows, phasor sweeps, orthogonality, the extraction formula
5. **L-Functions** — harmonic series, the s-dial, Euler product, the key formula
6. **Non-Vanishing** — the product trick, pole/zero playground, the non-negative series trap
7. **The Full Picture** — proof map, equidistribution, exploration sandbox

## Running locally

```bash
npm install
npm run dev
```

## Deploying

```bash
npm run deploy
```

Builds and pushes to the `gh-pages` branch for GitHub Pages hosting.

## Tech stack

- [Svelte 5](https://svelte.dev/) + [Vite](https://vite.dev/)
- [KaTeX](https://katex.org/) for math rendering
- SVG for all visualizations

## Authors

**Maksym Lysenko** and **Claude Opus 4.6**

## License

MIT

## Links

- [Live demo](https://mikolalysenko.github.io/dirichlet-explorer/)
- [GitHub repo](https://github.com/mikolalysenko/dirichlet-explorer)
