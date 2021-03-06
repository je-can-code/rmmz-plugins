[[_TOC_]]

---
# Action Id
The `action id` represents the event id that will be the visual representation of a usable skill in JABS. 
The `action id` would be determined by you, the RM dev, from the event id that you desire a skill to use visually from the action map.
You can have re-use actions for multiple skills.

**Syntax**:
```html
<actionId: eventIdFromActionMap>
eventIdFromActionMap = a number that maps to the event id on the action map.
```

**Example**:
```html
<actionId: 4>
- This skill will have the visual representation of event id 4 from the action map.
```
![image.png](/.attachments/image-57d94622-ddcf-4c26-bbe8-07b984ad2a66.png)

Applicable to:
- Skills

---
---
# AI Code
`ai` is the AI configuration for this battler on the map. This has a very rigid structure, so do check the syntax/example for details. It is an 8-character long code of `0`s and `1`s, where each character represents an AI trait. I strongly recommend you take time to read the section/article (not in this glossary) about the AI and how each trait works.
- first character represents `basic`.
- second character represents `smart`.
- third character represents `executor`.
- fourth character represents `defensive`.
- fifth character represents `reckless`.
- sixth character represents `healer`.
- seventh character represents `follower`.
- eighth character represents `leader`.

> The fourth through eighth AI traits are not yet implemented. They are on the agenda, though.

**Syntax**:
```html
<ai: aiCode>
aiCode = the code that determines this battler's AI.
```

**Example**:
```html
<ai: 11010001>
- This battler will have: "basic", "smart", "defensive", and "leader" AI traits.
```

Applicable to:
- Events (on the map)
---
---
# Alert Duration
The `ad` is the number of frames this battler will remain in an "alerted" state.

> This functionality is complete, but I plan on binding some of its functionality to specific AI traits.

**Syntax**:
```html
<ad: alertDuration>
alertDuration = the number in frames that the battler remains alerted.
```

**Example**:
```html
<ad: 300>
- The battler will remain alerted for 300 frames (about a five seconds) before giving up and returning to its home coordinates.
```

Applicable to:
- Events (on the map)
---
---
# Alert Pursuit Boost
The `ap` is the amount of bonus pursuit that is gained when in an alerted state.

**Syntax**:
```html
<ap: pursuitBoost>
sightBoost = the number to add to this battler's base pursuit range while alerted.
```

**Example**:
```html
<ap: 3>
- The battler will gain +3 pursuit while in an alerted state.
```

Applicable to:
- Events (on the map)
---
---
# Alert Sight Boost
The `as` is the amount of bonus sight that is gained when in an alerted state.

**Syntax**:
```html
<as: sightBoost>
sightBoost = the number to add to this battler's base sight range while alerted.
```

**Example**:
```html
<as: 3>
- The battler will gain +3 sight while in an alerted state.
```

Applicable to:
- Events (on the map)
---
---
# Battler Id
`e` (yes, just `e`) represents the id of the battler on the map (such as an enemy of id 2 or something in the database).

> Currently only applies to enemies, but will allow actor ids in the future.

**Syntax**:
```html
<e: battlerId>
battlerId = the id that this event on the map represents in the enemies tab of the database.
```

**Example**:
```html
<e: 5>
- This event on the map will use a battler based on enemy of id 5 from the database.
```

Applicable to:
- Events (on the map)
---
---
# Cast Animation
The `cast animation` is the animation that plays on the user of a skill when the skill is executed. 
The skill does not wait until the cast animation is completed before executing the skill.

Syntax:
```html
<castAnimation: animationId>
animationId = the id of the animation that should be executed.
```

Example:
```html
<castAnimation: 130>
- This skill will play the animation with id 130 on the caster when the skill is executed.
```
Cast animation `notes` are applicable to:
- Skills

---
---
# Combo
The `combo` note tag directly binds a sequential action with a reduced cooldown that a given action has.
Combo counters do not begin until a hit connects successfully with an enemy.
Combos can combo into themselves.

> After looking at the syntax and example, you'll notice I did call out that the `reducedCooldown` parameter must be shorter than the base cooldown. If the reduced cooldown is longer than the base cooldown, the window of which the sequential combo skill can be executed will not exist. If a skill has a base cooldown of 60, and the `reducedCooldown` is 10, then the player has a 50 frame window after 10 frames to hit the button again to execute the combo skill instead. If the player does not execute the skill within that window, then the next button press will execute the same skill instead.

