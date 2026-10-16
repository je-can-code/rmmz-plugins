# overview

* [The Plugin Overview](overview.md) - The general overview for what this plugin is about along with the when and how you might use it.

# dependencies

* [Dependencies](dependencies.md) - The list of dependencies- required and optional- for this plugin.

# notetag

* [Enemy ID](notetags/enemy-events/enemy-id.md) - The tag associating an event with an enemy from the database.
* [Sight Radius](notetags/enemy-events/sight-radius.md) - The tag defining how far around itself an enemy can perceive the player.
* [Pursuit Radius](notetags/enemy-events/pursuit-radius.md) - The tag defining the radius an enemy will maintain while actively engaged in combat.
* [Prepare Time](notetags/enemy-events/prepare-time.md) - The tag defining how many frames an enemy waits before taking its first action.
* [Alerting](notetags/enemy-events/alerting.md) - The tags configuring how an enemy reacts to being struck from outside its sight and pursuit range.
* [Vision Multiplier](notetags/enemy-events/vision-multiplier.md) - The tag scaling how well a battler sees its opponents.
* [Move Speed](notetags/enemy-events/move-speed.md) - The tag defining an enemy's move speed as any numeric value, such as 3.7.
* [AI Traits](notetags/enemy-events/ai-traits.md) - The tags modifying how an enemy chooses and uses its skills.
* [AI Roles](notetags/enemy-events/ai-roles.md) - The tags defining how a battler coordinates with other battlers on its team.
* [Guard Range](notetags/enemy-events/guard-range.md) - The tag defining the distance at which a guardian can respond to attacks on its wards.
* [Teams](notetags/enemy-events/teams.md) - The tag assigning a battler to a team, and the required config file defining the teams.
* [Circumstantial Config Options](notetags/enemy-events/circumstantial-config-options.md) - The tags modifying the base look or behavior of enemies.
* [Action Id](notetags/skills/action-id.md) - The tag associating a skill with an event on the action map.
* [Duration](notetags/skills/duration.md) - The tag defining how long a skill's action event persists on the map.
* [Linger](notetags/skills/linger.md) - The tag defining how many frames an expired action event spends fading out.
* [Cooldown Management](notetags/skills/cooldown-management.md) - The tags configuring skill cooldowns, the battler-wide global cooldown, and cooldown reduction.
* [Radius](notetags/skills/radius.md) - The tag defining how large a skill's hitbox is, using tiles as measurement.
* [Proximity](notetags/skills/proximity.md) - The tag defining the maximum tile distance between the battler and the target at which a skill can be used.
* [Direct](notetags/skills/direct.md) - The tag making a skill lock onto the nearest valid target rather than firing a flying map projectile.
* [Direct Lock](notetags/skills/direct-lock.md) - The tag making a direct skill lock onto the target's live position at the moment the skill fires.
* [Direct State Target](notetags/skills/direct-state-target.md) - The tag defining the state that marks the priority target of a direct skill.
* [Projectile](notetags/skills/projectile.md) - The tag defining how many projectiles fire when a skill is executed.
* [Projectile Duration](notetags/skills/projectile-duration.md) - The tag modifying how long all of a battler's map actions persist on the map.
* [Formation](notetags/skills/formation.md) - The tag defining the direction pattern in which a skill's projectiles fire.
* [Hitbox](notetags/skills/hitbox.md) - The tag defining the shape of collision for a skill.
* [Degrees](notetags/skills/degrees.md) - The tag defining the angular width of an ARC hitbox.
* [Thickness](notetags/skills/thickness.md) - The tag defining how many extra tiles of width a LINE or WALL hitbox occupies.
* [Inner Radius](notetags/skills/inner-radius.md) - The tag carving a dead zone out of the middle of a skill's hitbox, around the action's origin.
* [Cast Time](notetags/skills/cast-time.md) - The tag defining how many frames a battler must wait before a skill fires.
* [Cast Animation](notetags/skills/cast-animation.md) - The tag defining an animation that loops on the caster while a skill is being cast.
* [Self Animation](notetags/skills/self-animation.md) - The tag defining an animation that plays on the caster when a skill hits a target.
* [On-Cast Animation](notetags/skills/on-cast-animation.md) - The tag defining an animation that plays once on the caster at the moment a skill fires.
* [Channel](notetags/skills/channel.md) - The tags turning a skill into a vessel that repeatedly executes a child skill for a total duration.
* [Casting / Channeling Interruption](notetags/skills/casting-channeling-interruption.md) - The tags configuring how casting and channeling can be interrupted, and who is immune.
* [Piercing](notetags/skills/piercing.md) - The tag defining how many connections a skill's map action may complete, and the delay between them.
* [Per-Connection Bonus Hits (Skill Note)](notetags/skills/per-connection-bonus-hits-skill-note.md) - The tag adding extra battle-effect applications per target each time a skill's pierce step resolves.
* [Knockback](notetags/skills/knockback.md) - The tags configuring how far a skill knocks its target back, and whether terrain can halt it.
* [Delay](notetags/skills/delay.md) - The tag allowing a skill to sit on the map for a duration before triggering.
* [Combos](notetags/skills/combos.md) - The tags configuring what skill can be followed up after using a skill, and when it becomes available.
* [AI Skill Exclusion](notetags/skills/ai-skill-exclusion.md) - The tag excluding a skill from the pool of skills an AI battler can select.
* [Guarding](notetags/skills/guarding.md) - The tags configuring a guard skill's damage reduction, parry window and counter skills.
* [Unparryable](notetags/skills/unparryable.md) - The tag making a skill unable to be parried under any circumstances.
* [Parry Extension Rate (PER)](notetags/skills/parry-extension-rate-per.md) - The tag defining how many percent-points of parry window extension a source contributes.
* [Retaliate](notetags/skills/retaliate.md) - The tag defining a skill a battler has a chance to fire in immediate retaliation when struck.
* [On Own Defeat](notetags/skills/on-own-defeat.md) - The tag defining a parting skill a battler may fire when it is defeated.
* [On Target Defeat](notetags/skills/on-target-defeat.md) - The tag defining a follow-up skill a battler may fire when it defeats a target.
* [On Defeated Target](notetags/skills/on-defeated-target.md) - The tag making an onTargetDefeat skill spawn on the defeated target rather than on the caster.
* [On Evade Apply](notetags/skills/on-evade-apply.md) - The tag defining a state a battler may inflict on the attacker who missed it.
* [On Evade Apply Self](notetags/skills/on-evade-apply-self.md) - The tag defining a state a battler may apply to itself when it evades an incoming attack.
* [On Evade Execute](notetags/skills/on-evade-execute.md) - The tag defining a skill a battler may fire when it evades an incoming attack.
* [On-Chance Roll Manipulation (Lucky/Cursed Rolls)](notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md) - The tags adding extra rolls to either side of an on-chance roll contest, or bypassing it entirely.
* [Encore Repeats (Bonus Proc Executions)](notetags/skills/encore-repeats-bonus-proc-executions.md) - The tag defining how many extra times a battler's successful on-chance procs execute.
* [Accumulate Mode](notetags/skills/accumulate-mode.md) - The tag counting every positive roll in a chance-roll contest instead of stopping at the first success.
* [Skill History Bonus](notetags/skills/skill-history-bonus.md) - The tags applying a damage multiplier based on a battler's recent skill execution history.
* [Cast Time Damage Bonus](notetags/skills/cast-time-damage-bonus.md) - The tags scaling direct HP/MP damage from skills by their resolved cast time.
* [Range Size Modifiers](notetags/skills/range-size-modifiers.md) - The tags scaling the effective reach of every JABS action launched by the bearer.
* [This Range Size Modifiers](notetags/skills/this-range-size-modifiers.md) - The tags modifying one skill's reach, read from that skill's own note.
* [Loot Magnet](notetags/skills/loot-magnet.md) - The tags scaling how far the party leader draws loot drops toward themselves.
* [Per-Debuff Bonus](notetags/skills/per-debuff-bonus.md) - The tag adding bonus damage for every negative state active on the target.
* [Bonus Damage If State](notetags/skills/bonus-damage-if-state.md) - The tags adding bonus damage while the target has a specific state active.
* [Bonus Damage](notetags/skills/bonus-damage.md) - The tags adding an unconditional percent damage bonus, caster-wide or to a single skill.
* [Bonus Damage If State Type](notetags/skills/bonus-damage-if-state-type.md) - The tag adding bonus damage while the target has any active state of a given type.
* [Bonus Damage per State Type](notetags/skills/bonus-damage-per-state-type.md) - The tag adding bonus damage for every active state of a given type on the target.
* [Bonus Damage If Self State](notetags/skills/bonus-damage-if-self-state.md) - The tags adding bonus damage while the caster itself has a specific state active.
* [Bonus Damage per State Stack](notetags/skills/bonus-damage-per-state-stack.md) - The tags adding bonus damage per stack of one specific state on the target.
* [Bonus Damage for My State Count](notetags/skills/bonus-damage-for-my-state-count.md) - The tags adding bonus damage for every distinct state the caster has applied to the target.
* [Vulnerability per Authored State Stack](notetags/skills/vulnerability-per-authored-state-stack.md) - The tag making a target take bonus damage from anyone, per stack of each state the holder applied to it.
* [Bonus Damage If Target HP Below](notetags/skills/bonus-damage-if-target-hp-below.md) - The tags adding an execute-style bonus that grows as the target's hp drops under a threshold.
* [Apply State on Expire](notetags/skills/apply-state-on-expire.md) - The tag applying a follow-up state when a state expires naturally.
* [Purge States](notetags/skills/purge-states.md) - The tag making a skill strip states off the target by priority when it lands a hit.
* [No Logs](notetags/skills/no-logs.md) - The tag keeping a state's removal by a purge out of the map's action log.
* [State Spreading](notetags/skills/state-spreading.md) - The tags letting a tracked state spread to nearby battlers on its own cadence.
* [Mainhand and Offhand Slots](notetags/using-skills/mainhand-and-offhand-slots.md) - The tag defining which skill a piece of equipment grants to its mainhand or offhand slot.
* [Offhand Skill Override](notetags/using-skills/offhand-skill-override.md) - The tag defining a different skill a weapon grants to the offhand slot than to the mainhand slot.
* [Two-Handed Weapons](notetags/using-skills/two-handed-weapons.md) - The native trait that marks a weapon as two-handed by sealing the offhand slot.
* [Assigning the Offhand (Player Pin)](notetags/using-skills/assigning-the-offhand-player-pin.md) - The tag opting a skill into the list players can pin into the offhand slot.
* [Knockback Resistance](notetags/using-skills/knockback-resistance.md) - The tag reducing how far a battler carrying a piece of equipment is knocked back by incoming hits.
* [Proximity Knockback](notetags/using-skills/proximity-knockback.md) - The tag amplifying a battler's outgoing knockback by how many opposing battlers are near them.
* [Knockback Amp / This Knockback Amp](notetags/using-skills/knockback-amp-this-knockback-amp.md) - The tags amplifying a battler's outgoing knockback unconditionally, battler-wide or for a single skill.
* [Per-Connection Bonus Hits (Actor / Class / Equipment / States)](notetags/using-skills/per-connection-bonus-hits-actor-class-equipment-states.md) - The tags adding battler-side bonus hits per connection, stacking with the executing skill's own bonus hits.
* [Tool Slot](notetags/using-skills/tool-slot.md) - The tag defining which skill an item performs from the tool slot.
* [Dodge Slot](notetags/using-skills/dodge-slot.md) - The skill type setup that makes a skill eligible for the dodge slot.
* [Dodge Movetype](notetags/using-skills/dodge-movetype.md) - The tag defining which direction a dodge skill moves the player.
* [Dodge Distance](notetags/using-skills/dodge-distance.md) - The tag defining how many tiles a dodge skill forcefully moves the player.
* [Dodge Speed](notetags/using-skills/dodge-speed.md) - The tag defining a modifier added to the player's move speed while dodging.
* [Dodge Invincibility](notetags/using-skills/dodge-invincibility.md) - The tags making the player fully or partially invincible while dodging.
* [Combat Skill Slots](notetags/using-skills/combat-skill-slots.md) - The four player-assigned slots that hold the combat skills a player knows.
* [Auto Assignment of Skills](notetags/using-skills/auto-assignment-of-skills.md) - The tag enabling newly learned skills to be auto-assigned to empty combat slots.
* [Enable Auto Upgrade](notetags/using-skills/enable-auto-upgrade.md) - The tag allowing auto-learned skills to replace the existing equipped skills they upgrade.
* [Block Auto Assignment per Skill Type](notetags/using-skills/block-auto-assignment-per-skill-type.md) - The tag blocking skills of the listed skill types from being auto-assigned.
* [Block Auto Assignment per Individual Skill](notetags/using-skills/block-auto-assignment-per-individual-skill.md) - The tag blocking a single skill from being auto-assigned.
* [Upgrade Over Skill](notetags/using-skills/upgrade-over-skill.md) - The tag making a newly learned skill replace a currently equipped skill.
* [Upgrade Only Skill](notetags/using-skills/upgrade-only-skill.md) - The tag preventing a skill from being auto-assigned, leaving upgrades as its only way in.
* [No Upgrading a Skill](notetags/using-skills/no-upgrading-a-skill.md) - The tag preventing a skill from ever being upgraded by another skill.
* [Bonus Aggro](notetags/aggro/bonus-aggro.md) - The tag defining a flat amount of aggro a skill gains or loses.
* [Aggro Multiplier](notetags/aggro/aggro-multiplier.md) - The tag scaling the aggro a skill generates by a decimal multiplier.
* [Aggro Percent (Own Existing Aggro)](notetags/aggro/aggro-percent-own-existing-aggro.md) - The tag adjusting the caster's own standing aggro on the target by a percent.
* [Not My Aggro (Redirect Threat to Yourself)](notetags/aggro/not-my-aggro-redirect-threat-to-yourself.md) - The tags adjusting every teammate's standing aggro on the target, redirecting threat to the caster.
* [Aggro Lock](notetags/aggro/aggro-lock.md) - The tag freezing a battler's aggro while a state is active.
* [Aggro Out Amplifier](notetags/aggro/aggro-out-amplifier.md) - The tag multiplying all aggro a battler generates while a state is active.
* [Aggro In Amplifier](notetags/aggro/aggro-in-amplifier.md) - The tag multiplying all aggro a battler receives while a state is active.
* [Use on Pickup](notetags/loot/use-on-pickup.md) - The tag making a dropped item perform as if used on the player who picks it up.
* [Expiration](notetags/loot/expiration.md) - The tag overriding how long a specific loot drop persists on the map.
* [Dynamically Spawning Loot](notetags/loot/dynamically-spawning-loot.md) - The plugin command for generating and spawning loot at any map location.
* [Negative](notetags/states/negative.md) - The classifier informing the AI that a state is harmful.
* [Rooted](notetags/states/rooted.md) - The tag locking a battler's movement while the state is applied.
* [Disabled](notetags/states/disabled.md) - The tag locking a battler's basic attacks while the state is applied.
* [Muted](notetags/states/muted.md) - The tag locking a battler's combat skills while the state is applied.
* [Paralyzed](notetags/states/paralyzed.md) - The tag locking a battler's movement, basic attacks and combat skills all at once.
* [State-Application Immunity & Resistance](notetags/states/state-application-immunity-resistance.md) - The tags blocking states from being applied to a battler, or reducing the chance they land.
* [Skill Transform](notetags/states/skill-transform.md) - The tag transforming one equipped skill into another at runtime.
* [Slot Transform](notetags/states/slot-transform.md) - The tag redirecting an entire slot to a skill, regardless of what is equipped in it.
* [Slip Damage](notetags/states/slip-damage.md) - The tags defining how a state diminishes or replenishes HP, MP or TP on every tick.
* [Tick Speed](notetags/states/tick-speed.md) - The tags modifying how often slip and regen effects tick.
* [Slip Amplification](notetags/states/slip-amplification.md) - The tags amplifying each tick of the damage and healing over time a battler applies.
* [State Durations](notetags/states/state-durations.md) - The tags defining how long a state lasts on the map, or that it never expires there.
* [State Duration Extensions](notetags/states/state-duration-extensions.md) - The tags modifying the outgoing duration of states applied by a battler.
* [This State Duration Extensions](notetags/states/this-state-duration-extensions.md) - The tags modifying the outgoing duration of one state, read from that state's own note.
* [Stack Type](notetags/states/stack-type.md) - The tag overriding the reapply strategy for an individual state.
* [Refresh Config Overrides](notetags/states/refresh-config-overrides.md) - The tags overriding the refresh reapply settings for an individual state.
* [Extend Config Overrides](notetags/states/extend-config-overrides.md) - The tags overriding the extend reapply settings for an individual state.
* [Stack Config Overrides](notetags/states/stack-config-overrides.md) - The tags overriding how an individual state stacks, expires and converts.
* [No Switch](notetags/actors/no-switch.md) - The tag preventing the player from switching to an actor as the party leader.
* [Vis Offset](notetags/visuals/vis-offset.md) - The tags shifting a skill's action sprite by a pixel offset, optionally per direction of travel.
* [Vis Anchor](notetags/visuals/vis-anchor.md) - The tag overriding the anchor point of a skill's action sprite.
* [Vis Rotate](notetags/visuals/vis-rotate.md) - The tag making a skill's action sprite rotate to face the direction it is moving.
* [Vis Scale](notetags/visuals/vis-scale.md) - The tag overriding the scale of a skill's action sprite.
* [Vis Z](notetags/visuals/vis-z.md) - The tag overriding the z-order of a skill's action sprite.
* [Vis Debug](notetags/visuals/vis-debug.md) - The tag rendering a center-point debug gizmo on a skill's action sprite.
* [No Cast Preview (Per Skill)](notetags/cast-preview/no-cast-preview-per-skill.md) - The tag disabling the hitbox preview for one skill while it is being cast.
* [Cast Preview Warn At](notetags/cast-preview/cast-preview-warn-at.md) - The tag delaying a skill's hitbox preview until only the last frames of its cast remain.
* [No Cast Previews (Per Battler)](notetags/cast-preview/no-cast-previews-per-battler.md) - The tag disabling cast previews for every skill a battler executes.

