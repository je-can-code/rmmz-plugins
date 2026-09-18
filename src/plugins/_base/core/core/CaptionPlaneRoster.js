//region CaptionPlaneRoster
/**
 * The bookkeeping behind the caption plane: who belongs on it, and in what order they draw.
 *
 * The plane itself is a sprite, and a sprite is the one place in this codebase where logic is
 * hardest to get a test around. So the two decisions it makes live here instead, as pure functions
 * over plain arrays, and the plane is left doing nothing but adding and removing children.
 *
 * Both decisions exist because captions stopped being children of the characters they describe.
 * A child is kept in step by its parent for free - it appears when the character does, leaves when
 * the character is destroyed, and draws in whatever order the tilemap sorted its parent into. A
 * caption on a flat plane has none of that, and these are the two halves of paying it back.
 */
class CaptionPlaneRoster
{
  /**
   * Works out which captions have joined the map and which have left it since the last frame.
   *
   * The live character sprites are the authority, deliberately: J-ABS alone adds and removes them
   * from eight different places - actions, generated battlers, loot, party cycling - and every one
   * of those pushes to or splices from that one array. Reading the array is a single seam that
   * cannot be forgotten, where aliasing the eight call sites would be eight seams and a ninth bug
   * the first time somebody adds another.
   *
   * Eviction is driven by the sprite being gone rather than by anything the sprite tells us,
   * because by the time we notice, it is usually destroyed - J-ABS splices an expired action out of
   * tracking and calls `destroy()` on it in the same breath. A destroyed sprite cannot be asked
   * anything, so the question has to be answerable without it.
   * @param {Sprite_Character[]} characterSprites Every character sprite currently on the map.
   * @param {Sprite_CharacterOverlay[]} rosteredCaptions The captions the plane is holding today.
   * @returns {{additions: Sprite_CharacterOverlay[], evictions: Sprite_CharacterOverlay[]}}
   */
  static reconcile(characterSprites, rosteredCaptions)
  {
    // membership tests run once per caption below, so both sides get a set rather than a scan.
    const rostered = new Set(rosteredCaptions);
    const liveSprites = new Set(characterSprites);

    // a character sprite that exists without its caption on the plane has just arrived.
    const additions = characterSprites
      .map(characterSprite => characterSprite.characterOverlay())
      .filter(caption => rostered.has(caption) === false);

    // and a caption whose character sprite is no longer tracked has just left.
    const evictions = rosteredCaptions.filter(caption => liveSprites.has(caption.characterSprite()) === false);

    return {
      additions,
      evictions,
    };
  }

  /**
   * Orders two captions the way the tilemap would have ordered the characters they describe.
   *
   * This is `Tilemap._compareChildOrder` rewritten against captions, and it is a copy on purpose.
   * Depth used to come free: a caption rode inside its character sprite, the tilemap sorted that
   * sprite by y every frame, and a nearer character's nameplate landed over a farther one's without
   * anybody arranging it. Lifting captions onto a flat plane throws that away, and the only way the
   * two planes cannot drift apart is for them to be sorting by the same rule.
   *
   * Sorting by the caption's own mirrored fields rather than by reaching back through to the
   * character sprite is what keeps this a pure comparison of two plain objects - and the tie-break
   * still holds, because a caption is constructed immediately after the sprite it belongs to, so
   * caption ids run in the same order sprite ids do.
   * @param {Sprite_CharacterOverlay} a The caption on the left of the comparison.
   * @param {Sprite_CharacterOverlay} b The caption on the right of the comparison.
   * @returns {number}
   */
  static compareCaptionOrder(a, b)
  {
    // priority tier wins outright - a character on the upper tier is above one on the normal tier.
    if (a.z !== b.z)
    {
      return a.z - b.z;
    }

    // then screen depth, which is what makes a nearer character's caption cover a farther one's.
    if (a.y !== b.y)
    {
      return a.y - b.y;
    }

    // and finally construction order, so two captions in exactly the same place stay put rather
    // than swapping every frame the sort runs.
    return a.spriteId - b.spriteId;
  }
}

export default CaptionPlaneRoster;
//endregion CaptionPlaneRoster