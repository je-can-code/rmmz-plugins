//region Sprite_Character
import Escription from './../_models/Escription.js';

/**
 * The vertical distance between two stacked lines of escription text, in pixels.
 * Two more than the font size, which is the leading that stops descenders in one line from
 * touching the capitals in the next.
 * @type {number}
 */
const ESCRIPTION_LINE_HEIGHT = 16;

/**
 * The gap between the topmost line of escription text and an icon riding above it, in pixels.
 * @type {number}
 */
const ESCRIPTION_ICON_GAP = 32;

//region properties
/**
 * Hooks into the initmembers function to add our properties.
 */
J.ESCRIBE.Aliased.Sprite_Character.set('initMembers', Sprite_Character.prototype.initMembers);
Sprite_Character.prototype.initMembers = function()
{
  // perform original logic.
  J.ESCRIBE.Aliased.Sprite_Character.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with escriptions.
   */
  this._j._event = {
    /**
     * The sprites currently drawn for this character's escriptions, in the order the character
     * declared them. This holds sprites and nothing else- what each one *means* is read back off
     * the character every frame, so a page change can never leave this pointing at a stale model.
     * @type {(Sprite_BaseText|Sprite_Icon)[]}
     */
    _escriptionSprites: [],

    /**
     * The signature of the escriptions the sprites above were built from.
     *
     * This is the whole of the change detection. Comparing what the character says now against
     * what was built from replaces the flag-and-acknowledge handshake this plugin used to run
     * across two objects- a handshake that could desync, where a comparison cannot.
     * @type {string}
     */
    _escriptionKey: String.empty,
  };
};

/**
 * Gets the sprites currently drawn for this character's escriptions.
 * @returns {(Sprite_BaseText|Sprite_Icon)[]}
 */
Sprite_Character.prototype.escriptionSprites = function()
{
  return this._j._event._escriptionSprites;
};

/**
 * Sets the sprites currently drawn for this character's escriptions.
 * @param {(Sprite_BaseText|Sprite_Icon)[]} sprites The sprites now being drawn.
 */
Sprite_Character.prototype.setEscriptionSprites = function(sprites)
{
  this._j._event._escriptionSprites = sprites;
};

/**
 * Gets the signature of the escriptions the current sprites were built from.
 * @returns {string}
 */
Sprite_Character.prototype.escriptionKey = function()
{
  return this._j._event._escriptionKey;
};

/**
 * Sets the signature of the escriptions the current sprites were built from.
 * @param {string} key The signature just built from.
 */
Sprite_Character.prototype.setEscriptionKey = function(key)
{
  this._j._event._escriptionKey = key;
};
//endregion properties

//region helpers
/**
 * Gets the escriptions belonging to the character this sprite draws.
 * @returns {Escription[]} The escriptions; empty when there is nothing to draw.
 */
Sprite_Character.prototype.characterEscriptions = function()
{
  // grab the character.
  const character = this.character();

  // a sprite genuinely exists for a beat before the engine hands it a character.
  if (!character) return [];

  // you cannot escribe non-events.
  if (!character.isEvent()) return [];

  // whatever the character is currently saying.
  return character.escriptions();
};

/**
 * Whether the character this sprite draws currently describes anything.
 * @returns {boolean}
 */
Sprite_Character.prototype.hasCharacterEscriptions = function()
{
  return this.characterEscriptions().length > 0;
};

/**
 * Builds the signature of a collection of escriptions, for comparison against what was last built.
 * @param {Escription[]} escriptions The escriptions to summarize.
 * @returns {string}
 */
Sprite_Character.prototype.escriptionSignature = function(escriptions)
{
  return escriptions
    .map(escription => escription.key())
    .join('|');
};