# plugin-parameter

* [Parameter Group: BASE SETUP](parameters/base-configs.md) - The heading the BASE SETUP parameters sit under in the plugin manager.
* [Max AI Update Range Plugin Parameter](parameters/max-ai-update-range.md) - CHANGE THIS VALUE WITH CAUTION. MAKING THIS TOO HIGH WILL CAUSE LAG IF THERE ARE LOTS(30+) OF ENEMIES IN RANGE.
* [Action Map Id Plugin Parameter](parameters/action-map-id.md) - The default id of the map used for cloning action events off of.
* [Enemy Map Id Plugin Parameter](parameters/enemy-map-id.md) - The id of the map used for cloning enemy events off of.
* [Dodge Skill Type Id Plugin Parameter](parameters/dodge-skill-type-id.md) - The default id of the skill type that acts as a classification for dodge skills.
* [Rotate Skill Type Id Plugin Parameter](parameters/guard-skill-type-id.md) - The default id of the skill type that acts as a classification for guard skills.
* [Weapon Skill Type Id Plugin Parameter](parameters/weapon-skill-type-id.md) - The default id of the skill type that acts as a classification for weapon skills.
* [Parameter Group: ENEMY BATTLER DEFAULTS](parameters/enemy-default-configs.md) - The heading the ENEMY BATTLER DEFAULTS parameters sit under in the plugin manager.
* [Default Enemy Prepare Time Plugin Parameter](parameters/default-enemy-prepare-time.md) - The default number of frames for "prepare" time.
* [Default Enemy Attack Skill Plugin Parameter](parameters/default-enemy-attack-skill-id.md) - The default skill id used for an enemy basic attack where their animation is "normal attack".
* [Default Enemy Sight Range Plugin Parameter](parameters/default-enemy-sight-range.md) - The default range from a battler that they can engage in combat from.
* [Default Enemy Pursuit Range Plugin Parameter](parameters/default-enemy-pursuit-range.md) - The default range from a battler that they can remain in combat within.
* [Default Enemy Alerted Sight Boost Plugin Parameter](parameters/default-enemy-alerted-sight-boost.md) - The default boost to sight an enemy gains while alerted (alerted: hit from out of combat).
* [Default Enemy Alerted Pursuit Boost Plugin Parameter](parameters/default-enemy-alerted-pursuit-boost.md) - The default boost to pursuit an enemy gains while alerted (alerted: hit from out of combat).
* [Default Enemy Alert Duration Plugin Parameter](parameters/default-enemy-alert-duration.md) - The default number of frames an enemy remains alerted (alerted: hit from out of combat).
* [Default Enemy Can Idle Plugin Parameter](parameters/default-enemy-can-idle.md) - The default for whether or not enemies can idle.
* [Default Enemy Show HP Bar Plugin Parameter](parameters/default-enemy-show-hp-bar.md) - The default for whether or not enemies' HP bars are visible.
* [Default Enemy Show Battler Name Plugin Parameter](parameters/default-enemy-show-battler-name.md) - The default for whether or not enemies' names are visible.
* [Default Enemy Is Invincible Plugin Parameter](parameters/default-enemy-is-invincible.md) - Setting this to true will cause all enemies to be invincible by default. USE WITH CAUTION.
* [Default Enemy Is Inanimate Plugin Parameter](parameters/default-enemy-is-inanimate.md) - Setting this to true will cause all enemies to be inanimate by default. USE WITH CAUTION.
* [Default Respawn Method Plugin Parameter](parameters/default-respawn-method.md) - The world-default respawn method for defeated enemies. Leave blank for no respawn tracking at all.
* [Default Respawn Param Plugin Parameter](parameters/default-respawn-param.md) - The parameter fed to the world-default respawn method, such as the number of seconds.
* [Default Respawn Animation Plugin Parameter](parameters/default-respawn-animation-id.md) - The default animation to play on an event when its battler respawns. Set to 0 for no animation.
* [Parameter Group: WHEN UNASSIGNED](parameters/default-configs.md) - The heading the WHEN UNASSIGNED parameters sit under in the plugin manager.
* [Default Tool Cooldown Time Plugin Parameter](parameters/default-tool-cooldown-time.md) - The default number of frames for an item's cooldown if one isn't specified.
* [Default Loot Duration Plugin Parameter](parameters/default-loot-expiration.md) - The default number of frames before an item expires from the map. Set to -1 for no expiration.
* [Parameter Group: MAP AFFLICTION STRIP](parameters/map-affliction-configs.md) - The heading the MAP AFFLICTION STRIP parameters sit under in the plugin manager.
* [Map Affliction Icon Scale Plugin Parameter](parameters/map-affliction-icon-scale.md) - Scale applied to map affliction icons (1 = full icon size).
* [Map Affliction Gauge Height Plugin Parameter](parameters/map-affliction-gauge-height.md) - Height in pixels of each map affliction drain gauge.
* [Gap Below HP Bar Plugin Parameter](parameters/map-affliction-gap-below-hp-bar.md) - Pixels between the hp gauge bottom and the affliction icon row.
* [Map Affliction Max Slots Plugin Parameter](parameters/map-affliction-max-slots.md) - Maximum number of affliction icons shown per row below a map battler.
* [Default Attack Animation Id Plugin Parameter](parameters/default-attack-animation-id.md) - The default id of the animation for battlers when none is defined.
* [Parameter Group: ICON CONFIGURATIONS](parameters/icon-configs.md) - The heading the ICON CONFIGURATIONS parameters sit under in the plugin manager.
* [Use Elemental Icons Plugin Parameter](parameters/use-elemental-icons.md) - Enable or disable the display of elemental icons on damage popups with this option.
* [Elemental Icon Data Plugin Parameter](parameters/elemental-icon-data.md) - The collection of element ids and their icon indices.
* [Parameter Group: ACTION DECIDED ANIMATIONS](parameters/animation-configs.md) - The heading the ACTION DECIDED ANIMATIONS parameters sit under in the plugin manager.
* [Attack Decided Animation Id Plugin Parameter](parameters/attack-decided-animation-id.md) - The animation id that plays on the ai-controlled battler when they decide an attack-action.
* [Support Decided Animation Id Plugin Parameter](parameters/support-decided-animation-id.md) - The animation id that plays on the ai-controlled battler when they decide a support-action.
* [Parameter Group: AGGRO DEFAULTS](parameters/aggro-configs.md) - The heading the AGGRO DEFAULTS parameters sit under in the plugin manager.
* [Base Aggro Plugin Parameter](parameters/base-aggro.md) - The base amount of aggro generated by every action, in addition to the rest of the formula.
* [Aggro per HP damage Plugin Parameter](parameters/aggro-per-hp.md) - The amount of aggro generated per 1 HP damage dealt to a non-allied target.
* [Aggro per MP damage Plugin Parameter](parameters/aggro-per-mp.md) - The amount of aggro generated per 1 MP damage dealt to a non-allied target.
* [Aggro per TP damage Plugin Parameter](parameters/aggro-per-tp.md) - The amount of aggro generated per 1 TP damage dealt to a non-allied target.
* [Aggro Drain Multiplier Plugin Parameter](parameters/aggro-drain-multiplier.md) - If the skill was an HP Drain, then generate an additional X aggro per HP drained.
* [Aggro Parry Flat Amount Plugin Parameter](parameters/aggro-parry-flat-amount.md) - If the skill didn't connect because it was parried, add this much instead. Can be negative.
* [Aggro Parry User Gain Plugin Parameter](parameters/aggro-parry-user-gain.md) - If the skill didn't connect because it was parried, aggro the attacker this much.
* [Aggro Player Reduction Plugin Parameter](parameters/aggro-player-reduction.md) - The player can attack much faster than AI, so reducing their aggro output by default is sensible.
* [Parameter Group: CHANNELING DEFAULTS](parameters/channel-configs.md) - The heading the CHANNELING DEFAULTS parameters sit under in the plugin manager.
* [Default Channel Tick Speed Plugin Parameter](parameters/default-channel-tick-speed.md) - The number of frames between each repeated execution of a `<channel:[SKILL_ID, DURATION]>` skill's child skill, when the skill omits its own `<channelTickSpeed:N>` override.
* [Parameter Group: STATE DEFAULTS](parameters/state-configs.md) - The heading the STATE DEFAULTS parameters sit under in the plugin manager.
* [Reapply Type Plugin Parameter](parameters/default-state-reapply-type.md) - The strategy used when applying a state on a battler already afflicted with the same state.
* ["REFRESH" CONFIG Plugin Parameter](parameters/refresh-configs.md) - "Refresh" means that the state will have its duration reset to its original duration.
* ["EXTEND" CONFIG Plugin Parameter](parameters/extend-configs.md) - "Extend" means that the state will have its duration increased by its original duration.
* ["STACK" CONFIG Plugin Parameter](parameters/stack-configs.md) - "Stack" means that a state will gain an additional instance and be "refreshed".
* ["TICK" CONFIG Plugin Parameter](parameters/tick-configs.md) - Governs how often states (and natural regen) tick for slip/regen purposes.
* [Refresh Diminishment Plugin Parameter](parameters/default-state-refresh-diminish.md) - When a state is "refreshed", it will have this many frames less in duration added.
* [Diminishment Reset Plugin Parameter](parameters/default-state-refresh-reset.md) - After this many frames, the diminishing returns on a state being "refreshed" will reset. (60 frames = 1 second)
* [Default Spread Tick Interval Plugin Parameter](parameters/default-state-spread-tick-interval.md) - Frames between state spread pulses when a state row omits <spreadTick:N>. (60 frames = 1 second)
* [Extend Amount Plugin Parameter](parameters/default-state-extend-amount.md) - When a state is "extended", it will instead extend remaining duration by this many frames.
* [Extend Amount Plugin Parameter](parameters/default-state-extend-max.md) - When a state is "extended", it will instead extend remaining duration by this many frames.
* [Stack Cap Plugin Parameter](parameters/default-state-stack-max.md) - When a state "stacks", there is a limit of this many stacks.
* [Stacks per Application Plugin Parameter](parameters/default-state-application-count.md) - When "stacking" a state, it will apply this many stacks by default.
* [Lose All Stacks Plugin Parameter](parameters/default-state-lose-all-stacks-at-once.md) - If true, then all state "stacks" will be lost upon expiration. If false, then one will be lost and "refresh".
* [Default Tick Interval Plugin Parameter](parameters/default-state-tick-interval.md) - Frames between slip/regen ticks when a state omits <thisTickSpeed:N>. (60 frames = 1 second)
* [Minimum Tick Interval Plugin Parameter](parameters/minimum-state-tick-interval.md) - The tunable floor for tick intervals after all modifiers are applied; ticks can never resolve faster than this.
* [Natural Regen Tick Type Plugin Parameter](parameters/natural-regen-tick-type.md) - The <type:CLASSIFIER> string treated as natural HRG/MRG/TRG's own type, so type-scoped tick modifiers can reach it.
* [Parameter Group: MISCELLANEOUS SETUP](parameters/misc-configs.md) - The heading the MISCELLANEOUS SETUP parameters sit under in the plugin manager.
* [Ally Rubberband Adjustment Plugin Parameter](parameters/ally-rubberband-adjustment.md) - A modifier on the ally rubber band range (defaults of 10). This also affects the ally AI plugin if used.
* [Dash Movespeed Boost Plugin Parameter](parameters/dash-speed-boost.md) - The boost to movement speed when dashing. You may need to toy with this a bit to get it right.
* [Enable Hitbox Overlays Plugin Parameter](parameters/hitbox-overlays-initially-visible.md) - Whether or not to overlay the map with battler and action hitbox visuals- for debugging.
* [Melee Hitbox Origin Offset X (px) Plugin Parameter](parameters/hitbox-melee-origin-offset-px-x.md) - Extra pixels added to the screen-space X origin shared by collision, overlays, and hitbox pulses (negative = left).
* [Melee Hitbox Origin Offset Y (px) Plugin Parameter](parameters/hitbox-melee-origin-offset-px-y.md) - Extra pixels added to the screen-space Y origin shared by collision, overlays, and hitbox pulses (negative = up).
* [Melee Origin Extra Y When Facing Down (px) Plugin Parameter](parameters/hitbox-melee-origin-extra-px-y-facing-down.md) - Added on top of Offset Y when travel facing is down (2) or diagonal down (1/3); tune if down-swings read behind the actor.
* [Melee Origin Extra Y When Facing Up (px) Plugin Parameter](parameters/hitbox-melee-origin-extra-px-y-facing-up.md) - Added on top of Offset Y when travel facing is up (8) or diagonal up (7/9); tune if up-swings read too far from the body.
* [Melee Origin Lift Reduction When Facing Down (px) Plugin Parameter](parameters/hitbox-melee-origin-lift-reduction-px-facing-down.md) - Subtracts from the default half-tile vertical lift when facing down (2) or diagonal down (1/3). Fixes pivots that sit too high (hitbox reads behind the actor). Half strength on diagonals.
* [Hitbox Pulse (Active Shape) Plugin Parameter](parameters/hitbox-pulse-enabled.md) - When enabled, draws your attack hit shape for the full active lifetime (hit or miss). Uses the Hitbox Pulse layer.
* [Pulse: Highlight Colliding Battlers Plugin Parameter](parameters/hitbox-pulse-highlight-colliders.md) - While Hitbox Pulse is enabled, briefly outline battlers (enemies, pillars, etc.) whose collision box overlaps your action shape—without turning on full debug overlays.
* [Hitbox Pulse: Use Fade / Pop Animation Plugin Parameter](parameters/hitbox-pulse-use-fade-animation.md) - When false, the active hit shape holds steady alpha for the whole swing. When true, uses the legacy fade/scale pulse curve (better for very short flashes).
* [Parameter Group: DISENGAGE SETUP](parameters/disengage-configs.md) - The heading the DISENGAGE SETUP parameters sit under in the plugin manager.
* [Show Disengage Balloon Plugin Parameter](parameters/show-disengage-balloon.md) - Whether or not to show a balloon above a battler when they disengage from their target.
* [Disengage Balloon Id Plugin Parameter](parameters/disengage-balloon-id.md) - The id of the balloon to display when a battler disengages. Requires "Show Disengage Balloon" to be enabled.
* [Parameter Group: GUARD / PARRY VISUALS](parameters/guard-parry-visual-configs.md) - The heading the GUARD / PARRY VISUALS parameters sit under in the plugin manager.
* [Parry Map Animation Id Plugin Parameter](parameters/parry-character-animation-id.md) - Database animation id played on the map character when a parry succeeds. Use 0 to skip the effect.
* [Parameter Group: IMPLICIT PARRY (PASSIVE)](parameters/implicit-parry-configs.md) - The heading the IMPLICIT PARRY (PASSIVE) parameters sit under in the plugin manager.
* [Dominance Multiplier (M) Plugin Parameter](parameters/implicit-parry-dominance-multiplier.md) - A/D ratio: no parry if >= M; always parry if <= 1/M; else linear odds. Default 2. Min 1.01.
* [Implicit Parry Baseline Floor Plugin Parameter](parameters/implicit-parry-baseline-floor.md) - Base pressure on both A and D before the per-level add below.
* [Baseline Per Caster/Target Level Plugin Parameter](parameters/implicit-parry-baseline-per-level.md) - Extra baseline per level: caster level on A, target level on D (Lv1 adds 0).
* [Full Parry Scale Factor Plugin Parameter](parameters/implicit-parry-scale-factor.md) - Multiplies the raw parry formula output to produce the actual full-negate chance. 0.2 = 20% of formula.
* [Parameter Group: GLANCING BLOW (PARTIAL HIT)](parameters/glancing-blow-configs.md) - The heading the GLANCING BLOW (PARTIAL HIT) parameters sit under in the plugin manager.
* [Glancing Dominance Multiplier (M) Plugin Parameter](parameters/glancing-blow-dominance-multiplier.md) - Band width for the glancing roll; uses the same A/D formula as parry but an independent M. Default 2.
* [Glancing Blow Damage Factor Plugin Parameter](parameters/glancing-blow-damage-factor.md) - Fraction of normal damage dealt on a glancing blow. 0.3 = 30% of calculated damage.
* [Parameter Group: QUICKMENU SETUP](parameters/quickmenu-configs.md) - The heading the QUICKMENU SETUP parameters sit under in the plugin manager.
* [Equip Combat Skills Text Plugin Parameter](parameters/equip-combat-skills-text.md) - The text that shows up in the JABS quickmenu for the "equip combat skills" command.
* [Equip Dodge Skills Text Plugin Parameter](parameters/equip-dodge-skills-text.md) - The text that shows up in the JABS quickmenu for the "equip dodge skills" command.
* [Equip Offhand Skill Text Plugin Parameter](parameters/equip-offhand-text.md) - The text that shows up in the JABS quickmenu for the "equip offhand skill" command.
* [Equip Tools Text Plugin Parameter](parameters/equip-tools-text.md) - The text that shows up in the JABS quickmenu for the "equip tools" command.
* [Equip Usable Item Text Plugin Parameter](parameters/equip-usable-item-text.md) - The text that shows up in the JABS quickmenu for the "equip usable item" command.
* [Main MenuText Plugin Parameter](parameters/main-menu-text.md) - The text that shows up in the JABS quickmenu for the "main menu" command.
* [Cancel Text Plugin Parameter](parameters/cancel-text.md) - The text that shows up in the JABS quickmenu for the "cancel" command.
* [Clear Slot Text Plugin Parameter](parameters/clear-slot-text.md) - The text that shows up in the JABS quickmenu for the "clear slot" command.
* [UnassignedText Plugin Parameter](parameters/unassigned-text.md) - The text that shows up in the JABS quickmenu for the "- unassigned -" command.
* [Parameter Group: GLOBAL COOLDOWN (GCD)](parameters/global-cooldown-configs.md) - The heading the GLOBAL COOLDOWN (GCD) parameters sit under in the plugin manager.
* [Enable Global Cooldown Plugin Parameter](parameters/enable-global-cooldown.md) - When true, whitelisted skill types stamp a battler-wide GCD and respect it on skill use (not dodge/tool).
* [Default GCD Frames Plugin Parameter](parameters/global-cooldown-frames.md) - Frames of global lockout after a GCD skill executes. Per-skill override: gcd notetag.
* [Global Cooldown Skill Types Plugin Parameter](parameters/global-cooldown-skill-types.md) - Skill type ids (stypeId, same order as Database Types). These types trigger and respect GCD. Empty = no type-based GCD.
* [Parameter Group: SKILL HISTORY](parameters/skill-history-configs.md) - The heading the SKILL HISTORY parameters sit under in the plugin manager.
* [Skill History Max Window (Seconds) Plugin Parameter](parameters/skill-execution-max-window-seconds.md) - How many seconds a skill execution entry is kept before being pruned. Individual tag windows must be <= this value.
* [Skill History Excluded Skill Types Plugin Parameter](parameters/skill-execution-excluded-skill-types.md) - Skill type ids (stypeId) that are never recorded in the skill history log. Useful for excluding weapon combo types.

