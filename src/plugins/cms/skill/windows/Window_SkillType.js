//region Window_SkillType
/**
 * Overwrites {@link #maxCols}.<br/>
 * Fixes the maximum columns for this screen to be 1.
 * @returns {number}
 */
Window_SkillType.prototype.maxCols = function()
{
  return 1;
};

Window_SkillType.prototype.makeCommandList = function()
{
  /** @type {Game_Actor} */
  const currentActor = this._actor;

  // when not currentActor, take this branch.
  if (!currentActor) return;

  // policy step inside make command list.
  /** @type {number[]} */
  const skillTypeIds = currentActor.addedSkillTypes()
    .filter((x, i, self) => self.indexOf(x) === i);

  // policy step inside make command list.
  skillTypeIds.forEach(skillTypeId =>
  {
    const name = $dataSystem.skillTypes[skillTypeId];
    const icon = IconManager.skillType(skillTypeId);
    this.addCommand(name, "skill", true, skillTypeId, icon);
  });
};
//endregion Window_SkillType