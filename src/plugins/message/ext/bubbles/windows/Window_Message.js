//region Window_Message
import BubbleBounds from '../__models/BubbleBounds.js';
import BubbleGeometry from '../services/BubbleGeometry.js';
import BubbleLayout from '../services/BubbleLayout.js';
import BubbleStyle from '../services/BubbleStyle.js';
import BubbleTargetResolver from '../services/BubbleTargetResolver.js';
import SpentBubbleManager from '../managers/SpentBubbleManager.js';
import Sprite_MessageBubble from '../sprites/Sprite_MessageBubble.js';

//region bubble pipeline
/**
 * Extends {@link #initMembers}.<br/>
 * Also raises the backdrop a floating message is drawn on.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.set('initMembers', Window_Message.prototype.initMembers);
Window_Message.prototype.initMembers = function()
{
  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.get('initMembers')
    .call(this);

  this.initMessageBubbleMembers();
};

/**
 * Initializes the members this plugin adds to the message window.
 */
Window_Message.prototype.initMessageBubbleMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with floating messages.
   */
  this._j._bubbles ||= {};

  /**
   * The character this message is currently floating above, if any.
   * @type {?(Game_Character|BubbleAnchor)}
   */
  this._j._bubbles._target = null;

  /**
   * The target the current message named, verbatim.
   *
   * Kept alongside the resolved character rather than derived from it, because it is the stable
   * identity of a speaker: `a1` is the player while Jerald leads and a follower after a reorder,
   * and a conversation keyed on the character would give one actor a bubble per marching position.
   * @type {string}
   */
  this._j._bubbles._token = String.empty;

  /**
   * How much room the current message's text needs, measured before it began revealing.
   * @type {BubbleBounds}
   */
  this._j._bubbles._content = BubbleBounds.empty();

  /**
   * Everything the current message would need in order to be redrawn without this window.
   *
   * Assembled while the message is still live, because almost none of it survives the message
   * ending - `terminateMessage` clears `$gameMessage`, which takes the speaker's name, the
   * background and the target with it.
   * @type {?object}
   */
  this._j._bubbles._entry = null;

  /**
   * The rectangle this window occupies when it is not floating anywhere.
   *
   * Captured rather than recomputed, because a floating message resizes the window to fit its own
   * text and the next ordinary message has to find it the size the scene built it.
   * @type {Rectangle}
   */
  this._j._bubbles._restingRect = new Rectangle(this.x, this.y, this.width, this.height);

  /**
   * The backdrop a floating message is drawn on.
   * @type {Sprite_MessageBubble}
   */
  this._j._bubbles._sprite = new Sprite_MessageBubble();

  // behind everything else the window owns, so the glyphs in the client area draw on top of it.
  this.addChildAt(this._j._bubbles._sprite, 0);
};

/**
 * The character this message is currently floating above.
 * @returns {?(Game_Character|BubbleAnchor)} The target, or null when this message is not floating.
 */
Window_Message.prototype.bubbleTarget = function()
{
  return this._j._bubbles._target;
};

/**
 * Sets the character this message is floating above.
 * @param {?(Game_Character|BubbleAnchor)} target The target, or null to stop floating.
 */
Window_Message.prototype.setBubbleTarget = function(target)
{
  this._j._bubbles._target = target;
};

/**
 * The target the current message named, verbatim.
 * @returns {string}
 */
Window_Message.prototype.bubbleToken = function()
{
  return this._j._bubbles._token;
};

/**
 * Sets the target the current message named.
 * @param {string} token The target, verbatim.
 */
Window_Message.prototype.setBubbleToken = function(token)
{
  this._j._bubbles._token = token;
};

/**
 * Everything the current message would need in order to be redrawn without this window.
 * @returns {?object}
 */
Window_Message.prototype.bubbleEntry = function()
{
  return this._j._bubbles._entry;
};

/**
 * Sets everything the current message would need in order to be redrawn without this window.
 * @param {?object} entry The retained message, or null when there is nothing to retain.
 */
Window_Message.prototype.setBubbleEntry = function(entry)
{
  this._j._bubbles._entry = entry;
};

/**
 * How much room the current message's text needs.
 * @returns {BubbleBounds}
 */
Window_Message.prototype.bubbleContent = function()
{
  return this._j._bubbles._content;
};

/**
 * Sets how much room the current message's text needs.
 * @param {BubbleBounds} content The measured text.
 */
Window_Message.prototype.setBubbleContent = function(content)
{
  this._j._bubbles._content = content;
};

/**
 * The rectangle this window occupies when it is not floating anywhere.
 * @returns {Rectangle}
 */
Window_Message.prototype.bubbleRestingRect = function()
{
  return this._j._bubbles._restingRect;
};

/**
 * The backdrop a floating message is drawn on.
 * @returns {Sprite_MessageBubble}
 */
