---
type: plugin-command
title: Refresh Required AP Plugin Command
description: A debug command for refreshing the requiredAp values for an actor.
tags: [ap, command, debug]
command:
  key: refresh-required-ap
  text: Refresh Required AP
  desc: Re-syncs persisted aptitude requiredAp values against current notetags for an actor by its id.
  args:
    - key: actorId
      type: actor
      desc: The id of the actor to refresh aptitude requirements for.
      default: 1
---

# `refresh-required-ap`

The command for re-syncing a single actor's persisted aptitudes' `requiredAp` values against the current tags.

This mostly should get used during balancing and less as something in regular gameplay.
