---
type: notetag
title: Apply State on Expire
description: The tag applying a follow-up state when a state expires naturally.
tags: [abs, tag, state, expire, chain]
---

# Apply State on Expire

## Description

When a state expires by its natural frame-counter reaching zero, this tag causes a follow-up state to be applied to the
same battler at a given percent chance. This is the backbone of any "chain" state system.

IMPORTANT: This tag fires ONLY on natural expiry. Forced removal — via dispel, script calls, KO, or the food-chain
strip routine — does NOT trigger it. This distinction is intentional so that removing a chain early does not cascade
the chain forward.

Only one `<applyStateOnExpire>` tag per state is read (the first match). The follow-up state inherits the same source
battler as the expiring state.

## TAG USAGE

- States

## TAG FORMAT

`<applyStateOnExpire:[STATE_ID, CHANCE]>`
Where STATE_ID is the integer database id of the state to apply next.
Where CHANCE is an integer percent chance (0–100) of the follow-up firing.

## TAG EXAMPLES

`<applyStateOnExpire:[STATE_PUMPED_ID, 100]>`
A "Well Fed (Protein)" state that always transitions into "Pumped".

`<applyStateOnExpire:[STATE_SCORCHED_ID, 50]>`
A "Burning" state that has a 50% chance to leave a "Scorched" debuff.