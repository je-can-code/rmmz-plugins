//region LightingTagParser
import AmbientDeclaration from '../models/AmbientDeclaration.js';
import LightDeclaration from '../models/LightDeclaration.js';
import LightingColor from './LightingColor.js';
import LightingEffects from './LightingEffects.js';

/**
 * Turns authored lighting tags into declarations.
 *
 * One parser serves every source. An event page hands it comment text, a map hands it the body of
 * its note, and the party leader's equipment hands it the same - which is why `<light:[5]>` means
 * exactly one thing no matter where somebody writes it.
 */
class LightingTagParser
{
  /**
   * How many parameters a `<light:>` tag accepts before something is wrong.
   *
   * Reach, colour, intensity and an effect. Anything beyond that is an author remembering a
   * signature that does not exist.
   * @type {number}
   */
  static LIGHT_PARAMETER_LIMIT = 4;

  /**
   * The largest intensity an author can ask for, being a completely flat disc.
   * @type {number}
   */
  static MAX_INTENSITY_PERCENT = 100;

  /**
   * How many positional parameters an `<ambient:>` tag accepts before something is wrong.
   * @type {number}
   */
  static AMBIENT_PARAMETER_LIMIT = 2;

  /**
   * The largest darkness an author can ask for, being all of it.
   * @type {number}
   */
  static MAX_DARKNESS_PERCENT = 100;

  /**
   * Reads every light tag out of a list of comment strings.
   * @param {string[]} comments The comment text to read.
   * @param {Game_CharacterBase} character The character these lights hang off.
   * @param {string} sourceKey Who is declaring these lights.
   * @returns {LightDeclaration[]} Every valid declaration found, in the order written.
   */
  static parseComments(comments, character, sourceKey)
  {
    const declarations = [];

    comments.forEach(comment =>
    {
      const match = J.LIGHTING.RegExp.Light.exec(comment);

      // not a light tag; the page is full of other plugins' comments and that is fine.
      if (match === null) return;

      const [ , payload ] = match;
      const declaration = LightingTagParser.parseLightPayload(payload, character, sourceKey);

      // the tag was shaped like a light but did not describe one; it has already been reported.
      if (declaration === null) return;

      declarations.push(declaration);
    }, this);

    return declarations;
  }

  /**
   * Reads every light tag off a collection of database objects that carry notes.
   *
   * This is how the party leader comes to be carrying a lantern: `getAllNotes` hands over the actor,
   * its class, its skills, its equipment and its states, and any one of them may be the thing that
   * glows.
   * @param {RPG_BaseItem[]} noteObjects The database objects to read.
   * @param {Game_CharacterBase} character The character these lights hang off.
   * @param {string} sourceKey Who is declaring these lights.
   * @returns {LightDeclaration[]} Every valid declaration found.
   */
  static parseNoteObjects(noteObjects, character, sourceKey)
  {
    const payloads = RPGManager.getStringsFromAllNotesByRegex(noteObjects, J.LIGHTING.RegExp.Light);

    const declarations = [];

    payloads.forEach(payload =>
    {
      const declaration = LightingTagParser.parseLightPayload(payload, character, sourceKey);

      // malformed, and already reported in detail by the payload parser.
      if (declaration === null) return;

      declarations.push(declaration);
    }, this);

    return declarations;
  }

  /**
   * Turns one light tag's bracketed body into a declaration.
   *
   * Returns null when the tag cannot be honoured, which is one of the two places in this plugin
   * where null is a meaningful answer: the caller needs to distinguish "this text was not for us"
   * from "this text was for us and was wrong", and only the second is worth complaining about.
   * @param {string} payload The bracketed body, ex: `[5, #ffbb73, flicker]`.
   * @param {Game_CharacterBase} character The character this light hangs off.
   * @param {string} sourceKey Who is declaring this light.
   * @returns {LightDeclaration|null} The declaration, or null when the tag was invalid.
   */
  static parseLightPayload(payload, character, sourceKey)
  {
    const parsed = JsonMapper.parseObject(payload);
    const [ radius, ...rest ] = parsed;

    if (parsed.length > LightingTagParser.LIGHT_PARAMETER_LIMIT)
    {
      const message = `light accepts up to ${LightingTagParser.LIGHT_PARAMETER_LIMIT} parameters`;
      Diagnostics.warn(__PLUGIN_NAME__, message, { payload, sourceKey });

      return null;
    }

    // a light with no reach is not a light, and neither is one whose radius was written as a word.
    // the unit is tiles, so a fractional value is perfectly legitimate.
    if (Number.isFinite(radius) === false || radius <= 0)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `light radius must be a positive number of tiles`, { payload, sourceKey });

