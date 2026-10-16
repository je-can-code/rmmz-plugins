---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.0
  - Added natural growth tags for shield amplification (sar) and shield effectiveness (ser).
### 1.1.3
  - The shield gauge now hangs off the character overlay, so it keeps its own size and stays put through whatever the
    battler beneath it is animating.
### 1.1.2
  - Routed the shield-formula error through J-Base's new Diagnostics, so it names J-ABS-Shield and shows the target,
    attacker and error as named keys rather than three positional values.
### 1.1.1
  - Fixed shields computing different values on application and recalculation.
  - The attacker was omitted the first time, leaving the point formulas without their a binding and the outgoing
    amplification without its source.
### 1.1.0
  - JABS_State.onShieldBreak now passes the broken shield's cap to Game_Battler.onShieldBreak.
  - Game_Battler.onShieldBreak stores the value as lastShieldBreakValue before firing break skills, then clears it
    immediately after. This value is exposed as the formula variable 's' via Game_Action.registerFormulaContext, so a
    skill authored with <shieldBreak:[ID]> can write its damage formula as e.g. "s * 0.30" to deal 30% of the broken
    shield's cap.
  - 's' is 0 for all non-shield-break actions; it never persists across frames.
  - Added SAR (Shield Amplification Rate) and SER (Shield Effectiveness Rate) battler-wide stats via
    <sar:PERCENT_POINTS>/<ser:PERCENT_POINTS>, summed from all note sources plus SDP panel investment. SAR scales
    shields this battler grants; SER scales shields this battler receives.
  - <shield>/<shieldCap> formulas now expose 'a' (applier), 'b' (receiver), and 's' (the shield state itself) —
    previously 'a' was the afflicted target and 'b' was the state, so existing formulas using 'a'/'b' need re-authoring
    against the new meaning.
### 1.0.2
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.1
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.0
  - The initial release.