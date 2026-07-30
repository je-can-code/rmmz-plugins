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
 *
 * Unlike the equip scene, the parent being displaced here is not an empty one. {@link Scene_ItemBase}
 * carries the whole "use this on which ally" flow- the actor window, target resolution, usability
 * checks and item application- roughly twenty methods that the skill scene leans on and does not
 * redefine. Pointing straight at the facet base would take all of that with it.
 *
 * So the layer is rebuilt above the facet base rather than dropped: a plain object holding
 * `Scene_ItemBase`'s own members, whose own prototype is the facet base. The resulting chain is
 * `Scene_Skill` -> item-base members -> facet base -> `Scene_MenuBase`, and both halves answer.
 *
 * Splicing the facet base beneath `Scene_ItemBase.prototype` itself would be shorter, but
 * {@link Scene_Item} shares that prototype and would inherit the facet skeleton's `helpAreaHeight`
 * along with it, moving windows in a scene that never asked for any of this.
 */
const skillItemBaseMembers = Object.create(Scene_ActorFacetBase.prototype);

// copy descriptors rather than values, so anything the engine defined as an accessor stays one.
Object.defineProperties(skillItemBaseMembers, Object.getOwnPropertyDescriptors(Scene_ItemBase.prototype));

// the copied `constructor` names Scene_ItemBase, which is no longer anywhere in this chain.
delete skillItemBaseMembers.constructor;

Object.setPrototypeOf(Scene_Skill.prototype, skillItemBaseMembers);

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
  this._j._moreVisible = false;

  /**
   * The pane describing the highlighted skill.
   * @type {Window_SkillDetail|null}
   */
  this._j._skillDetailWindow = null;
};

/**
 * Overwrites {@link Scene_Skill.create}.<br/>
 * Builds this scene's windows around the shared chrome.
 *
 * Deliberately does not call vanilla's own `create`. That builds a `Window_SkillStatus`- a full-width
 * strip carrying the actor's face, name, level and gauges- which is the actor ribbon by another name.
 * The base already supplies the ribbon, so the remaining window creations are listed out individually
 * rather than inherited wholesale.
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
 * Reports the actor ribbon as this scene's status window.
 *
 * Vanilla reaches for this in `refreshActor` and when returning from item use, so it answers rather
 * than vanishing- and the ribbon is what describes the actor whose skills are listed here.
 * @returns {Window_ActorRibbon}
 */
Scene_Skill.prototype.statusWindow = function()
{
  return this.getActorRibbonWindow();
};

/**
 * Overwrites {@link Scene_Skill.refreshActor}.<br/>
 * Points every actor-driven window in this scene at whoever is currently being viewed.
 *
 * Vanilla reaches for `_statusWindow` by field here rather than through its accessor, and this scene
 * never builds one- the ribbon stands in its place, so the accessor is what gets asked.
 */
Scene_Skill.prototype.refreshActor = function()
{
  // whoever the party has selected for the menu.
  const actor = this.actor();

  // the skill type list decides which types this actor has access to.
  this.skillTypeWindow()
    .setActor(actor);

  // the ribbon names the actor and draws their face.
  this.statusWindow()
    .setActor(actor);

  // the skill list is built from what this actor knows.
  this.itemWindow()
    .setActor(actor);
};

/**
 * Overwrites {@link Scene_Skill.useItem}.<br/>
 * Spends the highlighted skill and refreshes whatever its use may have changed.
 *
 * Same substitution as {@link Scene_Skill.refreshActor}: the ribbon is this scene's status window, and
 * it needs redrawing because using a skill moves the resources the ribbon reports.
 */
Scene_Skill.prototype.useItem = function()
{
  // perform original logic, which applies the skill and pays for it.
  Scene_ItemBase.prototype.useItem.call(this);

  // the actor's resources have moved, so the ribbon reporting them is stale.
  this.statusWindow()
    .refresh();

  // costs may have put other skills out of reach, which the list draws differently.
  this.itemWindow()
    .refresh();
};

/**
 * Overwrites {@link Scene_Skill.onActorChange}.<br/>
 * Rebuilds this scene around the newly selected party member.
 *
 * Routed through the facet base rather than {@link Scene_MenuBase} directly, because the base is what
 * knows to repoint the actor ribbon- reaching past it would leave the ribbon naming the previous actor.
 */
Scene_Skill.prototype.onActorChange = function()
{
  // perform original logic, which repoints the actor ribbon.
  Scene_ActorFacetBase.prototype.onActorChange.call(this);

  // rebuild this scene's own windows around the new actor.
  this.refreshActor();

  // the skill list belongs to someone else now, so nothing in it should look chosen.
  this.itemWindow()
    .deselect();

  // hand control back to the type list, which is where this scene starts.
  this.skillTypeWindow()
    .activate();
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
 * A proportion of the region rather than a pixel width, so the split holds at any resolution.
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
  const window = new Window_SkillDetail(this.skillDetailRect());

  // the list drives what this pane describes, so it needs a handle on it.
  this.itemWindow()
    .setSkillDetailWindow(window);

  this.setSkillDetailWindow(window);
  this.addWindow(window);
};

/**
 * Gets the pane describing the highlighted skill.
 * @returns {Window_SkillDetail}
 */
Scene_Skill.prototype.skillDetailWindow = function()
{
  return this._j._skillDetailWindow;
};

/**
 * Sets the pane describing the highlighted skill.
 * @param {Window_SkillDetail} window The window to track.
 */
Scene_Skill.prototype.setSkillDetailWindow = function(window)
{
  this._j._skillDetailWindow = window;
};

/**
 * Overwrites {@link Scene_Skill.skillDetailRect}.<br/>
 * The detail pane, taking the whole column beside the list at the full height of the content area.
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
