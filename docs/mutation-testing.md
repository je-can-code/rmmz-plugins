# Mutation testing

Coverage proves a line **ran**. Nothing in it proves anything **checked** it, and the gap between those
two is where a suite quietly stops protecting anything. Mutation testing is the only automated way to
see that gap: it deliberately breaks a branch in the source and asks whether any test notices.

- Tests go **red** -> the mutant is **killed**. Something genuinely constrains that branch.
- Tests stay **green** -> the mutant **survived**. The branch executed, and nothing asserted on the
  difference it makes.

Every measured file here is already at 100% branch coverage, which sharpens the inference considerably:
a survivor **cannot** mean "no test reached it." It reached it. So a survivor is necessarily an
assertion gap, a redundant guard, or an equivalent mutant — never a reachability problem.

```bash
bun run mutate src/plugins/_base/core/managers/TraitResolver.js   # one file
bun run mutate src/plugins/_base/core                             # a whole ship
```

The tool is `src/build-tools/mutate.js`, wrapping [StrykerJS](https://stryker-mutator.io). It prints a
score plus every survivor beside **the exact expression it replaced** — which matters, because Stryker
emits several mutants per line (the whole condition, then each sub-expression), and "line 313 survived"
cannot tell you which of the three it was.

---

## Reading a survivor

**This is the whole skill, and it is not automatable.** A survivor is not a defect until you have read
it. There are exactly three kinds, and they call for three different actions:

### 1. A missing assertion -> write the test

The branch matters and nothing pins it. Most survivors are this.

### 2. A redundant guard -> raise it as a deletion candidate

The branch cannot change the outcome, because something downstream already handles it. `JaftingSalvage-
Manager` normalized a field that the very next call normalized identically; `RPGManager`'s empty-
collection early returns produce the same `0`/`null` the fall-through produces. **Raise these; do not
delete them on your own** — see the "stop and raise it" rule in `CLAUDE.md`.

### 3. Equivalent by construction -> prove it and move on

The mutant changes the code without changing its behavior. Never contrive a test to kill one. The
recurring shapes here:

- **Optimization guards.** `if (conflicts.size === 0) return base;` short-circuits work that would
  produce the identical result anyway. Forcing it `false` runs a filter that removes nothing.
- **An `if` guarding a `while` with the same condition.** Entering the block is a no-op because the
  loop immediately declines to run.
- **Spreading an empty collection.** `if (found.length) push(...found)` — pushing nothing is nothing.
- **Consecutive `switch` cases returning the same value.** Emptying a case body falls through to a case
  returning the identical thing. `ColorManager`'s two element tables are this — **30 of its 35
  survivors**, and not one of them is killable.

  **A lookup table is not equivalent because it is a lookup table.** `TextManager` carried the same
  reputation on nothing but resemblance, and all **31** of its survivors turned out to be killable:
  every adjacent case there returns a *distinct* pair of strings, and the fixtures asserted
  `toHaveLength(2)` against a table where every case returns two elements. Shape held while identity
  went unchecked, exactly like `TraitResolver`.

  The survivor list tells you which one you have before you read any test, and the tell is **which
  case is missing**:

  | What survived | What it means |
  |---|---|
  | Every case *except the terminator of each run* | Same-value runs. Genuine equivalents — the terminator died only because it falls into the *next* run. |
  | Every case *except the last one in the whole switch* | Distinct values with a shape-only assertion. All killable — the last one died only because it falls through to `undefined`. |

  Settle it by reading two adjacent cases and asking whether they return the same thing. That is the
  entire question, and it takes ten seconds.

> **Deciding equivalence is undecidable in general** — it reduces to the halting problem. No tool will
> ever sort this pile for you, which means a mutation score never legitimately reaches 100. Anyone
> reporting 100 is either counting wrong or writing contrived tests to farm the number.

---

## What survivors actually look like here

Two shapes account for the overwhelming majority of real gaps found so far. Both are worth recognizing
on sight.

### A fixture with one of everything

`TraitResolver` sat at 100% coverage behind tests that were well named and written one per branch — all
four cross-product cases of its opposing-pair cancellation, deliberately covered. Every identity
predicate in it could still be replaced with `true` without a single test noticing, because each list
held exactly one trait per code:

```js
const base = [ trait(41, 3, 1) ];
const material = [ trait(42, 3, 1) ];
expect(result).toEqual([]);
```

With one candidate, "matches this one" and "matches everything" are the same program. Adding a
**near-miss sibling** that must survive — `trait(41, 7, 1)`, same code, different dataId — killed 27 of
its 30 survivors. The rule now lives in `CLAUDE.md` as *"good test data is not a sample size of one."*

### One operand of an `||` chain carrying the whole condition

```js
if (this.format === ParameterFormat.PERCENT_SUFFIX
  || this.format === ParameterFormat.PERCENT_CENTERED
  || this.format === ParameterFormat.MULTIPLIER_PERCENT
  || this.format === ParameterFormat.PERCENT)
```

Every test used `PERCENT`, so the other three operands could each be forced `false` unnoticed. A
four-operand `||` is four conditions and needs four cases — the same rule as one `it` per branch,
applied inside a compound condition.

---

## Working practice

1. **Scan the file**, read every survivor, and sort it into one of the three buckets before writing
   anything. The bucket decides the action; the score decides nothing.
2. **Observe, then pin.** When a new expectation is needed, run the code and read the actual value
   rather than deriving it from the source. Predicted values are wrong at a surprising rate and the
   errors are confidently reasoned.
3. **Re-scan to confirm the kill.** A green test proves the test passes, not that it constrains
   anything. The only proof is the survivor turning into a kill.
4. **Check for regressions in the diff**, not just the total. Compare survivors before and after by
   `(line, column, end, replacement)` — several mutants share a start position, and keying on the line
   alone silently collapses them into one.
5. **Run `bun run hotfix`** before anything lands, as always.

## Caveats worth knowing

- **Only the conditional operator is enabled**, so the report maps one-to-one onto branch coverage.
  Stryker offers fifteen more. Widening the set finds more but makes the score incomparable to every
  earlier run — **a mutation score is meaningless without naming the operator set it belongs to.**
- **Scores are per-file and not comparable across files.** A lookup table full of same-valued cases
  scores badly and is fine. A file at 100% coverage with a near-zero mutation score is more likely a
  mapping artifact than a worthless suite — investigate before concluding.
- **Nothing is ever mutated in your working tree.** Stryker copies the project into a sandbox outside
  the repo. The scan is read-only as far as git is concerned.
- **The sandbox needs the full tree.** A handful of tests load built bundles from `project/` and
  `out/`; trimming those to speed up the copy breaks them.
- **Speed.** Roughly 50-200 ms per mutant depending on how many tests cover the file — hub files in
  `_base` are the slow ones. A single manager takes seconds; a whole ship takes minutes.