/**
 * The height an escription floats above this sprite's feet, in pixels.<br/>
 * Every escription hangs off this one number so they never drift apart.
 *
 * The thirty-two is the gap that reads as "labelled" rather than "collided", measured from the top
 * of the character rather than guessed from its sheet. A `$` prefix means a sheet holds a single
 * character, not that the character is tall - `$o_grass` is a `$` sheet with 47 pixel frames, and a
 * height picked off that prefix buried its label sixty pixels up in the scenery while `$dragon`, at
 * 120, wore its label inside its own silhouette.
 *
 * This is deliberately recomputed every frame rather than settled when the sprite is built.
 * {@link Sprite_Character.patternHeight} divides the character bitmap's height, and escriptions are
 * created from `setCharacterBitmap` - one line after the image is *requested*. On a cold load that
 * bitmap has not decoded yet and reports a height of zero, so a value computed there is right only
 * when the image happened to be cached. Reading it per frame costs one subtraction and is correct
 * the moment the image lands, and again whenever a page change swaps the sprite for a taller one.
 * @returns {number}
 */
Sprite_Character.prototype.escriptionBaseY = function()
{
  // `patternHeight` is the raw frame height with no scale applied, and a character that has been
  // scaled up extends upward from its feet - so the drawn body is taller than that number claims by
  // exactly its own scale. The overlay layer these sprites hang from deliberately cancels that scale
  // so captions keep their size and their alignment with each other, which means clearing a resized
  // head is this sprite's own business rather than something the layer does on its behalf.
  const drawnHeight = this.patternHeight() * this.scale.y;

  return -(drawnHeight + 32);
};

/**
 * How many text lines the given escriptions amount to.
 * @param {Escription[]} escriptions The escriptions to count through.
 * @returns {number}
 */
Sprite_Character.prototype.escriptionLineCount = function(escriptions)
{
  return escriptions.filter(escription => escription.kind() === Escription.Kinds.Text).length;
};

/**
 * The offset from {@link Sprite_Character.escriptionBaseY} that one escription sits at.
 *
 * Text lines stack **upward**, so the last line sits on the base and the first sits highest- a
 * block therefore reads top to bottom, and a single line lands exactly where a single line has
 * always landed. The icon clears the whole block rather than only the first line, so writing a
 * second line pushes the icon up with the text instead of burying it in the middle of it.
 * @param {Escription} escription The escription being placed.
 * @param {number} index Its position in the character's list.
 * @param {number} lineCount How many text lines the character declares in total.
 * @returns {number}
 */
Sprite_Character.prototype.escriptionOffsetY = function(escription, index, lineCount)
{
  // an icon rides above the topmost line of text- or above the character itself, when an event
  // declares an icon and nothing to write beside it.
  if (escription.kind() === Escription.Kinds.Icon)
  {
    const topLine = Math.max(lineCount - 1, 0);
    return 0 - ((topLine * ESCRIPTION_LINE_HEIGHT) + ESCRIPTION_ICON_GAP);
  }

  // text lines are declared before the icon, so a text escription's position in the list is also
  // its line number- and the lines above it are what lift it off the base. subtracting from zero
  // rather than negating keeps the bottom line at a plain zero instead of a negative one.
  const linesAbove = lineCount - 1 - index;
  return 0 - (linesAbove * ESCRIPTION_LINE_HEIGHT);
};

/**
 * Extends {@link Sprite_Character.isEmptyCharacter}.<br/>
 * If the character describes something, don't make it invisible for the time being.
 * @returns {boolean} True if the character should be drawn, false otherwise.
 */
J.ESCRIBE.Aliased.Sprite_Character.set('isEmptyCharacter', Sprite_Character.prototype.isEmptyCharacter);
Sprite_Character.prototype.isEmptyCharacter = function()
{
  // if we describe something and the character is not erased, then we are not empty.
  if (this.hasCharacterEscriptions() && !this.isErased()) return false;

  // perform original logic.
  return J.ESCRIBE.Aliased.Sprite_Character.get('isEmptyCharacter')
    .call(this);
};
//endregion helpers

//region building escription sprites
/**
 * Extends {@link Sprite_Character.setCharacterBitmap}.<br/>
 * Also re-reads what the underlying character describes.
 */
J.ESCRIBE.Aliased.Sprite_Character.set('setCharacterBitmap', Sprite_Character.prototype.setCharacterBitmap);
Sprite_Character.prototype.setCharacterBitmap = function()
{
  // perform original logic.
  J.ESCRIBE.Aliased.Sprite_Character.get('setCharacterBitmap')
    .call(this);

  // a fresh bitmap means a fresh page, so re-read what this character has to say. nothing is built
  // here on purpose- the update loop notices the difference on its next pass and rebuilds there,
  // which keeps every path that changes an escription going through exactly one piece of code.
  this.refreshCharacterEscriptions();
};

