import Window_MenuActorCommand from './../windows/Window_MenuActorCommand.js';
import Window_MenuPartyCommand from './../windows/Window_MenuPartyCommand.js';
import MenuCommandBroadcaster from './../_models/MenuCommandBroadcaster.js';

/**
 * Overwrites {@link #create}.<br/>
 * Builds the main menu as three columns- actor commands, the party display, party commands.
 *
 * The two command columns mirror how the scenes behind them actually divide: some concern a single
 * actor, the rest concern the party or the game. Two columns of eight read faster than one list of
 * sixteen, because the grouping does the sorting on the player's behalf.
 */
Scene_Menu.prototype.create = function()
{
  // perform the grandparent's logic, skipping vanilla's single-column window creation entirely.
  Scene_MenuBase.prototype.create.call(this);

  // the help window caps the center stack and describes whichever command is highlighted.
  this.createHelpWindow();

  // build both command columns. this remains the hook six other plugins alias to register their own
  // commands, so it must keep being called by that name and must keep exposing `_commandWindow`.
  this.createCommandWindow();

  // build the party display between them.
  this.createStatusWindow();

  // build the currency strip flooring the center stack.
  this.createGoldWindow();

  // build the legend teaching the controls, which are otherwise unguessable.
  this.createControlLegendWindow();

  // now that both columns know their contents, let them shrink to fit and center themselves.
  this.actorCommandWindow()
    .fitToContents();
  this.partyCommandWindow()
    .fitToContents();

  // begin in the actor column, since it is the more frequently wanted of the two.
  this.actorCommandWindow()
    .activate();
  this.actorCommandWindow()
    .select(0);
};

//region layout
/**
 * The width of a single command column.
 *
 * Derived from the screen rather than fixed, so the layout holds at any resolution. Nothing in this
 * scene may use a pixel literal- a hardcoded column width is exactly the drift this menu replaces.
 * @returns {number}
 */
Scene_Menu.prototype.commandColumnWidth = function()
{
  return Math.floor(Graphics.boxWidth * this.commandColumnRatio());
};

/**
 * The proportion of the screen width given to each command column.
 * @returns {number}
 */
Scene_Menu.prototype.commandColumnRatio = function()
{
  return 0.22;
};

/**
 * The width of the center stack, being whatever the two command columns do not claim.
 *
 * Expressed as the remainder rather than its own calculation, so rounding in the column widths can
 * never leave an unclaimed strip down the middle of the screen.
 * @returns {number}
 */
Scene_Menu.prototype.centerStackWidth = function()
{
  return Graphics.boxWidth - (this.commandColumnWidth() * 2);
};

/**
 * The x coordinate at which the center stack begins.
 * @returns {number}
 */
Scene_Menu.prototype.centerStackX = function()
{
  return this.commandColumnWidth();
};

/**
 * Builds the provisional rectangle for a command column.
 *
 * Only the width and left edge matter here. The column shrinks to its contents and centers itself
 * once its list exists- see {@link Window_MenuSectionCommand.fitToContents}- because most of this
 * menu is unlocked over the course of the game and the count is not knowable before then.
 * @param {number} x The left edge of the column.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.floatingColumnRect = function(x)
{
  return new Rectangle(x, 0, this.commandColumnWidth(), Graphics.boxHeight);
};

/**
 * The rectangle for the actor command column, floating against the left edge.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.actorCommandWindowRect = function()
{
  return this.floatingColumnRect(0);
};

/**
 * The rectangle for the party command column, floating against the right edge.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.partyCommandWindowRect = function()
{
  return this.floatingColumnRect(Graphics.boxWidth - this.commandColumnWidth());
};

/**
 * Overwrites {@link #helpWindowRect}.<br/>
 * The rectangle for the help window, capping the center stack.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.helpWindowRect = function()
{
  return new Rectangle(
    this.centerStackX(),
    0,
    this.centerStackWidth(),
    this.calcWindowHeight(this.helpWindowLineCount(), false));
};

/**
 * How many lines of description the help window renders.
 * @returns {number}
 */
Scene_Menu.prototype.helpWindowLineCount = function()
{
  return 2;
};

