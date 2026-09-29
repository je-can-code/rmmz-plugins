//region NotetagDescriber
import ExternalJsonConfigLoader from './ExternalJsonConfigLoader.js';
import ExternalJsonConfigLoaderOptions from './../models/ExternalJsonConfigLoaderOptions.js';
import NotetagLine from './../models/NotetagLine.js';
import RPGManager from './RPGManager.js';

/**
 * Turns the notetags on a database row into the lines telling a player what each one does.
 *
 * The plugin that declares a tag is the one that knows what it means, so each describes its own: it registers a
 * describer against the `RegExp` its reader uses, and this class asks every registered describer about a row.
 * Nothing here knows any tag by name.
 *
 * The words themselves belong to the game rather than to any plugin, so they live in its data: one template per
 * tag in {@link NotetagDescriber.TemplatesPath}, written the way SDP's mastery prose is written, with tokens filled
 * from the tag just read. A describer reads the tag, works out its numbers and names, and decides which way the
 * effect cuts; {@link NotetagDescriber.line} turns that into the finished sentence. A rebalance never leaves a
 * sentence quoting a stale number, and rewording one never needs a build.
 *
 * A describer answers with a list of lines, which is how it says three different things: one line, the usual case;
 * several, for a tag naming several things at once; or none, when there is nothing to say. A template written
 * empty is a decision that its tag says nothing, and a key missing from the config is a sentence not written yet.
 * The two only look alike on screen.
 *
 * Lines come back grouped by describer, in the order the describers were registered, and within one describer in
 * the order the note is written. Every occurrence of a tag is its own line: tags are never merged the way traits
 * are, because how several copies of a tag combine is up to the plugin that reads it.
 */
class NotetagDescriber
{
  /**
   * Where the game keeps the sentence for every tag that has one.
   * @type {string}
   */
  static TemplatesPath = 'data/config.notetag-lines.json';

  /**
   * The kinds a token other than the value can be, each standing out its own way: the same palette SDP's mastery
   * prose reads in.
   *
   * A code is the exception: a text code such as `\state[ID]`, which draws its own icon, name and color when the
   * line is drawn, so it is placed exactly as written. A name the database owns is written this way rather than
   * copied out of the table, so the line always shows whatever the row is called today.
   * @type {{SUBJECT: string, MEASURE: string, QUANTITY: string, LIST: string, CODE: string}}
   */
  static TokenKinds = {
    SUBJECT: 'subject',
    MEASURE: 'measure',
    QUANTITY: 'quantity',
    LIST: 'list',
    CODE: 'code',
  };

  /**
   * The color each token kind is drawn in. On the class, so a game wanting different colors changes them once.
   * @type {Object<string, number>}
   */
  static KindColorIndices = {
    subject: 1,
    measure: 6,
    quantity: 3,
    list: 2,
  };

  /**
   * The token kinds that are values, and so are bolded as well as colored, the way every value in a line is.
   * @type {string[]}
   */
  static BoldKinds = [ 'measure', 'quantity' ];

  /**
   * A token in a template: a name in braces.
   *
   * <pre>
   * Structure:
   *  {NAME}
   *
   * Example:
   *  Enemies yield {value} {reward}.
   *
   * Translation:
   *  {value} stays in place for the screen to color; {reward} is filled from the describer's tokens.
   * </pre>
   * @type {RegExp}
   */
  static TokenPattern = /\{([a-zA-Z]+)}/g;

  //region properties
  /**
   * Gets the describers, keyed by the regex each one describes.
   * @returns {Map<RegExp, function(RegExpExecArray, RPG_Base): NotetagLine[]>}
   */
  static describers()
  {
    return this._describers;
  }

  /**
   * Gets the templates, keyed by the name a describer asks for each by.
   * @returns {Map<string, string>}
   */
  static templates()
  {
    return this._templates;
  }

  /**
   * Sets the templates, keyed by the name a describer asks for each by.
   * @param {Map<string, string>} templates The templates.
   */
  static setTemplates(templates)
  {
    this._templates = templates;
  }
  //endregion properties

  /**
   * Every registered describer, keyed by the `RegExp` its plugin reads the tag with.
   * @type {Map<RegExp, function(RegExpExecArray, RPG_Base): NotetagLine[]>}
   */
  static _describers = new Map();