/**
 * Asks the underlying character to re-read its own event comments.
 */
Sprite_Character.prototype.refreshCharacterEscriptions = function()
{
  // grab the character.
  const character = this.character();

  // a sprite genuinely exists for a beat before the engine hands it a character.
  if (!character) return;

  // you cannot escribe non-events.
  if (!character.isEvent()) return;

  // parse the comments if there are any.
  character.parseEscriptionComments();
};

/**
 * Rebuilds this sprite's escription sprites, but only when what the character describes has
 * actually changed since they were built.
 */
Sprite_Character.prototype.refreshEscriptionSpritesIfNeeded = function()
{
  // work out what the character is saying right now.
  const escriptions = this.characterEscriptions();
  const signature = this.escriptionSignature(escriptions);

  // what is already on screen still says exactly that, so there is nothing to do.
  if (signature === this.escriptionKey()) return;

  // whatever was drawn belongs to a page, or an event, that has moved on.
  this.removeEscriptionSprites();

  // build one sprite per escription, in the order the character declared them.
  const sprites = escriptions.map(escription => this.buildEscriptionSprite(escription));

  // put them on screen, on the layer that insulates a caption from what its character is doing - an
  // escription that stretched with a squash or tipped over with a spin would read as a bug.
  const overlay = this.characterOverlay();
  sprites.forEach(sprite => overlay.addChild(sprite));

  // remember both what is drawn and what it was drawn from.
  this.setEscriptionSprites(sprites);
  this.setEscriptionKey(signature);
};

/**
 * Builds the sprite that draws a single escription.
 * @param {Escription} escription The escription to build a sprite for.
 * @returns {Sprite_BaseText|Sprite_Icon}
 */
Sprite_Character.prototype.buildEscriptionSprite = function(escription)
{
  // the kind decides what kind of sprite draws it.
  let sprite = null;
  if (escription.kind() === Escription.Kinds.Icon)
  {
    sprite = this.buildEscriptionIconSprite(escription);
  }
  else
  {
    sprite = this.buildEscriptionTextSprite(escription);
  }

  // a proximity-gated escription is born invisible and fades in when the player arrives; an
  // ungated one is simply on. this is the reason proximity belongs in the signature.
  if (escription.hasProximity())
  {
    sprite.opacity = 0;
  }

  return sprite;
};

/**
 * Builds the text sprite for a text escription.
 * @param {Escription} escription The escription to build a sprite for.
 * @returns {Sprite_BaseText}
 */
Sprite_Character.prototype.buildEscriptionTextSprite = function(escription)
{
  // build the text sprite.
  const sprite = new Sprite_BaseText()
    .setText(escription.content())
    .setFontSize(14)
    .setAlignment(Sprite_BaseText.Alignments.Center)
    .setColor('#ffffff');

  // this text sprite is a child of the character sprite, and a character sprite's origin already
  // sits at the character's horizontal centre - so centring the label needs nothing but half its
  // own width. the character's map coordinate has no business in this sum: it is measured in
  // tiles, so folding it in shifted every label right by one pixel per tile from the map's left
  // edge, which reads as "roughly centred" near the origin and drifts visibly across a wide map.
  //
  // half of a measured width is very rarely a whole number of pixels, and a glyph that starts on a
  // fraction is sampled across two columns instead of filling one - so the centred result is landed
  // on the display's own pixel grid rather than left wherever the division put it.
  //
  // the width is read off the bitmap rather than off the sprite, because the overlay layer this is
  // about to be parented to writes a scale onto its children - and `Sprite.width` folds that scale
  // in, so a label rebuilt while its character happened to be mid-squish would centre against a
  // width that is not the one it draws at.
  sprite.x = TextRasterMetrics.snap(-(sprite.bitmapWidth() / 2), Graphics.deviceScale);

  // the height is deliberately left alone. it depends on the character bitmap, which may not have
  // loaded, and on how many lines the block turned out to hold - so the update pass that runs in
  // this same frame owns it, and owning it in one place is what keeps the stack from disagreeing
  // with itself.

  // return the built sprite.
  return sprite;
};