/**
 * Overwrites {@link #statusWindowRect}.<br/>
 * The rectangle for the party display, filling the center stack between help and currency.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.statusWindowRect = function()
{
  // begin immediately beneath the help window.
  const wy = this.helpWindowRect().height;

  // claim everything between the help window and the currency strip.
  const wh = Graphics.boxHeight - wy - this.goldWindowRect().height;

  // return the built rectangle.
  return new Rectangle(this.centerStackX(), wy, this.centerStackWidth(), wh);
};

/**
 * Overwrites {@link #goldWindowRect}.<br/>
 * The rectangle for the currency strip, flooring the center stack.
 *
 * Deliberately mirrors the help window at the opposite end of the stack, and spans the full center
 * width rather than only as much as a gold value needs- this strip is intended to carry more than
 * gold in future, and sizing it to today's contents would only mean resizing it later.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.goldWindowRect = function()
{
  // a single line of text.
  const wh = this.calcWindowHeight(1, true);

  // sit directly above the control legend.
  const wy = Graphics.boxHeight - this.controlLegendWindowRect().height - wh;

  // return the built rectangle.
  return new Rectangle(this.centerStackX(), wy, this.centerStackWidth(), wh);
};

/**
 * The rectangle for the control legend, pinned across the full width of the bottom.
 *
 * Unlike the help window and currency strip, this spans the whole screen rather than only the center
 * stack, because it describes the entire scene- including the two command columns that sit outside
 * that stack.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.controlLegendWindowRect = function()
{
  // a single line of reduced-size text.
  const wh = this.calcWindowHeight(1, false);

  // pin to the very bottom of the screen.
  return new Rectangle(0, Graphics.boxHeight - wh, Graphics.boxWidth, wh);
};

/**
 * CMS menu keeps commands on the left- never mirror for right-side input.
 * @returns {boolean}
 */
Scene_Menu.prototype.isRightInputMode = function()
{
  return false;
};

/**
 * CMS menu keeps help at the top- not the bottom strip layout.
 * @returns {boolean}
 */
Scene_Menu.prototype.isBottomHelpMode = function()
{
  return false;
};

/**
 * CMS menu uses bottom button hints instead of top-of-screen buttons.
 * @returns {boolean}
 */
Scene_Menu.prototype.isBottomButtonMode = function()
{
  return true;
};

//endregion layout

//region control legend
/**
 * Creates the control legend and adds it to tracking.
 */
Scene_Menu.prototype.createControlLegendWindow = function()
{
  // build the window into its rectangle.
  const window = new Window_ControlLegend(this.controlLegendWindowRect());

  // teach the controls that cannot be discovered by looking at the screen.
  window.setEntries(this.controlLegendEntries());

  // register the window.
  this.addWindow(window);
};

/**
 * The controls this menu teaches.
 *
 * Only the non-obvious ones are worth the space. Moving between the two columns is the entry that
 * justifies this window existing at all- nothing about two side-by-side lists suggests the second one
 * is reachable, which is precisely the sort of silent capability players never find.
 * @returns {{semantic: string, label: string}[]}
 */
Scene_Menu.prototype.controlLegendEntries = function()
{
  return [
    {
      semantic: [ 'focus-prev', 'focus-next' ],
      label: 'switch column',
    },
    {
      semantic: 'ok',
      label: 'open',
    },
    {
      semantic: 'cancel',
      label: 'back',
    },
  ];
};

//endregion control legend

//region command columns
/**
 * Overwrites {@link #createCommandWindow}.<br/>
 * Creates both command columns and exposes them behind a single broadcaster.
 *
 * Eight plugins alias this method and then call `this._commandWindow.setHandler(...)` to wire their
 * own commands. Keeping both the method name and that property means all eight keep working
 * untouched- `_commandWindow` is simply no longer a window, but something that hands each
 * registration to both columns. Only the column actually rendering a given command can ever fire its
 * handler.
 *
 * IMPORTANT: this is an overwrite rather than an alias, so any plugin patching this method must load
 * AFTER this one or its patch is discarded. That is why J-CMS is ordered immediately after J-Base,
 * ahead of every plugin that contributes a menu command- ordering it later silently breaks the
 * handlers of anything loaded before it, while leaving their commands visibly rendered.
 */
Scene_Menu.prototype.createCommandWindow = function()
{
  // build the two real columns.
  this.createActorCommandWindow();
  this.createPartyCommandWindow();

  // expose them as one target so existing integrations need no knowledge of the split.
  this.setCommandWindow(new MenuCommandBroadcaster([ this.actorCommandWindow(), this.partyCommandWindow() ]));

  // wire the vanilla commands through the same broadcaster everyone else uses.
  this.bindMenuCommandHandlers(this.commandWindow());

  // both columns describe their highlighted command into the same help window.
  this.actorCommandWindow()
    .setHelpWindow(this.helpWindow());
  this.partyCommandWindow()
    .setHelpWindow(this.helpWindow());
};

/**
 * Creates the actor command column.
 */
Scene_Menu.prototype.createActorCommandWindow = function()
{
  // build the window into its rectangle.
  const window = new Window_MenuActorCommand(this.actorCommandWindowRect());

  // moving right hands focus to the party column.
  window.setHandler('focus-next', this.onFocusPartyColumn.bind(this));

  // backing out of the menu returns to the map.
  window.setHandler('cancel', this.popScene.bind(this));

  // track and register the window.
  this.setActorCommandWindow(window);
  this.addWindow(window);
};

