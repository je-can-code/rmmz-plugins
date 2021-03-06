# ABS Checklist

- ✅ = complete
- ⭕ = work in progress
- ❌ = not started
---
Bugs

- ❌ disable click buttons (like menu)

---

- ✅ battler events on the map are identified as battlers.
  - ✅ events are translated to `JABS_Battler`s.
  - ✅ battlers take damage when damage effects are applied.
  - ✅ events are deleted when defeated.

- ✅ action sprite events on the map are handled.
  - ✅ sprites are newly generated on command (such as attacking or using a skill).
  - ✅ sprites are clones of the base event from the action map.
  - ✅ sprites execute the move route they've been assigned.
  - ✅ sprites collide with targets of the designated group (based on scope).
  - ✅ sprites expire on collision when specified.

- ⭕ battlers act accordingly to AI.
  - ✅ AI will engage/disengage.
  - ❌ AI can change targets based on aggro of who is attacking it.
  - ✅ AI can decide best action in battle.
  - ⭕ AI can be mixed and matched without unexpected behavior.

- ✅ states are handled.
  - ✅ states affect both allies and enemies.
  - ✅ ABS-specific states can be added.
    - ✅ `paralyzed` state; combination of rooted, spellbound, and weaponlocked.
    - ✅ `rooted` state; cannot move.
    - ✅ `muted` state; cannot use skills.
    - ✅ `disabled` state; cannot use basic attacks (including combos).
  - ✅ Non-ABS-specific states can be added.
    - ✅ any state from the database can be added. (restrictions don't apply, use ABS-specific states!)
    - ✅ slip damage is applied at regular intervals.
      - ✅ HRG/MRG/TRG combine with poison-type states and regenerate accordingly over time.
  - ✅ states can be removed.
    - ✅ states can wear off due to turns passing.
    - ✅ states can be removed from other effects.
  - ✅ states are tracked visually.
    - ✅ states show up in the HUD with countdown.
    - ✅ states show up on the map as sideview state overlays.
    - ✅ states count down over time based on duration.

- ✅ skill scope is handled.
  - ✅ Enemy-One = single target = only hits first target the skill collides with not of same team.
  - ✅ Enemy-Random = Enemy-One.
  - ✅ Enemy-All = multi-target = hits all targets the skill collides with not of same team.
  - ✅ Ally-One = single target = only hits first target the skill collides of same team.
  - ✅ Ally-All = multi-target = hits all targets the skill collides of same team.
  - ✅ Enemy&Ally-All = multi-target = hits all targets the skill collides with, regardless of team.
- ✅ skill collision hitboxes work.
  - ✅ `rhombus` shape strikes as growing rectangle of a given range at the collision. (recommended: melee)
  - ✅ `square` shape strikes a square of a given range at the projectile collision. (recommended: ranged)
  - ✅ `frontsquare` shape strikes a square of a given range infront of the collision (recommended: melee)
  - ✅ `line` shape strikes as a straight line in the direction faced. (recommended: melee)
  - ✅ `arc` shape strikes a half-diamond-esque area. (recommended: ranged)
  - ✅ `wall` shape strikes a single line of a given range infront of the attacker. (recommended: melee)
  - ✅ `cross` shape strikes as a cross from collision. (recommended: ranged)
- ⭕ can fire multiple skills per usage
  - ✅ can fire 2 shots infront of the player (V)
  - ✅ can fire 3 shots infront of the player (spray)
  - ✅ can fire 4 shots around the player (cross)
  - ✅ can fire 8 shots around the player (star)
  - ❌ can fire "beam" with a "width" of a shot is available (1dir) (1-tiny, 3-regular, 5-thick, 7-huge, 9-wall)

- ✅ a default means of handling the hud is available.
  - ✅ hud has hp/mp/tp/xp bars
  - ✅ hud hides on command.
  - ✅ hud hides when in close proximity.

- ⭕ a text log is generated on the map.
  - ✅ can write text to the log in single message format.
  - ❌ can write icons into the text of a log.
  - ✅ messages disappear after a duration.
  - ✅ messages don't start disappearing until X time inactive.

- ⭕ various combat features are implemented.
  - ✅ Parrying: if the target is facing you and has GRD, it may parry.
    - ✅ notetags are available to ignore parry.
    - ✅ attacker's HIT stat reduces target's parry chance.
  - ✅ Knockback: if a skill has knockback on it, an enemy will be knocked back.
    - ✅ notetags are available to determine knockback on skills.
    - ✅ notetags are available to prevent or reduce knockback on targets.
  - ⭕ Invincibility: the battler's cannot be collided with while "invincible".
    - ✅ On death, "invincibility" is applied to prevent errors.
    - ❌ "invincibility" can be applied through states.
  - ✅ Loot Drops:
    - ✅ all available loot falls to the ground (_instead of the mob gentlemanly depositing them in your inventory_).
    - ✅ internal drop chance algorithm is rewritten to instead use RM dev input of drop chance as percent rather than fraction.
    - ✅ notetags are available allow for more than hard-coded 3 slots for loot.

- ✅ player input is handled.
  - ✅ attack button executes equipped weapons map action skills.
    - ✅ determines skill based on equipped weapon.
  - ✅ offhand button executes offhand action 
    - ✅ determines skill based on equipped offhand (weapon or armor).
  - ✅ R1 to access the 4 skills assigned.
    - ✅ executes a skill based on the `R1 + A` skill.
    - ✅ executes a skill based on the `R1 + B` skill.
    - ✅ executes a skill based on the `R1 + X` skill.
    - ✅ executes a skill based on the `R1 + Y` skill.
  - ✅ L1 to access the 4 skills assigned.
    - ✅ executes a skill based on the `L1 + A` skill.
    - ✅ executes a skill based on the `L1 + B` skill.
    - ✅ executes a skill based on the `L1 + X` skill.
    - ✅ executes a skill based on the `L1 + Y` skill.
  - ✅ combo attacks can chain together as expected for any skill if applicable.
  - ✅ strafing occurs while holding `L2` (lock facing direction while held)
  - ✅ executes the dodge skill if `R2` is pressed (various on skill implementation)
    - ✅ dodging forward (lunge) works.
    - ✅ dodging backward (backstep) works.
    - ✅ dodging directionally (tumble) works.
    - ✅ dodge skill is assignable.
    - ✅ dodge skill has invincibility frames

## Post-1.0.0 features to be implemented
- Charging:
  - attacks can be charged up
- Tools:
  - look to zelda or something for ideas of tools, like hookshot or boots.
- Cooldown-affecting things:
  - gear that increases/reduces cooldown for attacks/skills/tools.
- Drops:
  - potentially non-static locations
  - leverage AI to move away/towards player
  - gear that "sucks in" loot?