Window_Message.prototype.bubbleSprite = function()
{
  return this._j._bubbles._sprite;
};

/**
 * Whether the current message is floating above somebody rather than sitting in its usual box.
 * @returns {boolean}
 */
Window_Message.prototype.isFloatingMessage = function()
{
  return this.bubbleTarget() !== null;
};

/**
 * The Position value meaning a bubble should hang under its speaker rather than over them.
 * @type {number}
 */
Window_Message.BubbleBelowPosition = 2;

/**
 * Whether this message asked to hang under its speaker.
 *
 * The Show Text command's Position dropdown, reused. It has always been there and has never meant
 * anything to a floating message, which makes it the one place an author can already say "put this
 * one on the other side" - and two characters talking need exactly that, or both their bubbles land
 * at the same height and sit on top of each other.
 * @returns {boolean}
 */
Window_Message.prototype.bubblePrefersBelow = function()
{
  return $gameMessage.positionType() === Window_Message.BubbleBelowPosition;
};

/**
 * Extends {@link #startMessage}.<br/>
 * Also works out whether this message floats, and sizes it to its own text if it does.
 *
 * Split either side of the original on purpose. The target has to be known *before*, because the
 * original decides the window's backdrop on the way through and that decision depends on it; the
 * measuring has to happen *after*, because it needs the speaker's profile and the page setup the
 * original performs.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.set('startMessage', Window_Message.prototype.startMessage);
Window_Message.prototype.startMessage = function()
{
  this.resolveBubbleTarget();

  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.get('startMessage')
    .call(this);

  this.refreshMessageBubble();
};

/**
 * Identifies whoever this message should float above, if anybody.
 */
Window_Message.prototype.resolveBubbleTarget = function()
{
  const requested = $gameMessage.bubbleTarget();
  const hostEventId = $gameMessage.bubbleHostEventId();

  const target = BubbleTargetResolver.resolve(requested, hostEventId);
  this.setBubbleTarget(target);
  this.setBubbleToken(requested);
  this.setBubbleEntry(null);

  // a speaker who is about to say something else does not also need their last line hanging in the
  // same place. Released here rather than when the new message ends, or the two would overlap for
  // the whole of it.
  SpentBubbleManager.release(requested);
};

/**
 * Sizes the window to the message it is about to reveal, and draws the bubble around it.
 */
Window_Message.prototype.refreshMessageBubble = function()
{
  const sprite = this.bubbleSprite();

  if (this.isFloatingMessage() === false)
  {
    sprite.visible = false;
    this.restoreRestingRect();

    return;
  }

  // the Background dropdown the author already filled in decides how this looks: a window, a hush,
  // or nothing behind the words at all.
  const style = BubbleStyle.forBackground($gameMessage.background());
  sprite.visible = style.drawn;
  sprite.setFillColor(style.fillColor);
  sprite.setFillAlpha(style.fillAlpha);
  sprite.setBorderColor(style.borderColor);
  sprite.flagBordered(style.bordered);
  sprite.setLegendColor(style.legendColor);

  // the plate is started by the original `startMessage` whether or not anybody wants it, so closing
  // it is a separate act from declining to give it a name.
  this.nameBoxWindow()
    .close();

  // measured ahead of the reveal, because glyphs are emitted a tick at a time and there are none of
  // them yet - the window has to be the right size before the first character appears in it.
  const glyphs = this.layoutMessageGlyphs($gameMessage.allText());
  const content = BubbleGeometry.contentBounds(glyphs);
  this.setBubbleContent(content);

  const speakerName = this.convertEscapeCharacters($gameMessage.speakerName());
  sprite.setSpeakerName(speakerName);

  // assembled now rather than at the end, because almost none of this survives the message ending:
  // terminating one clears `$gameMessage`, which takes the name, the background and the target with
  // it. What is kept is entirely values, so it outlives this window being torn down and rebuilt.
  this.setBubbleEntry({
    hostEventId: $gameMessage.bubbleHostEventId(),
    glyphs,
    content,
    speakerName,
    style,
    padding: this.padding,
    preferBelow: this.bubblePrefersBelow(),
    frame: 0,
  });

  this.updateMessageBubble();
};

/**
 * Puts the window back the size and shape the scene built it.
 */
Window_Message.prototype.restoreRestingRect = function()
{
  const resting = this.bubbleRestingRect();

  // nothing to do for the overwhelming majority of messages, which never moved it in the first place.
  if (this.width === resting.width && this.height === resting.height) return;

  this.move(resting.x, resting.y, resting.width, resting.height);
  this.createContents();
};

/**
 * Places the floating window over its target and redraws the bubble around it.
 *
 * Run every frame rather than once, because the target walks. `updatePlacement` fires exactly once
 * per message, from `startMessage`, so a bubble positioned only from there would be left behind the
 * moment its owner took a step.
 */
