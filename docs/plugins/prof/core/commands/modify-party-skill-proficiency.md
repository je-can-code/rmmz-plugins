---
type: plugin-command
title: Modify Party's Proficiency Plugin Command
description: Increase/decrease every member in the current party's proficiency with a particular skill.
tags: [prof, command]
command:
  key: modifyPartySkillProficiency
  text: Modify Party's Proficiency
  desc: Increase/decrease every member in the current party's proficiency with a particular skill.
  args:
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

# `modifyPartySkillProficiency`

Increase/decrease every member in the current party's proficiency with a particular skill.