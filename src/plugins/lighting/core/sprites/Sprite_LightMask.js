//region Sprite_LightMask
import LightingRenderLayer from './LightingRenderLayer.js';
import PlayerLightCoordinator from '../managers/PlayerLightCoordinator.js';
import ScreenLightingComposer from '../managers/ScreenLightingComposer.js';

/**
 * The single sprite that takes light away from the map.
 *
 * Everything interesting happens offscreen. This holds a render texture, asks the render layer to
 * composite the darkness and every light into it, and shows the result multiplied into the scene.
 * Multiplication is what makes a light a *hole* rather than a glow: where the texture is white the
 * world survives untouched, where it is black the world is gone, and a torch is simply a bright
 * patch in an otherwise dark sheet.
 */
class Sprite_LightMask
  extends Sprite
{
  /**
   * How far past the screen the mask extends on every side, in pixels.
   *
   * The spriteset shakes as a whole, mask included, so a mask sized exactly to the screen slides off
   * its own edge during a screen shake and shows a bright strip of undarkened world where it ran
   * out. One tile of overdraw is comfortably more than any shake the engine produces, and costs a
   * border of texture nobody ever sees.
   * @type {number}
   */
  static MARGIN = 48;

  /**
   * Initializes this sprite.
   *
   * Members are seeded here rather than in class fields because `Sprite`'s constructor calls
   * `initialize` on the way past, which means class fields have not been installed yet by the time
   * anything this method reaches could run.
   */
  initialize()
  {
    // perform original logic.
    super.initialize();

    this.initMembers();
    this.prepareMask();
  }

  /**
   * Initializes all properties of this sprite.
   */
  initMembers()
  {
    /**
     * The texture the darkness and every light are composited into each frame.
     * @type {PIXI.RenderTexture}
     */
    this._renderTexture = null;

    /**
     * The offscreen scene that composite is built from.
     * @type {LightingRenderLayer}
     */
    this._renderLayer = null;
  }

  /**
   * Gets the texture the composite is rendered into.
   * @returns {PIXI.RenderTexture} The renderTexture.
   */
  renderTexture()
  {
    // hand back the render target.
    return this._renderTexture;
  }

  /**
   * Sets the texture the composite is rendered into.
   * @param {PIXI.RenderTexture} texture The new render target.
   */
  setRenderTexture(texture)
  {
    this._renderTexture = texture;
  }

  /**
   * Gets the offscreen scene the composite is built from.
   * @returns {LightingRenderLayer} The renderLayer.
   */
  renderLayer()
  {
    // hand back the offscreen scene.
    return this._renderLayer;
  }

  /**
   * Sets the offscreen scene the composite is built from.
   * @param {LightingRenderLayer} layer The new offscreen scene.
   */
  setRenderLayer(layer)
  {
    this._renderLayer = layer;
  }

  /**
   * Builds the render target, the offscreen scene, and this sprite's own blending.
   */
  prepareMask()
  {
    const margin = Sprite_LightMask.MARGIN;
    const width = Graphics.width + (margin * 2);
    const height = Graphics.height + (margin * 2);

    this.setRenderTexture(PIXI.RenderTexture.create(width, height));
    this.setRenderLayer(new LightingRenderLayer(width, height, margin));

    this.texture = this.renderTexture();
    this.blendMode = PIXI.BLEND_MODES.MULTIPLY;

    // sit the overdrawn border off the top-left so the screen itself lands where it belongs.
    this.x = -margin;
    this.y = -margin;
  }

  /**
   * Extends {@link Sprite.update}.<br/>
   * Recomposites the darkness and every light into the render target.
   */
  update()
  {
    // perform original logic.
    super.update();

    // catch the case where the party is now being led by somebody else entirely.
    PlayerLightCoordinator.refreshIfLeaderChanged();

    const composition = ScreenLightingComposer.compose();

    // nowhere has said it is dark, so there is nothing to take away and nothing to render.
    this.visible = composition.hasMask();
    if (this.visible === false) return;

    this.renderLayer()
      .syncTo(composition);

    this.renderComposite();
  }

  /**
   * Draws the offscreen scene into the render target.
   *
   * This runs every frame even though the darkness rarely changes, because the lights inside it move
   * with the camera - a torch two tiles away is somewhere different the moment the player walks. It
   * is one GPU pass over a screen-sized target, which is the cheap half of what the plugin this
   * replaces was doing sixty times a second on the CPU.
   */
  renderComposite()
  {
    const { renderer } = Graphics.app;
    const layer = this.renderLayer();
    const target = this.renderTexture();

    renderer.render(layer, target);
  }
}

export default Sprite_LightMask;
//endregion Sprite_LightMask