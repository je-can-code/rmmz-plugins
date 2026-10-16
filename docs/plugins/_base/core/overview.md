---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [base, overview]
---

# Overview

This is the base class that is required for basically ALL of `J-*` plugins. Please be sure this is above all other `J-*`
plugins, and keep it up to date!

## Tags

- [Max Item Quantity](notetags/max-item-quantity.md)
- [Custom Max TP](notetags/custom-max-tp.md)
- [State Type Classifier](notetags/state-type-classifier.md)
- [HAR (Healing Rate)](notetags/har-healing-rate.md)

## Dev details

I would encourage you peruse the added functions to the various classes. Many helper functions that probably should've
existed were added, and coding patterns that were used erratically are... less erratic now.

## Dev things added

- many `*-Manager` type classes were added, and existing ones were extended.
- the concept of "long param" was utilized for iterating over parameters.
- "implemented" a class layer for many database objects.
- added various lifecycle hooks to battlers and states.
- rewrites the way items are managed and processed.
- adds a number of functions to retrieve data that was otherwise "private".
- adds an API for retrieving specific regex-based comments from an event.
- adds an API for getting all notes associated with given battlers.
- adds a few reusable sprites for convenience, like faces, icons, and text.
- adds a parent class for subclassing to strongly type plugin metadata.