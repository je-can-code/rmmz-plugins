//region JABS_HitboxPulseManager (static)
import JABS_HitboxPulseOptions from './../__models/JABS_HitboxPulseOptions.js';
import JABS_Action from './../__models/JABS_Action.js';
import Sprite_HitboxPulse from './../sprites/Sprite_HitboxPulse.js';
/**
 * A static manager that owns lightweight hitbox "pulses" for resolved JABS actions.
 * Uses a small pool to avoid churn. Attach a PIXI container via `setLayer()`.
 */
class JABS_HitboxPulseManager
{
  //region static fields
  /**
   * @type {PIXI.Container|null}
   */
  static _layer = null;

  /**
   * @type {Sprite_HitboxPulse[]}
   */
  static _active = [];

  /**
   * @type {Sprite_HitboxPulse[]}
   */
  static _pool = [];

  /**
   * @type {number}
   */
  static _cap = 8;

  /**
   * @type {JABS_HitboxPulseOptions}
   */
  static _defaults = JABS_HitboxPulseOptions.defaults();

  /**
   * Sustained pulses keyed by {@link JABS_Action#getUuid}; refreshed each frame while the action lives.
   * @type {Record<string, Sprite_HitboxPulse>}
   */
  static _sustainedByUuid = {};
  //endregion static fields

  //region accessors
  /**
   * Assigns/changes the target layer that pulses are attached to.
   * @param {PIXI.Container} layer The container to attach pulses to.
   */
  static setLayer(layer)
  {
    // assign the destination container for pulses.
    JABS_HitboxPulseManager._layer = layer;
  }

  /**
   * Retrieves the current layer the pulses are attached to.
   * @returns {PIXI.Container|null}
   */
  static getLayer()
  {
    // return the assigned layer.
    return JABS_HitboxPulseManager._layer || null;
  }

  /**
   * Gets the internal active collection reference.
   * @returns {Sprite_HitboxPulse[]}
   */
  static getActive()
  {
    // return the active pulses collection.
    return JABS_HitboxPulseManager._active;
  }

  /**
   * Gets the internal pooled collection reference.
   * @returns {Sprite_HitboxPulse[]}
   */
  static getPool()
  {
    // return the pool of pulses for reuse.
    return JABS_HitboxPulseManager._pool;
  }

  /**
   * Gets the current maximum concurrent pulse cap.
   * @returns {number}
   */
  static getCap()
  {
    // return the current cap.
    return JABS_HitboxPulseManager._cap;
  }

  /**
   * Sets the maximum number of pulses concurrently alive.
   * @param {number} cap The maximum concurrent pulses.
   */
  static setCap(cap)
  {
    // clamp to a sensible minimum of 0.
    JABS_HitboxPulseManager._cap = Math.max(0, Math.floor(cap || 0));
  }

  /**
   * Gets a cloned copy of the current default options used for pulses.
   * @returns {JABS_HitboxPulseOptions}
   */
  static getDefaultOptions()
  {
    // return a cloned copy of the default options.
    return JABS_HitboxPulseManager._defaults.clone();
  }

  /**
   * Replaces the manager defaults with the provided options.
   * @param {JABS_HitboxPulseOptions} opts The options to set as defaults.
   */
  static setDefaultOptions(opts)
  {
    // set the defaults to the provided copy.
    JABS_HitboxPulseManager._defaults = opts.clone();
  }

  //endregion accessors

  //region configuration
  /**
   * Overrides default visual/lifetime settings for the manager.
   * Any provided fields merge over the existing defaults.
   * @param {Partial<JABS_HitboxPulseOptions>=} opts The optional default overrides.
   */
  static configure(opts)
  {
    // if nothing provided, skip configuration.
    if (!opts) return;

    // apply the overrides to defaults.
    JABS_HitboxPulseManager._defaults.apply(opts);

    // allow cap override when provided using the setter.
    if (typeof opts.maxConcurrentPulses === "number")
    {
      // set the cap accordingly.
      JABS_HitboxPulseManager.setCap(opts.maxConcurrentPulses);
    }
  }

