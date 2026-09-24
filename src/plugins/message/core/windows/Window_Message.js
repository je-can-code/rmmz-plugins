//region Window_Message
import MessageChain from '../services/MessageChain.js';
import MessageEffectSet from '../services/MessageEffectSet.js';
import MessageFade from '../services/MessageFade.js';
import MessageGlyph from '../__models/MessageGlyph.js';
import MessageGlyphRunSplitter from '../services/MessageGlyphRunSplitter.js';
import MessageGlyphStyle from '../__models/MessageGlyphStyle.js';
import MessagePacing from '../services/MessagePacing.js';
import MessageProfileResolver from '../services/MessageProfileResolver.js';
import MessageSpeakerProfile from '../__models/MessageSpeakerProfile.js';
import MessageVoiceSelector from '../services/MessageVoiceSelector.js';
import Sprite_MessageGlyphLayer from '../sprites/Sprite_MessageGlyphLayer.js';

//region glyph pipeline
/**
 * The lowest character code that is a character rather than a command.
 *
 * The engine draws anything at or above this and interprets anything below it, so it is also the
 * line between something a speaker says out loud and something an author typed at the engine.
 * @type {number}
 */
const FIRST_PRINTABLE_CHAR_CODE = 0x20;

/**
 * The gap the engine leaves after an inline icon, in pixels.
 * @type {number}
 */
const ICON_TRAILING_GAP = 4;

/**
 * Extends {@link #initMembers}.<br/>
 * Also raises the plane that message glyphs are drawn on.
 */
J.MESSAGE.Aliased.Window_Message.set('initMembers', Window_Message.prototype.initMembers);
Window_Message.prototype.initMembers = function()
{
  // perform original logic.
  J.MESSAGE.Aliased.Window_Message.get('initMembers')
    .call(this);

  this.initMessageGlyphMembers();
};

/**
 * Initializes the members this plugin adds to the message window.
 *
 * This runs from `initMembers` rather than from the constructor body because the window's client
 * area has to exist before anything can be parented into it, and `Window_Base.initialize` builds
 * that on the way through to here.
 */
Window_Message.prototype.initMessageGlyphMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the message system.
   */
  this._j._message ||= {};

  /**
   * The profile of whoever is speaking the current message.
   * @type {MessageSpeakerProfile}
   */
  this._j._message._profile = MessageSpeakerProfile.default();

  /**
   * The plane this window's glyphs are drawn on.
   * @type {Sprite_MessageGlyphLayer}
   */
  this._j._message._glyphLayer = new Sprite_MessageGlyphLayer();

  /**
   * How many frames this window has been fading out for, or -1 when it is not.
   * @type {number}
   */
  this._j._message._fadeElapsed = Window_Message.NotFading;

  /**
   * How many frames this window's fade runs for in total.
   *
   * Captured when the fade begins rather than asked for each frame, so a config reloaded mid-fade
   * cannot change the length of one already running.
   * @type {number}
   */
  this._j._message._fadeFrames = 0;

  /**
   * The rectangle the scene built this window at.
   *
   * Captured rather than recomputed, because a message that welds several Show Text commands
   * together grows the window to hold all of them, and the ordinary message after it has to find
   * the window at the size the project laid out.
   * @type {Rectangle}
   */
  this._j._message._defaultRect = new Rectangle(this.x, this.y, this.width, this.height);

  // parenting into the client area rather than the window buys the padding, the scroll origin,
  // the open/close visibility and the draw order above contents, all of it already correct.
  this.addInnerChild(this._j._message._glyphLayer);
};

/**
 * The plane this window's glyphs are drawn on.
 * @returns {Sprite_MessageGlyphLayer}
 */
Window_Message.prototype.messageGlyphLayer = function()
{
  return this._j._message._glyphLayer;
};

/**
 * The rectangle the scene built this window at.
 * @returns {Rectangle}
 */
Window_Message.prototype.defaultMessageRect = function()
{
  return this._j._message._defaultRect;
};

