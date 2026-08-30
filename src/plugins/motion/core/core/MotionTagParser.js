//region MotionTagParser
import MotionDeclaration from '../models/MotionDeclaration.js';
import MotionTypeRegistry from './MotionTypeRegistry.js';

/**
 * Turns authored motion tags into declarations.
 *
 * One parser serves every source. An event page hands it comment text, a plugin command hands it
 * the body of a tag, and an extension reading a state's notes will hand it the same, which is why
 * `<motion:[breathe]>` means exactly one thing no matter where it is written.
 */
class MotionTagParser
{
  /**
   * Reads every motion tag out of a list of comment strings.
   * @param {string[]} comments The comment text to read.
   * @param {string} sourceKey Who is declaring these motions.
   * @returns {MotionDeclaration[]} Every valid declaration found, in the order written.
   */
  static parseComments(comments, sourceKey)
  {
    const declarations = [];

    comments.forEach(comment =>
    {
      const match = J.MOTION.RegExp.Motion.exec(comment);

      // not a motion tag; the page is full of other plugins' comments and that is fine.
      if (match === null) return;

      const [ , payload ] = match;
      const declaration = MotionTagParser.parsePayload(payload, sourceKey);

      // the tag was shaped like a motion but did not describe one; it has already been reported.
      if (declaration === null) return;

      declarations.push(declaration);
    }, this);

    return declarations;
  }

  /**
   * Turns one tag's bracketed body into a declaration.
   *
   * Returns null when the tag cannot be honoured, which is the one place in this plugin where null
   * is a meaningful answer: the caller needs to distinguish "this comment was not for us" from
   * "this comment was for us and was wrong", and only the second is worth complaining about.
   * @param {string} payload The bracketed body, ex: `[breathe, 0.08]`.
   * @param {string} sourceKey Who is declaring this motion.
   * @returns {MotionDeclaration|null} The declaration, or null when the tag was invalid.
   */
  static parsePayload(payload, sourceKey)
  {
    const parsed = JsonMapper.parseObject(payload);
    const [ motionType, ...parameters ] = parsed;

    if (MotionTypeRegistry.isRegistered(motionType) === false)
    {
      Diagnostics.warn(__PLUGIN_NAME__, `unknown motion type: [ ${motionType} ]`, { payload, sourceKey });

      return null;
    }

    if (MotionTagParser.hasTooManyParameters(motionType, parameters) === true)
    {
      const allowed = MotionTypeRegistry.parameterCountFor(motionType);
      const message = `motion [ ${motionType} ] accepts up to ${allowed} parameters`;
      Diagnostics.warn(__PLUGIN_NAME__, message, { payload, sourceKey });

      return null;
    }

    return new MotionDeclaration(motionType, parameters, sourceKey);
  }

  /**
   * Determines whether a tag supplied more parameters than its motion knows what to do with.
   *
   * Too many parameters is reported rather than trimmed, because it almost always means the author
   * has the order wrong or is remembering a different motion's signature — and silently animating
   * something subtly incorrect costs far more of their afternoon than a line in the console does.
   * @param {string} motionType The motion type from the tag.
   * @param {Array<string|number>} parameters Everything written after the type.
   * @returns {boolean}
   */
  static hasTooManyParameters(motionType, parameters)
  {
    const allowed = MotionTypeRegistry.parameterCountFor(motionType);

    // `sync` rides along on top of the positional parameters rather than being one of them.
    const positional = parameters.filter(parameter => parameter !== 'sync');

    return positional.length > allowed;
  }
}

export default MotionTagParser;
//endregion MotionTagParser