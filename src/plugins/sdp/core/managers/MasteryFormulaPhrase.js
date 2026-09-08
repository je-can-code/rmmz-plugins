//region MasteryFormulaPhrase
/**
 * Renders a damage or healing formula as the phrase a player reads.
 *
 * A payload's numbers live in its formula, and the formula is written for the engine rather than for a
 * reader: {@code (b.mhp * 0.02) + (a.mdf * 2)} is exact and says nothing. This class turns it into
 * "2% of their Max Life plus 2x your Resist", so the description quotes the real number without an
 * author having to copy it by hand into a sentence that will drift the next time it is tuned.
 */
class MasteryFormulaPhrase
{
  /**
   * The reading of each formula subject.
   * @type {Object<string, string>}
   */
  static Subjects = {
    a: 'your',
    b: 'their',
  };

  /**
   * The reading of each parameter shorthand a formula can name.
   * @type {Object<string, string>}
   */
  static Parameters = {
    mhp: 'Max Life',
    mmp: 'Max Magi',
    mtp: 'Max Tech',
    hp: 'current Life',
    mp: 'current Magi',
    tp: 'current Tech',
    atk: 'Power',
    def: 'Endurance',
    mat: 'Force',
    mdf: 'Resist',
    agi: 'Speed',
    luk: 'Luck',
    sar: 'Shield Amp',
    level: 'level',
    missinghp: 'missing Life',
    missingmp: 'missing Magi',
    missingtp: 'missing Tech',
  };

  /**
   * The reading of each method call a formula can make.
   * @type {Object<string, string>}
   */
  static MethodCalls = {
    getMasteryCount: 'mastery count',
  };

  /**
   * The reading of each bare context variable a formula can name.
   * @type {Object<string, string>}
   */
  static ContextVariables = {
    d: 'the damage taken',
    m: 'the Magi damage taken',
    t: 'the Tech damage taken',
    s: 'the shield broken',
    p: 'your proficiency',
  };

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The phrase describing the given formula.
   * @param {string} formula The raw damage or heal formula.
   * @returns {string|null} Null when the formula uses something this class cannot read aloud.
   */
  static phraseFor(formula)
  {
    // the standard mitigation clause is arithmetic the player never sees as a number, and reading it
    // aloud would bury the magnitude that matters, so it is dropped before phrasing.
    const demitigated = formula.replace(/\*?\s*\(\s*100\s*\/\s*\(\s*100\s*\+\s*[ab]\.[a-z]+\s*\)\s*\)/gi, '');
    // grouping parens are noise, but the empty pair marking a method call is not, so it is held
    // aside as a marker rather than erased along with them.
    // the difference between a maximum and a current is how every "what they are missing" effect is
    // written, and it reads far better as that phrase than as two subtracted terms.
    const withMissing = demitigated.replace(
      /\(\s*([ab])\.m(hp|mp|tp)\s*-\s*[ab]\.(hp|mp|tp)\s*\)/gi,
      (whole, subject, pool) => `${subject}.missing${pool}`);

    // a parenthesised subexpression that is then scaled cannot be read term by term without changing
    // what it means, so it is refused outright rather than phrased into something plausible and wrong.
    if (/\)\s*\*/.test(withMissing.replace(/\(\s*\)/g, '@@'))) return null;

    const marked = withMissing.replace(/\(\s*\)/g, '@@');
    const stripped = marked.replace(/[()]/g, ' ');
    const pieces = stripped.split(/\s*([+-])\s*/)
      .map(piece => piece.trim())
      .filter(piece => piece !== String.empty);

    if (pieces.length === 0) return null;

    const phrases = [];

    for (const piece of pieces)
    {
      if (piece === '+') { phrases.push('plus'); continue; }
      if (piece === '-') { phrases.push('less'); continue; }

      const termPhrase = MasteryFormulaPhrase.#phraseTerm(piece);

      if (termPhrase === null) return null;

      phrases.push(termPhrase);
    }

    return phrases.join(' ');
  }

  /**
   * The phrase describing one multiplicative term.
   * @param {string} term A single term, such as {@code a.mat*3} or {@code d * 0.5}.
   * @returns {string|null}
   */
  static #phraseTerm(term)
  {
    const methodMatch = term.match(/^([ab])\.([a-zA-Z]+)@@\s*(?:\*\s*([\d.]+))?$/);

    if (methodMatch)
    {
      const [ , methodSubject, methodName, methodMultiplier ] = methodMatch;
      const noun = MasteryFormulaPhrase.MethodCalls[methodName];

      if (!noun) return null;

      const scale = methodMultiplier === undefined
        ? 1
        : Number(methodMultiplier);

      return `${MasteryFormulaPhrase.#magnitude(scale)} ${MasteryFormulaPhrase.Subjects[methodSubject]} ${noun}`.trim();
    }

    const match = term.match(/^([abv]?)\.?([a-z]+)\s*(?:\*\s*([\d.]+))?$/i);

    if (!match) return null;

    const [ , subjectKey, name, rawMultiplier ] = match;
    const multiplier = rawMultiplier === undefined
      ? 1
      : Number(rawMultiplier);

    // a bare variable names something the action already knows, so it takes no subject word.
    if (subjectKey === String.empty && MasteryFormulaPhrase.ContextVariables[name])
    {
      const noun = MasteryFormulaPhrase.ContextVariables[name];

      return `${MasteryFormulaPhrase.#magnitude(multiplier)} ${noun}`.trim();
    }

    const subject = MasteryFormulaPhrase.Subjects[subjectKey];
    const parameter = MasteryFormulaPhrase.Parameters[name];

    if (!subject || !parameter) return null;

    return `${MasteryFormulaPhrase.#magnitude(multiplier)} ${subject} ${parameter}`.trim();
  }

  /**
   * Renders a multiplier the way a player would say it.
   *
   * Fractions read better as a percentage of the thing, and whole multiples read better as a multiple
   * of it, which is the difference between "5% of their Max Life" and "3x your Force".
   * @param {number} multiplier The coefficient on the term.
   * @returns {string}
   */
  static #magnitude(multiplier)
  {
    if (multiplier < 1)
    {
      const percent = Math.round(multiplier * 1000) / 10;

      return `${percent}% of`;
    }

    // a coefficient of one adds nothing a reader needs; "your level" beats "1x your level".
    if (multiplier === 1) return String.empty;

    return `${multiplier}x`;
  }
}

export default MasteryFormulaPhrase;
//endregion MasteryFormulaPhrase