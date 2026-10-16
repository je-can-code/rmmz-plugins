---
type: notetag
title: Choice Conditionals
description: The tags conditionally showing a Show Choices choice based on the party leader or the state of a switch.
tags: [message, tag, choice, event, leader, switch]
---

# Choice Conditionals

## Description

Have you ever wanted to be able to conditionally make choices appear based on a situation like a switch or who the
leader currently is? Well now you can! By adding tags into the comments of your 'Show Choices' branches, you too can
have conditionally appearing choices in events!

## NOTE ABOUT NESTED CHOICES

It is untested how well this functions with nested 'Show Choices' commands, if it functions at all as-intended. It is
recommended to avoid nesting the switches.

## TAG USAGE

- Event comments, specifically in a 'Show Choices' branch/choice.

## TAG FORMAT

`<leaderChoiceCondition:ACTOR_ID>`
`<notLeaderChoiceCondition:ACTOR_ID>`
Where ACTOR_ID represents the id of the actor to condition this choice for.

`<switchOnChoiceCondition:SWITCH_ID>`
`<switchOffChoiceCondition:SWITCH_ID>`
Where SWITCH_ID represents the id of the switch to condition this choice for.

## TAG EXAMPLES

`<leaderChoiceCondition:4>`
The choice with this in its branch will be visible only while the actor of ACTOR_ID 4 is the leader when this event gets
triggered.

`<notLeaderChoiceCondition:17>`
The choice with this in its branch will be hidden only while the actor of ACTOR_ID 17 is the leader when this event gets
triggered.

`<switchOnChoiceCondition:222>`
The choice with this in its branch will be visible only while the switch of SWITCH_ID 222 is ON when this event gets
triggered.

`<switchOffChoiceCondition:74>`
The choice with this in its branch will be visible only while the switch of SWITCH_ID 74 is OFF when this event gets
triggered.