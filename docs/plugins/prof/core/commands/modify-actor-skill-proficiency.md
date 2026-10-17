---
type: plugin-command
title: Modify Actor's Proficiency Plugin Command
description: Increase/decrease one or more actor's proficiency with one or more skills.
tags: [prof, command]
command:
  key: modifyActorSkillProficiency
  text: Modify Actor's Proficiency
  desc: Increase/decrease one or more actor's proficiency with one or more skills.
  args:
    - key: actorIds
      type: actor[]
      text: Actor Id
      desc: Choose one or more actors to modify the proficiency for.
    - key: skillIds
      type: skill[]
      text: Skill Id
      desc: Choose one or more skills to modify the proficiency for.
    - key: amount
      type: number
      min: -999999
      max: 999999
      text: Modifier
      desc: This modifier can be negative or positive.
---

# `modifyActorSkillProficiency`

Increase/decrease one or more actor's proficiency with one or more skills.