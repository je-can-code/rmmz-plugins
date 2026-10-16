# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [Slip Popup Suppression](notetags/slip-popup-suppression.md) - The tags suppressing the slip and regen popups that a state generates.

# plugin-parameter

* [Disable skill-used popups Plugin Parameter](parameters/disable-skill-used-popups.md) - When true, hides the floating skill name on the caster only; damage/healing/reward popups still show.
* [Merge combat strike numbers Plugin Parameter](parameters/enable-merge-combat.md) - Sum incoming strikes on the target into one stream per HP/MP/TP line (who-hit-you lives in logs).
* [Merge slip/regen ticks Plugin Parameter](parameters/enable-merge-slip.md) - Sum slip/regen ticks on the battler into one stream per resource line until flush.
* [Merge reward totals (exp/gold/AP/SDP) Plugin Parameter](parameters/enable-merge-rewards.md) - Sum numeric reward pops before releasing motion.
* [Stack mitigation labels (parry/dodge counts) Plugin Parameter](parameters/enable-merge-mitigation.md) - Shows PARRY xN / DODGE xN style stacks before releasing motion.
* [Idle flush frames Plugin Parameter](parameters/merge-idle-flush-frames.md) - Release after this many frames with no merge **on this battler** (any stream counts).
* [Harm outline width Plugin Parameter](parameters/damage-outline-width.md) - Pixel width of the outline on harm HP/MP/TP combat damage numbers.
* [Heal outline width Plugin Parameter](parameters/healing-outline-width.md) - Pixel width of the outline on heal HP/MP/TP combat regen numbers.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
