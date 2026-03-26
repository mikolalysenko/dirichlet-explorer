# Dirichlet's Theorem on Primes in Arithmetic Progressions

## Statement

**Theorem (Dirichlet, 1837).** If $a$ and $q$ are coprime positive integers (i.e. $\gcd(a,q)=1$), then the arithmetic progression

$$a,\; a+q,\; a+2q,\; a+3q,\; \dots$$

contains infinitely many primes.

More precisely, the series $\sum_{p \equiv a \pmod{q}} \frac{1}{p}$ diverges, which is a stronger statement.

---

## Overview of the Proof

The proof proceeds in several stages:

1. **Dirichlet characters and $L$-functions.** We introduce the key analytic machinery: Dirichlet characters modulo $q$ and the associated $L$-series $L(s, \chi)$.
2. **Extracting primes in a residue class.** Using the orthogonality relations for characters, we isolate the primes $p \equiv a \pmod{q}$.
3. **Analytic properties of $L(s, \chi)$.** We study the behavior of $L(s, \chi)$ as $s \to 1^+$.
4. **Non-vanishing of $L(1, \chi)$.** The crux: we prove $L(1, \chi) \neq 0$ for every non-principal character $\chi$. This is the hardest part.
5. **Conclusion.** Combining everything, we show $\sum_{p \equiv a \pmod{q}} p^{-1} = +\infty$.

---

## 1. Dirichlet Characters

### Definition

A **Dirichlet character modulo $q$** is a function $\chi : \mathbb{Z} \to \mathbb{C}$ satisfying:

- **Periodicity:** $\chi(n + q) = \chi(n)$ for all $n$.
- **Complete multiplicativity:** $\chi(mn) = \chi(m)\chi(n)$ for all $m, n$.
- **Vanishing on non-coprime integers:** $\chi(n) = 0$ if $\gcd(n, q) > 1$.
- **Non-triviality:** $\chi$ is not identically zero.

Equivalently, a Dirichlet character modulo $q$ is a lift of a group homomorphism $(\mathbb{Z}/q\mathbb{Z})^{\times} \to \mathbb{C}^{\times}$ to $\mathbb{Z}$, extended by zero on integers not coprime to $q$.

### Properties

There are exactly $\varphi(q)$ Dirichlet characters modulo $q$, where $\varphi$ is Euler's totient function.

The **principal character** $\chi_0$ is defined by $\chi_0(n) = 1$ if $\gcd(n,q)=1$ and $\chi_0(n) = 0$ otherwise.

Since $(\mathbb{Z}/q\mathbb{Z})^{\times}$ is a finite abelian group, the characters are exactly the elements of its dual group $\widehat{(\mathbb{Z}/q\mathbb{Z})^{\times}}$.

### Orthogonality Relations

The characters satisfy two fundamental orthogonality relations:

**First orthogonality relation (sum over characters):**

$$\sum_{\chi \bmod q} \chi(m)\overline{\chi(n)} = \begin{cases} \varphi(q) & \text{if } m \equiv n \pmod{q} \text{ and } \gcd(m,q)=1, \\ 0 & \text{otherwise.} \end{cases}$$

**Second orthogonality relation (sum over residues):**

