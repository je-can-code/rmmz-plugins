# JABS backlog (per-item)

Phase 3 and related work items live as **one markdown file each** under this directory.

## Layout

| Path | Contents |
|------|----------|
| [`unstarted/`](unstarted/) | Not begun. Includes work that is parked indefinitely — nobody is working on either, so they are the same folder. |
| [`inprogress/`](inprogress/) | Actively being worked. **Move the file here when you start**, not when you finish. |
| [`completed/`](completed/) | Shipped. |
| This file | Conventions and the template. **Not an inventory** — see below. |

**The folder is the status.** There is no `status` field in these files, deliberately: a field that restates the directory name is a second copy of one fact, and by 2026-08-23 six files in `completed/` still had frontmatter calling them open. There is no `area` field either — that is what the title is for, and the field had rotted into thirteen values including nine files marked `area: completed`, which is a status in the wrong box. A file's frontmatter is now for things nothing else records: a `completed:` date, a `parent:` item, the `ship:` it landed in.

**And there is no inventory table.** A hand-maintained list of a directory listing drifts every time someone closes an item and updates two of the three places; the old one had accumulated nine dead rows, six items it had never heard of, and six whose status it got wrong. `ls unstarted/` is always correct. A list in this file is correct only until the next close.

## Moving an item along

- **Starting** — move the file into [`inprogress/`](inprogress/).
- **Finished** — move the file into [`completed/`](completed/).
- **Cancelled** — **delete the file.** A cancelled item is either no longer relevant or a conscious "we are not doing that," and neither is worth carrying as clutter that has to be read and dismissed on every pass through the folder. Git history keeps it if the reasoning is ever wanted again.

**`inprogress/` is the "did we forget something?" folder.** Half-landed work is the state that actually goes missing: a plan whose code shipped but whose data pass did not, an item paused for a week that everyone remembers differently. With nowhere to put it, it stayed filed as unstarted and looked untouched — `localised-equipment-parameters` sat there for two weeks after shipping. A folder that should almost always be near-empty is a loud one; anything sitting in it a while is a question worth asking out loud.

The natural moment to do all of this is **PR time**, alongside the version bumps and changelog blocks — that is already when the diff gets reverse-analysed to work out what shipped, which is the same judgment call.

## File naming

Use a stable **kebab-case** slug: `team-parameterization.md`, not line numbers in the filename. Rename files only when the scope of the item changes enough to warrant a new identity.

## Definition of done

**Every item needs one, and it has to be checkable by someone who was not there.** Name the command to run, the file or symbol to look for, or the thing to do in-game and what should happen. Not "the crafting scene feels right" — `ls src/plugins/_base/core/windows/Window_FilterableList.js`, or `bun run hotfix`, or "open the SDP menu, press R2, the strip changes family."

This is the section that keeps the folder honest. The 2026-08-23 sweep found seventeen items whose real status Jeremy knew and the files did not, and the reason none of them got filed was that answering "is this done?" meant re-reading a 500-line plan and going hunting through source. An item you can verify in one command gets closed the day it lands. An item you cannot gets left open until someone does an audit.

It also protects against the opposite error: a plan can be fully executed and still not be done, because a data pass or a display change never happened. Writing the check down at authoring time is what makes that visible at close time.

## Template (copy into `unstarted/`)

Longer items are worth a short **Severity** and **Gain** section up top, as several already have — that is what the old inventory table was really carrying, and it belongs with the item rather than in a copy of it.

```markdown
# Short title

## Source

- `path/to/file.js` (approximate lines or symbol names)

## Context

Why this exists; what is wrong or missing today.

## Work

Concrete steps or acceptance-style description.

## Definition of done

How a future reader checks this without re-reading the plan. A command, a path, or an
in-game observable — something that answers yes or no in under a minute.

- [ ] `bun run hotfix` green
- [ ] `path/to/NewThing.js` exists and `OldThing.js` is gone
- [ ] in-game: open X, press Y, Z happens

## Notes

Optional: PR links, follow-ups, related backlog files.
```