**Syntax**:
```html
<combo: [comboSkillId, reducedCooldown]>
comboSkillId = the skill the execute instead of this skill.
reducedCooldown = the number of frames until the combo skill is available (MUST BE SHORTER THAN THE BASE COOLDOWN).
```

**Example**:
```html
<combo: [12, 10]>
- 10 frames after using this skill, a subsequent use of the skill will instead execute the skill with the id of 12.
(as long as the base cooldown has not completed)
```

Applicable to:
- Skills

---
---
# Cooldown
The `cooldown` is the number of frames the battler must wait until the action can be used again.

**Syntax**:
```html
<cooldown: cooldownFrames>
cooldownFrames = the number in frames that the battler must wait after executing this action to execute it again.
```

**Example**:
```html
<cooldown: 60>
- The battler must wait 60 frames before using this action again.
```

Applicable to:
- Skills
- Items
---
---
# Disabled
The `disabled` note tag prevents the battler from executing "attacks". For the player, attacks are defined as either the mainhand or offhand skills. Dodge/Tools/L1/R1 skills are not affected by this. For non-player battlers, attacks only include their "basic attack" skill.

**Syntax** & **Example**:
```html
<muted>
```
> Just having this tag enables the functionality for the state(s).

Applicable to:
- States
---
---
# Duration
The `duration` is the number of frames the action will exist on the map before being disposed of.

> A few notes:
> - actions have a minimum duration of 15 frames (about a quarter second).
> - after the minimum duration, actions will automatically expire if they reached the max number of hits on an enemy.

**Syntax**:
```html
<duration: durationFrames>
durationFrames = the number in frames that the action will persist on the map.
```

**Example**:
```html
<duration: 30>
- The action will persist for 30 frames (about a half second) before being disposed of.
```

Applicable to:
- Skills
---
---
# Free Combo
The `freeCombo` note tag makes it so that a skill does not require connecting successfully with a target to execute the combo skill.

> This note tag is pending implementation and may be merged with the `<combo: [#, #]>` note tag.

**Syntax** & **Example**:
```html
<freeCombo>
```
> Just having this tag enables the functionality for the action(s).

Applicable to:
- Skills
- Weapons (n/a for now)
- Armors (n/a for now)
- States (n/a for now)
---
---
# Hp Flat
The `hpFlat` is the number to modify the **hp5** regeneration value by.

> It is recommended to read the section regarding the changes made to regeneration.

**Syntax**:
```html
<hpFlat: flatAmount>
flatAmount = the amount to modify the hp5 regeneration value by. Can be negative or positive.
```

**Example**:
```html
<hpFlat: 50>
- This battler's hp5 will be increased by 50.

<hpFlat: -25>
- This battler's hp5 will be reduced by 25.
```

Applicable to:
- States
---
---
# Hp Perc
The `hpPerc` is the number to modify the **hp5** regeneration value by.

> It is recommended to read the section regarding the changes made to regeneration.

**Syntax**:
```html
<hpPerc: percentAmount%>
percentAmount = the amount to modify the hp5 regeneration value by. Can be negative or positive.
```

**Example**:
```html
<hpPerc: 10%>
- This battler's hp5 will be increased by 10% of their own max HP.

<hpPerc: -5%>
- This battler's hp5 will be reduced by 5% of their own max HP.
```

Applicable to:
- States
---
---
# Ignore Parry
The `ignoreParry` allows for skills to bypass either some or all of a target's parry chance.

> This note tag is only partially implemented- only <ignoreParry> works, the percentage functionality is not available.

**Syntax**:
```html
<ignoreParry>

or

<ignoreParry: ignoreParryValue>
ignoreParryValue = percent of parry value to ignore.
```

**Example**:
```html
<ignoreParry>
- this action cannot be parried.

<ignoreParry: 25>
- this action ignores 25% of the parry chance of the target.
```

Applicable to:
- Skills
- Weapons (n/a for now)
- Armors (n/a for now)
- States (n/a for now)
---
---
# Inanimate
The `inanimate` note tag is a shorthand for both `<noIdle>` and `<noHpBar>`. Additionally, `inanimate` events on the map cannot be engaged with (though you can still hit them).

**Syntax** & **Example**:
```html
<inanimate>
```
> Just having this tag enables the functionality for the battler(s).

Applicable to:
- Events (on the map)
---
---
# Invincible
The `invincible` note tag makes it so that a battler no longer can be collided with. 
Actions will pass through them and have no effect.

