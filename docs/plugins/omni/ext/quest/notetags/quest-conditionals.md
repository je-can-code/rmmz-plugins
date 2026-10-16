---
type: notetag
title: Quest Conditionals
description: The tags gating an event page, or a single Show Choices branch, behind the state of a quest or objective.
tags: [omni-quest, tag, quest, objective, event, page, choice]
---

# Quest Conditionals

## Description

Beyond the JSON-authored quest data itself, this plugin adds tags that gate event pages and "Show Choices" branches
behind quest/objective state, similar in spirit to
[`J-Message`'s leader/switch choice conditionals](../../../../message/core/notetags/choice-conditionals.md).

## NOTE ABOUT THE THREE ARGUMENT SHAPES

All six tags below accept the array in one of three shapes, and behave accordingly:

`[QUEST_KEY]`
Valid while the quest itself is active (any objective).

`[QUEST_KEY, OBJECTIVE_ID]`
Valid while that specific objective is active.

`[QUEST_KEY, OBJECTIVE_ID, STATE]`
Valid while that specific objective is in the given STATE, where STATE is one of: `inactive`, `active`, `completed`,
`failed`, `missed`.

## TAG USAGE

- Event comments, on an event page; gates the whole page like a normal page condition.
- Event comments, in a "Show Choices" branch; gates a single choice.

## TAG FORMAT

`<pageQuestCondition:[QUEST_KEY]>`
`<pageQuestCondition:[QUEST_KEY, OBJECTIVE_ID]>`
`<pageQuestCondition:[QUEST_KEY, OBJECTIVE_ID, STATE]>`
Gates an entire event page.

`<choiceQuestCondition:[QUEST_KEY]>`
`<choiceQuestCondition:[QUEST_KEY, OBJECTIVE_ID]>`
`<choiceQuestCondition:[QUEST_KEY, OBJECTIVE_ID, STATE]>`
Gates a single "Show Choices" branch.

## TAG EXAMPLES

`<pageQuestCondition:[herbalist_delivery]>`
This event page is only active while the "`herbalist_delivery`" quest is active (in any objective state).

`<pageQuestCondition:[herbalist_delivery, 2]>`
This event page is only active while objective 2 of that quest is active.

`<choiceQuestCondition:[herbalist_delivery, 2, completed]>`
This choice is only shown while objective 2 of that quest is completed.