  /**
   * Every template, keyed by the name a describer asks for it by. Empty until the game's config is loaded.
   * @type {Map<string, string>}
   */
  static _templates = new Map();

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Registers the describer for one tag.
   *
   * A describer receives one occurrence of the tag as its regex matched it, every capture unparsed, along with
   * the row it sits on, and answers with the lines describing it.
   *
   * Registering one tag twice throws, because the second describer would silently replace the first one's words.
   * @param {RegExp} structure The regex the tag's own plugin reads it with.
   * @param {function(RegExpExecArray, RPG_Base): NotetagLine[]} describe The describer.
   */
  static register(structure, describe)
  {
    // a second describer would quietly replace the first one's words.
    if (this.describers().has(structure))
    {
      throw new Error(`NotetagDescriber: duplicate describer for ${structure}.`);
    }

    // record the describer under the regex it describes.
    this.describers().set(structure, describe);
  }

  /**
   * The lines describing every described tag on a database row.
   * @param {RPG_Base} dataRow The row whose note is read.
   * @returns {NotetagLine[]}
   */
  static linesFor(dataRow)
  {
    // every describer, in the order they were registered.
    const entries = [ ...this.describers().entries() ];

    return entries.flatMap(([ structure, describe ]) => this.linesForTag(dataRow, structure, describe));
  }

  /**
   * The lines describing only the given tags on a database row, grouped in the order the tags are given.
   *
   * For a screen that shows one plugin's effects in a place of their own, where every other plugin's lines would be
   * out of place beside them.
   * @param {RPG_Base} dataRow The row whose note is read.
   * @param {RegExp[]} structures The regexes of the tags to describe, each already registered by its plugin.
   * @returns {NotetagLine[]}
   */
  static linesForTags(dataRow, structures)
  {
    return structures.flatMap(structure =>
    {
      // the tag's own describer, which its plugin registered.
      const describe = this.describers()
        .get(structure);

      return this.linesForTag(dataRow, structure, describe);
    });
  }

  /**
   * The lines one describer answers for every occurrence of its tag on a row.
   * @param {RPG_Base} dataRow The row whose note is read.
   * @param {RegExp} structure The regex the tag is read with.
   * @param {function(RegExpExecArray, RPG_Base): NotetagLine[]} describe The tag's describer.
   * @returns {NotetagLine[]}
   */
  static linesForTag(dataRow, structure, describe)
  {
    // every occurrence, read the way the tag's own plugin reads it.
    const matches = RPGManager.getMatchesFromNoteByRegex(dataRow, structure);

    // each occurrence says its own piece.
    return matches.flatMap(match => describe(match, dataRow));
  }

  //region templates
  /**
   * Loads every sentence from the game's config.
   *
   * Hard-required, like every other config this codebase reads: a missing or unreadable file stops the boot,
   * rather than leaving every tag silent with nothing to say why.
   */
  static loadTemplates()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-Base')
      .configName('notetag lines')
      .validator(parsed => this.validateTemplates(parsed))
      .mapper(parsed => this.templatesByKey(parsed))
      .build();

