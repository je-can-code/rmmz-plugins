---
type: notetag
title: AI Follow-Up
description: The tags making a tactical enemy cast a skill first while its target carries a given state, and save it for that.
tags: [abs, tag, skill, ai]
---

# AI Follow-Up

## Description

Names the states a skill follows up on. While its target carries one of them, an enemy with the tactical trait casts
this skill before anything else but a combo already under way. One battler lays a state and another cashes it in: a
boss's machine paralyzes you, and his big spell follows.

`<aiFollowUpOnly>` makes the enemy save the skill for that moment. It never comes up in an ordinary decision or as an
interrupt, so it is never on cooldown when the moment arrives. The one way past that is a `<combo>`: a skill whose
combo names this one still chains into it.

## NOTE ABOUT AI SKILL EXCLUSION

`<aiSkillExclusion>` removes a skill from the AI's pool entirely, so it can never be a follow-up either. Use
`<aiFollowUpOnly>` to keep a skill for its follow-up alone.

## NOTE ABOUT THE TACTICAL TRAIT

Only an enemy with `<aiTrait:tactical>` looks for follow-ups. A skill saved with `<aiFollowUpOnly>` on an enemy without
it is cast only through a combo that names it. Ally AI does not read either tag.

## TAG USAGE

- Skills

## TAG FORMAT

`<aiFollowUp:[STATE_IDS]>`

`<aiFollowUpOnly>`

## TAG EXAMPLES

`<aiFollowUp:[2090, 4]>`
While its caster's target carries state 2090 or state 4, a tactical enemy casts this skill first.

`<aiFollowUp:[2090]>`
`<aiFollowUpOnly>`
This skill is cast only as a follow-up to state 2090.