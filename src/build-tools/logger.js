/**
 * A simple logger utility for my cute lil RMMZ dev helper scripts.
 */

/**
 * A string-union type for valid Logger style keys.
 * Use this type anywhere you want intellisense and checking for styles.
 * @typedef {
 *  'reset' | 'bold' | 'dim' |
 *  'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' |
 *  'brightBlack' | 'brightRed' | 'brightGreen' | 'brightYellow' | 'brightBlue' |
 *  'brightMagenta' | 'brightCyan' | 'brightWhite' | 'rainbow'
 * } LogStyleKey
 */

/**
 * An enum-like object of style keys so callers can avoid magic strings.
 * Example: Logger.log('Working...', LogStyle.cyan);
 */
export const LogStyle = Object.freeze({
  // emphasis
  reset: 'reset',
  bold: 'bold',
  dim: 'dim',

  // foreground colors
  black: 'black',
  red: 'red',
  green: 'green',
  yellow: 'yellow',
  blue: 'blue',
  magenta: 'magenta',
  cyan: 'cyan',
  white: 'white',

  // bright variants
  brightBlack: 'brightBlack',
  brightRed: 'brightRed',
  brightGreen: 'brightGreen',
  brightYellow: 'brightYellow',
  brightBlue: 'brightBlue',
  brightMagenta: 'brightMagenta',
  brightCyan: 'brightCyan',
  brightWhite: 'brightWhite',

  // special effects
  rainbow: 'rainbow',
});

class Logger
{
  /**
   * Whether or not to use this logger.
   * @type {boolean}
   */
  static #blocked = true;

  /**
   * ANSI style codes for simple coloring/styling.
   * Keys align 1:1 with {@link LogStyle} values.
   * @type {Record<LogStyleKey, string>}
   */
  static #styles = {
    [LogStyle.reset]: '\x1b[0m',

    // emphasis
    [LogStyle.bold]: '\x1b[1m',
    [LogStyle.dim]: '\x1b[2m',

    // foreground colors
    [LogStyle.black]: '\x1b[30m',
    [LogStyle.red]: '\x1b[31m',
    [LogStyle.green]: '\x1b[32m',
    [LogStyle.yellow]: '\x1b[33m',
    [LogStyle.blue]: '\x1b[34m',
    [LogStyle.magenta]: '\x1b[35m',
    [LogStyle.cyan]: '\x1b[36m',
    [LogStyle.white]: '\x1b[37m',

