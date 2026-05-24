//region JABS_StateBuilder
import JABS_Shield from './JABS_Shield.js';

/**
 * The shield for this state.
 * @type {JABS_Shield|null}
 */
Object.defineProperty(
  JABS_StateBuilder.prototype, 'shield',
  {
    get()
    {
      // Return null if the backing field hasn’t been set yet.
      if (this._shield === undefined)
      {
        return null;
      }

      // Return the current shield value.
      return this._shield;
    },
    set(v)
    {
      // Assign the shield backing field.
      this._shield = v;
    },
    enumerable: true,
    configurable: true,
  }
);

J.ABS.EXT.SHIELD.Aliased.JABS_StateBuilder.set('build', JABS_StateBuilder.prototype.build);
JABS_StateBuilder.prototype.build = function()
{
  // perform original logic.
  const originalState = J.ABS.EXT.SHIELD.Aliased.JABS_StateBuilder.get('build')
    .call(this);

  // add the shield.
  originalState.shield = this.shield;

  // return the state.
  return originalState;
};

/**
 * Attaches a prebuilt {@link JABS_Shield} to the state after construction.
 * @param {JABS_Shield} shield The shield model to assign.
 * @returns {JABS_StateBuilder} This builder for chaining.
 */
JABS_StateBuilder.prototype.setShield = function(shield)
{
  // assign the shield to be applied post-construction.
  this.shield = shield;

  // return this for chaining.
  return this;
};
//endregion JABS_StateBuilder