/**
 * The rectangle this window should occupy for the message it is about to reveal.
 *
 * Everything but the height is the scene's answer passed straight back. A message is only ever
 * allowed to grow downward, because how wide the box is and where it sits are the project's layout
 * - not something any one line of dialogue gets an opinion about.
 * @returns {Rectangle}
 */
Window_Message.prototype.messageRestingRect = function()
{
  const rect = this.defaultMessageRect();
  const height = this.messageRestingHeight();

  return new Rectangle(rect.x, rect.y, rect.width, height);
};

/**
 * How tall this window has to be to hold the message it is about to reveal.
 *
 * Deliberately not clamped to the screen. The ceiling is enforced where the decision to weld another
 * Show Text onto this one is made, which is the only place that can stop before crossing it rather
 * than trimming afterward - and the editor gives a single Show Text four lines, so a message that
 * never welded cannot outgrow the box on its own.
 * @returns {number}
 */
Window_Message.prototype.messageRestingHeight = function()
{
  const rect = this.defaultMessageRect();
  const lineHeight = this.lineHeight();

  const defaultRows = MessageChain.rowsFor(rect.height, lineHeight, this.padding);
  const rows = $gameMessage.texts().length;

  return MessageChain.heightFor(rows, rect.height, defaultRows, lineHeight);
};

/**
 * Puts this window at the size the message it is showing calls for.
 *
 * Named for restoring rather than resizing because that is what it does the overwhelming majority of
 * the time: the message before this one grew the box, or floated it somewhere, and this is the box
 * coming home. A message long enough to need more room is the rare case, not the ordinary one.
 */
Window_Message.prototype.restoreMessageRect = function()
{
  const resting = this.messageRestingRect();

  // nothing to do at all for a message the same shape as the one before it, which is most of them.
  if (this.width === resting.width && this.height === resting.height) return;

  this.move(resting.x, resting.y, resting.width, resting.height);
  this.createContents();
};

/**
 * The profile of whoever is speaking the current message.
 * @returns {MessageSpeakerProfile}
 */
Window_Message.prototype.messageProfile = function()
{
  return this._j._message._profile;
};

/**
 * Sets the profile of whoever is speaking the current message.
 * @param {MessageSpeakerProfile} profile The speaker's profile.
 */
Window_Message.prototype.setMessageProfile = function(profile)
{
  this._j._message._profile = profile;
};

/**
 * Adds frames to however long this window is already waiting.
 *
 * Deliberately additive. The engine's own {@link Window_Message.startWait} assigns, and the author's
 * `\.` and `\|` write to the very same counter - so pacing that assigned would silently swallow a
 * beat somebody wrote on purpose, and would do it only when the two happened to land on the same
 * frame, which is the worst possible way to find out.
 * @param {number} frames How many frames to add.
 */
Window_Message.prototype.addMessageWait = function(frames)
{
  const waiting = this.waitCount();

  this.setWaitCount(waiting + frames);
};

/**
 * How many frames this window is still waiting before it reveals anything more.
 * @returns {number}
 */
Window_Message.prototype.waitCount = function()
{
  return this._waitCount;
};

/**
 * Sets how many frames this window waits before it reveals anything more.
 * @param {number} frames The frames remaining.
 */
Window_Message.prototype.setWaitCount = function(frames)
{
  this._waitCount = frames;
};

/**
 * Whether this window is currently racing to the end of the page.
 *
 * True while the player holds the confirm button, and while a line has been marked to show fast.
 * Both mean the same thing for anything that happens per character: it is about to happen for the
 * whole page within a single frame.
 * @returns {boolean}
 */
Window_Message.prototype.isRushingMessage = function()
{
  return this.showFast() === true || this.lineShowFast() === true;
};

/**
 * Whether the player is currently holding the message forward.
 * @returns {boolean}
 */
Window_Message.prototype.showFast = function()
{
  return this._showFast;
};

/**
 * Whether the current line has been marked to reveal without pausing.
 * @returns {boolean}
 */
