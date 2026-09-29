//region Window_ClassList
import ClassAptitudeManager from '../managers/ClassAptitudeManager.js';

/**
 * Extends {@link #classRightText}.<br/>
 * Also shows how much of each class the actor has learned.
 * @param {RPG_Class} dataClass The class the row names.
 * @returns {string}
 */
J.CLASS.EXT.APT.Aliased.Window_ClassList.set('classRightText', Window_ClassList.prototype.classRightText);
Window_ClassList.prototype.classRightText = function(dataClass)
{
  // perform original logic.
  const original = J.CLASS.EXT.APT.Aliased.Window_ClassList.get('classRightText')
    .call(this, dataClass);

  // the service decides whether this class has any progress to show.
  const progressText = ClassAptitudeManager.progressText(this.actor(), dataClass.id);

  // a class with nothing to learn leaves the row as it was.
  if (progressText === String.empty) return original;

  return progressText;
};

/**
 * Extends {@link #classRightColorIndex}.<br/>
 * Also marks a class the actor has learned everything from.
 * @param {RPG_Class} dataClass The class the row names.
 * @returns {number}
 */
J.CLASS.EXT.APT.Aliased.Window_ClassList.set('classRightColorIndex', Window_ClassList.prototype.classRightColorIndex);
Window_ClassList.prototype.classRightColorIndex = function(dataClass)
{
  // perform original logic.
  const original = J.CLASS.EXT.APT.Aliased.Window_ClassList.get('classRightColorIndex')
    .call(this, dataClass);

  // anything short of mastery keeps whatever was chosen before.
  if (ClassAptitudeManager.isMastered(this.actor(), dataClass.id) === false) return original;

  return ClassAptitudeManager.MASTERED_COLOR_INDEX;
};
//endregion Window_ClassList