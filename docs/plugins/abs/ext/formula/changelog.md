---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.1.2
  - Routed the formula-failure warning and its stack through J-Base's new Diagnostics, so it names J-ABS-Formula in the
    console.
### 1.1.1
  - Repointed formula packet logging at J-Log's new $mapLogs registry. The $actionLogManager global this called is gone.
    Requires J-Log 3.0.0 when J-Log is installed at all.
### 1.1.0
  - Changed <on-HH:to-AA:by-formula:for-RR:[FORMULA]> to <onApplyFormula:[HH, AA, RR, FORMULA]>, and
    <on-HH:to-AA:by-skill:[SKILL_ID]> to <onApplySkill:[HH, AA, SKILL_ID]>. The old tag-name-encoded-enum shape required
    a bespoke, ad-hoc multi-capture-group reader (RPGManager.getAllCapturesFromNoteByRegex) instead of the standardized
    bracket-array family used by every other multi-value tag; the new single bracket form reads through
    getArraysFromNotesByRegex like the rest. No existing Chef Adventure data used these tags, so no migration was
    needed.
  - Replaced eval() with new Function() in evaluateFormula, matching J-Base's removal of eval() from every
    damage/formula path.
  - Dropped the unused reduced/HP-mitigation-display param from generateFormulaActionLogIfAvailable; guarded
    recipient.result() against a null recipient.
### 1.0.4
  - Healing path now also applies HAR (healing rate) on the caster, alongside the existing REC (recovery) on the
    recipient. Requires J-Base 3.2.0+.
### 1.0.2
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.1
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.0
  - Initial release.