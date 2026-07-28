//region InputLegendResolver
/**
 * A registry translating semantic input handlers into something displayable to the player.
 *
 * Windows bind semantic handler names- `context`, `content-next`, `actor-prev`- rather than physical
 * buttons, which is what lets one input mapping serve the whole ecosystem. The cost is that a legend
 * wanting to tell the player "press Triangle" has nothing to read: the semantic name is all there is.
 *
 * This registry closes that gap without creating a dependency. J-Base knows only that a resolver may
 * exist; whichever plugin actually owns the input mapping registers one at boot. With a resolver
 * present, legends render live controller glyphs that follow the player's remapping. Without one,
 * they fall back to the plain text label the caller supplied, which is always readable.
 */
class InputLegendResolver
{
  /**
   * The registered resolver function, if any.
   * @type {?function(string): string}
   */
  static #resolver = null;

  /**
   * Registers the function responsible for turning a semantic handler name into display text.
   *
   * The resolver is expected to return {@link String.empty} for anything it cannot describe, which
   * lets the caller keep its own fallback rather than rendering a blank.
   * @param {function(string): string} resolver Receives a semantic name, returns display text.
   */
  static registerResolver(resolver)
  {
    this.#resolver = resolver;
  }

  /**
   * Gets whether a resolver has been registered.
   * @returns {boolean}
   */
  static hasResolver()
  {
    return this.#resolver !== null;
  }

  /**
   * Resolves a semantic handler name into display text.
   * @param {string} semantic The semantic handler name, such as `context` or `actor-next`.
   * @param {string} fallback The text to use when no resolver can describe this semantic.
   * @returns {string}
   */
  static resolve(semantic, fallback)
  {
    // with nobody registered, the caller's own wording is the best available answer.
    if (this.hasResolver() === false) return fallback;

    // ask the resolver what this semantic currently looks like to the player.
    const resolved = this.#resolver(semantic);

    // resolvers report "I cannot describe this" with an empty string rather than by throwing.
    if (resolved === String.empty) return fallback;

    // the resolver knew what this was.
    return resolved;
  }

  /**
   * Clears the registered resolver, restoring plain-text fallback behavior.
   */
  static clearResolver()
  {
    this.#resolver = null;
  }
}

export default InputLegendResolver;
//endregion InputLegendResolver
