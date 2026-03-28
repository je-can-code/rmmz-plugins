# JABS backlog (per-item)

Phase 3 and related work items live as **one markdown file each** under this directory.

## Layout

| Path | Contents |
|------|----------|
| [`unstarted/`](unstarted/) | Work not finished yet (`status: open`, or deferred / blocked items you still track here). |
| [`completed/`](completed/) | Shipped or abandoned-as-done items (`status: done`). Move the file here when closing it out. |
| This file | Conventions and template only. |

New entries belong in **`unstarted/`**. When an item is finished, set `status: done` in its frontmatter and **move** the file into **`completed/`**.

## File naming

Use a stable **kebab-case** slug: `team-parameterization.md`, not line numbers in the filename. Rename files only when the scope of the item changes enough to warrant a new identity.

## Frontmatter (optional)

YAML between `---` lines at the top is optional but encouraged for filtering and future tooling.

| Field | Values |
|-------|--------|
| `status` | `open`, `done`, `deferred`, `wontfix` |
| `area` | `architecture`, `feature`, `code-quality`, `ext-star`, `ext-pixel`, `completed` |

Body after frontmatter: title, source pointers, context, and work as in the template below.

## Template (copy into `unstarted/`)

```markdown
---
status: open
area: architecture
---

# Short title

## Source

- `path/to/file.js` (approximate lines or symbol names)

## Context

Why this exists; what is wrong or missing today.

## Work

Concrete steps or acceptance-style description.

## Notes

Optional: PR links, follow-ups, related backlog files.
```

## Inventory

Browse **`unstarted/`** and **`completed/`**; there is no generated index.
