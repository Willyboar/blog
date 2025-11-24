---
title = "Nuttracker Cracking Errors (Vol.1)"
description = "Start the implementation of an error-tracker"
date = "2025-11-25"
tags = ["gleam", "programming", "tools", "nuttracker"]
---

# Nuttracker: Cracking errors (Vol.1)

A few weeks ago I kinda nerd snipped to experiment with the implementation of an error tracker in Gleam. I played around with some prototypes but the error capture didn't cover a lot and such a library would not be useful at all. 

## What's the target?

The target is to create an error tracker library/app that is **framework agnostic**, has a small **footprint** in users app and can be used in production.

Something that a user can use with 1-2 lines of code and be able to catch all the errors happening in their app.

## What's the plan?

After a bit of research it seems like the best solution is to implement an erlang *logger handler* and a gleam wrapper using FFI.

This part is extremely crucial because it is the heart of the library. Everything after that is mostly manipulating data — adding fingerprints, grouping errors with the same fingerprint, counting occurrences, storing events in a database, and finally building a dashboard so the user can view and manage errors.

## What's next?

The next step is the implementation of the *logger handler* and the wrapper. I want to cover the process in this blog at least for the first parts of the error tracker implementation. 

Stay tuned.
