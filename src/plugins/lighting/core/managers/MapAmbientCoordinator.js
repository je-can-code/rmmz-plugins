//region MapAmbientCoordinator
import LightingTagParser from '../core/LightingTagParser.js';
import ScreenLightingComposer from './ScreenLightingComposer.js';

/**
 * Keeps the darkness a place is ordinarily in, and lets an event argue with it.
 *
 * A map's `<ambient:>` tag says what somewhere is like when nothing else is going on, which is the
 * right default and the wrong answer for a room whose lights can come on. Reading the tag and
 * withdrawing it are therefore two separate operations rather than one, so a cutscene can say "the
 * lights are working now" without having to know what the map said in the first place - and without
 * that knowledge having to be copied into the event.
 *
 * Withdrawal lasts only as long as the visit. Walking back in re-reads the tag, so a room returns to
 * being what the map says it is unless something turns the lights on again. Anything that should
 * outlive a transfer is a switch and a page, which is eventing's job rather than this plugin's.
 */
class MapAmbientCoordinator
{
  /**
   * The source key a map's own darkness is declared under.
   * @type {string}
   */
  static SOURCE_KEY = 'map';

  /**
   * Reads the current map's darkness and declares it, or declares nothing at all.
   *
   * A map with no tag declares nothing, and that silence is load-bearing: it is what leaves every
   * map authored before this plugin existed exactly as bright as it always was.
   */
  static refresh()
  {
    const payload = RPGManager.getStringFromNoteByRegex($dataMap, J.LIGHTING.RegExp.Ambient, true);

    // this map never said it was dark, so it is not dark.
    if (payload === null)
    {
      ScreenLightingComposer.removeDeclarations(MapAmbientCoordinator.SOURCE_KEY);

      return;
    }

    const declaration = LightingTagParser.parseAmbientPayload(payload, MapAmbientCoordinator.SOURCE_KEY);

    // the tag was shaped like an ambient but did not describe one; already reported in detail.
    if (declaration === null) return;

    ScreenLightingComposer.declareAmbient(MapAmbientCoordinator.SOURCE_KEY, declaration);
  }

  /**
   * Withdraws the darkness this map declared, until the player next arrives here.
   *
   * This is what an event does when the lights come on. It is a withdrawal rather than a declaration
   * of brightness because darkness compounds - declaring "no darkness" would compound to exactly the
   * darkness already there and change nothing at all.
   */
  static suppress()
  {
    ScreenLightingComposer.removeDeclarations(MapAmbientCoordinator.SOURCE_KEY);
  }
}

export default MapAmbientCoordinator;
//endregion MapAmbientCoordinator