Window_Message.prototype.lineShowFast = function()
{
  return this._lineShowFast;
};

/**
 * The text state of the message currently being revealed, if there is one.
 * @returns {?RPG_TextState}
 */
Window_Message.prototype.textState = function()
{
  return this._textState;
};

/**
 * Whether a text state belongs to the message this window is currently revealing.
 *
 * `Window_Message` inherits `drawTextEx` and `textSizeEx` from its base, and both run the whole text
 * pipeline on a state of their own. Those are ordinary drawing and measuring operations that happen
 * to be performed on this window, and they must keep landing in `contents` the way they always have
 * - only the message being read aloud becomes glyphs.
 * @param {RPG_TextState} textState The text state in question.
 * @returns {boolean}
 */
Window_Message.prototype.isRevealingTextState = function(textState)
{
  return textState === this.textState();
};

/**
 * Extends {@link #startMessage}.<br/>
 * Also works out who is speaking and how much room they need, before anything is built that needs
 * to know either.
 */
J.MESSAGE.Aliased.Window_Message.set('startMessage', Window_Message.prototype.startMessage);
Window_Message.prototype.startMessage = function()
{
  // resolved first rather than last, because the original builds the text state and pages it in
  // on the way through - and the page is where a speaker's baseline effects are applied.
  this.resolveMessageProfile();

  // sized before the original for a plainer reason: the original is what puts the window on screen,
  // and where it lands is worked out from how tall it is.
  this.restoreMessageRect();

  // perform original logic.
  J.MESSAGE.Aliased.Window_Message.get('startMessage')
    .call(this);
};

/**
 * Identifies the speaker of the current message and adopts their profile.
 */
Window_Message.prototype.resolveMessageProfile = function()
{
  const speakerName = $gameMessage.speakerName();
  const faceName = $gameMessage.faceName();
  const faceIndex = $gameMessage.faceIndex();

  const profile = MessageProfileResolver.resolve(speakerName, faceName, faceIndex);
  this.setMessageProfile(profile);
};

/**
 * Extends {@link #createTextState}.<br/>
 * Also seeds the effect and glyph bookkeeping this plugin reads while revealing.
 *
 * Deliberately blind to who is speaking. This is a `Window_Base` method, so `drawTextEx` and
 * `textSizeEx` reach it on this very window - seeding a speaker's baseline here would leak the
 * current message's identity into drawing that has nothing to do with the message.
 * @param {string} text The text to reveal.
 * @param {number} x The x coordinate to begin at.
 * @param {number} y The y coordinate to begin at.
 * @param {number} width The width available.
 * @returns {RPG_TextState}
 */
J.MESSAGE.Aliased.Window_Message.set('createTextState', Window_Base.prototype.createTextState);
Window_Message.prototype.createTextState = function(text, x, y, width)
{
  // perform original logic.
  const textState = J.MESSAGE.Aliased.Window_Message.get('createTextState')
    .call(this, text, x, y, width);

  /**
   * The effects the author has opened with a text code and not yet closed.
   * @type {Set<string>}
   */
  textState.spanEffects = new Set();

  /**
   * How many glyphs have been emitted so far, counted across runs and lines.
   * @type {number}
   */
  textState.glyphIndex = 0;

  /**
   * Where this state's glyphs go instead of onto the window's plane, if anywhere.
   *
   * Null for the message actually being read, which emits onto the plane the player is looking at.
   * An array for a measuring pass, which wants the same glyphs handed back rather than displayed.
   * @type {?MessageGlyph[]}
   */
  textState.glyphSink = null;

  return textState;
};

