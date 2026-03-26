# Dirichlet's Prime Number Theorem — Explorable Explanation

## Goal

An interactive, single-page web document that explains **Dirichlet's theorem on primes in arithmetic progressions** to a smart middle school student. Every concept is introduced visually before formally, with interactive widgets the reader can play with. The tone is curious and direct — no lecturing, no filler. The reader should finish feeling like they *understand* why the theorem is true, not just that it is.

## The theorem

> If you pick any starting number *a* and step size *q* that share no common factor, the sequence *a, a+q, a+2q, ...* contains infinitely many primes — and they're spread equally among all valid starting points.

## Audience

A motivated 12–14 year old who knows arithmetic, primes, and basic algebra. No knowledge of complex numbers, group theory, or calculus is assumed — each is introduced when needed.

## Design principles

- **Concrete before abstract.** Show the pattern first, then explain why.
- **Every concept earns its place.** Before introducing new math, show the problem it solves.
- **Interact, don't just read.** Every major idea has a widget. Sliders, clickable grids, animated arrows.
- **Short paragraphs.** If a paragraph is longer than 4 sentences, split it or add a visual.
- **One idea per section.** Each section has a single takeaway the reader can state in one sentence.

## Sections

### 0. Hook
**Takeaway:** "Coprime progressions are rich with primes; non-coprime ones are barren."

- Interactive number line: choose *a* and *q*. ALL values of *a* are shown (1 to q).
- Coprime values in blue, non-coprime in red. User can select either.
- **Coprime case:** counter shows primes found, message "infinitely more!"
- **Non-coprime case:** shows the common factor, explains every term is divisible by it, reports 0 or 1 primes. Dramatic contrast motivates the theorem.
- Bridge text invites switching between blue/red to see the difference.

### 1. Primes — the atoms of numbers
**Takeaway:** "Every number factors into primes uniquely, and there are infinitely many primes."

| Concept | Visualization |
|---------|--------------|
| What is a prime? | — |
| Unique factorization | **Factor tree** — click to split numbers into prime factors. "Split all" button. Shows final factorization. |
| Infinitely many primes (Euclid) | **Euclid widget** — pick your "complete" list, compute product+1, find the new prime, add it, repeat. |
| Primes thin out but never stop | **Density histogram** — bars show prime count per group of 10. Slider extends range. |

### 2. Patterns in primes — arithmetic progressions
**Takeaway:** "Primes only appear in columns coprime to q, and they seem evenly spread."

| Concept | Visualization |
|---------|--------------|
| Arithmetic progressions | — |
| Mod-q grid reveals columns | **Number grid** — integers in q columns, primes colored. Slider for q, click columns to highlight. |
| Why non-coprime columns are prime-free | Callout: if d divides both the column and q, every number in the column is divisible by d. |
| Statement of Dirichlet's theorem | Callout box. |

### 3. Remainder clocks — modular arithmetic
**Takeaway:** "Coprime residues form a group under multiplication."

| Concept | Visualization |
|---------|--------------|
| Clock metaphor for mod q | **Mod clock** — circular face with q positions. Type a number, hand rotates. |
| Addition and multiplication mod q | Clock calculator with two inputs and operation selector. |
| Coprime residues are closed under × | Proof: if p divides a·b and q, it divides a or b — contradiction. |
| Group structure (identity, inverses) | Callout listing the four group properties. |

### 4. Secret signals — Dirichlet characters
**Takeaway:** "Characters are multiplicative arrow-labels that can filter out one residue class."

This is the hardest conceptual leap. Three sub-parts:

**4a. Arrows on a circle (complex numbers intro)**
- Numbers as arrows on the unit circle. Length 1, angle matters.
- Key rule: multiply arrows by adding angles.
- Concrete examples: 90°×90° = 180°, 120°×3 = 360° = back to 1.

**4b. Characters = labeling residues with arrows**

| Concept | Visualization |
|---------|--------------|
| Definition: χ(ab) = χ(a)·χ(b) | — |
| Character table | **Character table** — φ(q)×φ(q) grid of arrow diagrams. Click rows/columns to highlight. |
| Phasor sweep | **Phasor strip** — each character shown as e^{2πi·a·x/q} with x sweeping 0 to q continuously. Arrows at coprime integers are highlighted nodes. |
| Animated phasor wheels | **Phasor wheels** — play/pause through integers, watch arrows rotate per character. |

**4c. Orthogonality = the extraction formula**

| Concept | Visualization |
|---------|--------------|
| Weighted sum cancels for wrong residue, reinforces for right one | **Orthogonality grid** — for each residue m, show arrows summing to 0 or 1. |
| Step-by-step inner product | **Animated inner product** — pick two characters, watch term-by-term accumulation on complex plane. Table shows each residue's contribution. Same characters → sum to 1. Different → spiral to 0. |

### 5. The prime-counting machine — L-functions
**Takeaway:** "L-functions connect character sums to prime detection, via the Euler product."

**5a. Infinite sums and the s-dial**

