//region plugins/omni/ext/_component/optional-sibling-gates.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The three places the omnipedia extensions decline to patch anything.
 *
 * Each is a namespace check against a genuinely optional sibling, and each is the side a fully
 * installed project never takes. They are gathered here because all three need their namespace
 * *absent* at import time, which the rest of the omni suite establishes the opposite of.
 *
 * The `canGainEntry` one is a different shape from the other two: it is a shared helper the first
 * omnipedia extension to load contributes, and every later one finds already present. Whichever ship
 * happens to load first takes the defining branch; the rest take the skip.
 */
describe('omni extension optional-sibling gates', () =>
{
  beforeEach(() =>
  {
    vi.resetModules();
  });

  describe('monsterpedia target-frame patch', () =>
  {
    it('patches nothing onto JABS_Battler when the target frame HUD is absent', async () =>
    {
      // Arrange- the patch teaches a battler how to describe itself to the target frame, so without
      // that window there is nothing for it to describe itself to.
      globalThis.J = { OMNI: { EXT: { MONSTER: { Aliased: { JABS_Battler: new Map() } } } }, HUD: { EXT: {} } };
      globalThis.JABS_Battler = class {};

      // Act
      await import('../../../../../src/plugins/omni/ext/monster/objects/JABS_Battler.js');

      // Assert
      expect(globalThis.J.OMNI.EXT.MONSTER.Aliased.JABS_Battler.size)
        .toBe(0);
    });
  });

  describe('questopedia input adapter', () =>
  {
    it('adds no questopedia action when JABS is absent', async () =>
    {
      // Arrange- the questopedia opens from a JABS input binding; without JABS there is no adapter
      // to bind it to, and the menu command reaches it instead.
      globalThis.J = { OMNI: { EXT: { QUEST: {} } } };
      globalThis.JABS_InputAdapter = {};

      // the engine bases the questopedia's own scene/window graph is declared against; nothing here
      // constructs one, they only need to exist for the class declarations to evaluate.
      globalThis.Window_HorzCommand = class {};
      globalThis.Window_Command = class {};
      globalThis.Window_Base = class {};
      globalThis.Scene_MenuBase = class {};

      // Act
      await import('../../../../../src/plugins/omni/ext/quest/managers/JABS_InputAdapter.js');

      // Assert
      expect(globalThis.JABS_InputAdapter.performQuestopediaAction)
        .toBeUndefined();
    });
  });

  describe('the shared canGainEntry helper', () =>
  {
    it('leaves an already-contributed helper alone rather than replacing it', async () =>
    {
      // Arrange- the monsterpedia and the questopedia both want this helper and neither owns it, so
      // whichever loads second must defer. Replacing it would be harmless today and a silent
      // divergence the moment the two definitions stopped matching.
      const existing = () => 'the first one to load wins';
      globalThis.J = {
        OMNI: {
          EXT: {
            QUEST: {
              Aliased: { Game_Party: new Map() },
              Metadata: { quests: [] },
            },
          },
        },
      };
      globalThis.Game_Party = class {};
      globalThis.Game_Party.prototype.initOmnipediaMembers = () => {};
      globalThis.Game_Party.prototype.canGainEntry = existing;

      // the tracked models register their save codecs at import time against the registry J-Base
      // hoists as a global; nothing here exercises it.
      globalThis.SerializableRegistry = { register: vi.fn() };
      globalThis.String.empty = '';

      // Act
      await import('../../../../../src/plugins/omni/ext/quest/objects/Game_Party.js');

      // Assert
      expect(globalThis.Game_Party.prototype.canGainEntry)
        .toBe(existing);
    });
  });
});
//endregion plugins/omni/ext/_component/optional-sibling-gates.test.js