  //endregion configuration

  //region lifecycle
  /**
   * Spawns a pulse using geometry data from a resolved action.
   * Accepts either a `JABS_HitboxPulseOptions` or a plain partial literal.
   * @param {JABS_HitboxPulseOptions|Partial<JABS_HitboxPulseOptions>} data The pulse data.
   */
  /**
   * Keeps one sustained pulse sprite aligned with the supplied action for the entire collision window.
   * @param {JABS_Action} jabsAction The live map action.
   */
  static syncSustainedActionPulse(jabsAction)
  {
    if (!J.ABS.Metadata.HitboxPulse.enabled)
    {
      JABS_HitboxPulseManager.releaseSustainedPulse(jabsAction.getUuid());
      return;
    }

    // capture layer for downstream policy in this routine.
    const layer = JABS_HitboxPulseManager.getLayer();

    // early-map bootstrap: skip quietly until Spriteset_Map wires the layer.
    if (!layer)
    {
      return;
    }

    // when jabsAction.getNeedsRemoval(), take this branch.
    if (jabsAction.getNeedsRemoval())
    {
      JABS_HitboxPulseManager.releaseSustainedPulse(jabsAction.getUuid());
      return;
    }

    // when jabsAction.isDelayCompleted()  equals  false, take this branch.
    if (jabsAction.isDelayCompleted() === false)
    {
      JABS_HitboxPulseManager.releaseSustainedPulse(jabsAction.getUuid());
      return;
    }

    // capture uuid for downstream policy in this routine.
    const uuid = jabsAction.getUuid();
    const plain = jabsAction.composeHitboxPulsePlainOptions();

    // capture pulse for downstream policy in this routine.
    let pulse = JABS_HitboxPulseManager._sustainedByUuid[uuid];
    const pool = JABS_HitboxPulseManager.getPool();

    // when not pulse, take this branch.
    if (!pulse)
    {
      pulse = pool.length > 0
        ? pool.pop()
        : new Sprite_HitboxPulse();
      JABS_HitboxPulseManager._sustainedByUuid[uuid] = pulse;
      layer.addChild(pulse);
    }

    // policy step inside sync sustained action pulse.
    pulse.reset();
    pulse.setup(plain);
    pulse.setWorldPosition(plain.x, plain.y);
    pulse.setRotation(JABS_HitboxPulseManager.directionToRadians(plain.facing));
  }

  /**
   * Detaches a sustained pulse by action uuid (cleanup / disable paths).
   * @param {string} uuid The {@link JABS_Action} uuid.
   */
  static releaseSustainedPulse(uuid)
  {
    const pulse = JABS_HitboxPulseManager._sustainedByUuid[uuid];

    // when not pulse, take this branch.
    if (!pulse)
    {
      return;
    }

    // policy step inside release sustained pulse.
    delete JABS_HitboxPulseManager._sustainedByUuid[uuid];

    // capture layer for downstream policy in this routine.
    const layer = JABS_HitboxPulseManager.getLayer();

    // when layer  and  pulse.parent  equals  layer, take this branch.
    if (layer && pulse.parent === layer)
    {
      layer.removeChild(pulse);
    }

    // policy step inside release sustained pulse.
    JABS_HitboxPulseManager.getPool()
      .push(pulse);
  }

