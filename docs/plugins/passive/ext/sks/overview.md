---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [passive-sks, overview]
---

# Overview

Without this extension, a learned skill contributes its
[`<passive:[...]>`](../../core/notetags/passive-states.md) effect the instant it is known, regardless of whether it is
equipped into an `SKS` slot.

This extension narrows an actor's passive-state-sourced skills down to only those currently equipped via `SKS`,
alongside any skill exempt from slotting entirely (tagged `<unslotted>`, or ineligible for slotting by skill type).
Exempt skills behave exactly as they do without this extension- always contributing their passive effect once known.
Enemies are unaffected, since `SKS`'s equip state only exists for actors.