**Syntax** & **Example**:
```html
<invincible>
```
> Just having this tag enables the functionality for the battler(s).

Applicable to:
- Events (on the map)
---
---
# Knockback
The `knockback` allows for skills to knock back the target by `X` amount.
Knockback can be negative, resulting in pulling an enemy closer.
Knockback is reduced by `knockback resist`.

> This functionality has had some quirkiness about it, resulting randomly in sending the battler flying. I'm sorry. I'll fix it eventually.

**Syntax**:
```html
<knockback: knockbackPower>
knockbackPower = the number of squares/spaces/tiles to knock the target back.
```

**Example**:
```html
<knockback: 2>
- this action will knock the target back up to 2 tiles.
```

> "up to 2 tiles" as in, when trying to knock back the target, if the 2nd tile is impassible, then it will stop at 1.

Applicable to:
- Skills
---
---
# Knockback Resist
`Knockback resist` represents the percentage of knockback that is ignored from an opposing JABS battler.
Knockback resist is a percent resistance to being knocked back. Having 100 resistance means you simply won't be knocked up, back, or anywhere.

**Syntax**:
```html
<knockbackResist: resistanceValue>
resistanceValue = some number between 0-100.
```

**Example**:
```html
<knockbackResist: 75>
- Resists 75% of the knockback value that an enemy's knockback power.

If their skill had a knockback of 4, but you had 75% knockback resist, then you'd only be knocked back 1 instead.
```

Applicable to:
- Actors
- Enemies
---
---
# Move Speed
`ms` is an optional note tag. It permits the assignment of custom movespeed values to an event on the map... but not just any custom values, DECIMAL custom values. If you do not use this note, then it'll just use whatever is in the event's first page.

> Because the run functionality was removed, giving an enemy about 3.5 movespeed is ideal for the average enemy.

**Syntax**:
```html
<ms: customMoveSpeed>
customMoveSpeed = the custom move speed value (probably decimal) that you want this event to have.
```

**Example**:
```html
<ms: 3.5>
- This battler's movespeed will be set to 3.5.
```

Applicable to:
- Events (on the map)
---
---
# Move Type
`MoveType` is an identifier for the type of dodge skill this is.
There are only three options for this:
- `forward` : move the battler in the same direction they are facing.
- `backward` : move the battler in the opposite direction they are facing.
- `directional` : move the battler in any of the four directions, depending on what direction is being held at time of cast.

**Syntax**:
```html
<moveType: type>
type = either `forward`, `backward`, or `directional`. 
```

**Example**:
```html
<moveType: backward>
- This dodge skill will move the player in the opposite direction that they are facing when the skill is cast.
```

Applicable to:
- Skills
---
---
# Mp Flat
The `mpFlat` is the number to modify the **mp5** regeneration value by.

> It is recommended to read the section regarding the changes made to regeneration.

**Syntax**:
```html
<mpFlat: flatAmount>
flatAmount = the amount to modify the mp5 regeneration value by. Can be negative or positive.
```

**Example**:
```html
<mpFlat: 50>
- This battler's mp5 will be increased by 50.

<mpFlat: -25>
- This battler's mp5 will be reduced by 25.
```

Applicable to:
- States
---
---
# Mp Perc
The `mpPerc` is the number to modify the **mp5** regeneration value by.

> It is recommended to read the section regarding the changes made to regeneration.

**Syntax**:
```html
<mpPerc: percentAmount%>
percentAmount = the amount to modify the mp5 regeneration value by. Can be negative or positive.
```

**Example**:
```html
<mpPerc: 10%>
- This battler's mp5 will be increased by 10% of their own max MP.

<mpPerc: -5%>
- This battler's mp5 will be reduced by 5% of their own max MP.
```

Applicable to:
- States
---
---
# Muted
The `muted` note tag prevents the battler from executing "skills". For the player, skills are defined as any skill triggered by holding L1/R1. Mainhand/offhand/dodge/tools are not affected by this. For non-player battlers, skills are any skill that the battler knows that isn't it's "basic attack" skill.

**Syntax** & **Example**:
```html
<muted>
```
> Just having this tag enables the functionality for the state(s).

Applicable to:
- States
---
---
# No HP Bar
The `noHpBar` note tag disables the visibility of the hp bar that is over all active battlers (except the player).

**Syntax** & **Example**:
```html
<noHpBar>
```
> Just having this tag enables the functionality for the action(s).

Applicable to:
- Events (on the map)
---
---
# No Idle
The `noIdle` note tag disables the AI-controlled battler's idle wanderings that occur when they are not engaged in battle or alerted.