# plugin-command

* [Enable JABS Plugin Command](commands/enable-jabs.md) - Enables the JABS engine allowing battles on the map to take place.
* [Disable JABS Plugin Command](commands/disable-jabs.md) - Disables the JABS engine.
* [Toggle Hitbox Overlays Plugin Command](commands/toggle-hitbox-overlays.md) - Toggles the visibility of the hitbox overlays.
* [Assign a JABS skill Plugin Command](commands/set-jabs-skill.md) - Assigns a specific skill id or (item id) to a designated slot. Assigned skills will be removed if not learned (unless locked).
* [Unlock a single JABS skill slot Plugin Command](commands/unlock-jabs-skill-slot.md) - Unlocks a single JABS skill slot for the leader.
* [Unlock all JABS skill slots Plugin Command](commands/unlock-all-jabs-skill-slots.md) - Unlocks all JABS skill slots for the leader.
* [Cycle to next leader Plugin Command](commands/rotate-party-members.md) - Cycles the leader to the back and shifts all members forward one slot.
* [Disable Party Rotation Plugin Command](commands/disable-party-rotation.md) - Disables the player from being able to rotate the party leader. (This only affects the JABS party rotate functionality.)
* [Enable Party Rotation Plugin Command](commands/enable-party-rotation.md) - (Re-)Enables the ability to execute a party rotate. Other conditions still apply (like not rotating to a dead member).
* [Apply global cooldown to actor Plugin Command](commands/apply-global-cooldown.md) - Sets the battler-wide GCD timer on a party actor that is on the map (leader or visible follower).
* [Spawn Enemy Plugin Command](commands/spawn-enemy.md) - Dynamically spawn an enemy onto the map from the enemy clone map.
* [Spawn Loot Plugin Command](commands/spawn-loot.md) - Dynamically spawn some loot onto the map from the database. If multiple loot ids are defined, then multiple will be dropped.
* [Force Respawn Plugin Command](commands/force-respawn.md) - Frees every defeated battler in the world from its respawn timer at once, regardless of the method each was scheduled with. Use this for the beats that move the world on, such as sleeping at an inn.

# plugin-struct

* [Elemental Icon Struct](structs/elemental-icon-struct.md) - The fields of the Elemental Icon Struct, which MZ edits together as one value.

# storage

* [Data Saved](storage.md) - The details about what is saved to disk for this plugin.

# changelog

* [Changelog](changelog.md) - The list of all version updates this plugin has gone through and major change points.
