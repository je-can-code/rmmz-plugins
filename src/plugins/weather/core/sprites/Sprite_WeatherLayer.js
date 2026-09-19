//region Sprite_WeatherLayer
import WeatherDirector from './../managers/WeatherDirector.js';
import WeatherMotion from './../core/WeatherMotion.js';

/**
 * One layer of a place's ambience, drawn as a fixed population of particles.
 *
 * A layer is one picture travelling one way: rain falling, motes wandering, embers rising. Anything
 * more complicated than that - snow that is also blowing sideways, a lava flow that both glows and
 * sparks - is two layers, which is why a preset owns a list of them rather than a single description.
 *
 * **The population never changes size.** Particles are created once and reused forever: one that
 * leaves the screen is not destroyed and replaced, it is moved back to an edge and given a fresh
 * velocity. That matters more here than almost anywhere else in this codebase, because the heaviest
 * ambience Chef Adventure authors runs a thousand particles, and allocating a thousand short-lived
 * objects sixty times a second is how a plugin quietly starts costing frames.
 *
 * For the same reason the particle *state* is a plain object rather than a class. Nothing outside
 * this file touches it, it is read and written a thousand times a frame, and putting a pair of
 * accessors in front of every number would be paying a readability tax on the one loop in the plugin
 * that cannot afford it.
 */
