---
status: open
area: abs/core
---

# JABS Parry System Redesign

## Summary

The parry mechanic has historically been difficult to balance. Now that pixel movement
changed the anti-parry model (cast time is the parry window instead of random enemy
facing imprecision), the whole formula deserves a first-principles review.

## Current Behavior

- Player guards with a skill slot that has `<jabsGuard>` or similar.
- A parry succeeds when the player is hit within the parry window while guarding.
- Enemies previously had a 30% chance to not face the player during movement, making
  parry timing less reliable. With pixel movement that roll moved to cast time instead.

## Known Problems

- Parry window timing has been hard to balance across different enemy attack speeds
  and cast times.
- Skills with zero cast time cannot be meaningfully parried — whether this is correct
  game design or a gap is unresolved.
- No per-skill or per-enemy knobs for parry difficulty (e.g. "this boss cannot be parried").

## Questions to Resolve

1. Should parrying be tied to cast time, a dedicated parry window tag, or both?
2. Should zero-cast-time skills always be unparriable, or should they have a tiny
   fixed parry window regardless?
3. Should there be a `<jabsUnparriable>` notetag to opt specific skills out?
4. Is the current parry formula (damage reduction / reflect / counter) correct?
5. Should parry success have a skill-level or battler-level "parry resist" stat?

## Notes

- This was flagged during the pixel movement work (session: pixelistics-v1 branch).
- Do not re-introduce the old movement-phase random facing roll — that is dead with
  pixel movement and has been cleaned up.