| Concept | Visualization |
|---------|--------------|
| Harmonic series diverges | **Bar chart** with slider for number of terms. |
| The parameter s controls convergence | **S-dial** — slider from 0.5 to 4. Bars shrink/grow. Diverges at s ≤ 1, converges above. |

**5b. Euler's product (with proof)**

Three-step proof:
1. Geometric series for each prime: 1/(1−p^{-s}) = 1 + 1/p^s + 1/p^{2s} + ...
2. Multiplying two series generates all integers with those prime factors (unique factorization!).
3. All primes → all integers.

| Concept | Visualization |
|---------|--------------|
| Sieve animation | **Euler sieve grid** — 6×6 grid of integers. Add primes with ±buttons. Cells light up as integers become "reachable." Factorizations shown. Partial sum = product at every step. |
| Per-prime contribution | **Euler product bars** — bar chart of 1/(1−p^{-s}) per prime, product total. |

**5c. From L-functions to counting primes**

Three-step derivation:
1. Take log of Euler product → sum over primes.
2. Apply character filter (multiply by χ̄(a)/φ(q), sum over χ).
3. Swap sums, use orthogonality → extracts primes ≡ a (mod q).

| Concept | Visualization |
|---------|--------------|
| Principal L-function diverges | **L-function plot** — curves for all characters. Principal one rockets up as s→1; others converge. |

### 6. The heart of the proof — non-vanishing
**Takeaway:** "L(1,χ) can never be zero — so the principal term always wins."

| Concept | Visualization |
|---------|--------------|
| Product of all L-functions ≥ 1 | **Product curve** — plot stays above 1. Derived from orthogonality: log is a sum of non-negative terms. |
| Complex characters: 2 zeros vs 1 pole | **Tug-of-war diagram**. (s−1)²/(s−1) → 0, contradicts ≥ 1. |
| Real characters: Landau's theorem | Prose: analytic + non-negative coefficients ⟹ convergence boundary is a singularity. But Σ1/m diverges at s=1/2. Contradiction. |

### 7. The full picture
**Takeaway:** "Every coprime residue class has infinitely many primes, equally distributed."

| Concept | Visualization |
|---------|--------------|
| Proof map | **Proof flowchart** — DAG of all concepts, clickable nodes scroll to section. |
| Equidistribution | **Histogram** — prime counts per residue class. Slider for range up to 10,000. Bars equalize. |
| Sandbox | **Progression explorer** — revisit the opening widget with full understanding. |
| History | Dirichlet (1837), Prime Number Theorem, Riemann Hypothesis, Green-Tao. |

## Interactive components (13 total)

| Component | Type | Key interaction |
|-----------|------|----------------|
| NumberLine | SVG | Slider for a, q; dots + labels for primes in progression |
| FactorTree | SVG | Click nodes to split; "Split all" / "Reset" buttons |
| NumberGrid | SVG | Slider for q; click column headers to highlight |
| ModClock | SVG | Number input moves clock hand; shows coprime positions |
| CharacterTable | SVG+HTML | Click row/column; arrows on mini unit circles |
| CharacterPhasors | SVG | Play/pause animation; phasor wheels + continuous sweep strips |
| OrthogonalityViz | SVG | Select target residue; shows arrow sums per residue |
| OrthogonalityAnimated | SVG+HTML | Pick 2 characters; play/step through inner product; table + complex plane |
| EulerSieveViz | SVG | ±buttons add primes; grid cells light up; sum = product readout |
| EulerProductViz | SVG | Sliders for s and #primes; bar chart + product comparison |
| LFunctionPlot | SVG | Sliders for q and s; curves for all characters with legend |
| EquidistributionViz | SVG | Sliders for q and max N; histogram + expected-value line |
| ProofMap | SVG | Click nodes to jump to corresponding section |

## Layout

- **Single scrollable page** with sticky sidebar table of contents.
- **TOC** highlights current section via IntersectionObserver.
- **Content width:** ~740px centered. Visualizations break wider to ~960px.
- **Responsive:** TOC collapses to hamburger on mobile.

## Tech stack

- **Svelte 5 + Vite** — reactive components, scoped CSS, fast builds.
- **KaTeX** — synchronous math rendering. Use `String.raw` template literals for LaTeX.
- **SVG** — all visualizations. Svelte manages DOM; D3 utilities for scales only.
- **No server** — static site. `npm run build` produces `dist/`.

## Typography and color

- **Body:** Crimson Pro (serif). **Math:** KaTeX Computer Modern. **Code/numbers:** JetBrains Mono.
- **Background:** #fafaf8 (warm white). **Text:** #1a1a2e.
- **Primes:** gold/amber (#d4880f). **Accents:** blue (#2563eb).
- **Characters:** 6 distinct hues, consistent across all visualizations.

## Non-goals

- Not a textbook. No exercises, no formal proofs with QED boxes.
- Not exhaustive. Skip analytic continuation, functional equations, explicit formulas.
- Not a reference. Optimize for first-read clarity, not completeness.
