//region LootMotionCoordinator
/**
 * Connects a loot drop's remaining lifetime with what its sprite is doing about it.
 *
 * A drop that times out is removed from the map the instant its duration hits zero. Nothing leads
 * into that, so from the player's side an item they were on their way to fetch is simply not there
 * any more, at a moment they had no way to anticipate.
 *
 * The warning is a blink first and a dissolve second, and the order matters. A slow dim is
 * something the eye adapts to rather than notices, and it also makes the drop progressively harder
 * to see during exactly the window it most needs finding. A blink keeps the drop at full opacity
 * half the time while being impossible to miss, which is why it is the conventional language for
 * a despawning pickup. The dissolve then joins it for the closing stretch to say the blinking is
 * nearly over.
 *
 * Collection is deliberately left alone. A collected drop arrives at the player and vanishes there,
 * which is already a moment with an author - adding a dissolve after it would soften a beat that
 * has earned being abrupt.
 *
 * `CharacterMotionComposer` and `MotionDeclaration` are reached as globals rather than imports:
 * they ship in the J-Motion bundle, and importing across that boundary would bundle a second copy
 * of each into this one.
 */
class LootMotionCoordinator
{
  /**
   * The source key a loot drop's expiry blink is declared under.
   * @type {string}
   */
  static WARN_SOURCE_KEY = 'loot:expiry-warn';

  /**
   * The source key a loot drop's expiry dissolve is declared under.
   *
   * Kept separate from the blink rather than declared alongside it, because a source replacing its
   * own declarations tears down whatever it had running - so sharing one key would restart the
   * blink at the moment the dissolve joined it.
   * @type {string}
   */
  static FADE_SOURCE_KEY = 'loot:expiry-fade';

  /**
   * Keeps a loot sprite's expiry warning in step with how long the drop has left.
   *
   * Safe to call every frame. The composer treats a source re-declaring exactly what it already
   * declared as a no-op, so each stage is started once and then left to run rather than being
   * restarted into its opening frame over and over.
   * @param {Sprite_Character} sprite The sprite of the loot drop being checked.
   */
  static syncExpiryWarning(sprite)
  {
    const character = sprite.character();
    const lootDrop = character.getJabsLoot();

    // a drop already claimed by somebody is not running out of time, and if it began warning
    // before it was claimed it should stop - it is about to be collected, not lost.
    if (lootDrop.isWaiting() === false)
    {
      LootMotionCoordinator.withdrawExpiryWarning(character);

      return;
    }

    // a drop told to stay forever has no expiry to warn about.
    if (lootDrop.canExpire() === false) return;

    const remaining = lootDrop.duration();
    const metadata = J.MOTION.EXT.ABS.Metadata;

    // still has time in hand, so there is nothing to say yet.
    if (remaining > metadata.lootExpiryWarnFrames) return;

    LootMotionCoordinator.declareExpiryFlicker(character, metadata.lootExpiryFlicker);

    // blinking on its own for now; the dissolve is reserved for the closing stretch.
    if (remaining > metadata.lootExpiryFadeFrames) return;

    LootMotionCoordinator.declareExpiryFade(character, metadata.lootExpiryFadeFrames);
  }

  /**
   * Starts a drop blinking to announce that it is running out of time.
   * @param {Game_CharacterBase} character The loot character that should blink.
   * @param {{min: number, max: number, interval: number}} flicker The shape of the blink.
   */
  static declareExpiryFlicker(character, flicker)
  {
    const { min, max, interval } = flicker;
    const declaration = new MotionDeclaration('flicker', [ min, max, interval ],
      LootMotionCoordinator.WARN_SOURCE_KEY);

    CharacterMotionComposer.declare(character, LootMotionCoordinator.WARN_SOURCE_KEY, [ declaration ]);
  }

  /**
   * Starts a drop dissolving over the frames it has left.
   * @param {Game_CharacterBase} character The loot character that should dissolve.
   * @param {number} fadeFrames How many frames the dissolve spans.
   */
  static declareExpiryFade(character, fadeFrames)
  {
    // fade to nothing across exactly the frames that remain, so the drop reaches invisible on the
    // same frame it reaches zero rather than blinking out of a half-faded state.
    const declaration = new MotionDeclaration('fade', [ 0, fadeFrames ], LootMotionCoordinator.FADE_SOURCE_KEY);

    CharacterMotionComposer.declare(character, LootMotionCoordinator.FADE_SOURCE_KEY, [ declaration ]);
  }

  /**
   * Takes back everything the expiry warning had declared on a drop.
   * @param {Game_CharacterBase} character The loot character that is no longer doomed.
   */
  static withdrawExpiryWarning(character)
  {
    CharacterMotionComposer.removeDeclarations(character, LootMotionCoordinator.WARN_SOURCE_KEY);
    CharacterMotionComposer.removeDeclarations(character, LootMotionCoordinator.FADE_SOURCE_KEY);
  }
}

export default LootMotionCoordinator;
//endregion LootMotionCoordinator