**Syntax** & **Example**:
```html
<noIdle>
```
> Just having this tag enables the functionality for the action(s).

Applicable to:
- Events (on the map)
---
---
# Paralyzed
The `paralyzed` note tag prevents the battler from taking any action while afflicted with a state that has this note on it. This is the equivalent of being `muted`, `rooted`, and `disabled` all at the same time.

**Syntax** & **Example**:
```html
<paralyzed>
```
> Just having this tag enables the functionality for the state(s).

Applicable to:
- States
---
---
# Pierce
`pierce` represents the concept of a single action hitting multiple times.

> There is no limit to the number of times a single action can hit a foe, but it is important to know that this counter is per enemy. If a single action hits multiple enemies, it can hit all enemies this many times each. This is obviously limited by the collision size.

**Syntax**:
```html
<pierce: [pierceCount, pierceDelay]>
pierceCount = the number of times this single action can hit a foe.
pierceDelay = the delay in frames between each successive hit from the same action.
```

**Example**:
```html
<pierce: [2, 3]>
- This skill can hit a maximum of 2 times, with a delay of 3 frames between each hit.
```

Applicable to:
- Skills
---
---
# Pose Suffix
`poseSuffix` is an extremely crude means of "posing" when executing a skill. The most common usecase for this would be to show your player's battler swinging a sword when they execute the sword slash attack or something. However, it also works with enemy battlers and such, too.

Does not support posing to non-indexed spritesheets. (files prefixed with $, such as $BigMonster1.png)

This also autocycles through patterns, but it is hard coded to start at 2, then drop to 1 and 0 at the end of the pose. This is on my list of things to upgrade to a more robust pose functionality.

**Syntax**:
```html
<poseSuffix: [spriteSuffix, spriteIndex, poseDuration]>
spriteSuffix = the suffix to append to the name of your battler's spritesheet.
spriteIndex = the index to use on the spritesheet to pose.
poseDuration = the number of frames to spend posing in this spritesheet.
```

**Example**:
```html
<poseSuffix: ["-atk", 0, 12]>
- If your battler's spritesheet was named "chara_je.png", then it'd look for "chara_je-atk.png".
- It would take the 0th index character (upper left most sprite) from that sheet.
- And spend 12 frames in that pose before reverting back to the original spritesheet.
```

Applicable to:
- Skills
---
---
# Prepare Time
`prepare` is the amount of time in frames an AI-controlled battler spends in phase 1 of the AI. This is effectively the time until their turn is ready. During this time, they may or may not move depending on their AI configuration.

Does not affect the player-controlled character.

> When AI for allies is implemented, this will apply to actors as well.

**Syntax**:
```html
<prepare: prepareFrames>
prepareFrames = the minimum distance (in squares/spaces/tiles) away to execute the skill.
```

**Example**:
```html
<prepare: 120>
- The battler must wait 120 frames before proceeding to phase 2 of the AI.
```

Applicable to:
- Enemies
- Actors (not yet available)
---
---
# Proximity
`proximity` is the minimum distance that an AI-controlled battler must be from its target in order to execute this action.

Does not affect the player-controlled character.

**Syntax**:
```html
<proximity: minimumDistance>
minimumDistance = the minimum distance (in squares/spaces/tiles) away to execute the skill.
```

**Example**:
```html
<proximity: 2>
- The battler must be within 2 squares/spaces/tiles before it will try to execute the skill.
```

Applicable to:
- Skills
---
---
# Pursuit
`p` (yes, just `p`) represents the distance of which this battler will pursue its currently engaged target. This should typically be greater than the battler's sight range. If the target leaves this range, it will disengaged and return to it's "home" coordinates.

> Similar to sight, this is unobstructed distance.

**Syntax**:
```html
<p: pursuitRange>
pursuitRange = the maximum distance this battler will pursue a target.
```

**Example**:
```html
<p: 8>
- Once engaged, this battler will remain engaged so long as the the target is within 8 squares/spaces/tiles.
```

Applicable to:
- Events (on the map)
---
---
# Range
`range` affects the size of shapes/hitboxes for an action. The more `range`, the bigger/longer the hitbox for the action.

**Syntax**:
```html
<range: rangeValue>
rangeValue = the size/range of the skill.
```

**Example**:
```html
<range: 2>
- the action can potentially hit up to 2 squares/spaces/tiles away/wide/far (see the shapes section).
```

