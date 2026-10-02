### Minimization as the Method of Bounding Sequences

In classical analysis, finding the minimum value of a function is operationalized by bounding the infimum from above and below. To minimize a function $f: \mathbb{R}^n \to \mathbb{R}$ is to construct two observable sequences:

1. A sequence of upper bounds $\{U_k\}_{k=0}^\infty$ such that $U_k \ge f^* \equiv \inf_{x} f(x)$,
2. A sequence of lower bounds $\{L_k\}_{k=0}^\infty$ such that $L_k \le f^*$,

such that the certified optimality gap $\Delta_k \equiv U_k - L_k \ge 0$ converges asymptotically to zero.

The accelerated gradient method of Yurii Nesterov is often presented as an algebraic mystery—a collection of auxiliary sequences, momentum parameters, and estimate functions whose validity is checked only after the fact. This historical framing is misleading. Nesterov's framework is an explicit, constructive realization of the method of bounding sequences: **we do not prove Nesterov’s momentum method; we derive it.**

The algorithm is governed by a singular operational principle: **use knowledge of upper and lower bounds together to derive optimal query points, and update both bounds simultaneously from the same oracle evaluations.**

---

### Dual Models from the First-Order Oracle

Let $f \in \mathcal{F}_{\mu, L}^{1,1}(\mathbb{R}^n)$ be $\mu$-strongly convex with an $L$-Lipschitz continuous gradient ($\mu > 0$). At each iteration, we evaluate the gradient oracle at a query point $\mathbf{\color{#0f766e}{y_k}} \in \mathbb{R}^n$. This single oracle call simultaneously yields two quadratic models of $f$:

**1. The Local Quadratic Upper Bound (Primal Descent)**

By $L$-smoothness, the function is upper-bounded globally by a parabola of curvature $L$ tangent at $\mathbf{\color{#0f766e}{y_k}}$. Minimizing this upper bound yields the candidate iterate $x_{k+1} = \mathbf{\color{#0f766e}{y_k}} - \frac{1}{L}\nabla f(\mathbf{\color{#0f766e}{y_k}})$, guaranteeing the upper bound:


$$f(x_{k+1}) \le f(\mathbf{\color{#0f766e}{y_k}}) - \frac{1}{2L}\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2 \equiv U_{k+1}$$

**2. The Global Quadratic Lower Bound (Dual Memory)**

By $\mu$-strong convexity, the hyperplane at $\mathbf{\color{#0f766e}{y_k}}$ can be lifted into a quadratic lower-bounding minorant of curvature $\mu$:


$$q(x; \mathbf{\color{#0f766e}{y_k}}) \equiv f(\mathbf{\color{#0f766e}{y_k}}) + \langle \nabla f(\mathbf{\color{#0f766e}{y_k}}), x - \mathbf{\color{#0f766e}{y_k}} \rangle + \frac{\mu}{2}\Vert{}x - \mathbf{\color{#0f766e}{y_k}}\Vert{}^2 \le f(x), \quad \forall x \in \mathbb{R}^n$$

Rather than retaining the entire history of cutting planes, we maintain an accumulated lower bound $Q_k(x)$ via an exponential moving average with parameter $\mathbf{\color{#0f766e}{\alpha}} \in (0, 1)$:


$$Q_{k+1}(x) = (1 - \mathbf{\color{#0f766e}{\alpha}}) Q_k(x) + \mathbf{\color{#0f766e}{\alpha}}\, q(x; \mathbf{\color{#0f766e}{y_k}})$$


Initialized with $Q_0(x) = f(x_0) + \frac{\mu}{2}\Vert{}x - x_0\Vert{}^2$ (or the first supporting quadratic $q(x; x_0)$), the Hessian of $Q_k(x)$ remains identically $\mu I$ for all $k$. In vertex form:


$$Q_k(x) = L_k + \frac{\mu}{2}\Vert{}x - v_k\Vert{}^2$$


where $L_k \equiv \min_x Q_k(x)$ is the scalar lower bound on $f^*$, and $v_k = \arg\min_x Q_k(x)$ represents the center of accumulated gradient evidence.

---

### Deriving the Recurrence of the Lower Bound Minimum

Substituting the canonical form into the definition of $Q_{k+1}(x)$ and finding the unconstrained minimizer $v_{k+1}$ via $\nabla Q_{k+1}(v_{k+1}) = 0$ yields the center update:


$$v_{k+1} = (1 - \mathbf{\color{#0f766e}{\alpha}}) v_k + \mathbf{\color{#0f766e}{\alpha}} \mathbf{\color{#0f766e}{y_k}} - \frac{\mathbf{\color{#0f766e}{\alpha}}}{\mu}\nabla f(\mathbf{\color{#0f766e}{y_k}})$$

Evaluating the minimum value $L_{k+1} = Q_{k+1}(v_{k+1})$ gives:


$$L_{k+1} = (1 - \mathbf{\color{#0f766e}{\alpha}}) L_k + \mathbf{\color{#0f766e}{\alpha}} f(\mathbf{\color{#0f766e}{y_k}}) - \frac{\mathbf{\color{#0f766e}{\alpha}}^2}{2\mu}\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2 + \mathbf{\color{#0f766e}{\alpha}}(1 - \mathbf{\color{#0f766e}{\alpha}})\langle \nabla f(\mathbf{\color{#0f766e}{y_k}}), v_k - \mathbf{\color{#0f766e}{y_k}} \rangle + \frac{\mathbf{\color{#0f766e}{\alpha}}(1 - \mathbf{\color{#0f766e}{\alpha}})\mu}{2}\Vert{}\mathbf{\color{#0f766e}{y_k}} - v_k\Vert{}^2$$

Dropping the non-negative dispersion term $\frac{\mathbf{\color{#0f766e}{\alpha}}(1 - \mathbf{\color{#0f766e}{\alpha}})\mu}{2}\Vert{}\mathbf{\color{#0f766e}{y_k}} - v_k\Vert{}^2 \ge 0$ preserves the inequality:


$$L_{k+1} \ge (1 - \mathbf{\color{#0f766e}{\alpha}}) L_k + \mathbf{\color{#0f766e}{\alpha}} f(\mathbf{\color{#0f766e}{y_k}}) - \frac{\mathbf{\color{#0f766e}{\alpha}}^2}{2\mu}\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2 + \mathbf{\color{#0f766e}{\alpha}}(1 - \mathbf{\color{#0f766e}{\alpha}})\langle \nabla f(\mathbf{\color{#0f766e}{y_k}}), v_k - \mathbf{\color{#0f766e}{y_k}} \rangle$$

---

### The Certificate Gap Inequality

We define the certificate gap at iteration $k$ as:


$$\Delta_k \equiv U_k - L_k$$

Our objective is to enforce geometric contraction on this certificate:


$$\Delta_{k+1} \le (1 - \mathbf{\color{#0f766e}{\alpha}})\Delta_k$$

Subtracting the lower bound inequality from the descent inequality $U_{k+1} = f(\mathbf{\color{#0f766e}{y_k}}) - \frac{1}{2L}\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2$:


$$\Delta_{k+1} \le f(\mathbf{\color{#0f766e}{y_k}}) - \frac{1}{2L}\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2 - (1 - \mathbf{\color{#0f766e}{\alpha}}) L_k - \mathbf{\color{#0f766e}{\alpha}} f(\mathbf{\color{#0f766e}{y_k}}) + \frac{\mathbf{\color{#0f766e}{\alpha}}^2}{2\mu}\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2 - \mathbf{\color{#0f766e}{\alpha}}(1 - \mathbf{\color{#0f766e}{\alpha}})\langle \nabla f(\mathbf{\color{#0f766e}{y_k}}), v_k - \mathbf{\color{#0f766e}{y_k}} \rangle$$

Grouping the zero-order terms yields $f(\mathbf{\color{#0f766e}{y_k}}) - \mathbf{\color{#0f766e}{\alpha}} f(\mathbf{\color{#0f766e}{y_k}}) = (1 - \mathbf{\color{#0f766e}{\alpha}})f(\mathbf{\color{#0f766e}{y_k}})$. To relate this to the previous upper bound $U_k$, we invoke convexity of $f$ between $\mathbf{\color{#0f766e}{y_k}}$ and the prior iterate $x_k$:


$$f(\mathbf{\color{#0f766e}{y_k}}) \le f(x_k) + \langle \nabla f(\mathbf{\color{#0f766e}{y_k}}), \mathbf{\color{#0f766e}{y_k}} - x_k \rangle \le U_k + \langle \nabla f(\mathbf{\color{#0f766e}{y_k}}), \mathbf{\color{#0f766e}{y_k}} - x_k \rangle$$

Substituting this into the gap inequality and collecting $(1 - \mathbf{\color{#0f766e}{\alpha}})(U_k - L_k) = (1 - \mathbf{\color{#0f766e}{\alpha}})\Delta_k$:

$$\Delta_{k+1} \le (1 - \mathbf{\color{#0f766e}{\alpha}})\Delta_k + \underbrace{(1 - \mathbf{\color{#0f766e}{\alpha}})\left\langle \nabla f(\mathbf{\color{#0f766e}{y_k}}),\, (\mathbf{\color{#0f766e}{y_k}} - x_k) - \mathbf{\color{#0f766e}{\alpha}}(v_k - \mathbf{\color{#0f766e}{y_k}}) \right\rangle}_{\text{Directional Error Term}} - \underbrace{\left(\frac{1}{2L} - \frac{\mathbf{\color{#0f766e}{\alpha}}^2}{2\mu}\right)\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2}_{\text{Magnitude Error Term}}$$

---

### Extinguishing the Adversarial Errors

The vector $\mathbf{\color{#0f766e}{y_k}} \in \mathbb{R}^n$ and the scalar $\mathbf{\color{#0f766e}{\alpha}} \in (0, 1)$ have not yet been defined; they are **free variables**.

Because $f$ is an arbitrary black-box function, an adversary selects the gradient $\nabla f(\mathbf{\color{#0f766e}{y_k}})$. To ensure the desired contraction unconditionally, the error terms must be neutralized independently using our available degrees of freedom:

**1. Directional Immunity (Determining $\mathbf{\color{#0f766e}{y_k}}$)**

If the vector argument inside the inner product is non-zero, the adversary can choose $\nabla f(\mathbf{\color{#0f766e}{y_k}})$ parallel to that vector with arbitrary magnitude, violating the inequality. We spend our vector degree of freedom $\mathbf{\color{#0f766e}{y_k}}$ to force this displacement to vanish:


$$(\mathbf{\color{#0f766e}{y_k}} - x_k) - \mathbf{\color{#0f766e}{\alpha}}(v_k - \mathbf{\color{#0f766e}{y_k}}) = 0 \implies \mathbf{\color{#0f766e}{y_k}} = \frac{x_k + \mathbf{\color{#0f766e}{\alpha}} v_k}{1 + \mathbf{\color{#0f766e}{\alpha}}}$$

The query point is necessarily a convex combination of the current state $x_k$ and the historical dual anchor $v_k$.

**2. Magnitude Immunity (Determining $\mathbf{\color{#0f766e}{\alpha}}$)**

With the directional error eliminated, the remaining excess depends entirely on the scalar magnitude $\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}^2$. We spend our scalar degree of freedom $\mathbf{\color{#0f766e}{\alpha}}$ to make the quadratic coefficient non-negative:


$$\frac{1}{2L} - \frac{\mathbf{\color{#0f766e}{\alpha}}^2}{2\mu} \ge 0 \implies \mathbf{\color{#0f766e}{\alpha}} \le \sqrt{\frac{\mu}{L}}$$

Maximizing the contraction rate $(1 - \mathbf{\color{#0f766e}{\alpha}})$ demands choosing the largest admissible parameter:


$$\mathbf{\color{#0f766e}{\alpha}} = \sqrt{\frac{\mu}{L}} = \frac{1}{\sqrt{\kappa}}$$

---

### The Synthesis of Primal and Dual Mechanics

Fixing these parameters leaves no residual error:


$$\Delta_{k+1} \le \left(1 - \frac{1}{\sqrt{\kappa}}\right)\Delta_k \implies f(x_k) - f^* \le U_k - L_k \le \left(1 - \frac{1}{\sqrt{\kappa}}\right)^k \Delta_0$$

Nesterov's acceleration is not an empirical trick of physical momentum, but an exact coupling of **primal gradient descent** with **dual mirror descent**:

* When the gradient norm $\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}$ is large, the primal step makes significant descent progress, pushing the upper bound $U_{k+1}$ down by $\mathcal{O}\left(\frac{1}{L}\Vert{}\nabla f\Vert{}^2\right)$.
* When the gradient norm $\Vert{}\nabla f(\mathbf{\color{#0f766e}{y_k}})\Vert{}$ is small, the current point is near stationary, and the dual surrogate minimum $L_{k+1}$ rises by $\mathcal{O}\left(\mathbf{\color{#0f766e}{\alpha}} f(\mathbf{\color{#0f766e}{y_k}})\right)$.

The query point $\mathbf{\color{#0f766e}{y_k}}$ is the exact geometric location where the directional liabilities of these two processes cancel, forcing the certificate gap to close at the optimal rate $(1 - 1/\sqrt{\kappa})$.