$$\sum_{\substack{n=1 \\ \gcd(n,q)=1}}^{q} \chi(n)\overline{\chi'(n)} = \begin{cases} \varphi(q) & \text{if } \chi = \chi', \\ 0 & \text{otherwise.} \end{cases}$$

These follow from the standard orthogonality of characters of finite abelian groups.

---

## 2. Dirichlet $L$-Functions

### Definition

For a Dirichlet character $\chi$ modulo $q$ and $\text{Re}(s) > 1$, the **Dirichlet $L$-function** is

$$L(s, \chi) = \sum_{n=1}^{\infty} \frac{\chi(n)}{n^s}.$$

### Euler Product

Since $\chi$ is completely multiplicative, $L(s, \chi)$ admits an Euler product for $\text{Re}(s) > 1$:

$$L(s, \chi) = \prod_{p \text{ prime}} \left(1 - \frac{\chi(p)}{p^s}\right)^{-1}.$$

Taking logarithms (using the principal branch):

$$\log L(s, \chi) = \sum_{p} \sum_{k=1}^{\infty} \frac{\chi(p)^k}{k \, p^{ks}} = \sum_{p} \frac{\chi(p)}{p^s} + O(1)$$

where the $O(1)$ term accounts for the $k \geq 2$ terms, which converge absolutely for $\text{Re}(s) > \tfrac{1}{2}$.

### Connection to the Principal Character

For the principal character $\chi_0$:

$$L(s, \chi_0) = \prod_{p \nmid q} \left(1 - \frac{1}{p^s}\right)^{-1} = \zeta(s) \prod_{p \mid q} \left(1 - \frac{1}{p^s}\right)$$

where $\zeta(s)$ is the Riemann zeta function. Since $\zeta(s)$ has a simple pole at $s=1$ with residue 1, so does $L(s, \chi_0)$ — specifically:

$$L(s, \chi_0) \sim \frac{\prod_{p|q}(1 - 1/p)}{s - 1} = \frac{\varphi(q)/q}{s-1} \quad \text{as } s \to 1^+.$$

---

## 3. Isolating Primes in a Residue Class

Using the first orthogonality relation with $n = a$, for any $m$ coprime to $q$:

$$\frac{1}{\varphi(q)} \sum_{\chi \bmod q} \overline{\chi(a)} \, \chi(m) = \begin{cases} 1 & \text{if } m \equiv a \pmod{q}, \\ 0 & \text{otherwise.} \end{cases}$$

Therefore:

$$\sum_{\substack{p \leq x \\ p \equiv a \pmod{q}}} \frac{1}{p^s} = \frac{1}{\varphi(q)} \sum_{\chi \bmod q} \overline{\chi(a)} \sum_{p} \frac{\chi(p)}{p^s}.$$

Using the logarithmic derivative of $L(s, \chi)$ from the Euler product:

$$\sum_{\substack{p \\ p \equiv a \pmod{q}}} \frac{1}{p^s} = \frac{1}{\varphi(q)} \sum_{\chi \bmod q} \overline{\chi(a)} \left( \log L(s, \chi) + O(1) \right)$$

for real $s > 1$ (where we use that $\log L(s,\chi) = \sum_p \chi(p)/p^s + O(1)$).

As $s \to 1^+$, the $\chi = \chi_0$ term contributes:

$$\frac{1}{\varphi(q)} \overline{\chi_0(a)} \log L(s, \chi_0) = \frac{1}{\varphi(q)} \log \frac{1}{s-1} + O(1) \to +\infty.$$

**The key question:** Do the non-principal terms $\chi \neq \chi_0$ contribute a bounded quantity as $s \to 1^+$?

This holds if and only if $\log L(s, \chi)$ remains bounded as $s \to 1^+$ for each $\chi \neq \chi_0$, which in turn holds if and only if $L(1, \chi) \neq 0$ and $L(s, \chi)$ extends continuously (or at least stays bounded) near $s = 1$.

---

## 4. Analytic Continuation of $L(s, \chi)$ for $\chi \neq \chi_0$

For non-principal characters, $\sum_{n=1}^{q} \chi(n) = 0$ (by the second orthogonality relation applied with $\chi' = \chi_0$). This cancellation allows us to extend $L(s, \chi)$ beyond $\text{Re}(s) > 1$.

**Partial summation argument.** Let $A(x) = \sum_{n \leq x} \chi(n)$. Since $\chi$ is periodic with period $q$ and $\sum_{n=1}^{q}\chi(n) = 0$, we have $|A(x)| \leq q$ for all $x$. By Abel's summation formula (partial summation):

$$L(s, \chi) = s \int_{1}^{\infty} \frac{A(t)}{t^{s+1}} \, dt.$$

Since $A(t) = O(1)$, this integral converges for $\text{Re}(s) > 0$, providing an analytic continuation of $L(s, \chi)$ to the half-plane $\text{Re}(s) > 0$.

In particular, $L(1, \chi)$ is a well-defined complex number for every non-principal character $\chi$. We can write:

$$L(1, \chi) = \sum_{n=1}^{\infty} \frac{\chi(n)}{n}$$

where this series converges (conditionally) by Dirichlet's test, using the boundedness of the partial sums $A(x)$.

---

## 5. The Non-Vanishing Theorem: $L(1, \chi) \neq 0$

This is the heart of the proof. We must show $L(1, \chi) \neq 0$ for all non-principal $\chi \bmod q$. We handle complex and real characters separately.

### Case 1: Complex Characters ($\chi \neq \overline{\chi}$, i.e., $\chi^2 \neq \chi_0$)

Consider the product over all characters:

$$\prod_{\chi \bmod q} L(s, \chi).$$

**Claim:** For real $s > 1$:

$$\prod_{\chi \bmod q} L(s, \chi) = \sum_{n=1}^{\infty} \frac{a_n}{n^s}$$

where $a_n \geq 0$ for all $n$, and in fact this product equals a Dirichlet series with non-negative coefficients.

**Proof of claim.** Taking the logarithm using the Euler product:

$$\log \prod_{\chi} L(s, \chi) = \sum_{\chi} \sum_{p} \sum_{k=1}^{\infty} \frac{\chi(p)^k}{k\,p^{ks}}.$$

For a fixed prime $p$ with $\gcd(p,q)=1$, and a fixed $k$:

$$\sum_{\chi \bmod q} \chi(p)^k = \sum_{\chi \bmod q} \chi(p^k) = \begin{cases} \varphi(q) & \text{if } p^k \equiv 1 \pmod{q}, \\ 0 & \text{otherwise.} \end{cases}$$

Therefore:

$$\log \prod_{\chi} L(s, \chi) = \varphi(q) \sum_{p} \sum_{\substack{k \geq 1 \\ p^k \equiv 1 \pmod{q}}} \frac{1}{k \, p^{ks}} \geq 0.$$

This implies $\prod_{\chi} L(s, \chi) \geq 1$ for all real $s > 1$.

Now suppose $L(1, \chi_1) = 0$ for some complex character $\chi_1$. Since $L(s, \overline{\chi}) = \overline{L(s, \chi)}$ for real $s$, and $\chi_1 \neq \overline{\chi_1}$, we also have $L(1, \overline{\chi_1}) = 0$. So the product $\prod_{\chi} L(s, \chi)$ has at least a double zero at $s = 1$ from $\chi_1$ and $\overline{\chi_1}$.

But the only pole comes from $L(s, \chi_0)$, which has a simple pole at $s=1$. So:

$$\prod_{\chi} L(s, \chi)$$

would have a zero at $s=1$ (double zero minus simple pole gives at least a simple zero). But we showed this product is $\geq 1$ for real $s > 1$. By continuity, $\lim_{s \to 1^+} \prod_{\chi} L(s,\chi) \geq 1$, contradicting a zero at $s=1$.

Hence $L(1, \chi) \neq 0$ for all complex characters. $\square$

### Case 2: Real Characters ($\chi = \overline{\chi}$, $\chi \neq \chi_0$)

A real non-principal character takes values in $\{-1, 0, 1\}$ and is essentially the Legendre/Jacobi/Kronecker symbol. The argument above only gives a simple zero at $s=1$ (since $\chi = \overline{\chi}$, so we only get one zero) which exactly cancels the simple pole from $\chi_0$. We need a different argument.

There are several approaches. We present two.

#### Approach A: Using the Class Number Formula (Dirichlet's Original Method)

For a primitive real character $\chi$ modulo $q$ (which is a Kronecker symbol $\chi(n) = \left(\frac{D}{n}\right)$ for some fundamental discriminant $D$ with $|D| = q$ or similar), Dirichlet established explicit formulas:

**If $D < 0$ (negative discriminant):**

$$L(1, \chi) = \frac{2\pi h(D)}{w \sqrt{|D|}}$$

where $h(D)$ is the class number of the imaginary quadratic field $\mathbb{Q}(\sqrt{D})$ and $w$ is the number of roots of unity (so $w \in \{2, 4, 6\}$). Since $h(D) \geq 1$, we get $L(1, \chi) > 0$.

**If $D > 0$ (positive discriminant):**

$$L(1, \chi) = \frac{2 h(D) \log \varepsilon}{\sqrt{D}}$$

where $\varepsilon > 1$ is the fundamental unit of $\mathbb{Q}(\sqrt{D})$ and $h(D) \geq 1$. Again $L(1, \chi) > 0$.

These formulas give not just non-vanishing but explicit positivity (and in fact a quantitative lower bound). However, they require the theory of binary quadratic forms or algebraic number theory.

#### Approach B: Analytic Proof (Following de la Vallée Poussin)

We can give a more self-contained analytic argument.

Consider the product:

$$F(s) = \zeta(s) \cdot L(s, \chi)$$

where $\chi$ is a real non-principal character. We will show $L(1, \chi) \neq 0$ by contradiction.

**Step 1.** Consider the function:

$$G(s) = \zeta(s) \cdot L(s, \chi) = \prod_{p \nmid q} \frac{1}{(1 - p^{-s})(1 - \chi(p)p^{-s})}.$$

For primes $p$ where $\chi(p) = 1$: the factor is $(1 - p^{-s})^{-2}$.
For primes $p$ where $\chi(p) = -1$: the factor is $(1 - p^{-2s})^{-1}$.
For primes $p$ where $\chi(p) = 0$: the factor is $(1 - p^{-s})^{-1}$.

All factors can be expanded as Dirichlet series with non-negative coefficients. Hence $G(s) = \sum_{n=1}^{\infty} b_n / n^s$ with $b_n \geq 0$ for all $n$.

**Step 2.** More precisely, $G(s) = \sum_n b_n n^{-s}$ where $b_n \geq 0$ and $b_1 = 1$. For a Dirichlet series with non-negative coefficients, the real axis is crucial: if the series converges for some real $s_0$, then $G(s_0) \geq b_1 = 1 > 0$.

**Step 3.** Now suppose $L(1, \chi) = 0$. Then $G(s) = \zeta(s) L(s, \chi)$ has a simple pole from $\zeta(s)$ at $s=1$ and a zero from $L(s, \chi)$ at $s = 1$, so $G(s)$ is analytic at $s = 1$ (they cancel). Since $G(s)$ converges absolutely for $\text{Re}(s) > 1$ and extends analytically through $s=1$, by Landau's theorem (a Dirichlet series with non-negative coefficients that extends analytically beyond its abscissa of convergence must actually converge beyond it), the series $\sum b_n n^{-s}$ would converge for all $s > 0$.

**Step 4 (Landau's Theorem).** Landau's theorem states: if $f(s) = \sum_{n=1}^{\infty} a_n n^{-s}$ with $a_n \geq 0$ has abscissa of convergence $\sigma_c$, then $f$ has a singularity at $s = \sigma_c$ (on the real axis). Equivalently, if $f$ extends analytically past every real point $s \geq \sigma_0$, then $\sigma_c \leq \sigma_0$.

*Proof of Landau's Theorem.* Suppose $f$ converges for $\text{Re}(s) > \sigma_c$ and is analytic in a neighborhood of $\sigma_c$. Then for any $s_0 > \sigma_c$:

$$f(s) = \sum_{k=0}^{\infty} \frac{f^{(k)}(s_0)}{k!}(s - s_0)^k$$

in some disk around $s_0$. Computing derivatives:

$$f^{(k)}(s_0) = \sum_{n=1}^{\infty} a_n \frac{(-\log n)^k}{n^{s_0}} = (-1)^k \sum_{n=1}^{\infty} \frac{a_n (\log n)^k}{n^{s_0}}.$$

For $s < s_0$ (real):

$$f(s) = \sum_{k=0}^{\infty} \frac{(s_0 - s)^k}{k!} \sum_{n=1}^{\infty} \frac{a_n (\log n)^k}{n^{s_0}}.$$

Since all terms $a_n \geq 0$, we can interchange sums:

$$f(s) = \sum_{n=1}^{\infty} \frac{a_n}{n^{s_0}} \sum_{k=0}^{\infty} \frac{(s_0 - s)^k (\log n)^k}{k!} = \sum_{n=1}^{\infty} \frac{a_n}{n^{s_0}} \cdot n^{s_0 - s} = \sum_{n=1}^{\infty} \frac{a_n}{n^s}.$$

So the Dirichlet series converges for $s$ to the left of $s_0$ as long as the Taylor series converges, meaning it converges for $s > s_0 - r$ where $r$ is the radius of convergence of the Taylor series at $s_0$. If $f$ is analytic in a neighborhood of $\sigma_c$, we can take $s_0$ close to $\sigma_c$ and push convergence below $\sigma_c$, a contradiction. $\square$

**Step 5.** Applying Landau's theorem: if $L(1,\chi) = 0$, then $G(s)$ is analytic for $\text{Re}(s) > 0$ (the pole at $s=1$ is cancelled), and since it has non-negative coefficients, it converges for all $s > 0$. In particular, $G(s) \to +\infty$ as $s \to 0^+$:

$$G(s) \geq b_1 \cdot 1^{-s} = 1 > 0$$

for all $s > 0$.

But let us evaluate $G(s)$ differently for $s$ near 0. We know:

$$G(s) = \zeta(s) L(s, \chi).$$

$\zeta(s)$ has a known value $\zeta(0) = -1/2$ and $L(0, \chi)$ is finite (by the analytic continuation). But $\zeta(s)$ has a simple pole at $s=1$ and is negative for $s \in (0,1)$: specifically $\zeta(s) < 0$ for $0 < s < 1$. Since $L(1,\chi) = 0$ means $L(s, \chi) > 0$ for real $s$ near 1 with $s > 1$ (from the Euler product with non-negative log), by continuity $L(s,\chi)$ can be shown to be positive for $s \in (0,1)$ as well (or at least eventually positive as $s \to 1^-$).

More carefully: since $G(s) = \sum b_n n^{-s}$ converges for $s > 0$ with $b_n \geq 0$, we need $G(s) > 0$ for all $s > 0$. But $\zeta(s)$ has the pole at $s=1$ with residue 1 and $L(s,\chi) = 0$ at $s=1$, so $G$ extends to $s = 1$. For $s$ slightly less than 1, $\zeta(s) \to -\infty$ (approaching from the left of the pole). Meanwhile $L(s, \chi)$ approaches $L(1,\chi) = 0$, and the question is the sign.

Actually, let us be more careful and use a cleaner version of the argument.

**Cleaner version:** Consider

$$\Phi(s) = \prod_{\chi \bmod q} L(s, \chi) = \sum_{n=1}^{\infty} \frac{c_n}{n^s}, \quad c_n \geq 0.$$

We showed $c_n \geq 0$ and the product is $\geq 1$ for $s > 1$.

$\Phi(s)$ has a simple pole at $s=1$ from $L(s,\chi_0)$.

If $L(1, \chi_1) = 0$ for a single real character $\chi_1$, this zero cancels the pole, and $\Phi$ is analytic for $\text{Re}(s) > 0$. By Landau's theorem, $\sum c_n n^{-s}$ converges for all $s > 0$.

Now consider $s \to 0^+$. We know $\Phi(s) \geq c_1 = 1 > 0$ for all $s > 0$. But:

$$\Phi(0) = \prod_{\chi} L(0, \chi).$$

It is known that $L(0, \chi_0) = \zeta(0) \prod_{p|q}(1 - 1) = 0$ if $q > 1$ (since some factor vanishes... actually $L(0, \chi_0) = -\prod_{p|q}(1-1)/2$; this needs care).

Rather than evaluating at $s = 0$, the cleanest argument uses the following observation:

For $s > 0$ real, $G(s) = \zeta(s) L(s,\chi_1) \geq 0$ (non-negative coefficients). But $\zeta(s) < 0$ for $s \in (0, 1)$, so we need $L(s, \chi_1) \leq 0$ for $s \in (0,1)$. If $L(1, \chi_1) = 0$ and $L(s, \chi_1) > 0$ for $s > 1$ (clear from the Euler product), then by the zero at $s = 1$, $L(s, \chi_1)$ changes sign, so $L(s, \chi_1) < 0$ for $s$ slightly less than 1. This is consistent so far.

But now consider the full product. We use a refined version:

$$\zeta(s)^2 \cdot L(s, \chi_1)^2 \cdot \zeta(2s) \cdot L(2s, \chi_1) \cdots$$

Actually, the most efficient argument uses the function:

$$h(s) = \zeta(s) L(s, \chi_1)$$

and notes that its Dirichlet series $\sum b_n n^{-s}$ satisfies $b_n \geq 0$, $b_1 = 1$, and (if $L(1,\chi_1)=0$) converges for all $s > 0$. Then:

$$h(s) \geq 1 \quad \text{for all } s > 0.$$

But we can compute $h$ at specific points. Actually, the most elementary completion of the argument is:

Consider $h(\sigma)$ for small $\sigma > 0$. Since $\zeta(s) = \frac{1}{s-1} + \gamma + O(s-1)$ near $s = 1$, and if $L(1,\chi_1) = 0$ with $L(s, \chi_1) = L'(1, \chi_1)(s-1) + O((s-1)^2)$, then $h(1) = L'(1, \chi_1)$ is finite.

Now for $0 < \sigma < 1$, $\zeta(\sigma) = \frac{1}{\sigma - 1} + \gamma + \cdots < 0$ (it diverges to $-\infty$ as $\sigma \to 1^-$, but for $\sigma$ away from 1 it's a specific negative number).

At $\sigma = 1/2$: $\zeta(1/2) \approx -1.46$. And $L(1/2, \chi_1)$ is some real number. If $L(1, \chi_1) = 0$, then $h(s)$ is entire on $(0, \infty)$, but $h(1/2) = \zeta(1/2) L(1/2, \chi_1)$ needs to be $\geq 1$.

We need a more definitive contradiction. Here it is:

**Definitive argument.** Expand $G(s)$ as a Dirichlet series. We have $b_n \geq 0$ and in particular $b_{n^2} \geq 1$ for all $n$ coprime to $q$ (since $\chi_1(n^2) = 1$ for $\gcd(n,q) = 1$). This means:

$$G(\sigma) = \sum_{n=1}^{\infty} \frac{b_n}{n^\sigma} \geq \sum_{\substack{m=1 \\ \gcd(m,q)=1}}^{\infty} \frac{1}{m^{2\sigma}}$$

The right side diverges as $\sigma \to 1/2^+$ (it's essentially $\zeta(2\sigma) \to \infty$).

But if $L(1, \chi_1) = 0$, $G$ is analytic at $s = 1$ and indeed for all $\text{Re}(s) > 0$. By Landau's theorem, the Dirichlet series converges for $\sigma > 0$, and $G(\sigma)$ is finite for all $\sigma > 0$. In particular $G(1/2)$ should be finite. But we just showed $G(\sigma) \to \infty$ as $\sigma \to 1/2^+$. 

Wait — that bound isn't quite right because $b_{m^2}$ might be large but we need to be more precise about the lower bound.

Let me give the cleanest standard argument.

**Clean argument using $\zeta_K$.** The product $\zeta(s) L(s, \chi_1)$ equals the Dedekind zeta function $\zeta_K(s)$ of the quadratic field $K = \mathbb{Q}(\sqrt{D})$ (up to finitely many Euler factors), where $\chi_1 = \left(\frac{D}{\cdot}\right)$. The Dedekind zeta function is known to have a simple pole at $s = 1$ (this follows from the finiteness of the class number, or from a lattice point counting argument). Hence $L(1, \chi_1) \neq 0$.

**Self-contained analytic argument.** Here is the standard textbook proof:

Define for real $s > 0$:

$$\psi(s) = \sum_{n=1}^{\infty} d_\chi(n) \, n^{-s}$$

where $d_\chi(n) = \sum_{d | n} \chi_1(d)$. Note that $d_\chi(n) \geq 0$ for all $n$ (since $\chi_1$ is real and $d_\chi(n)$ counts, with signs, the divisors of $n$; more precisely, $d_\chi$ is the Dirichlet convolution $\mathbf{1} * \chi_1$, and for real characters this function is non-negative — indeed $d_\chi(n) = \sum_{d|n} \chi_1(d)$ is a multiplicative function and for prime powers $d_\chi(p^k) = 1 + \chi_1(p) + \cdots + \chi_1(p)^k \geq 0$).

Moreover $\psi(s) = \zeta(s) L(s, \chi_1)$ for $s > 1$, by Dirichlet series multiplication.

And $d_\chi(n) \geq 1$ whenever $n$ is a perfect square coprime to $q$ (since $\chi_1(d) = 1$ when $d = 1$ and $d = n$, and all intermediate terms are $\geq -1$; more precisely, $d_\chi(m^2) = \sum_{d | m^2} \chi_1(d) \geq 1$ because the sum includes $d_\chi(1) = 1$ and $d_\chi(m^2) \geq 0$ by the multiplicativity argument, and it equals at least 1 since for $p^{2k}$ we get $d_\chi(p^{2k}) = 1 + \chi(p) + \cdots + \chi(p)^{2k} \geq 1$ regardless of whether $\chi(p) = \pm 1$ or $0$).

So:

$$\psi(s) \geq \sum_{\substack{m=1\\\gcd(m,q)=1}}^{\infty} \frac{1}{m^{2s}}.$$

As $s \to 1/2^+$, the right side diverges. But $\psi(s) = \zeta(s) L(s, \chi_1)$, and:

- $\zeta(s)$ has a simple pole at $s=1$.
- If $L(1, \chi_1) = 0$, then $\psi$ is analytic at $s = 1$ and (by Landau's theorem for non-negative Dirichlet series) $\psi$ converges for all $s > 1/2$ (or wherever the next singularity is). But the lower bound shows $\psi(s) \to +\infty$ as $s \to 1/2^+$. So the abscissa of convergence of $\psi$ is at least $1/2$, meaning $\psi$ has a singularity at $s = 1/2$ or to the right of it.

But actually, $\zeta(s)$ is meromorphic everywhere with its only pole at $s=1$, and $L(s, \chi_1)$ is entire (for non-principal $\chi_1$). So $\psi(s) = \zeta(s)L(s,\chi_1)$ is meromorphic with its only possible pole at $s=1$. If $L(1,\chi_1)=0$, then $\psi$ is entire on $\text{Re}(s) > 0$. By Landau's theorem, the Dirichlet series (with non-negative coefficients) must converge for all $\text{Re}(s) > 0$. But the lower bound $\psi(s) \geq \sum_{m \geq 1} m^{-2s}$ shows divergence at $s = 1/2$. **Contradiction.** $\square$

(Note: The meromorphic continuation of $L(s,\chi)$ to $\text{Re}(s) > 0$ follows from the partial summation argument in Section 4. The meromorphic continuation of $\zeta(s)$ to $\text{Re}(s) > 0$ can be established by $\zeta(s) = \frac{1}{s-1} + 1 - s\int_1^\infty \frac{\{t\}}{t^{s+1}}dt$ for $\text{Re}(s)>0$, which only has a simple pole at $s=1$.)

---

## 6. Conclusion

We now assemble the proof.

**Combining the ingredients:**

For real $s > 1$:

$$\sum_{\substack{p \\ p \equiv a \pmod{q}}} \frac{1}{p^s} = \frac{1}{\varphi(q)} \sum_{\chi \bmod q} \overline{\chi(a)} \left(\log L(s,\chi) + g_\chi(s)\right)$$

where each $g_\chi(s)$ is bounded as $s \to 1^+$.

- For $\chi = \chi_0$: $\log L(s, \chi_0) \sim \log \frac{1}{s-1} \to +\infty$.
- For $\chi \neq \chi_0$: $L(s, \chi) \to L(1, \chi) \neq 0$ (by Sections 4–5), so $\log L(s, \chi) \to \log L(1, \chi)$, which is finite.

Therefore:

$$\sum_{\substack{p \\ p \equiv a \pmod{q}}} \frac{1}{p^s} = \frac{1}{\varphi(q)} \log\frac{1}{s-1} + O(1) \quad \text{as } s \to 1^+.$$

Since the right side diverges as $s \to 1^+$, the sum over primes $p \equiv a \pmod{q}$ must include infinitely many terms. In fact, letting $s \to 1^+$:

$$\boxed{\sum_{\substack{p \text{ prime} \\ p \equiv a \pmod{q}}} \frac{1}{p} = +\infty.}$$

This proves Dirichlet's theorem: there are infinitely many primes $p \equiv a \pmod{q}$.

Moreover, the asymptotic $\frac{1}{\varphi(q)} \log \frac{1}{s-1}$ is the same for every admissible residue class $a$, showing that the primes are **equidistributed** among the $\varphi(q)$ reduced residue classes modulo $q$, in the sense of Dirichlet density.

---

## Summary of Key Steps

1. **Characters and orthogonality** allow us to write a sum over primes in a single residue class as a linear combination of $\log L(s, \chi)$ over all characters $\chi \bmod q$.

2. **The principal character** contributes a term that diverges like $\log\frac{1}{s-1}$, inheriting the pole of $\zeta(s)$.

3. **Non-principal characters** contribute bounded terms, provided $L(1, \chi) \neq 0$.

4. **Non-vanishing of $L(1,\chi)$:**
   - For **complex** $\chi$: the product $\prod_\chi L(s,\chi)$ has non-negative Dirichlet coefficients and is $\geq 1$; a zero would create too many zeros to be compensated by the single pole.
   - For **real** $\chi$: $\zeta(s)L(s,\chi)$ has non-negative Dirichlet coefficients; if $L(1,\chi)=0$ the product would be analytic on $\text{Re}(s) > 0$, but a lower bound shows it diverges at $s = 1/2$, contradicting Landau's theorem.

$\blacksquare$
