---
type: notetag
title: Stack Type
description: The tag overriding the reapply strategy for an individual state.
tags: [abs, tag, state, reapply]
---

# Stack Type

## Description

By default, all states use the reapply strategy defined in the plugin parameters (refresh, extend, or stack). You can
override this on a per-state basis using these tags on individual states in the database.

Overrides the reapply strategy for this specific state.

## TAG USAGE

- States

## TAG FORMAT

`<stackType:TYPE>`
Where TYPE is one of: refresh, extend, stack.

## TAG EXAMPLES

`<stackType:stack>`
This state uses the stack reapply strategy, rather than the one defined in the plugin parameters.