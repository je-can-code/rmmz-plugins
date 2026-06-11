//region JABS_BaseController
import JABS_InputAdapter from './JABS_InputAdapter.js';
import JABS_Battler from './JABS_Battler.js';
/**
 * Base class for all JABS input controllers.
 */
class JABS_BaseController
{
  /**
   * The battler this controller is associated with.
   * @type {JABS_Battler|null}
   */
  battler = null;

  /**
   * Default constructor for registering this controller with the input adapter.
   */
  constructor()
  {
    // register this controller with the input adapter.
    this.register();
  }

  /**
   * Connects this controller to the {@link JABS_InputAdapter}.
   */
  register()
  {
    // register this controller with the input adapter.
    JABS_InputAdapter.register(this);
  }

  /**
   * Gets the battler this controller is associated with.
   * @returns {JABS_Battler|null}
   */
  getBattler()
  {
    return this.battler;
  }

  /**
   * Sets the battler this controller is associated with.
   * @param {JABS_Battler} battler The new battler to associate this controller with.
   */
  setBattler(battler)
  {
    if (battler === undefined)
    {
      throw new Error(`Cannot set the controller's battler to undefined. Use null if you want to clear it.`);
    }

    // assign battler on this instance for callers.
    this.battler = battler;
  }
}

export default JABS_BaseController;
//endregion JABS_BaseController