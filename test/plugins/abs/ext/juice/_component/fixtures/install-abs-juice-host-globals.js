//region plugins/abs/ext/juice/_component/fixtures/install-abs-juice-host-globals.js
/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Juice's own identity. Call
 * this right before importing abs/ext/juice/_metadata/initialization.js, after the shared fixture's
 * `setPluginContextToJAbs` and the J-ABS initialization.js import it guards (ext/juice requires both
 * J-Base and J-ABS at minimum versions).
 *
 * This is J-ABS-Juice's own isolated fixture, not shared with any other extension- each J-ABS
 * extension is its own independent plugin and gets its own fixture file.
 *
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJabsJuice(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Juice';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}

/**
 * The juice section of J-ABS's external configuration, shaped the way the real
 * `data/config.jabs.json` shapes it. J-ABS parses this onto its own metadata before any extension
 * reaches `postInitialize`, so an extension test has to stand it up the same way.
 * @type {object}
 */
export const SAMPLE_JUICE_CONFIG = {
  target: {
    physicalSquishIntensity: 0.25,
    magicalSquishIntensity: 0.15,
    squishFrames: 8.7,
    healingRecipientScale: 1.1,
    flurryDecayPercent: 50.4,
  },
  caster: {
    dodgeSquishIntensity: 0.2,
    dodgeSquishFrames: 6.9,
    spriteVerticalOffsetPixels: 4,
    strikeTiltFrames: 5,
    strikeTiltRadians: 0.3,
    supportPulseIntensity: 0.4,
    supportPulseFrames: 12,
    unarmedStrikeSquishIntensity: 0.18,
    unarmedStrikeSquishFrames: 7,
    weaponSwingFrames: 10,
    weaponSwingPeakRadians: 0.9,
  },
  casting: {
    pulseAmplitude: 0.35,
  },
  profiles: {
    sword: { tiltMul: 1.0, swingMul: 1.0 },
    axe: { tiltMul: 1.4, swingMul: 1.6 },
  },
};

/**
 * Publishes the juice configuration onto J-ABS's metadata, which is where this extension reads it
 * from while translating its own plugin parameters.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @param {object} [config] The juice configuration to publish. Defaults to {@link SAMPLE_JUICE_CONFIG}.
 */
export function installJuiceExternalConfig(sandbox = globalThis, config = SAMPLE_JUICE_CONFIG)
{
  sandbox.J.ABS.Metadata.ExternalConfig ??= {};
  sandbox.J.ABS.Metadata.ExternalConfig.juice = config;
}
//endregion plugins/abs/ext/juice/_component/fixtures/install-abs-juice-host-globals.js
