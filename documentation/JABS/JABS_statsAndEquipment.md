# Things to know about stats and equipment
Due to the nature of JABS being an ABS, some of the stats that a player's character has were either repurposed or aren't currently used. In this section, we'll be going over the details of what was changed, and how that affects you.

## Stats that changed
As you've seen if you've poked around in RPG Maker MZ, there are three categories of stats:
- the base parameters, such as HP or MAT
- the ex-params, such as CRI or HRG
- the s-params, such as GRD or MCR

Let's talk about each category in detail:

---
### The Base Stats
Nothing changed about these. HP/MP/TP/ATK/DEF/MAT/MDF/AGI/LUK all function as they did previously.

---
### The Ex Stats
The Ex stats probably have the most things you should know about them, as some are largely unused, while others were changed to be more ABS-like:

The Ex-params that were untouched include:<br/>
EVA, CRI, CEV, MEV

The Ex-params that are currently unused due to ABS reasons:<br/>
MRF, CTR

The Ex-params that were updated due to ABS reasons:<br/>
- HRG/MRG/TRG: These were all updated to be more "realtime" on the map. The number that you see here when viewing in the status menu (if you have one that displays this value) now represents the regeneration per-5 rate as a flat value for the given stat.
- HIT: This stat was repurposed (along with GRD) to be the attacker's hit rate when penetrating the innate parry rate of the target.

---
### The S Stats
The S stats were largely untouched except for one, while others are simply unused in an ABS context:

The S-params that were untouched include (so many!):<br/>
REC, PHA, MCR, TCR, PDR, MDR, FDR, EXR

The S-params that are currently unused due to ABS reasons:<br/>
TGR

The S-params that were updated due to ABS reasons:
- GRD: This stat was repurposed (along with HIT) to be the defender's parry rate to totally mitigate an incoming attack.

## Equipment Changes
Largely, equipment hasn't really changed a whole lot. Mostly its just the stats that changed, which will result in needing to update the way you assign stats to the equipment for your players to use. However, there are a few tags that can be placed in the notes of gear that are JABS-specific that you may want to use:

```html
<skillId:11>
```
`skillId` represents the skill id that this weapon will perform when the corresponding button is pressed while this weapon is equipped. If it is equipped in your main hand, then pressing the mainhand button will perform it, while if the battler is dual-wielding and you stick this in the offhand slot, it'll require you press the offhand button instead. This tag can go on weapons or any armor that may wind up in the player's offhand (such as a shield).

```html
<speedBoost:-2>
```
`speedBoost` is a newly tracked parameter for JABS and currently isn't visible anywhere. However, the impact of this is pretty noticable if the player has a lot of positive or negative `speedBoost`. As you might guess, this invisible parameter affects the actual movespeed of the player. It does have diminishing returns (in both directions), you'll need to toy with it a bit to see the impact it can have when its as high as 15, or as low as -15. The idea behind it was to give the effect that heavy equipment can slow you down (full plate mail), while lighter gear lends itself better to faster movement (cloth gear, or magical rings etc).