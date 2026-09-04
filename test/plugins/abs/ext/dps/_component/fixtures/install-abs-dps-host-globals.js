//region plugins/abs/ext/dps/_component/fixtures/install-abs-dps-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Dps's own identity. Call
 * this right before importing abs/ext/dps/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards.
 *
 * This is J-ABS-Dps's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsDps(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Dps';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Stands in the cooldown-type constants J-ABS-InputManager publishes as a bare global.
 *
 * The assignable combat slots are present alongside the two the tracker excludes, because a filter
 * given only the values it rejects cannot be told apart from one that rejects everything.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function installJabsButtonStub(sandbox = globalThis)
{
  sandbox.JABS_Button = {
    Mainhand: 'Mainhand',
    Offhand: 'Offhand',
    Tool: 'Tool',
    UsableItem: 'UsableItem',
    Dodge: 'Dodge',
    CombatSkill1: 'CombatSkill1',
  };
}

/**
 * Installs a `$gameParty` whose in-combat answer can be moved between updates.
 * @param {boolean} [inCombat] What the party reports to begin with.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @returns {{setInCombat: Function}} A handle for moving the answer mid-test.
 */
export function installCombatFlag(inCombat = false, sandbox = globalThis)
{
  let engaged = inCombat;

  sandbox.$gameParty = {
    anyMemberInCombat: () => engaged,
  };

  return {
    setInCombat: value =>
    {
      engaged = value;
    },
  };
}

/**
 * Builds a stand-in for the action that landed a hit.
 * @param {string} cooldownType The slot the action came out of.
 * @param {string} casterUuid The uuid of the battler that swung.
 * @param {boolean} casterIsActor Whether the caster counts as an actor.
 * @param {number} skillId The id of the skill behind the action.
 * @returns {object} The JABS action stand-in.
 */
export function buildAction(cooldownType, casterUuid, casterIsActor, skillId)
{
  return {
    getCooldownType: () => cooldownType,
    getCaster: () => ({
      getUuid: () => casterUuid,
      isActor: () => casterIsActor,
    }),
    getBaseSkill: () => ({ id: skillId }),
  };
}

/**
 * Builds a stand-in for the battler a hit landed on.
 * @param {boolean} isEnemy Whether the target counts as an enemy.
 * @param {boolean} isInanimate Whether the target is scenery rather than an opponent.
 * @param {object} result The action result sitting on the target's battler.
 * @returns {object} The JABS battler stand-in.
 */
export function buildTarget(isEnemy, isInanimate, result)
{
  return {
    isEnemy: () => isEnemy,
    isInanimate: () => isInanimate,
    getBattler: () => ({
      result: () => result,
    }),
  };
}

/**
 * Builds the action result a landed hit leaves on its target.
 * @param {number} hpDamage The hp damage dealt.
 * @param {boolean} [critical] Whether the hit was a critical.
 * @param {boolean} [evaded] Whether the attack was evaded outright.
 * @returns {object} The result stand-in.
 */
export function buildResult(hpDamage, critical = false, evaded = false)
{
  return {
    hpDamage,
    critical,
    evaded,
  };
}
//endregion plugins/abs/ext/dps/_component/fixtures/install-abs-dps-host-globals.js