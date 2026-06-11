//region Game_CharacterBase
import AutoApplyStateManager from '../managers/AutoApplyStateManager.js';
import AutoExecuteSkillManager from '../managers/AutoExecuteSkillManager.js';

/**
 * Extends {@link Game_CharacterBase#updatePixelStepping}.<br/>
 * Credits whole tiles toward {@code move} auto-apply after Pixelistics fires a step.<br/>
 * Hooks stepping instead of {@link Game_CharacterBase#onStep} because J-Pixelistics aliases
 * {@link Game_Player#onStep} on its own prototype (player steps never reach a base-only onStep chain).
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_CharacterBase.set(
  'updatePixelStepping',
  Game_CharacterBase.prototype.updatePixelStepping
);
Game_CharacterBase.prototype.updatePixelStepping = function()
{
  const tookStep = this.moveDistance() >= this.stepDistance();

  // perform original logic (Pixelistics may call onStep / player step effects inside).
  J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_CharacterBase.get('updatePixelStepping')
    .call(this);

  if (tookStep === false) return;

  AutoApplyStateManager.processTileStepFromCharacter(this);
  AutoExecuteSkillManager.processTileStepFromCharacter(this);
};
//endregion Game_CharacterBase
