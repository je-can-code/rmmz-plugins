//region LightingComposition
/**
 * What every lighting source, taken together, says the screen should look like this frame.
 *
 * Nothing writes to a composition after it is built. The composer hands the same instance to the
 * colour filter and to the mask, and neither is able to disturb what the other sees - which matters
 * because they run at different points in the render walk and in battle only one of them exists.
 */
class LightingComposition
{
  /**
   * The colour cast over the whole scene, as `[r, g, b, grey]`.
   * @type {number[]}
   */
  #tone = [ 0, 0, 0, 0 ];

  /**
   * How much light the scene has lost, as a fraction where `0` is untouched and `1` is pitch black.
   * @type {number}
   */
  #darkness = 0;

  /**
   * What colour the darkness is, as `[r, g, b]`.
   * @type {number[]}
   */
  #ambientColor = [ 0, 0, 0 ];

  /**
   * Every light currently burning, from every source at once.
   * @type {LightDeclaration[]}
   */
  #lights = [];

  /**
   * Constructor.
   * @param {number[]} tone The colour cast over the scene, as `[r, g, b, grey]`.
   * @param {number} darkness The fraction of light removed, 0 through 1.
   * @param {number[]} ambientColor The colour of the darkness, as `[r, g, b]`.
   * @param {LightDeclaration[]} lights Every light currently burning.
   */
  constructor(tone, darkness, ambientColor, lights)
  {
    this.#tone = tone;
    this.#darkness = darkness;
    this.#ambientColor = ambientColor;
    this.#lights = lights;
  }

  /**
   * Gets the colour cast over the whole scene.
   * @returns {number[]} The tone.
   */
  tone()
  {
    // hand back the composed tone.
    return this.#tone;
  }

  /**
   * Gets how much light the scene has lost.
   * @returns {number} The darkness.
   */
  darkness()
  {
    // hand back the composed darkness.
    return this.#darkness;
  }

  /**
   * Gets what colour the darkness is.
   * @returns {number[]} The ambientColor.
   */
  ambientColor()
  {
    // hand back the composed colour of the dark.
    return this.#ambientColor;
  }

  /**
   * Gets every light currently burning.
   * @returns {LightDeclaration[]} The lights.
   */
  lights()
  {
    // hand back every live light.
    return this.#lights;
  }

  /**
   * Determines whether there is any darkness worth rendering a mask for.
   *
   * A place nobody said was dark is not dark, and this is the guard that keeps that promise. Every
   * map in a game that predates this plugin declares no ambient at all, so every one of them takes
   * this exit and renders exactly as it always has - no mask, no render pass, no cost.
   *
   * Lights deliberately do not qualify on their own. A torch in a well-lit room has nothing to
   * reveal, and letting it force a mask into existence would put an additive glow on two hundred
   * existing events the moment this plugin was installed.
   * @returns {boolean}
   */
  hasMask()
  {
    // only a stated darkness earns the render pass.
    return this.#darkness > 0;
  }
}

export default LightingComposition;
//endregion LightingComposition