Window_Message.prototype.updateMessageBubble = function()
{
  const target = this.bubbleTarget();
  const content = this.bubbleContent();

  const preferBelow = this.bubblePrefersBelow();
  const anchorX = target.screenX();

  // the side is asked for first, because which end of a character a bubble aims at depends on it.
  const anchorY = target.bubbleAnchorY(preferBelow);

  // the same solve a spent bubble uses, so a live message and the line before it sit identically.
  const solved = BubbleLayout.solve(
    content,
    this.padding,
    anchorX,
    anchorY,
    Graphics.boxWidth,
    Graphics.boxHeight,
    preferBelow);

  this.resizeMessageBubble(solved.x, solved.y, solved.width, solved.height);

  this.bubbleSprite()
    .refresh(solved.bounds, solved.tail);
};

/**
 * Moves the window, rebuilding its contents only when it actually changed size.
 *
 * The distinction matters every frame: a walking speaker moves the bubble constantly while its size
 * holds still, and `createContents` allocates a bitmap.
 * @param {number} x Where the window's left edge goes.
 * @param {number} y Where the window's top edge goes.
 * @param {number} width How wide the window should be.
 * @param {number} height How tall the window should be.
 */
Window_Message.prototype.resizeMessageBubble = function(x, y, width, height)
{
  const isSameSize = this.width === width && this.height === height;

  this.move(x, y, width, height);

  if (isSameSize === true) return;

  this.createContents();
};

/**
 * The plate the engine draws a speaker's name on.
 * @returns {Window_NameBox}
 */
Window_Message.prototype.nameBoxWindow = function()
{
  return this._nameBoxWindow;
};

/**
 * Extends {@link #updateSpeakerName}.<br/>
 * Also keeps the engine's name plate out of the way of the bubble's own legend.
 *
 * A floating message already says who is speaking, set into its own border. The plate would be the
 * same name a second time, in a rectangle, parked wherever the bubble happens to have floated to -
 * which is the exact thing the legend exists to replace.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.set('updateSpeakerName', Window_Message.prototype.updateSpeakerName);
Window_Message.prototype.updateSpeakerName = function()
{
  if (this.isFloatingMessage() === true)
  {
    this.nameBoxWindow()
      .setName(String.empty);

    return;
  }

  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.get('updateSpeakerName')
    .call(this);
};

/**
 * Extends {@link #update}.<br/>
 * Also keeps a floating message over the character it belongs to.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.set('update', Window_Message.prototype.update);
Window_Message.prototype.update = function()
{
  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.get('update')
    .call(this);

  // a closed window has nothing to follow anybody with, and a message that is not floating is
  // exactly where the engine put it.
  if (this.isFloatingMessage() === false) return;

  this.updateMessageBubble();
};

/**
 * Extends {@link #updateBackground}.<br/>
 * Also takes the windowskin away from a floating message, and gives it back to one that is not.
 *
 * Both directions on every call, deliberately. This runs once per message, so an alias that only
 * turned the chrome off would leave the next ordinary message in the game with no frame and no
 * backdrop at all.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.set('updateBackground', Window_Message.prototype.updateBackground);
Window_Message.prototype.updateBackground = function()
{
  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.get('updateBackground')
    .call(this);

  if (this.isFloatingMessage() === true)
  {
    // the engine's own switches rather than reaching in and zeroing opacities: type two is the
    // documented "no backdrop at all", and the frame is a public flag honoured every frame.
    this.setBackgroundType(2);
    this.frameVisible = false;

    return;
  }

  this.frameVisible = true;
};

/**
 * Extends {@link #terminateMessage}.<br/>
 * Also puts the window back where an ordinary message expects to find it.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.set('terminateMessage', Window_Message.prototype.terminateMessage);
Window_Message.prototype.terminateMessage = function()
{
  // retained before the original, which clears `$gameMessage` out from under everything this reads.
  this.retainMessageBubble();

  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Window_Message.get('terminateMessage')
    .call(this);

  this.setBubbleTarget(null);
  this.setBubbleToken(String.empty);
  this.setBubbleEntry(null);

  this.bubbleSprite().visible = false;

  this.restoreRestingRect();
};

/**
 * Leaves this message's bubble behind for the rest of the conversation.
 *
 * Caught at whatever frame the message was on when it closed, so the letters freeze where they were
 * rather than snapping back to rest - a word that was mid-wave stays mid-wave, which reads as
 * somebody having stopped talking rather than as the effect having been switched off.
 */
Window_Message.prototype.retainMessageBubble = function()
{
  // an ordinary bottom-box message leaves nothing behind; there was never a bubble to leave.
  if (this.isFloatingMessage() === false) return;

  const entry = this.bubbleEntry();
  entry.frame = this.messageGlyphLayer()
    .frame();

  SpentBubbleManager.retain(this.bubbleToken(), entry);
};
//endregion bubble pipeline
//endregion Window_Message