/**
 * Builds a message's glyphs without showing any of them.
 *
 * The reason this exists: glyphs are emitted *as the text reveals*, a tick at a time, so on the frame
 * a message opens there are none of them yet. Anything that needs to know how much room the message
 * will occupy - a bubble sized to its own text, most obviously - is asking that question at the one
 * moment the answer does not exist. This runs the entire pipeline ahead of time and collects what it
 * produces, so the question has an answer before the first character appears.
 *
 * It is the whole pipeline on purpose rather than a cheaper estimate. Line breaking, face offsets,
 * every escape code, font size changes mid-line and the database substitution codes all move glyphs
 * around, and a measurement that reimplemented any of that would agree with the real thing right up
 * until it did not.
 * @param {string} text The message text, exactly as it will be revealed.
 * @returns {MessageGlyph[]} Every glyph the message will produce, positioned.
 */
Window_Message.prototype.layoutMessageGlyphs = function(text)
{
  // the timing codes write to the window rather than to the text state - `\.` and `\|` add frames,
  // `\!` sets the window waiting on the player - and a measuring pass that left those behind would
  // hand the real message a pause it never asked for.
  const heldWaitCount = this.waitCount();
  const heldPause = this.pause;

  const textState = this.buildMessageLayoutState(text);
  this.processAllText(textState);

  this.setWaitCount(heldWaitCount);
  this.pause = heldPause;

  return textState.glyphSink;
};

/**
 * Prepares a text state for measuring, set up exactly as the real one will be.
 *
 * Mirrors what `startMessage` and `newPage` do between them, because anything they do that moves a
 * glyph has to have happened before the glyphs are counted: the face pushes the first line right,
 * and the font settings decide how wide every character measures.
 * @param {string} text The message text, exactly as it will be revealed.
 * @returns {RPG_TextState}
 */
Window_Message.prototype.buildMessageLayoutState = function(text)
{
  const textState = this.createTextState(text, 0, 0, this.innerWidth);

  // the face image, if there is one, is what decides where the first line starts.
  textState.x = this.newLineX(textState);
  textState.startX = textState.x;
  textState.y = 0;

  // collecting rather than displaying is the whole difference between this pass and the real one.
  textState.glyphSink = [];

  // whatever the last message left the font as is not what this one will be measured at.
  this.resetFontSettings();
  textState.height = this.calcTextHeight(textState);

  return textState;
};

/**
 * Whether a text state should produce glyphs rather than pixels.
 *
 * Two kinds qualify: the message being read aloud, and a measuring pass that has somewhere to put
 * what it builds. Everything else on this window - `drawTextEx` from a subclass, `textSizeEx` from
 * the engine - is ordinary drawing and keeps landing in `contents` exactly as it always has.
 * @param {RPG_TextState} textState The text state in question.
 * @returns {boolean}
 */
Window_Message.prototype.isEmittingGlyphs = function(textState)
{
  if (this.isRevealingTextState(textState) === true) return true;

  return textState.glyphSink !== null;
};

/**
 * Files one glyph wherever the state it came from wants its glyphs.
 * @param {MessageGlyph} glyph The glyph to file.
 * @param {RPG_TextState} textState The text state that produced it.
 */
Window_Message.prototype.addMessageGlyph = function(glyph, textState)
{
  if (textState.glyphSink !== null)
  {
    textState.glyphSink.push(glyph);

    return;
  }

  this.messageGlyphLayer()
    .addGlyph(glyph);
};

/**
 * Extends {@link #newPage}.<br/>
 * Also empties the glyph plane and closes any emphasis left open on the page before.
 */
J.MESSAGE.Aliased.Window_Message.set('newPage', Window_Message.prototype.newPage);
Window_Message.prototype.newPage = function(textState)
{
  // perform original logic.
  J.MESSAGE.Aliased.Window_Message.get('newPage')
    .call(this, textState);

  this.messageGlyphLayer()
    .clearGlyphs();

  // an emphasis the author opened and never closed ends with the page whether they said so or not.
  // the speaker's own baseline is not held here and is therefore untouched by this, which is what
  // keeps a character who always waves waving on page two.
  textState.spanEffects.clear();
};

/**
 * The elapsed value meaning this window is not fading out.
 * @type {number}
 */
Window_Message.NotFading = -1;

/**
 * Extends {@link #terminateMessage}.<br/>
 * Also begins fading the finished message out rather than letting it blink away.
 */
