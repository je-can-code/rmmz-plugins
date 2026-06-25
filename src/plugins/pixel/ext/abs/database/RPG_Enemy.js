//region RPG_Enemy
/**
 * Normalizes raw hitbox size note data into the canonical width/height model.
 * @param {string|number|number[]|null} rawHitboxSize The raw hitbox size data.
 * @returns {{widthTiles:number,heightTiles:number}|null}
 */
RPG_Enemy.hitboxSizeDataFromRaw = function(rawHitboxSize)
{
  // if no override exists, then there is nothing to normalize.
  if (rawHitboxSize === null || rawHitboxSize === undefined) return null;

  // parse the raw note payload into an engine-friendly object.
  const parsedHitboxSize = JsonMapper.parseObject(rawHitboxSize);

  // if the shorthand number was provided, then it represents a square hitbox.
  if (Number.isFinite(parsedHitboxSize))
  {
    // reject invalid sizes so callers can fall back cleanly.
    if (parsedHitboxSize <= 0) return null;

    // the shorthand applies equally to width and height.
    return {
      widthTiles: parsedHitboxSize,
      heightTiles: parsedHitboxSize,
    };
  }

  // if the rectangle form was provided, then normalize its dimensions.
  if (Array.isArray(parsedHitboxSize))
  {
    // deconstruct the rectangle into width and height.
    const [ widthTiles, heightTiles ] = parsedHitboxSize;

    // reject invalid rectangles so callers can fall back cleanly.
    if (widthTiles <= 0 || heightTiles <= 0) return null;

    // return the normalized rectangle.
    return {
      widthTiles,
      heightTiles,
    };
  }

  // anything else is malformed and should be ignored.
  return null;
};

/**
 * The enemy hitbox size override from this database note, if any.
 * @type {{widthTiles:number,heightTiles:number}|null}
 */
Object.defineProperty(RPG_Enemy.prototype, 'hitboxSizeData', {
  get: function()
  {
    // grab the raw hitbox payload from the notes.
    const rawHitboxSize = RPGManager.getStringFromNoteByRegex(this, J.PIXEL.EXT.ABS.RegExp.HitboxSize, true);

    // normalize the found data into the shared runtime model.
    return RPG_Enemy.hitboxSizeDataFromRaw(rawHitboxSize);
  },
});

/**
 * The enemy hitbox reveal range override from this database note, if any.
 * @type {number|null}
 */
Object.defineProperty(RPG_Enemy.prototype, 'hitboxRevealRange', {
  get: function()
  {
    // grab the configured reveal range from the notes.
    return RPGManager.getNumberFromNoteByRegex(this, J.PIXEL.EXT.ABS.RegExp.HitboxReveal, true);
  },
});
//endregion RPG_Enemy