---
type: notetag
title: Stack Config Overrides
description: The tags overriding how an individual state stacks, expires and converts.
tags: [abs, tag, state, reapply, stack]
---

# Stack Config Overrides

## TAG USAGE

- Actors, for `<stackMaxBoost:VAL>` only.
- Classes, for `<stackMaxBoost:VAL>` only.
- Weapons, for `<stackMaxBoost:VAL>` only.
- Armor, for `<stackMaxBoost:VAL>` only.
- States

## TAG FORMAT

`<stackMax:VAL>`
Maximum number of stacks this state can accumulate.

`<stackMaxBoost:VAL>`
A blanket bonus to the stack cap of every state this battler stacks, regardless of which state it is. Read from every
note source on the battler applying the stack (actor, class, equips, states) and summed together. Place on gear or a
passive state for a "stacks build up further, period" effect.

`<thisStackMaxBoost:VAL>`
A bonus to this specific state's own stack cap, read from this state's own note only (not summed from the battler's
other sources). On its own this is nothing you couldn't do by just raising `<stackMax:VAL>` directly- its purpose is to
ride along on a `J-Extend` overlay state. When another active state carries `<extend:[STATE_ID]>` or `<extendType:TYPE>`
targeting this state, `J-Extend` merges the overlay's note (and thus its `<thisStackMaxBoost:VAL>` tag) into this
state's resolved note before this tag is read- so a single overlay state (e.g. an equipment-granted passive) can raise
the stack cap of one specific state, or of every state sharing a `<type:TYPE>` classifier, without touching the target
state(s) directly.

`<applyStacks:VAL>`
Number of stacks applied per hit (default 1).

`<loseAllStacksAtOnce>`
If present, all stacks are lost at once upon expiration rather than losing one stack and refreshing.

`<stackOnExpire>`
Inverts the normal expiration behavior entirely: instead of losing a stack when duration runs out, the state GAINS a
stack and re-arms its own duration indefinitely, with no external reapplication needed. This is a self-perpetuating
"ticking clock" state -- once applied, it keeps building stacks on its own timer until something else removes it
outright (dispel, death, script call). Takes precedence over `<loseAllStacksAtOnce>`, since stacks are never lost via
this path.

`<stacksConvertToState:[NEW_STATE_ID, STACKS_REQUIRED]>`
When this state's stack count reaches STACKS_REQUIRED (checked on every stack application, using >= so overshooting is
safe), the state identified by NEW_STATE_ID is applied to the afflicted battler as a fresh application. The converted
state starts at 1 stack regardless of the source state's count. If the converted state is already active on the battler,
the re-application is intentional — the converted state will be refreshed/stacked/extended per its own reapplication
type on each subsequent source stack application. Only the first tag is read.

`<removeOnConvert>`
If present alongside `<stacksConvertToState>`, the source state is fully removed from the battler when the conversion
fires. Without this tag the source state remains active (both states coexist), which is the intended behavior for
escalation patterns where the lesser effect persists alongside the greater one (e.g. base poison stays while lethal dose
is also applied).

`<convertUsesCaster>`
By default, conversion data (`<stacksConvertToState>` and `<removeOnConvert>`) is read from the TARGET's perceived
version of the state. Add this tag to the base state to instead read conversion data from the CASTER's perceived version
of the state. This is required when the conversion tag is added via a caster-side extension passive (e.g. a prof unlock
that extends Tenderizing with `<stacksConvertToState:[EXPOSED_ID, 20]>`) — without it, the enemy target would not see
the extension and the conversion would never fire.

## TAG EXAMPLES

`<stackMax:5>`
This state can accumulate a maximum of 5 stacks.

`<stackMaxBoost:2>`
Every state this battler stacks gets a blanket bonus of 2 to its stack cap.

`<thisStackMaxBoost:2>`
This specific state gets a bonus of 2 to its own stack cap.

`<applyStacks:2>`
2 stacks of this state are applied per hit.

`<loseAllStacksAtOnce>`
All stacks of this state are lost at once upon expiration.

`<stackOnExpire>`
This state GAINS a stack when its duration runs out, instead of losing one.

`<stacksConvertToState:[15, 10]>`
When this state's stack count reaches 10, state 15 is applied to the afflicted battler as a fresh application.

`<removeOnConvert>`
This state is fully removed from the battler when its conversion fires.

`<convertUsesCaster>`
This state's conversion data is read from the CASTER's perceived version of the state.