    // read the sentences, keyed the way describers ask for them.
    const templates = ExternalJsonConfigLoader.load(this.TemplatesPath, options);
    this.setTemplates(templates);
  }

  /**
   * Whether a sentence or phrase has been written for a key, even one written empty.<br/>
   * Lets a describer choose between a variant it cannot do without and one that may fall back to its plainer form.
   * @param {string} key The key.
   * @returns {boolean}
   */
  static hasTemplate(key)
  {
    return this.templates()
      .has(key);
  }

  /**
   * Refuses a config naming one key twice, since the second sentence would silently replace the first.
   * @param {{key: string, template: string}[]} parsed The parsed config.
   */
  static validateTemplates(parsed)
  {
    // every key after its first appearance.
    const keys = parsed.map(({ key }) => key);
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);

    // one key, one sentence.
    if (duplicates.length > 0)
    {
      const listed = duplicates.join(', ');
      throw new Error(`duplicate key(s): ${listed}.`);
    }
  }

  /**
   * The parsed config as a lookup from each key to its sentence.
   * @param {{key: string, template: string}[]} parsed The parsed config.
   * @returns {Map<string, string>}
   */
  static templatesByKey(parsed)
  {
    const entries = parsed.map(({ key, template }) => [ key, template ]);

    return new Map(entries);
  }
  //endregion templates

  //region lines
  /**
   * The line a describer answers with for one occurrence of its tag, built from the tag's template.
   *
   * It answers no line when there is nothing to say, which happens four ways: no template has been written for the
   * key yet; one was written empty, to say the tag says nothing; the template names the value and the describer
   * gave none; or it names a token the describer did not supply. The last two fail closed, the way SDP's mastery
   * prose does, because a sentence with a hole in it would show the player a wrong number.
   * @param {string} templateKey The key of the tag's sentence in the config.
   * @param {object} parts What the describer read off the tag.
   * @param {number} [parts.iconIndex] The icon drawn beside the line.
   * @param {number} [parts.holderImpact] Which way the effect cuts for whoever carries it.
   * @param {string} [parts.value] The value the screen colors, where the template writes `{value}`.
   * @param {Object<string, {text: string, kind: string}>} [parts.tokens] Every other token the template may name.
   * @returns {NotetagLine[]}
   */
  static line(templateKey, parts)
  {
    const {
      iconIndex = 0,
      holderImpact = NotetagLine.Impacts.NEITHER,
      value = String.empty,
      tokens = {},
    } = parts;

    // a sentence not written yet has nothing to say.
    if (this.templates().has(templateKey) === false) return [];

    // a sentence naming the value needs a value to name.
    const template = this.templates().get(templateKey);
    const namesValue = template.includes(NotetagLine.ValueToken);
    if (namesValue && value === String.empty) return [];

    // every token but the value filled in: nothing at all when one was never supplied, or when the sentence was
    // written empty on purpose to say the tag says nothing.
    const text = this.fillTemplate(template, tokens);
    if (text === String.empty) return [];

    return [ new NotetagLine({ iconIndex, text, value, holderImpact }) ];
  }

  /**
   * A phrase from the game's config, filled in like a sentence and handed back as a token a sentence can name: a
   * clause written in the game's own words, such as the condition an effect fires on.
   *
   * The phrase comes back as a code, placed exactly as written, since its own tokens are already colored. A phrase
   * never names `{value}`, which belongs to the line it ends up in. It comes back empty when there is nothing to say:
   * no phrase written for the key, one written empty, or one naming a token that was not supplied, and an empty token
   * is a hole in any sentence naming it, so that sentence says nothing either.
   * @param {string} key The key of the phrase in the config.
   * @param {Object<string, {text: string, kind: string}>} tokens Every token the phrase may name.
   * @returns {{text: string, kind: string}}
   */
  static phrase(key, tokens)
  {
    // a phrase not written yet has nothing to say.
    if (this.hasTemplate(key) === false) return { text: String.empty, kind: this.TokenKinds.CODE };

    // every token filled in, or nothing at all when one was never supplied.
    const template = this.templates()
      .get(key);
    const text = this.fillTemplate(template, tokens);

    return { text, kind: this.TokenKinds.CODE };
  }

  /**
   * Fills every token in a template but the value, or answers nothing when the template names a token that was not
   * supplied, or was supplied empty, such as a phrase with nothing written for it.
   * @param {string} template The template.
   * @param {Object<string, {text: string, kind: string}>} tokens The tokens supplied.
   * @returns {string}
   */
  static fillTemplate(template, tokens)
  {
    let isComplete = true;

    const filled = template.replace(this.TokenPattern, (whole, name) =>
    {
      // the value is the screen's to color, so it stays where it is.
      if (whole === NotetagLine.ValueToken) return whole;

      // a token the describer did not supply, or supplied with nothing in it, leaves a hole the sentence cannot have.
      if (Object.hasOwn(tokens, name) === false || tokens[name].text === String.empty)
      {
        isComplete = false;

        return whole;
      }

      return this.tokenText(tokens[name]);
    });

    // one hole spoils the whole sentence.
    if (isComplete === false) return String.empty;

    return filled;
  }

  /**
   * One filled token: in its kind's color, and bold when its kind is a value, unless it is a code that draws itself.
   * @param {{text: string, kind: string}} token The token.
   * @returns {string}
   */
  static tokenText(token)
  {
    const {
      text,
      kind
    } = token;

    // a text code brings its own icon and color, which a color of ours would only fight.
    if (kind === this.TokenKinds.CODE) return text;

    const colorIndex = this.KindColorIndices[kind];

    // a value stands out the way every value in a line does.
    if (this.BoldKinds.includes(kind)) return `\\C[${colorIndex}]\\*${text}\\*\\C[0]`;

    return `\\C[${colorIndex}]${text}\\C[0]`;
  }
  //endregion lines
}

export default NotetagDescriber;
//endregion NotetagDescriber