---
title: Gradient descent on the Stiefel manifold
date: 2026-11-23
draft: true
summary: Optimizing under orthogonality constraints, starting from the sphere.
---

Many models want weights with orthonormal columns: orthogonal RNN transitions, whitening layers, low-rank factors. The set of such matrices is the **Stiefel manifold**

$$ \mathrm{St}(n,k) = \{ X \in \mathbb{R}^{n \times k} : X^\top X = I_k \}. $$

For $k=1$ this is just the unit sphere in $\mathbb{R}^n$, which is the easiest place to see what is going on.

## The recipe

To minimize $f$ on the manifold, repeat three steps:

1. Compute the Euclidean gradient $G = \nabla f(X)$.
2. Project it onto the tangent space at $X$. With the embedded metric, $\operatorname{grad} f(X) = G - X\,\mathrm{sym}(X^\top G)$, where $\mathrm{sym}(A) = (A + A^\top)/2$.
3. Take a step, then **retract** back onto the manifold, for example with a QR decomposition: $X \leftarrow \mathrm{qf}\big(X - \eta\, \operatorname{grad} f(X)\big)$.

On the sphere the retraction is just normalization, and the projected gradient is $g - (x^\top g)\,x$.

## Try it

We minimize the Rayleigh quotient $f(x) = x^\top A x$ on the sphere. Its minimizer is the eigenvector of $A$ with the smallest eigenvalue, so the iterate should land on the green ring.

<div data-viz="stiefel"></div>

Switch the retraction off and watch $\lVert x \rVert$ in the readout. The tangent step is orthogonal to $x$, so each update makes the norm grow by $\eta^2 \lVert \operatorname{grad} f \rVert^2$ and the iterate slowly leaves the manifold. Retraction is what keeps it honest.

## Why it matters

For $k>1$ the same recipe with $f(X) = \mathrm{tr}(X^\top A X)$ finds the bottom-$k$ eigenspace of $A$. Orthogonality-constrained updates also show up in recent work on neural network optimizers, where weights or updates are kept on or near a Stiefel manifold.
