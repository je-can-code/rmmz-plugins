---
status: open
area: feature
---

# JAFTING freestyle extension

## Source

- [`src/plugins/jafting/ext/freestyle/`](src/plugins/jafting/ext/freestyle/)
- Template metadata still references `J.__TEMPLATE__` / `J-TEMPLATE` from the generic plugin scaffold.

## Context

The freestyle bundle under JAFTING is not implemented as a real feature; it remains placeholder metadata and commands. Core, Creation, and Refinement are the supported JAFTING surfaces.

## Work

- Replace template namespaces with real `J.JAFTING.EXT.FREESTYLE` (or remove the tree from shipping if the feature is abandoned).
- Implement intended gameplay/UI behavior, or document and remove from `plugins.js` recommendations until ready.