      return null;
    }

    // everything after the reach is read by what it *is* rather than by where it sits, so an author
    // can write the colour, the intensity and the effect in whatever order reads best to them. The
    // three are unmistakable from one another: a colour starts with a hash, an effect is one of a
    // known handful of words, and anything else numeric is an intensity.
    const effect = rest.find(parameter => LightingEffects.isEffect(parameter)) ?? LightingEffects.STEADY;
    const colorCandidates = rest.filter(parameter => String(parameter).startsWith('#'));
    const intensityCandidate = rest.find(parameter => Number.isFinite(parameter));

    const defaults = J.LIGHTING.Metadata.lightDefaults;
    const color = LightingTagParser.#resolveColor(colorCandidates, defaults.color, payload, sourceKey);
    const intensity = LightingTagParser.#resolveIntensity(intensityCandidate, defaults.intensity);

    LightingTagParser.#reportUnusable(rest, payload, sourceKey);

    return new LightDeclaration(radius, color, intensity, effect, character, sourceKey);
  }

  /**
   * Turns one ambient tag's bracketed body into a declaration.
   * @param {string} payload The bracketed body, ex: `[85, #0a2a2a]`.
   * @param {string} sourceKey Who is declaring this ambient.
   * @returns {AmbientDeclaration|null} The declaration, or null when the tag was invalid.
   */
  static parseAmbientPayload(payload, sourceKey)
  {
    const parsed = JsonMapper.parseObject(payload);
    const [ percent, ...rest ] = parsed;

    if (parsed.length > LightingTagParser.AMBIENT_PARAMETER_LIMIT)
    {
      const message = `ambient accepts up to ${LightingTagParser.AMBIENT_PARAMETER_LIMIT} parameters`;
      Diagnostics.warn(__PLUGIN_NAME__, message, { payload, sourceKey });

      return null;
    }

    // darkness written as a word cannot be clamped into meaning, so it is rejected rather than guessed at.
    if (Number.isFinite(percent) === false)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `ambient darkness must be a number`, { payload, sourceKey });

      return null;
    }

    // an author overshooting the scale means "as dark as it goes", which is a clamp rather than an error.
    const clamped = percent.clamp(0, LightingTagParser.MAX_DARKNESS_PERCENT);
    const darkness = clamped / LightingTagParser.MAX_DARKNESS_PERCENT;

    const defaultColor = J.LIGHTING.Metadata.ambientDefaults.color;
    const hex = LightingTagParser.#resolveColor(rest, defaultColor, payload, sourceKey);
    const color = LightingColor.toRgb(hex);

    // an author who wrote a colour meant to have one even if they misspelled it, and that intent is
    // what decides who wins the colour later - not whether the hex happened to parse.
    const declaresColor = rest.length > 0;

    return new AmbientDeclaration(darkness, color, declaresColor, sourceKey);
  }

  /**
   * Turns an authored intensity percentage into the fraction the renderer draws with.
   *
   * Absent means the configured default, which ships at zero - the soft pool a light has always
   * been. That is what keeps every tag written before intensity existed looking exactly as it did.
   * @param {number|undefined} candidate Whatever the author wrote, if anything.
   * @param {number} fallback The configured default, as a fraction.
   * @returns {number} The intensity as a fraction, 0 through 1.
   */
  static #resolveIntensity(candidate, fallback)
  {
    // nothing was written, so the configured default is exactly what was meant.
    if (candidate === undefined) return fallback;

    // an author overshooting the scale means "as flat as it goes", which is a clamp rather than an error.
    const clamped = candidate.clamp(0, LightingTagParser.MAX_INTENSITY_PERCENT);

    return clamped / LightingTagParser.MAX_INTENSITY_PERCENT;
  }

  /**
   * Reports any parameter that was neither a colour, an intensity, nor an effect.
   *
   * Silence here would be the wrong kindness. A misspelled `flickr` produces a light that is subtly
   * not what was asked for, and a author who is not told will stare at the event rather than the tag.
   * @param {Array<string|number>} parameters Everything written after the reach.
   * @param {string} payload The whole tag body, for reporting.
   * @param {string} sourceKey Who declared it, for reporting.
   */
  static #reportUnusable(parameters, payload, sourceKey)
  {
    const unusable = parameters.filter(parameter =>
    {
      if (Number.isFinite(parameter) === true) return false;
      if (String(parameter).startsWith('#') === true) return false;

      return LightingEffects.isEffect(parameter) === false;
    });

    if (unusable.length === 0) return;

    const message = `unrecognised light parameter: [ ${unusable.join(', ')} ]`;
    Diagnostics.warn(__PLUGIN_NAME__, message, { payload, sourceKey });
  }

  /**
   * Settles which colour a tag actually asked for, falling back to the configured default.
   *
   * A colour that is present but malformed is reported rather than quietly swapped, because it
   * almost always means a typo in a hex code - and a torch that is subtly the wrong colour is the
   * kind of thing an author stares at for twenty minutes without suspecting the tag.
   * @param {Array<string|number>} candidates Whatever parameters might be a colour.
   * @param {string} fallback The configured default for this kind of tag.
   * @param {string} payload The whole tag body, for reporting.
   * @param {string} sourceKey Who declared it, for reporting.
   * @returns {string} A hex colour that is safe to use.
   */
  static #resolveColor(candidates, fallback, payload, sourceKey)
  {
    // nothing was written, so the configured default is exactly what was meant.
    if (candidates.length === 0) return fallback;

    const [ candidate ] = candidates;

    if (LightingColor.isValidHex(candidate) === false)
    {
      const message = `unusable colour, falling back to ${fallback}`;
      Diagnostics.warn(__PLUGIN_NAME__, message, { candidate, payload, sourceKey });

      return fallback;
    }

    return candidate;
  }
}

export default LightingTagParser;
//endregion LightingTagParser