Applicable to:
- Skills
---
---
# Rooted
The `rooted` note tag prevents the battler from moving. Attacking and skills can still be used.

**Syntax** & **Example**:
```html
<rooted>
```
> Just having this tag enables the functionality for the state(s).

Applicable to:
- States
---
---
# Shape
`shape` is literally the shape of the hitbox for the collision of this action. This can be only one of a variety of different options:
- `rhombus` : A diamond-like shape. More range means bigger diamond.
- `square` : A square shape. Similar to `rhombus`, but rotated 45 degrees. More range means bigger square.
- `frontsquare` : A `square` that is truncated to be only infront of the battler/action. More range means bigger square.
- `line` : A 1-tile width line that stretches further based on range in a single direction.
- `arc` : The most common shape: a `rhombus` truncated to be only infront of the battler/action. Often used for things like a sword slash. More range means a the arc reaches further.
- `wall` : A 1-tile depth line that stretches to the left & right of the battler/action. More range means it stretches further left and right (not thicker, the `wall` will only ever have a distance of 1 infront of the battler/action).
- `cross` : A cross-shaped hitbox that will only ever be 1-tile thick. Goes in four directions from the battler/action.

> I would like to give credit to Moghunter for being the foundation of the collision functionality, though one may not recognize his code after the multiple iterations it went through, but it was there and I thank him for involuntarily giving me a launching point.

**Syntax**:
```html
<shape: theShape>
theShape = the shape of this action. See above for the available options.
```

**Example**:
```html
<shape: arc>
- the action will hit in an arc-shape, dependent on how big the range is.
```

Applicable to:
- Skills
---
---
# Sight
`s` (yes, just `s`) represents the distance of which this battler can perceive other battlers for engagement and otherwise.

> Currently, battlers can "see" through walls, for this is not actual sight, just a distance. I plan on implementing proper sight obstructions and all that so if you cant walk through it, you can't see through it either. Additionally, sight will later be utilized for other purposes, like targeting range for skills, etc.

**Syntax**:
```html
<s: sightRange>
sightRange = the maximum distance this battler can "see".
```

**Example**:
```html
<s: 4>
- This battler will see and engage on enemy battlers within 4 distance (tiles/squares/spaces).
```

Applicable to:
- Events (on the map)
---
---
# Skill Id
The `skillId` note tag binds an item/weapon/armor to a skill.

> The only armor that is considered is "offhand" armors, or your second weapon if dual-wielding.

**Syntax**:
```html
<skillId: skillIdValue>
skillIdValue = the skill id that this weapon/item links to.
```

**Example**:
```html
<skillId: 10>
- If on an item, then this item will execute the skill with id of 10 after applying the item effects.
- If on a mainhand weapon, then this weapon will execute the skill with id of 10 when pressing the mainhand attack button.
- If on an offhand weapon/armor, then this offhand equip will execute the skill with id of 10 when pressing the offhand attack button.
```

Applicable to:
- Items
- Weapons
- Armors
---
---
# Tp Flat
The `tpFlat` is the number to modify the **tp5** regeneration value by.

> It is recommended to read the section regarding the changes made to regeneration.

**Syntax**:
```html
<tpFlat: flatAmount>
flatAmount = the amount to modify the tp5 regeneration value by. Can be negative or positive.
```

**Example**:
```html
<tpFlat: 50>
- This battler's tp5 will be increased by 50.

<tpFlat: -25>
- This battler's tp5 will be reduced by 25.
```

Applicable to:
- States
---
---
# Tp Perc
The `tpPerc` is the number to modify the **tp5** regeneration value by.

> It is recommended to read the section regarding the changes made to regeneration.

**Syntax**:
```html
<tpPerc: percentAmount%>
percentAmount = the amount to modify the tp5 regeneration value by. Can be negative or positive.
```

**Example**:
```html
<tpPerc: 10%>
- This battler's tp5 will be increased by 10% of their own max TP.

<tpPerc: -5%>
- This battler's tp5 will be reduced by 5% of their own max TP.
```

> It is worth noting that the base max TP is fixed at 100 unless you're using other plugins, 
> so this is effectively the same as using `tpFlat`.

Applicable to:
- States
---
---
# Unique Cooldown
The `uniqueCooldown` note tag makes it so that a skill does not affect other skill slots that have the same skill equipped.

**Syntax** & **Example**:
```html
<uniqueCooldown>
```

> Just having this tag enables the functionality for the action(s).

Applicable to:
- Skills
---
---