class Sprite_WeatherLayer
  extends Sprite
{
  /**
   * How an authored blend name maps onto the renderer's own.
   *
   * Authored as words because that is what somebody tuning a config wants to type, and because
   * `additive` says what it does where `1` does not.
   * @type {Object<string, number>}
   */
  static Blends = {
    normal: 0,
    additive: 1,
    multiply: 2,
  };

  /**
   * The most frames any one particle is run forward for when the weather is first built.
   *
   * A ceiling rather than a target. Fog crawls at a third of a pixel a frame through a queue well
   * over a thousand pixels deep, and without a cap that arithmetic asks for tens of thousands of
   * iterations per particle at the exact moment a map is trying to load.
   * @type {number}
   */
  static MaxSettleFrames = 12000;

  /**
   * The screen an authored density is expressed against.
   *
   * RPG Maker's own default window, because that is the one number every author can be assumed to
   * have in mind, and because a config full of numbers tuned to one person's monitor is a config
   * that is wrong for everybody else's.
   * @type {number}
   */
  static ReferenceArea = 816 * 624;

  /**
   * Extends {@link Sprite.initialize}.<br/>
   * Also builds this layer's entire particle population.
   * @param {object} layer A layer resolved by `WeatherPresets.resolveLayer`.
   */
  initialize(layer)
  {
    // perform original logic.
    super.initialize();

    // initialize our properties.
    this.initMembers();

    // and populate this layer, once and for all.
    this.setLayer(layer);
    this.createParticles();
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with weather.
     */
    this._j._weather ||= {};

    /**
     * What this layer draws and how it moves.
     * @type {object}
     */
    this._j._weather._layer = null;

    /**
     * The state of every particle, in the same order as the sprites drawing them.
     * @type {object[]}
     */
    this._j._weather._particles = [];
  }

  /**
   * Gets what this layer draws and how it moves.
   * @returns {object} The layer.
   */
  layer()
  {
    // hand back what this layer is drawing.
    return this._j._weather._layer;
  }

  /**
   * Sets what this layer draws and how it moves.
   * @param {object} newLayer The new layer.
   */
  setLayer(newLayer)
  {
    // assign what this layer is drawing.
    this._j._weather._layer = newLayer;
  }

  /**
   * Gets the state of every particle in this layer.
   * @returns {object[]} The particles.
   */
  particles()
  {
    // hand back the particle states.
    return this._j._weather._particles;
  }

  /**
   * Builds the sprites and the states for this layer's whole population.
   *
   * One bitmap is shared by every particle, because they are all the same picture - a thousand rain
   * drops are a thousand draws of one 18x36 image, and loading it a thousand times would be a
   * thousand copies of it in texture memory.
   */
  createParticles()
  {
    const layer = this.layer();
    const bitmap = ImageManager.loadWeather(layer.asset);
    const blendMode = Sprite_WeatherLayer.Blends[layer.blend];

    const count = this.particleCount();

    for (let index = 0; index < count; index++)
    {
      const sprite = new Sprite(bitmap);
      sprite.anchor.set(0.5, 0.5);
      sprite.blendMode = blendMode;

      // the whole layer shares one colour, so this is set once at birth rather than every frame.
      sprite.tint = layer.tint;

      this.addChild(sprite);
      this.particles()
        .push(this.buildParticle());
    }

    // and then run the whole thing forward, so the player arrives into weather that has already been
    // going rather than watching it start.
    this.settle();
  }

  /**
   * How many particles this layer actually builds, for the screen it is being drawn on.
   *
   * **An authored density is a density, not a count.** It says how thick the weather is, and how
   * many sprites that takes depends entirely on how much screen there is to cover - a number tuned
   * against the engine's default 816x624 window puts a quarter as much weather on a 1080p one, which
   * is the difference between fog and a few wisps.
   *
   * Scaled by area rather than by width, because coverage is areal: a screen twice as wide and twice
   * as tall needs four times the particles to look the same, not two.
   * @returns {number}
   */
  particleCount()
  {
    const bounds = Sprite_WeatherLayer.screenBounds();
    const area = bounds.width * bounds.height;

    return Math.round(this.layer().density * (area / Sprite_WeatherLayer.ReferenceArea));
  }

  /**
   * Runs every particle forward by a random slice of its own journey.
   *
   * Seeding a *snapshot* - scattering the opening population across the screen - gets the first
   * frame right and every frame after it wrong, because on screen is not where most of a population
   * lives. Particles queue up off-screen before entering, so scattering them all into view opens at
   * several times the intended density and then thins out as the surplus drains away. What arriving
   * somewhere should look like is the distribution the weather settles into on its own, and the
   * cheapest way to get exactly that distribution is to let it settle.
   *
   * The cost is a few hundred thousand arithmetic operations, once, while the map is already loading.
   */
  settle()
  {
    const layer = this.layer();
    const bounds = Sprite_WeatherLayer.screenBounds();

    this.particles()
      .forEach((newborn, index) =>
      {
        const frames = Math.floor(Math.random() * Sprite_WeatherLayer.settleFramesFor(newborn, layer, bounds));

        for (let frame = 0; frame < frames; frame++)
        {
          // re-read every step, because a particle that escapes is replaced outright rather than
          // moved, and advancing the one that left would be advancing a ghost.
          const living = this.particles()[index];
          const params = this.paramsFor(index);

          WeatherMotion.advance(living, params);

          if (this.isFinished(living, params, bounds) === true)
          {
            this.reseatParticle(index);
          }
        }

        // whatever it was part-way through fading into, it has been there a while by now.
        const settled = this.particles()[index];
        settled.opacity = WeatherMotion.settledOpacityFor(settled, this.paramsFor(index));
        settled.stagger = 0;
      });
  }

  /**
   * How many frames one full round trip takes this particle.
   *
   * **The whole cycle, not the visible part of it.** A particle's journey begins a margin outside the
   * screen and as much as an entry queue further back again, so settling it for only the width of
   * the screen leaves most of a population still queued up outside and the map opening empty.
   * Overshooting is harmless - a particle that runs out the far side is reseated and simply goes
   * round again - so the number errs long on purpose.
   *
   * Measured per particle rather than per layer because their speeds differ, and a slow one given a
   * fast one's budget does not get far enough.
   * @param {object} particle The particle being settled.
   * @param {object} layer The motion parameters it was born from.
   * @param {{width: number, height: number}} bounds The screen it crosses.
   * @returns {number}
   */
  static settleFramesFor(particle, layer, bounds)
  {
    // a particle that dies of old age has exactly one cycle worth of states to be scattered over,
    // and running it further only walks it through the same lifetime again.
    if (particle.life > 0) return particle.life;

    const pace = Math.max(Math.abs(particle.velocityX), Math.abs(particle.velocityY), 0.05);

    const distance = (WeatherMotion.marginOf(layer) * 2)
      + WeatherMotion.entryDepthOf(layer)
      + bounds.width
      + bounds.height;

    return Math.min(distance / pace, Sprite_WeatherLayer.MaxSettleFrames);
  }

  /**
   * Builds one particle entering from a given edge.
   * @param {?string} edge Where to enter from, or null to use the layer's own.
   * @returns {object}
   */
  buildParticle(edge = null)
  {
    const layer = this.layer();
    const entry = edge === null
      ? WeatherMotion.resolveEdge(layer, Sprite_WeatherLayer.playerTravel())
      : edge;

    return WeatherMotion.spawn(layer, Sprite_WeatherLayer.screenBounds(), entry, Sprite_WeatherLayer.rolls());
  }

  /**
   * A fresh roll for every independent choice a particle makes at birth.
   *
   * Drawn here rather than inside the motion itself, which is what keeps every calculation in
   * {@link WeatherMotion} a pure function of its arguments and therefore assertable to an exact
   * number rather than a range.
   *
   * One per choice, never shared. Two choices driven off a single roll are not two choices - they
   * are one, wearing a disguise, and the population ends up agreeing with itself in a way that is
   * immediately visible as structure on screen.
   * @returns {{along: number, across: number, speedX: number, speedY: number, scale: number,
   * stagger: number, edge: number, phase: number, flip: number, pulse: number}}
   */
  static rolls()
  {
    return {
      along: Math.random(),
      across: Math.random(),
      speedX: Math.random(),
      speedY: Math.random(),
      scale: Math.random(),
      stagger: Math.random(),
      life: Math.random(),
      edge: Math.random(),
      phase: Math.random(),
      flip: Math.random(),
      pulse: Math.random(),
      tilt: Math.random(),
      stretchX: Math.random(),
      stretchY: Math.random(),
    };
  }

  /**
   * The screen every particle crosses.
   * @returns {{width: number, height: number}}
   */
  static screenBounds()
  {
    return {
      width: Graphics.width,
      height: Graphics.height,
    };
  }

  /**
   * How far the player moved this frame, per axis.
   *
   * Read from the director rather than measured here, because every layer of a preset asks on the
   * same frame and only the first of them could possibly observe the movement.
   * @returns {{x: number, y: number}}
   */
  static playerTravel()
  {
    return WeatherDirector.travel();
  }

  /**
   * Extends {@link Sprite.update}.<br/>
   * Also advances every particle and draws it where it got to.
   */
  update()
  {
    // perform original logic.
    super.update();

    // then move the weather along.
    this.updateParticles();
  }

  /**
   * Advances every particle by a frame, reseating any that have left the screen.
   */
  updateParticles()
  {
    const bounds = Sprite_WeatherLayer.screenBounds();

    this.particles()
      .forEach((particle, index) =>
      {
        const params = this.paramsFor(index);

        WeatherMotion.advance(particle, params);

        if (this.isFinished(particle, params, bounds) === true)
        {
          this.reseatParticle(index);
        }

        this.drawParticle(index);
      });
  }

  /**
   * Whether a particle is done and should be replaced.
   *
   * Two ways to be done, and a motion uses one or the other rather than both: travelling weather
   * finishes by leaving, and local weather finishes by running out of life. Asking both questions
   * of every particle costs nothing, since a motion with no lifetime answers the second instantly.
   * @param {object} particle The particle being tested.
   * @param {object} layer The motion parameters it was born from.
   * @param {{width: number, height: number}} bounds The screen it crosses.
   * @returns {boolean}
   */
  isFinished(particle, layer, bounds)
  {
    if (WeatherMotion.hasEscaped(particle, bounds, layer) === true) return true;

    return WeatherMotion.hasExpired(particle);
  }

  /**
   * Sends a particle that has left the screen back to an edge to cross it again.
   *
   * Rebuilt rather than merely repositioned, so it picks up a fresh velocity and size on the way -
   * a population that reseated without rerolling would settle into visible lanes within a minute.
   * @param {number} index Which particle is being reseated.
   */
  reseatParticle(index)
  {
    const particle = this.particles()[index];
    const successor = this.successorFor(particle);

    // a particle with somewhere left to go turns into it, right where it finished, rather than
    // going back to an edge and starting over as itself.
    if (successor !== null)
    {
      const bounds = Sprite_WeatherLayer.screenBounds();
      this.particles()[index] = WeatherMotion.succeed(particle, successor, bounds, Sprite_WeatherLayer.rolls());
      this.children[index].bitmap = ImageManager.loadWeather(successor.asset);

      return;
    }

    const replacement = this.buildParticle();

    // a reseated particle is already on screen the moment it is drawn, so it skips the stagger that
    // spreads a population out when the weather first arrives.
    replacement.stagger = 0;

    this.particles()[index] = replacement;
    this.children[index].bitmap = ImageManager.loadWeather(this.layer().asset);
  }

  /**
   * What a particle turns into when its life runs out, if anything.
   *
   * Only a first-stage particle has a successor. That is what keeps the chain finite without any
   * bookkeeping: a sparkle left behind by a shooting star simply dies and is replaced by a new
   * shooting star, rather than leaving a sparkle of its own forever.
   *
   * **And only a particle that ran out of life leaves anything behind.** A particle that merely
   * left the screen has not finished, it has gone - and a raindrop retired below the bottom edge
   * would otherwise splash a quarter of a screen beneath the world, where the ripple is both
   * invisible and occupying a particle that could have been raining.
   * @param {object} particle The particle whose turn has just ended.
   * @returns {?object} The successor layer, or null when this particle simply starts again.
   */
  successorFor(particle)
  {
    if (particle.stage > 0) return null;

    if (WeatherMotion.hasExpired(particle) === false) return null;

    return this.layer().becomes;
  }

  /**
   * The parameters one particle is currently living by.
   *
   * A particle part-way through a staged life is not moving the way its layer says any more - it is
   * a splash rather than a raindrop - so everything that advances or draws it has to ask which of
   * the two it is rather than assuming the layer.
   * @param {number} index Which particle is being asked about.
   * @returns {object} The motion parameters governing that particle right now.
   */
  paramsFor(index)
  {
    const particle = this.particles()[index];

    if (particle.stage === 0) return this.layer();

    return this.layer().becomes;
  }

  /**
   * Puts one particle's state onto the sprite drawing it.
   * @param {number} index Which particle is being drawn.
   */
  drawParticle(index)
  {
    const particle = this.particles()[index];
    const sprite = this.children[index];

    sprite.x = particle.x;
    sprite.y = particle.y;
    sprite.rotation = particle.rotation;

    // the layer's authored scale is already folded in when the particle is born, so this is the
    // particle's own size rather than a second application of the same percentage. the two axes
    // are set apart, which is what lets one picture read as a variety of shapes.
    sprite.scale.set(WeatherMotion.facingScaleX(particle), particle.scaleY);

    // a particle waiting out its stagger exists but is not yet part of the weather.
    sprite.opacity = particle.stagger > 0
      ? 0
      : WeatherMotion.glowFor(particle, this.paramsFor(index));
  }
}

export default Sprite_WeatherLayer;
//endregion Sprite_WeatherLayer