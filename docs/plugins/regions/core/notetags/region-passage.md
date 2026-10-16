---
type: notetag
title: Region Passage
description: The tags forcing every tile marked with given region ids on a map to be passable or impassable.
tags: [regions, tag, map, region, passage]
---

# Region Passage

## Description

Have you ever wanted a character on a particular map have the ability to traverse otherwise untraversable tiles? Or
possibly restrict traversal upon tiles that are normally traversable? Well now you can! By adding the appropriate tags
to the map properties, you too can control variable passage by region id!

## NOTE ABOUT OVERLAPPING IDS IN TAGS

If you use the same region id in both tags on the same map, the deny will take priority and prevent passage.

## NOTE ABOUT PLUGIN PARAMETERS

In addition to the per-map per-tag configuration, there is also a global array for both
[allow](../parameters/global-allow-regions.md) and [deny](../parameters/global-deny-regions.md) in case you want to
specify some regionIds that will always be either allow/deny. The regionIds that are identified as "global" are not
given any special treatment, and are simply concatenated into any found tags on the maps.

## TAG USAGE

- Maps, in the map's Properties.

## TAG FORMAT

`<allowRegions:[REGION_IDS]>`
`<denyRegions:[REGION_IDS]>`
Where REGION_IDS is a comma-delimited list of region ids used on the map.

## TAG EXAMPLES

`<allowRegions:[1]>`
A tile marked with the region id of 1 will become passable.

`<denyRegions:[2,3,4]>`
A tile marked with the region id of 2, 3, or 4 will become impassable.