/**
 * Builds the icon sprite for an icon escription.
 * @param {Escription} escription The escription to build a sprite for.
 * @returns {Sprite_Icon}
 */
Sprite_Character.prototype.buildEscriptionIconSprite = function(escription)
{
  // build the sprite.
  const sprite = new Sprite_Icon(escription.content());

  // an icon knows its own width up front, so centring it needs no measurement- the few extra
  // pixels are the nudge that lines it up with the text below it.
  sprite.x = 0 - (ImageManager.iconWidth / 2) - 4;

  // as with the text, the update pass owns the height.

  // return the built sprite.
  return sprite;
};

/**
 * Removes every escription sprite currently drawn, and forgets what they were built from.
 */
Sprite_Character.prototype.removeEscriptionSprites = function()
{
  // take them off the display and release them.
  this.escriptionSprites()
    .forEach(sprite =>
    {
      this.characterOverlay()
        .removeChild(sprite);
      sprite.destroy();
    });

  // nothing is drawn, and nothing was built from anything.
  this.setEscriptionSprites([]);
  this.setEscriptionKey(String.empty);
};
//endregion building escription sprites

//region updating escription sprites
/**
 * Hooks into the update function to update our escription sprites.
 */
J.ESCRIBE.Aliased.Sprite_Character.set('update', Sprite_Character.prototype.update);
Sprite_Character.prototype.update = function()
{
  // perform original logic.
  J.ESCRIBE.Aliased.Sprite_Character.get('update')
    .call(this);

  // manage the escriptions floating above this character.
  this.updateEscriptions();
};

/**
 * The update loop for managing the addition, removal and visibility of escriptions.
 */
Sprite_Character.prototype.updateEscriptions = function()
{
  // rebuild the sprites first, if what the character describes has changed.
  this.refreshEscriptionSpritesIfNeeded();

  // then keep whatever is drawn parked and faded correctly.
  this.updateEscriptionSprites();
};

/**
 * Keeps every escription sprite parked above the character and faded to match its proximity.
 */
Sprite_Character.prototype.updateEscriptionSprites = function()
{
  // the sprites and the escriptions were built together and share an order, so one index reaches
  // both. the escriptions are read fresh here rather than held, which is what keeps this correct
  // through a page change that happens to declare exactly the same thing as the last one.
  const escriptions = this.characterEscriptions();
  const sprites = this.escriptionSprites();

  // whatever height the character turned out to be this frame, everything hangs off it.
  const baseY = this.escriptionBaseY();

  // how tall the block of text is decides where every line and the icon above it sit.
  const lineCount = this.escriptionLineCount(escriptions);

  // park and fade each one.
  sprites.forEach((sprite, index) =>
  {
    // the escription this sprite is drawing.
    const escription = escriptions.at(index);

    // keep it parked above the character.
    sprite.y = baseY + this.escriptionOffsetY(escription, index, lineCount);

    // something always visible has nothing to fade toward.
    if (!escription.hasProximity()) return;

    // everything else chases wherever the player currently is.
    this.fadeEscriptionSprite(sprite, escription.isVisible());
  });
};

/**
 * Steps a sprite's opacity one frame's worth toward visible, or toward gone.
 *
 * The terminal checks are inequalities rather than equalities on purpose. `Sprite.opacity` reads
 * back as `alpha * 255` without rounding, and a step of seventeen does not land on a value the
 * float can hold exactly, so an equality check would sail past the destination and keep writing
 * forever. There is also no clamping to do here- the engine's own setter clamps to 0-255 before it
 * stores anything, which is why an out-of-range opacity is not a state this can ever observe.
 * @param {Sprite_BaseText|Sprite_Icon} sprite The sprite to fade.
 * @param {boolean} visible True to fade it in, false to fade it out.
 */
Sprite_Character.prototype.fadeEscriptionSprite = function(sprite, visible)
{
  // fading toward fully drawn.
  if (visible)
  {
    // already there.
    if (sprite.opacity >= 255) return;

    sprite.opacity += 17;
    return;
  }

  // already gone.
  if (sprite.opacity <= 0) return;

  sprite.opacity -= 17;
};
//endregion updating escription sprites
//endregion Sprite_Character