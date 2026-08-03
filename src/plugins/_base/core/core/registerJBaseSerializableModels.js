//region registerJBaseSerializableModels
import RPG_Skill from './../database/implementations/RPG_Skill.js';
import RPG_SkillDamage from './../database/_data/RPG_SkillDamage.js';
import RPG_UsableEffect from './../database/_data/RPG_UsableEffect.js';
import SerializableRegistry from './SerializableRegistry.js';
import J_Timer from './../models/J_Timer.js';

SerializableRegistry.register(J_Timer);

/**
 * A hydrated skill row reaches a savefile through J-Passive, which stores whole `RPG_Skill` objects
 * in `_j._passive._passiveSources` rather than the ids they were looked up by. That is a
 * reference-versus-value defect and is tracked as one - a rebalanced skill never reaches a save that
 * already captured a copy of it - but the encoder still has to be able to write what the codebase
 * actually puts in front of it, so the type is registered.
 *
 * Registering it drags in the two types a skill row holds instances of: its damage block, and one
 * effect object per entry in `effects`. Both are declared below.
 *
 * The seed copies a blank row rather than restating three classes' worth of class-field defaults,
 * which keeps the defaults following the constructor chain instead of a transcription of it.
 */
SerializableRegistry.register(RPG_Skill, {
  id: 'rpg-skill',
  aliases: [ 'RPG_Skill' ],
  typed: {
    damage: RPG_SkillDamage,
    effects: RPG_UsableEffect,
  },
  seed: instance => Object.assign(instance, RPG_Skill.createEmpty(0)),
});

/**
 * The damage block of a usable row. Its constructor tolerates being handed nothing and falls back to
 * its class-field defaults, so a blank instance is exactly the set of defaults the seed wants.
 */
SerializableRegistry.register(RPG_SkillDamage, {
  id: 'rpg-skill-damage',
  aliases: [ 'RPG_SkillDamage' ],
  seed: instance => Object.assign(instance, new RPG_SkillDamage()),
});

/**
 * One entry from a usable row's effects list. Unlike the damage block, this constructor reads its
 * argument unconditionally, so the defaults are spelled out rather than copied off a blank instance.
 */
SerializableRegistry.register(RPG_UsableEffect, {
  id: 'rpg-usable-effect',
  aliases: [ 'RPG_UsableEffect' ],
  seed: instance =>
  {
    instance.code = 0;
    instance.dataId = 0;
    instance.value1 = 0;
    instance.value2 = 0;
  },
});
//endregion registerJBaseSerializableModels