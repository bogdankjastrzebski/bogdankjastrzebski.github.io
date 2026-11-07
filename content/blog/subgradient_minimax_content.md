# Introduction

# informal

Here's a proof of maybe less trivial property, that when solving min_x max_y problem, and running subgradient method to maximize in y the inner function, we can average subgradient w.r.t. x's as well with the same weight we do dual average of y's, and this way we will get a proper $\varepsilon$-subgradient of the function F(x) := max_y f(x, y), which later can be used to minimize F via $\varepsilon$-subgradient method. 

The property is only amazing if we consider how hard it is otherwise to compute the correct gradient/sugbgradient, since we cannot use automatic differentiation for the approximate y*(x). The envelope's theorem doesn't apply directly because the function is not differentiable. The difficulty stems here from the fact that we have to accound for how y* changes with x, in order to correctly evaluate the derivative, as the term regarding y* doesn't vanish like in envelope's theorem proof. 

The standard alternative would be to try to for instance try to approximate the correct direction solving linearized min max round approximate solution. But this requires running next optimization to do that. Moreover, we don't really have an answer to when to stop the maximizing procedure. But here, we can derive constructive bounds on how epsilon in epsilon subgradient vanishes, and therefore the maximization procedure is actually the subgradient estimation procedure. This way, we simply run the subgradient estimation proceduce long enough to get enough accuracte epsilon subgradient. The problem stops being: maximize in y, step in x, and it becomes: run estimation of subgradient in x, for this x (the same algorithm as maximizing w.r.t. y!) and then make step with estimated epsilon subgradient. increase precision as you converge. 

You can also accelerate convergence if you have smoothness of strong convexity assumptions for the F function, which is also worth to mention, that we can demand the dual averaging maximizing f(x, y) w.r.t. y will return estimate of dF(x) with precision relative to its norm, and therefore obtaining linear convergence in the x steps. The same idea applies to momentum method, which likewise can be applied.

The fact that we don't do step in x step in y, correct for rotation type of algorithm, is actually very good, because what we propose with the subgradient method will probably work also in non-convex settings very well. In non-convex settings, or difficult problems, the strong duality doesn't apply and the methods that at the same time change x and y are difficult to handle. This way we propose to solve min-max is very reliable, which goes with the main subgradient method benefit: simple algorithm that does everything, you can apply it to almost all problems and it works.


Let $F(x) = \sup_{y \in Y} f(x, y)$.

### Setup

At a fixed $x$, the algorithm runs for $T$ iterations generating points $\{y_t\}_{t=1}^T$ and positive weights $\{\lambda_t\}_{t=1}^T$ with $\sum_{t=1}^T \lambda_t = 1$.

By assumption, the algorithm attains $\varepsilon_T$-accuracy in function values:


$$\varepsilon_T := F(x) - \sum_{t=1}^T \lambda_t f(x, y_t) \ge 0, \qquad \lim_{T \to \infty} \varepsilon_T = 0$$

Define the weighted average subgradient:


$$\bar{g}_T = \sum_{t=1}^T \lambda_t g_t, \qquad \text{where } g_t \in \partial_x f(x, y_t)$$

---

### Step 1: $\bar{g}_T$ is an $\varepsilon_T$-subgradient of $F$

For any test point $z$, convexity of $f(\cdot, y_t)$ gives:


$$f(z, y_t) \ge f(x, y_t) + \langle g_t, z - x \rangle$$

Multiply each inequality by $\lambda_t$ and sum over $t = 1, \dots, T$:


$$\sum_{t=1}^T \lambda_t f(z, y_t) \ge \sum_{t=1}^T \lambda_t f(x, y_t) + \langle \bar{g}_T, z - x \rangle$$

Since $F(z) \ge f(z, y_t)$ for every $t$, the left side satisfies $F(z) \ge \sum_{t=1}^T \lambda_t f(z, y_t)$. Replacing the first term on the right side with $F(x) - \varepsilon_T$:


$$F(z) \ge F(x) + \langle \bar{g}_T, z - x \rangle - \varepsilon_T \quad \forall z$$

Hence, by definition:


$$\bar{g}_T \in \partial_{\varepsilon_T} F(x)$$

---

### Step 2: Squeezing into the Subdifferential

Assume standard boundedness: $\Vert{}g_t\Vert{} \le M$, so $\Vert{}\bar{g}_T\Vert{} \le M$.

Let $\bar{g}$ be any limit point of $\{\bar{g}_T\}$ along a subsequence $T_k \to \infty$. Passing to the limit in the subgradient inequality:


$$F(z) \ge F(x) + \langle \bar{g}, z - x \rangle - \lim_{k \to \infty} \varepsilon_{T_k} = F(x) + \langle \bar{g}, z - x \rangle \quad \forall z$$

Thus:


$$\bar{g} \in \partial F(x)$$

Equivalently, in terms of set distance:


$$\lim_{T \to \infty} \mathrm{dist}\left(\bar{g}_T, \, \partial F(x)\right) = 0$$


$\blacksquare$
