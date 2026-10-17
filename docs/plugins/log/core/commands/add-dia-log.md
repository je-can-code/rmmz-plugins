---
type: plugin-command
title: Add DiaLog Plugin Command
description: Adds a single DiaLog into the DiaLog Window. Respects text codes.
tags: [log, command]
command:
  key: addDiaLog
  text: Add DiaLog
  desc: Adds a single DiaLog into the DiaLog Window. Respects text codes.
  args:
    - key: lines
      type: multiline_string
      text: Message
      desc: The message for the window; it should never be more than 3 lines.
      default: Hello World!
    - key: faceName
      type: file
      text: Face Filename
      desc: The filename for the face to use; use empty string for no face.
      default: ''
    - key: faceIndex
      type: number
      min: -1
      max: 7
      text: Face Index
      desc: The index of the face on the given face file; use -1 for no face.
      default: -1
---

# `addDiaLog`

Adds a single DiaLog into the DiaLog Window. Respects text codes.