J.MESSAGE.Aliased.Window_Message.set('terminateMessage', Window_Message.prototype.terminateMessage);
Window_Message.prototype.terminateMessage = function()
{
  // perform original logic.
  J.MESSAGE.Aliased.Window_Message.get('terminateMessage')
    .call(this);

  this.beginMessageFade();
};

/**
 * How many frames this window has been fading out for.
 * @returns {number}
 */
Window_Message.prototype.fadeElapsed = function()
{
  return this._j._message._fadeElapsed;
};

/**
 * Sets how many frames this window has been fading out for.
 * @param {number} elapsed The frames elapsed, or {@link Window_Message.NotFading}.
 */
Window_Message.prototype.setFadeElapsed = function(elapsed)
{
  this._j._message._fadeElapsed = elapsed;
};

/**
 * How many frames this window's fade runs for in total.
 * @returns {number}
 */
Window_Message.prototype.fadeFrames = function()
{
  return this._j._message._fadeFrames;
};

/**
 * Sets how many frames this window's fade runs for in total.
 * @param {number} frames The length of the fade.
 */
Window_Message.prototype.setFadeFrames = function(frames)
{
  this._j._message._fadeFrames = frames;
};

/**
 * Whether this window is currently fading out.
 * @returns {boolean}
 */
Window_Message.prototype.isFadingMessage = function()
{
  return this.fadeElapsed() !== Window_Message.NotFading;
};

/**
 * Starts fading the finished message out.
 *
 * The original `terminateMessage` has just called `close()`, which begins the engine's own vertical
 * collapse - and the first frame of that collapse hides the window's client area, taking every
 * letter with it. So the collapse is undone here and replaced with a fade: the window is held fully
 * open and made progressively transparent instead, which is the only way the text is still on screen
 * to leave with it.
 *
 * A window that was never opened declines the fade, because it has nothing on screen to fade. A Show
 * Choices, Input Number or Select Item written without a Show Text above it starts with this window
 * still shut, and still ends by terminating it - so fading from there would throw the empty box fully
 * open for the whole length of the fade just to dissolve it again.
 */
Window_Message.prototype.beginMessageFade = function()
{
  // the original's `close()` only raises a flag, so the openness here is still what the player saw.
  if (this.isClosed() === true)
  {
    this.finishMessageFade();

    return;
  }

  const frames = MessageFade.frames();

  this.setFadeFrames(frames);
  this.setFadeElapsed(0);

  // a project that has configured the fade away asked for the message to be gone, and it is.
  if (frames <= 0)
  {
    this.finishMessageFade();

    return;
  }

  // `open()` rather than reaching for the closing flag directly: it is the engine's own way of
  // saying "not closing", and the openness is already where it needs to be.
  this.openness = 255;
  this.open();
};

/**
 * Advances the fade by one frame, ending it when it has run its course.
 */
Window_Message.prototype.updateMessageFade = function()
{
  if (this.isFadingMessage() === false) return;

  const frames = this.fadeFrames();
  const elapsed = this.fadeElapsed() + 1;

  this.setFadeElapsed(elapsed);
  this.setMessageAlpha(MessageFade.alphaAt(elapsed, frames));

  if (MessageFade.isFinished(elapsed, frames) === false) return;

  this.finishMessageFade();
};

/**
 * Takes the faded message off the screen.
 */
Window_Message.prototype.finishMessageFade = function()
{
  this.setFadeElapsed(Window_Message.NotFading);
  this.setMessageAlpha(1);

  this.openness = 0;

  this.messageGlyphLayer()
    .clearGlyphs();
};

/**
 * Abandons a fade because the next message has arrived.
 *
 * The openness is deliberately left alone. Vanilla keeps the box seamlessly open when the following
 * text is already queued, and zeroing it here would make every line of a conversation re-open with
 * a little squeeze that the engine never had.
 */
Window_Message.prototype.cancelMessageFade = function()
{
  this.setFadeElapsed(Window_Message.NotFading);
  this.setMessageAlpha(1);
};

