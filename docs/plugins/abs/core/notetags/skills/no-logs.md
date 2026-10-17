---
type: notetag
title: No Logs
description: The tag keeping a state's removal by a purge out of the map's action log.
tags: [abs, tag, state, log]
---

# No Logs

## Description

Place on a STATE to suppress its own removal from being written to the `Map_TextLog` when it is stripped
via `<purgeStates>`.

## TAG USAGE

- States

## TAG FORMAT

`<noLogs>`

## TAG EXAMPLES

`<noLogs>`
This state's removal is not written to the `Map_TextLog` when it is stripped via `<purgeStates>`.