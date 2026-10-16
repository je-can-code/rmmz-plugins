---
type: plugin-command
title: Chatter Now Plugin Command
description: Makes a character say one specific line, ignoring radius, cooldown and any running event.
tags: [message-chatter, command]
command:
  key: chatter-now
  text: Chatter Now
  desc: Makes a character say one specific line, ignoring radius, cooldown and any running event.
  args:
    - key: target
      type: string
      text: Target
      desc: Who says it. Accepts self, player, eN for an event, aN for an actor, fN for a follower, or X,Y for a point.
      default: self
    - key: text
      type: string
      text: Text
      desc: What they say. Message text codes work here exactly as they do in a Show Text command.
      default: ''
    - key: duration
      type: string
      text: Duration
      desc: How many frames it stays up after it finishes typing out. Leave blank for this character's usual.
      default: ''
    - key: position
      type: select
      options:
        - option: ''
        - option: top
        - option: middle
        - option: bottom
      text: Position
      desc: Which side of the character it sits on. Leave blank for this character's usual.
      default: ''
    - key: background
      type: select
      options:
        - option: ''
        - option: window
        - option: dim
        - option: transparent
      text: Background
      desc: What it is drawn on, as the Show Text dropdown means it. Dim reads as a thought. Blank for the usual.
      default: ''
    - key: persist
      type: boolean
      text: Keep During Dialogue
      desc: Keep this line up even while a message opens above the same character. You decide where each one sits.
      default: false
---

# `chatter-now`

Makes a character say one specific line, ignoring radius, cooldown and any running event.