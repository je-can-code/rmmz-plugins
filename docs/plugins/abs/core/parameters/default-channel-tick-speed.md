---
type: plugin-parameter
title: Default Channel Tick Speed Plugin Parameter
description: The number of frames between each repeated execution of a `<channel:[SKILL_ID, DURATION]>` skill's child skill, when the skill omits its own `<channelTickSpeed:N>` override.
tags: [abs, parameter]
param:
  key: defaultChannelTickSpeed
  parent: channelConfigs
  type: number
  min: 1
  text: Default Channel Tick Speed
  desc: The number of frames between each repeated execution of a `<channel:[SKILL_ID, DURATION]>` skill's child skill, when the skill omits its own `<channelTickSpeed:N>` override.
  default: 30
---

# Parameter: `defaultChannelTickSpeed`

The number of frames between each repeated execution of a `<channel:[SKILL_ID, DURATION]>` skill's child skill, when the
skill omits its own `<channelTickSpeed:N>` override.