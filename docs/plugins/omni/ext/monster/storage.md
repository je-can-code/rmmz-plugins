---
type: storage
title: Data Saved
description: The details about what is saved to disk for this plugin.
tags: [omni-monster, save, data]
---

# Storage

This plugin adds its monster observations to the `_omni` namespace on the party. That namespace belongs to
`J-Omnipedia`; this plugin fills it rather than declaring a namespace of its own.

## Parent

- The party.

## Addition

The `_omni` namespace, which `J-Omnipedia` owns and each omnipedia extension adds its own data to.

## Save Section

None of its own. The `omni` section is registered by `J-Omnipedia`, when `J-Base-Save` is installed, and this plugin's
data rides in it. Without `J-Base-Save`, the namespace saves inline with the party in the normal save.