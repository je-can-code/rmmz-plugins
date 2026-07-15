//region plugins/hud/ext/target/_models/framed-target-configuration.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('FramedTargetConfiguration (direct src import)', () =>
{
  let FramedTargetConfiguration;

  beforeAll(async () =>
  {
    vi.resetModules();
    ({ default: FramedTargetConfiguration } = await import('../../../../../../src/plugins/hud/ext/target/_models/FramedTargetConfiguration.js'));
  });

  beforeEach(() =>
  {
    // the hp/mp/tp defaults are read from plugin metadata at construction time.
    globalThis.J = {
      HUD: {
        EXT: {
          TARGET: {
            Metadata: {
              EnableHP: true,
              EnableMP: false,
              EnableTP: true,
            },
          },
        },
      },
    };
  });

  describe('constructor', () =>
  {
    it('defaults showName/showText to true and showHp/showMp/showTp from plugin metadata', () =>
    {
      // Arrange/Act
      const config = new FramedTargetConfiguration();

      // Assert
      expect(config.showName).toEqual(true);
      expect(config.showText).toEqual(true);
      expect(config.showHp).toEqual(true);
      expect(config.showMp).toEqual(false);
      expect(config.showTp).toEqual(true);
    });

    it('assigns all explicitly-provided values over the defaults', () =>
    {
      // Arrange/Act
      const config = new FramedTargetConfiguration(false, false, false, true, false);

      // Assert
      expect(config.showName).toEqual(false);
      expect(config.showText).toEqual(false);
      expect(config.showHp).toEqual(false);
      expect(config.showMp).toEqual(true);
      expect(config.showTp).toEqual(false);
    });
  });
});
//endregion plugins/hud/ext/target/_models/framed-target-configuration.test.js