    // bright variants
    [LogStyle.brightBlack]: '\x1b[90m',
    [LogStyle.brightRed]: '\x1b[91m',
    [LogStyle.brightGreen]: '\x1b[92m',
    [LogStyle.brightYellow]: '\x1b[93m',
    [LogStyle.brightBlue]: '\x1b[94m',
    [LogStyle.brightMagenta]: '\x1b[95m',
    [LogStyle.brightCyan]: '\x1b[96m',
    [LogStyle.brightWhite]: '\x1b[97m',
  };

  /**
   * Enables logging.
   * @returns {boolean}
   */
  static enableLogging = () => this.#blocked = false;

  /**
   * Disables logging.
   * @returns {boolean}
   */
  static disableLogging = () => this.#blocked = true;

  /**
   * Returns the given text wrapped in the requested ANSI style.
   * If the style is unknown or falsy, the text is returned unmodified.
   * @param {string} text The text to colorize.
   * @param {LogStyleKey} [style] A style key from the built-in styles map.
   * @returns {string}
   */
  static color(text, style)
  {
    // special-case: rainbow effect delegates to the rainbow renderer.
    if (style === LogStyle.rainbow)
    {
      return this.rainbow(`${text}`);
    }

    // short-circuit when style is not provided or unknown.
    if (!style || !this.#styles[style])
    {
      return `${text}`;
    }

    // apply the style and reset at the end.
    const code = this.#styles[style];
    const reset = this.#styles[LogStyle.reset];
    return `${code}${text}${reset}`;
  }

  /**
   * Returns a rainbow-ified version of the provided text by coloring each character
   * with a cycling palette.
   * @param {string} text The text to colorize.
   * @param {object} [options]
   * @param {import('./logger.js').LogStyleKey[]} [options.palette] The palette to use.
   * @param {number} [options.offset] Starting index within the palette.
   * @param {boolean} [options.keepSpaces] If true, spaces/newlines do not advance the palette.
   * @returns {string}
   */
  static rainbow(text, options = {})
  {
    // Pull options with sensible defaults.
    const palette = options.palette || [
      LogStyle.brightRed,
      LogStyle.brightYellow,
      LogStyle.brightGreen,
      LogStyle.brightCyan,
      LogStyle.brightBlue,
      LogStyle.brightMagenta,
    ];
    const keepSpaces = options.keepSpaces === true;

    // Guard: empty / trivial cases.
    if (!text || !palette.length)
    {
      return `${text}`;
    }

    // Local references for speed.
    const styles = this.#styles;
    const reset = styles[LogStyle.reset];

    // Determine starting offset; randomize when not explicitly provided.
    const hasExplicitOffset = typeof options.offset === 'number' && Number.isFinite(options.offset);
    const startOffset = hasExplicitOffset
      ? options.offset
      : Math.floor(Math.random() * palette.length);

    // Build colored output char-by-char.
    let out = '';
    let i = startOffset % palette.length;

    for (let idx = 0; idx < text.length; idx++)
    {
      // Grab the current character.
      const ch = text[idx];

      // Identify whitespace for optional palette advancement rules.
      const isWhitespace = ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

      // Resolve this step's style and code.
      const styleKey = palette[i % palette.length];
      const code = styles[styleKey] || '';

      // Append the styled character and a reset.
      out += `${code}${ch}${reset}`;

      // Optionally do not advance palette on whitespace/newlines.
      if (keepSpaces && isWhitespace)
      {
        continue;
      }

      // Advance the palette index.
      i += 1;
    }

    // Return the fully-styled result.
    return out;
  }

  /**
   * Logs some text to the console.
   * Will not log if logging is not enabled.
   * @param {string|string[]|number|number[]} text The text to log.
   * @param {LogStyleKey} [style] Optional style key to colorize the message.
   */
  static log(text, style)
  {
    // don't log if we're not using it.
    if (this.#blocked)
    {
      return;
    }

    // log with optional style.
    const payload = this.color(text, style);
    console.log(`🔉 ${payload}`);
  }

  /**
   * Logs some text to the console regardless of the enabled flag.
   * @param {string|string[]|number|number[]} text The text to log.
   * @param {LogStyleKey} [style] Optional style key to colorize the message.
   */
  static logAnyway(text, style)
  {
    const payload = this.color(text, style);
    console.log(`✨ ${payload}`);
  }

  /**
   * Convenience: info-level (cyan).
   * @param {string} text
   */
  static info(text)
  {
    this.log(`INFO: ${text}`, LogStyle.cyan);
  }

  /**
   * Convenience: success-level (green).
   * @param {string} text
   */
  static success(text)
  {
    this.log(`SUCCESS: ${text}`, LogStyle.green);
  }

  /**
   * Convenience: warning-level (yellow).
   * @param {string} text
   */
  static warn(text)
  {
    this.log(`WARN: ${text}`, LogStyle.yellow);
  }

  /**
   * Convenience: error-level (brightRed).
   * @param {string|Error} text
   */
  static error(text)
  {
    const msg = text && text.stack
      ? text.stack
      : `${text}`;
    this.logAnyway(`ERROR: ${msg}`, LogStyle.brightRed);
  }

  /**
   * Convenience: dim a message (useful for verbose or timing notes).
   * @param {string} text
   */
  static dim(text)
  {
    this.log(text, LogStyle.dim);
  }
}

// export this beast.
export default Logger;