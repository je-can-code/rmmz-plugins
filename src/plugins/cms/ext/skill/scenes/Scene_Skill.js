//region Scene_Skill
import Window_SkillDetail from '../windows/Window_SkillDetail.js';

/**
 * Re-parents the engine's skill scene onto the shared actor facet skeleton.
 *
 * Like the equip scene, this is one of RPG Maker's own- a function with a hand-built prototype chain
 * and no `extends` clause to change- so its prototype is re-pointed at the base's. That is real
 * inheritance: the base's rect math arrives as inherited methods, `super` inside them still resolves,
 * this file's own definitions still shadow what they mean to override, and the scene remains an
 * instance of {@link Scene_MenuBase} for everything that checks.
 */
Object.setPrototypeOf(Scene_Skill.prototype, Scene_ActorFacetBase.prototype);

/**
 * Overwrites {@link Scene_Skill.initialize}.<br/>
 * Reaches the facet skeleton's initialize so its members are seeded alongside this scene's.
 */
Scene_Skill.prototype.initialize = function()
{
  Scene_ActorFacetBase.prototype.initialize.call(this);
};

/**
 * Extends {@link Scene_ActorFacetBase.initMembers}.<br/>
 * Also initializes this scene's own members.
 */
Scene_Skill.prototype.initMembers = function()
{
  // perform original logic, which seeds the shared namespace and the facet skeleton's members.
  Scene_ActorFacetBase.prototype.initMembers.call(this);

  /**
   * Whether the extended skill detail pane is currently showing.
   * @type {boolean}
   */
  this._j.moreVisible = false;
};

/**
 * Overwrites {@link Scene_Skill.create}.<br/>
 * Builds this scene's windows around the shared chrome.
 *
 * Deliberately does not call vanilla's own `create`. That builds a `Window_SkillStatus`- a full-width
 * strip carrying the actor's face, name, level and gauges- which is the actor ribbon by another name,
 * and a taller, less consistent one. The ribbon the base supplies replaces it, so the remaining window
 * creations are listed here individually rather than inherited wholesale.
 */
Scene_Skill.prototype.create = function()
{
  // the facet skeleton builds the control legend and the actor ribbon.
  Scene_ActorFacetBase.prototype.create.call(this);

  this.createHelpWindow();
  this.createSkillTypeWindow();
  this.createItemWindow();
  this.createActorWindow();
  this.createSkillDetailWindow();
};

/**
 * Overwrites {@link Scene_Skill.statusWindow}.<br/>
 * Reports the actor ribbon in place of the retired status strip.
 *
 * Vanilla reaches for this in `refreshActor` and when returning from item use, so it answers rather
 * than vanishing- and the ribbon genuinely is what describes the actor whose skills are listed now.
 * @returns {Window_ActorRibbon}
 */
Scene_Skill.prototype.statusWindow = function()
{
  return this.getActorRibbonWindow();
};

/**
 * Implements {@link Scene_MenuFacetBase.controlLegendEntries}.<br/>
 * Describes the controls this scene responds to.
 * @returns {{semantic: (string|string[]), label: string}[]}
 */
Scene_Skill.prototype.controlLegendEntries = function()
{
  return [
    {
      semantic: 'ok',
      label: 'use',
    },
    {
      semantic: [ 'actor-prev', 'actor-next' ],
      label: 'switch character',
    },
    {
      semantic: 'cancel',
      label: 'back',
    },
  ];
};

/**
 * The proportion of the region given to the left column of skill types and skills.
 * @returns {number}
 */
Scene_Skill.prototype.listColumnRatio = function()
{
  return 0.32;
};

/**
 * Overwrites {@link Scene_Skill.mainCommandWidth}.<br/>
 * The width of the skill type and skill list column.
 *
 * A proportion of the region rather than the flat 400px it used to be, so the split holds at any
 * resolution.
 * @returns {number}
 */
Scene_Skill.prototype.mainCommandWidth = function()
{
  return Math.round(this.contentAreaRect().width * this.listColumnRatio());
};

/**
 * Overwrites {@link Scene_Skill.skillTypeWindowRect}.<br/>
 * The skill-type picker, at the top of the list column.
 * @returns {Rectangle}
 */
Scene_Skill.prototype.skillTypeWindowRect = function()
{
  const contentArea = this.contentAreaRect();
  const ww = this.mainCommandWidth();

  // honour the player's preference for which side the interactive column sits on.
  const wx = this.isRightInputMode()
    ? contentArea.x + contentArea.width - ww
    : contentArea.x;

  return new Rectangle(wx, contentArea.y, ww, this.calcWindowHeight(4, true));
};

/**
 * Overwrites {@link Scene_Skill.itemWindowRect}.<br/>
 * The skill list, filling the rest of its column beneath the type picker.
 * @returns {Rectangle}
 */
Scene_Skill.prototype.itemWindowRect = function()
{
  const contentArea = this.contentAreaRect();
  const typeRect = this.skillTypeWindowRect();
  const wy = typeRect.y + typeRect.height;

  return new Rectangle(typeRect.x, wy, typeRect.width, contentArea.y + contentArea.height - wy);
};

/**
 * Creates and wires the skill detail pane beside the skill list.
 */
Scene_Skill.prototype.createSkillDetailWindow = function()
{
  const rect = this.skillDetailRect();
  this._skillDetailWindow = new Window_SkillDetail(rect);
  this.itemWindow()
    .setSkillDetailWindow(this._skillDetailWindow);
  this.addWindow(this._skillDetailWindow);
};

/**
 * Overwrites {@link Scene_Skill.skillDetailRect}.<br/>
 * The detail pane, taking the whole column beside the list.
 *
 * Full height of the region now, rather than starting beneath a status strip that no longer exists.
 * @returns {Rectangle}
 */
Scene_Skill.prototype.skillDetailRect = function()
{
  const contentArea = this.contentAreaRect();
  const listWidth = this.mainCommandWidth();

  // sit on whichever side the list column did not take.
  const wx = this.isRightInputMode()
    ? contentArea.x
    : contentArea.x + listWidth;

  return new Rectangle(wx, contentArea.y, contentArea.width - listWidth, contentArea.height);
};

/**
 * Overwrites {@link #createButtons}.<br/>
 * Removes the buttons because fuck the buttons.
 */
Scene_Skill.prototype.createButtons = function()
{
};

/**
 * Overwrites {@link #buttonAreaHeight}.<br/>
 * Replaces the button area height with 0 because fuck buttons.
 * @returns {number}
 */
Scene_Skill.prototype.buttonAreaHeight = () => 0;
//endregion Scene_Skill