/**
 * Creates the party command column.
 */
Scene_Menu.prototype.createPartyCommandWindow = function()
{
  // build the window into its rectangle.
  const window = new Window_MenuPartyCommand(this.partyCommandWindowRect());

  // moving left hands focus back to the actor column.
  window.setHandler('focus-prev', this.onFocusActorColumn.bind(this));

  // backing out of the menu returns to the map.
  window.setHandler('cancel', this.popScene.bind(this));

  // this column starts dormant; the player moves into it deliberately.
  window.deactivate();
  window.deselect();

  // track and register the window.
  this.setPartyCommandWindow(window);
  this.addWindow(window);
};

/**
 * Gets the actor command column.
 * @returns {Window_MenuActorCommand}
 */
Scene_Menu.prototype.actorCommandWindow = function()
{
  return this._j._cms._actorCommandWindow;
};

/**
 * Sets the actor command column to the given window.
 * @param {Window_MenuActorCommand} window The window to track.
 */
Scene_Menu.prototype.setActorCommandWindow = function(window)
{
  this._j ||= {};
  this._j._cms ||= {};
  this._j._cms._actorCommandWindow = window;
};

/**
 * Gets the party command column.
 * @returns {Window_MenuPartyCommand}
 */
Scene_Menu.prototype.partyCommandWindow = function()
{
  return this._j._cms._partyCommandWindow;
};

/**
 * Sets the party command column to the given window.
 * @param {Window_MenuPartyCommand} window The window to track.
 */
Scene_Menu.prototype.setPartyCommandWindow = function(window)
{
  this._j ||= {};
  this._j._cms ||= {};
  this._j._cms._partyCommandWindow = window;
};

/**
 * Hands focus to the party column.
 */
Scene_Menu.prototype.onFocusPartyColumn = function()
{
  this.swapColumnFocus(this.actorCommandWindow(), this.partyCommandWindow());
};

/**
 * Hands focus back to the actor column.
 */
Scene_Menu.prototype.onFocusActorColumn = function()
{
  this.swapColumnFocus(this.partyCommandWindow(), this.actorCommandWindow());
};

/**
 * Moves focus from one command column to the other.
 *
 * The column being left is fully deselected rather than merely deactivated, because a dormant column
 * still showing a highlighted row reads as though two things are selected at once. Its position is
 * remembered separately so returning to it lands where the player left off instead of snapping back
 * to the top.
 * @param {Window_MenuSectionCommand} leaving The column losing focus.
 * @param {Window_MenuSectionCommand} entering The column gaining focus.
 */
Scene_Menu.prototype.swapColumnFocus = function(leaving, entering)
{
  // remember where the player was before the highlight is cleared.
  leaving.rememberSelection();

  // stand the old column down and clear its highlight entirely.
  leaving.deactivate();
  leaving.deselect();

  // wake the new column where the player last left it.
  entering.activate();
  entering.restoreSelection();

  // the help window now describes this column's selection rather than the other's.
  entering.updateHelp();
};

/**
 * Binds the handlers for every command either column may contain.
 *
 * Both columns are wired identically, because a command's section decides which column renders it-
 * not which handlers exist. A command that never appears in a given column simply never fires there,
 * and wiring both means a plugin retagging its command needs no change here.
 * @param {MenuCommandBroadcaster} window The broadcaster feeding both command columns.
 */
Scene_Menu.prototype.bindMenuCommandHandlers = function(window)
{
  // the actor-scoped vanilla scenes.
  window.setHandler("skill", this.commandActorScene.bind(this, Scene_Skill));
  window.setHandler("equip", this.commandActorScene.bind(this, Scene_Equip));

  // the party-scoped vanilla scenes.
  window.setHandler("item", this.commandItem.bind(this));
  window.setHandler("options", this.commandOptions.bind(this));
  window.setHandler("save", this.commandSave.bind(this));
  window.setHandler("gameEnd", this.commandGameEnd.bind(this));
};

/**
 * Opens a scene scoped to the currently selected actor.
 *
 * Vanilla routes these three commands through an actor-selection window first, to answer "which of
 * the party did you mean?". A permanently two-person party whose scenes each carry their own actor
 * ribbon does not need that question asked, so the scene is pushed immediately and resolves the menu
 * actor itself- which {@link Game_Party.menuActor} always answers with a valid party member.
 * @param {Function} sceneClass The scene to open.
 */
Scene_Menu.prototype.commandActorScene = function(sceneClass)
{
  // open the requested scene directly.
  SceneManager.push(sceneClass);
};

//endregion command columns
