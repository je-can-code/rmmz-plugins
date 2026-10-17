---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.19.0
    base: true
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-ABS
    version: 4.13.0
    base: false
    orderAfter: true
  - key: J-LevelMaster
    version: 1.0.0
    base: false
    orderAfter: true
  - key: J-Log
    version: 3.0.0
    base: false
    orderAfter: true
  - key: J-NaturalGrowth
    version: 3.0.0
    base: false
    orderAfter: true
  - key: J-SDP
    version: 3.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Base-Save

Persists the actor aptitude records into custom save data.

## J-ABS

Links into battler rewards to grant AP upon enemy defeat.

## J-LevelMaster

Modifies AP gain based on level differences.

## J-Log

Adds historical logs for AP gained from killing J-ABS enemies in the action log and learning skills in the dia log.

## J-NaturalGrowth

Enables buff/growth and rate/plus for the `apr` parameter.

## J-SDP

Enables `apr` growth from SDPs.