/**
 * Sets how opaque the whole message is, plate included.
 *
 * The name plate is a window of its own that merely copies this one's openness, so left out of the
 * fade it would sit at full brightness over a message dissolving underneath it and then snap away.
 * @param {number} alpha The opacity, from one down to zero.
 */
Window_Message.prototype.setMessageAlpha = function(alpha)
{
  this.alpha = alpha;

  this.nameBoxWindow().alpha = alpha;
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
 * Extends {@link #update}.<br/>
 * Also runs the fade, and abandons it the moment another message is waiting.
 *
 * The abandoning happens before the original on purpose. The original is what starts the next
 * message, and a fade still running when it does would take the new message's own letters down with
 * it.
 */
J.MESSAGE.Aliased.Window_Message.set('update', Window_Message.prototype.update);
Window_Message.prototype.update = function()
{
  if (this.isFadingMessage() === true && $gameMessage.isBusy() === true)
  {
    this.cancelMessageFade();
  }

  // perform original logic.
  J.MESSAGE.Aliased.Window_Message.get('update')
    .call(this);

  this.updateMessageFade();
};

/**
 * Extends {@link #processCharacter}.<br/>
 * Also gives the speaker their voice and their pace.
 *
 * Purely observational- the original's buffering is untouched. That matters: the engine accumulates
 * characters into a run and only draws when it reaches a command, and the glyph pipeline downstream
 * depends on receiving whole runs rather than single letters.
 * @param {RPG_TextState} textState The text state being revealed.
 */
J.MESSAGE.Aliased.Window_Message.set('processCharacter', Window_Message.prototype.processCharacter);
Window_Message.prototype.processCharacter = function(textState)
{
  this.speakMessageCharacter(textState);

  // perform original logic.
  J.MESSAGE.Aliased.Window_Message.get('processCharacter')
    .call(this, textState);
};

/**
 * Sounds and paces the character that is about to be revealed.
 * @param {RPG_TextState} textState The text state being revealed.
 */
Window_Message.prototype.speakMessageCharacter = function(textState)
{
  // drawing and measuring are not speech.
  if (this.isRevealingTextState(textState) === false) return;

  // a player holding confirm has asked for the whole page *now*, and both halves of a speaker's
  // delivery have to respect that. Pacing especially: the engine skips ahead by not breaking out of
  // its reveal loop, and it only stays in that loop while nothing is waiting - so a per-character
  // wait added here keeps the page crawling through a skip that has visibly already happened.
  if (this.isRushingMessage() === true) return;

  // read rather than consumed; the original is what advances the index.
  const character = textState.text[ textState.index ];

  // a command is something the author typed at the engine, not something the speaker says.
  if (character.charCodeAt(0) < FIRST_PRINTABLE_CHAR_CODE) return;

  const profile = this.messageProfile();

  this.playMessageVoice(textState, character, profile);

  const extraFrames = MessagePacing.extraFramesFor(character, profile);
  this.addMessageWait(extraFrames);
};

/**
 * Plays the speaker's voice for one character, if this is a character they voice.
 * @param {RPG_TextState} textState The text state being revealed.
 * @param {string} character The character about to be revealed.
 * @param {MessageSpeakerProfile} profile The speaker's profile.
 */
Window_Message.prototype.playMessageVoice = function(textState, character, profile)
{
  const voice = MessageVoiceSelector.selectFor(textState.glyphIndex, character, profile);
  if (voice === null) return;

  AudioManager.playSe(voice);
};

/**
 * Overwrites {@link #flushTextState}.<br/>
 * Emits the buffered run as individually addressable glyphs instead of drawing it.
 *
 * The original is still reached for anything that is not the message being revealed, which is what
 * keeps `drawTextEx` on this window behaving exactly as it does everywhere else.
 * @param {RPG_TextState} textState The text state being flushed.
 */
J.MESSAGE.Aliased.Window_Message.set('flushTextState', Window_Base.prototype.flushTextState);
Window_Message.prototype.flushTextState = function(textState)
{
  if (this.isEmittingGlyphs(textState) === false)
  {
    // perform original logic.
    J.MESSAGE.Aliased.Window_Message.get('flushTextState')
      .call(this, textState);
    return;
  }

  this.flushTextStateAsGlyphs(textState);
};

/**
 * Performs the original flush's bookkeeping, emitting glyphs where it would have drawn.
 *
 * The cursor arithmetic below is the original's, reproduced rather than delegated to. Handing the
 * original a state with `drawing` switched off would skip the draw, but it also performs the
 * `outputWidth` and `outputHeight` accounting that a floating message window needs in order to size
 * itself - so the draw is what gets replaced, and the accounting is what gets kept.
 * @param {RPG_TextState} textState The text state being flushed.
 */
Window_Message.prototype.flushTextStateAsGlyphs = function(textState)
{
  const {
    buffer: run,
    rtl,
    height,
    y
  } = textState;
  const width = this.textWidth(run);

  // the cursor is read here and advanced at the end, so the run's left edge has to be captured
  // before anything moves it - and in a right-to-left message that edge is the far side.
  const x = rtl
    ? textState.x - width
    : textState.x;

  // a flush with nothing buffered is routine rather than exceptional: the engine flushes at every
  // command, so two commands in a row flush an empty run between them.
  if (textState.drawing === true && run.length > 0)
  {
    this.emitMessageGlyphRun(run, x, y, textState);
  }

  textState.x += rtl
    ? -width
    : width;
  textState.buffer = this.createTextBuffer(rtl);

  const outputWidth = Math.abs(textState.x - textState.startX);
  if (textState.outputWidth < outputWidth)
  {
    textState.outputWidth = outputWidth;
  }

  textState.outputHeight = y - textState.startY + height;
};

/**
 * Turns one buffered run into glyphs on the plane.
 * @param {string} run The buffered run of characters.
 * @param {number} x Where the run begins horizontally.
 * @param {number} y Where the run begins vertically.
 * @param {RPG_TextState} textState The text state being flushed.
 */
Window_Message.prototype.emitMessageGlyphRun = function(run, x, y, textState)
{
  const style = this.buildMessageGlyphStyle(textState);
  const origin = {
    x: x,
    y: y,
    index: textState.glyphIndex,
  };
  const measure = text => this.textWidth(text);

  const glyphs = MessageGlyphRunSplitter.split(run, origin, style, measure);

  glyphs.forEach(glyph => this.addMessageGlyph(glyph, textState));

  textState.glyphIndex += glyphs.length;
};

/**
 * Snapshots everything a glyph needs to know about how it should look.
 * @param {RPG_TextState} textState The text state being flushed.
 * @returns {MessageGlyphStyle}
 */
Window_Message.prototype.buildMessageGlyphStyle = function(textState)
{
  const profile = this.messageProfile();
  const effects = MessageEffectSet.resolve(profile.baselineEffects, textState.spanEffects);

  return MessageGlyphStyle.fromContents(this.contents, textState.height, effects);
};

/**
 * Overwrites {@link #processDrawIcon}.<br/>
 * Emits an inline icon as a glyph instead of blitting it into the contents.
 *
 * An icon left behind in `contents` while the letters beside it became sprites would hold perfectly
 * still inside a word that waves - and J-Message's own database codes all expand to an icon
 * followed by a coloured name, so that pairing is the common case rather than a corner one.
 * @param {number} iconIndex The icon to draw.
 * @param {RPG_TextState} textState The text state being revealed.
 */
J.MESSAGE.Aliased.Window_Message.set('processDrawIcon', Window_Base.prototype.processDrawIcon);
Window_Message.prototype.processDrawIcon = function(iconIndex, textState)
{
  if (this.isEmittingGlyphs(textState) === false)
  {
    // perform original logic.
    J.MESSAGE.Aliased.Window_Message.get('processDrawIcon')
      .call(this, iconIndex, textState);
    return;
  }

  this.emitMessageIconGlyph(iconIndex, textState);
};

/**
 * Emits one inline icon as a glyph, and advances the cursor past it.
 * @param {number} iconIndex The icon to draw.
 * @param {RPG_TextState} textState The text state being revealed.
 */
Window_Message.prototype.emitMessageIconGlyph = function(iconIndex, textState)
{
  // the engine centres an icon within the larger box it reserves for one, and the glyph has to
  // land in the same place the blit would have.
  const deltaX = ImageManager.standardIconWidth - ImageManager.iconWidth;
  const deltaY = ImageManager.standardIconHeight - ImageManager.iconHeight;
  const advance = ImageManager.standardIconWidth + ICON_TRAILING_GAP;

  if (textState.drawing === true)
  {
    const x = textState.x + (deltaX / 2) + 2;
    const y = textState.y + (deltaY / 2) + 2;
    const style = this.buildMessageGlyphStyle(textState);
    const glyph = MessageGlyph.forIcon(iconIndex, x, y, advance, textState.glyphIndex, style);

    this.addMessageGlyph(glyph, textState);

    textState.glyphIndex += 1;
  }

  textState.x += advance;
};

/**
 * Extends {@link #obtainEscapeCode}.<br/>
 * Also recognizes the symbols that toggle a rendering effect.
 *
 * Extended here rather than by widening J-Base's own escape code pattern, because that pattern
 * serves every window in the game - a symbol recognized there but answered only here would be
 * silently swallowed out of any menu that happened to contain it.
 * @param {RPG_TextState} textState The text state being revealed.
 * @returns {string} The escape code found, or an empty string.
 */
J.MESSAGE.Aliased.Window_Message.set('obtainEscapeCode', Window_Base.prototype.obtainEscapeCode);
Window_Message.prototype.obtainEscapeCode = function(textState)
{
  // perform original logic.
  const code = J.MESSAGE.Aliased.Window_Message.get('obtainEscapeCode')
    .call(this, textState);

  if (code !== String.empty) return code;

  return this.obtainMessageEffectCode(textState);
};

/**
 * Reads one effect-toggling symbol off the text, if that is what comes next.
 * @param {RPG_TextState} textState The text state being revealed.
 * @returns {string} The symbol found, or an empty string.
 */
Window_Message.prototype.obtainMessageEffectCode = function(textState)
{
  const symbol = textState.text[ textState.index ];

  if (J.MESSAGE.EffectCodes.has(symbol) === false) return String.empty;

  // consumed, the same way the original consumes whatever it recognizes.
  textState.index += 1;

  return symbol;
};

/**
 * Extends {@link #processEscapeCharacter}.<br/>
 * Also toggles a rendering effect when the code is one of ours.
 *
 * The original is called first and unconditionally, because vanilla's own handler ends by
 * delegating to the base - and the base is where J-Base's bold and italics live. Shadowing it
 * without falling through would take `\*` and `\_` out of every message in the game.
 * @param {string} code The escape code being processed.
 * @param {RPG_TextState} textState The text state being revealed.
 */
J.MESSAGE.Aliased.Window_Message.set('processEscapeCharacter', Window_Message.prototype.processEscapeCharacter);
Window_Message.prototype.processEscapeCharacter = function(code, textState)
{
  // perform original logic.
  J.MESSAGE.Aliased.Window_Message.get('processEscapeCharacter')
    .call(this, code, textState);

  this.processMessageEffectCode(code, textState);
};

/**
 * Toggles the effect a code names, if it names one.
 * @param {string} code The escape code being processed.
 * @param {RPG_TextState} textState The text state being revealed.
 */
Window_Message.prototype.processMessageEffectCode = function(code, textState)
{
  const effect = J.MESSAGE.EffectCodes.get(code);

  // every other escape code in the game also arrives here; most of them are not ours.
  if (effect === undefined) return;

  MessageEffectSet.toggle(textState.spanEffects, effect);
};
//endregion glyph pipeline
//endregion Window_Message