  static spawn(data)
  {
    // resolve the target layer.
    const layer = JABS_HitboxPulseManager.getLayer();

    // if no layer yet (early-map), skip spawn.
    if (!layer) return;

    // resolve collections and cap via accessors.
    const active = JABS_HitboxPulseManager.getActive();
    const pool = JABS_HitboxPulseManager.getPool();
    const cap = JABS_HitboxPulseManager.getCap();

    // optionally cap to keep GC and overdraw low.
    if (active.length >= cap)
    {
      // remove the oldest to make space.
      const oldest = active.shift();
      if (oldest)
      {
        // detach from layer if attached.
        if (oldest.parent === layer)
        {
          layer.removeChild(oldest);
        }

        // release to pool.
        pool.push(oldest);
      }
    }

    // produce a concrete options instance based on defaults.
    const base = JABS_HitboxPulseManager.getDefaultOptions();
    const options = JABS_HitboxPulseOptions.from(data, base);

    // pick from the pool or create a new graphics sprite.
    const pulse = pool.length > 0
      ? pool.pop()
      : new Sprite_HitboxPulse();

    // reset and (re)setup geometry + visuals.
    pulse.reset();
    pulse.setup(options.toPlain());

    // set world-space placement and rotation.
    pulse.setWorldPosition(options.x, options.y);
    pulse.setRotation(JABS_HitboxPulseManager.directionToRadians(options.facing));

    // attach to layer.
    layer.addChild(pulse);

    // track as active.
    active.push(pulse);
  }

  /**
   * Ticks all pulses and retires those that have finished.
   */
  static update()
  {
    // resolve collections and layer via accessors.
    const active = JABS_HitboxPulseManager.getActive();
    const pool = JABS_HitboxPulseManager.getPool();
    const layer = JABS_HitboxPulseManager.getLayer();

    // no pulses means no work.
    if (active.length === 0) return;

    // iterate from newest to oldest to allow safe splice.
    for (let i = active.length - 1; i >= 0; i--)
    {
      // grab the pulse.
      const pulse = active[i];

      // update the pulse; if complete, release it.
      pulse.update();
      if (pulse.isExpired())
      {
        // detach from layer if still attached.
        if (layer && pulse.parent === layer)
        {
          layer.removeChild(pulse);
        }

        // recycle the pulse back to the pool.
        pool.push(pulse);

        // remove from active.
        active.splice(i, 1);
      }
    }
  }

  /**
   * Clears all active and pooled pulses (for map transitions, etc.).
   */
  static clear()
  {
    // tear down sustained overlays before recycling ephemeral pulses.
    Object.keys(JABS_HitboxPulseManager._sustainedByUuid)
      .forEach(uuid =>
      {
        JABS_HitboxPulseManager.releaseSustainedPulse(uuid);
      });

    // resolve collections and layer via accessors.
    const active = JABS_HitboxPulseManager.getActive();
    const pool = JABS_HitboxPulseManager.getPool();
    const layer = JABS_HitboxPulseManager.getLayer();

    // destroy/detach all active pulses.
    for (let i = 0; i < active.length; i++)
    {
      // grab the pulse.
      const pulse = active[i];

      // if attached, detach.
      if (pulse && layer && pulse.parent === layer)
      {
        layer.removeChild(pulse);
      }
    }

    // reset collections.
    active.length = 0;
    pool.length = 0;
  }

  //endregion lifecycle

  //region helpers
  /**
   * Converts numeric direction (1,2,3,4,6,7,8,9) to radians for pulse rotation.
   * Baseline is Right (6) → 0 rad, because geometry is authored along +X.
   * @param {number} dir The numeric direction.
   * @returns {number} Radians.
   */
  static directionToRadians(dir)
  {
    // precomputed constants for clarity.
    // right.
    const RAD_0 = 0;
    const RAD_45 = Math.PI / 4;
    const RAD_90 = Math.PI / 2;
    const RAD_180 = Math.PI;
    const RAD_N90 = -Math.PI / 2;
    const RAD_N45 = -Math.PI / 4;

    // dispatch on the discriminant for the next policy branch.
    switch (dir)
    {
      // right.
      case 6: return RAD_0;
      // down-right.
      case 3: return RAD_45;
      // down.
      case 2: return RAD_90;
      // down-left (135°).
      case 1: return RAD_180 - RAD_45;
      // left.
      case 4: return RAD_180;
      // up-left (-135°).
      case 7: return -RAD_180 + RAD_45;
      // up.
      case 8: return RAD_N90;
      // up-right (-45°).
      case 9: return RAD_N45;
    }

    // default: point right.
    return 0;
  }

  //endregion helpers
}

export default JABS_HitboxPulseManager;
//endregion JABS_HitboxPulseManager (static)