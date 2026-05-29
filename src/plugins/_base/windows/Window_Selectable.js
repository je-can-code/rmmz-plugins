//region Window_Selectable
/**
 * Weaves in the "more data window" at the highest level of selectable.
 *
 * It can be added to any window that extends this or its subclasses.
 */
J.BASE.Aliased.Window_Selectable.initialize = Window_Selectable.prototype.initialize;
Window_Selectable.prototype.initialize = function(rect)
{
  J.BASE.Aliased.Window_Selectable.initialize.call(this, rect);
  /**
   * The "more data" window. Used for further elaborating on a particular selection.
   *
   * @type {Window_MoreData}
   */
  this._moreDataWindow = null;
};

J.BASE.Aliased.Window_Selectable.processHandling = Window_Selectable.prototype.processHandling;
Window_Selectable.prototype.processHandling = function()
{
  if (this.isOpenAndActive())
  {
    if (this.isMoreEnabled() && this.isMoreTriggered())
    {
      return this.processMore();
    }

    if (this.isContextEnabled() && this.isContextTriggered())
    {
      return this.processContext();
    }

    if (this.isContentPrevEnabled() && this.isContentPrevTriggered())
    {
      return this.processContentPrev();
    }

    if (this.isContentNextEnabled() && this.isContentNextTriggered())
    {
      return this.processContentNext();
    }

    if (this.isActorPrevEnabled() && this.isActorPrevTriggered())
    {
      return this.processActorPrev();
    }

    if (this.isActorNextEnabled() && this.isActorNextTriggered())
    {
      return this.processActorNext();
    }
  }

  return J.BASE.Aliased.Window_Selectable.processHandling.call(this);
};

/**
 * Gets whether or not "more" data has been provided.
 * @returns {boolean}  True if "more" is handled, false otherwise.
 */
Window_Selectable.prototype.isMoreEnabled = function()
{
  return this.isHandled('more');
};

/**
 * Gets whether or not the "more" button is pressed/held.
 * @returns {boolean} True if the "more" button is pressed/held, false otherwise.
 */
Window_Selectable.prototype.isMoreTriggered = function()
{
  return this._canRepeat
    ? Input.isRepeated('shift')
    : Input.isTriggered('shift');
};

/**
 * Processes the "more" functionality.
 */
Window_Selectable.prototype.processMore = function()
{
  this.playCursorSound();
  this.updateInputData();
  this.callMoreHandler();
};

/**
 * Calls the given handler provided by the "more" symbol.
 */
Window_Selectable.prototype.callMoreHandler = function()
{
  this.callHandler('more');
};

/**
 * Gets whether a contextual scene action handler is registered.
 * @returns {boolean}
 */
Window_Selectable.prototype.isContextEnabled = function()
{
  return this.isHandled('context');
};

/**
 * Gets whether triangle / tab fired this frame (or repeat when allowed).
 * @returns {boolean}
 */
Window_Selectable.prototype.isContextTriggered = function()
{
  return this._canRepeat
    ? Input.isRepeated('tab')
    : Input.isTriggered('tab');
};

/**
 * Processes the contextual scene action.
 */
Window_Selectable.prototype.processContext = function()
{
  this.playCursorSound();
  this.updateInputData();
  this.callContextHandler();
};

/**
 * Calls the handler registered for contextual scene actions.
 */
Window_Selectable.prototype.callContextHandler = function()
{
  this.callHandler('context');
};

/**
 * Gets whether a content-tab previous handler is registered.
 * @returns {boolean}
 */
Window_Selectable.prototype.isContentPrevEnabled = function()
{
  return this.isHandled('content-prev');
};

/**
 * Gets whether L2 / ctrl fired for content cycling.
 * @returns {boolean}
 */
Window_Selectable.prototype.isContentPrevTriggered = function()
{
  return this._canRepeat
    ? Input.isRepeated('l2')
    : Input.isTriggered('l2');
};

/**
 * Processes content-tab cycle toward the previous entry.
 */
Window_Selectable.prototype.processContentPrev = function()
{
  this.playCursorSound();
  this.updateInputData();
  this.callContentPrevHandler();
};

/**
 * Calls the handler registered for content-tab previous.
 */
Window_Selectable.prototype.callContentPrevHandler = function()
{
  this.callHandler('content-prev');
};

/**
 * Gets whether a content-tab next handler is registered.
 * @returns {boolean}
 */
Window_Selectable.prototype.isContentNextEnabled = function()
{
  return this.isHandled('content-next');
};

/**
 * Gets whether R2 / alt fired for content cycling.
 * @returns {boolean}
 */
Window_Selectable.prototype.isContentNextTriggered = function()
{
  return this._canRepeat
    ? Input.isRepeated('r2')
    : Input.isTriggered('r2');
};

/**
 * Processes content-tab cycle toward the next entry.
 */
Window_Selectable.prototype.processContentNext = function()
{
  this.playCursorSound();
  this.updateInputData();
  this.callContentNextHandler();
};

/**
 * Calls the handler registered for content-tab next.
 */
Window_Selectable.prototype.callContentNextHandler = function()
{
  this.callHandler('content-next');
};

/**
 * Gets whether an actor-previous handler is registered.
 * @returns {boolean}
 */
Window_Selectable.prototype.isActorPrevEnabled = function()
{
  return this.isHandled('actor-prev');
};

/**
 * Gets whether L1 / pageup fired for actor cycling.
 * @returns {boolean}
 */
Window_Selectable.prototype.isActorPrevTriggered = function()
{
  return this._canRepeat
    ? Input.isRepeated('pageup')
    : Input.isTriggered('pageup');
};

/**
 * Processes actor cycle toward the previous party member.
 */
Window_Selectable.prototype.processActorPrev = function()
{
  this.playCursorSound();
  this.updateInputData();
  this.callActorPrevHandler();
};

/**
 * Calls the handler registered for actor-previous.
 */
Window_Selectable.prototype.callActorPrevHandler = function()
{
  this.callHandler('actor-prev');
};

/**
 * Gets whether an actor-next handler is registered.
 * @returns {boolean}
 */
Window_Selectable.prototype.isActorNextEnabled = function()
{
  return this.isHandled('actor-next');
};

/**
 * Gets whether R1 / pagedown fired for actor cycling.
 * @returns {boolean}
 */
Window_Selectable.prototype.isActorNextTriggered = function()
{
  return this._canRepeat
    ? Input.isRepeated('pagedown')
    : Input.isTriggered('pagedown');
};

/**
 * Processes actor cycle toward the next party member.
 */
Window_Selectable.prototype.processActorNext = function()
{
  this.playCursorSound();
  this.updateInputData();
  this.callActorNextHandler();
};

/**
 * Calls the handler registered for actor-next.
 */
Window_Selectable.prototype.callActorNextHandler = function()
{
  this.callHandler('actor-next');
};

/**
 * Extends the `.select()` to include a hook for executing logic onIndexChange.
 */
J.BASE.Aliased.Window_Selectable.select = Window_Selectable.prototype.select;
Window_Selectable.prototype.select = function(index)
{
  const previousIndex = this._index;
  J.BASE.Aliased.Window_Selectable.select.call(this, index);
  if (previousIndex !== this._index)
  {
    this.onIndexChange();
  }
};

/**
 * Designed for overriding to weave in functionality on-change of the index.
 *
 * NOTE: This executes AFTER the index has changed.
 */
Window_Selectable.prototype.onIndexChange = function()
{
};
//endregion Window_Selectable
