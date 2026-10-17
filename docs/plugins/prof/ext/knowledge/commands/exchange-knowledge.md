---
type: plugin-command
title: Exchange Knowledge Plugin Command
description: Converts banked knowledge into whatever the named exchange offers.
tags: [prof-knowledge, command]
command:
  key: exchange-knowledge
  text: Exchange Knowledge
  desc: Converts banked knowledge into whatever the named exchange offers.
  args:
    - key: exchangeKey
      type: string
      text: Exchange
      desc: The name of the exchange to perform, as written in the configuration.
    - key: resultVariableId
      type: variable
      text: Amount Granted
      desc: A variable to write the number of things handed over into. Leave at 0 to skip.
      default: 0
    - key: resultSwitchId
      type: switch
      text: Granted Anything
      desc: A switch recording whether anything at all was handed over. Leave at 0 to skip.
      default: 0
---

# `exchange-knowledge`

Converts banked knowledge into whatever the named exchange offers.