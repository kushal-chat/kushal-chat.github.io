---
title: Entropy, cross-entropy and KL divergence
date: 2026-11-23
summary: One identity explains the loss function behind most language models.
draft: true
---

Take a distribution $P$ over a few outcomes. How many bits does it take, on average, to encode a sample from $P$ with the best possible code? That is the **entropy**:

$$ H(P) = -\sum_i p_i \log_2 p_i. $$

Now suppose you built your code for a different distribution $Q$. The average cost becomes the **cross-entropy**

$$ H(P, Q) = -\sum_i p_i \log_2 q_i, $$

and the extra cost over the optimum is the **KL divergence**:

$$ D_{\mathrm{KL}}(P \,\|\, Q) = \sum_i p_i \log_2 \frac{p_i}{q_i}. $$

Together they satisfy $H(P,Q) = H(P) + D_{\mathrm{KL}}(P\,\|\,Q)$.

## Play with it

Edit $P$ (the data) and $Q$ (the model). The bar at the bottom splits cross-entropy into the part you cannot avoid, $H(P)$, and the part a better model could remove, the KL term.

<div data-viz="infotheory"></div>

Try the **Q = P** button: the red segment disappears, because KL is zero exactly when the model matches the data. A distribution $Q$ that puts almost no mass on an outcome $P$ cares about makes the KL term blow up, because $-\log q_i$ becomes large.

## Why this is the training loss

A language model with next-token distribution $Q$ is trained by minimizing cross-entropy against the empirical data distribution $P$. Since $H(P)$ does not depend on the model, minimizing cross-entropy is the same as minimizing $D_{\mathrm{KL}}(P\,\|\,Q)$. And the **perplexity** $2^{H(P,Q)}$ reads off the cross-entropy as an effective number of equally likely choices, which is the readout shown above the controls.
