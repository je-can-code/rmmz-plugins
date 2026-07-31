//region plugins/hud/ext/target/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHud,
  setPluginContextToJHudTarget,
} from '../../../_component/fixtures/install-hud-host-globals.js';

describe('J-HUD-TargetFrame metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJHud();
    await import('../../../../../../src/plugins/hud/core/_metadata/initialization.js');

    setPluginContextToJHudTarget();
    await import('../../../../../../src/plugins/hud/ext/target/_metadata/initialization.js');
  });

  it('parses the target frame window bounds from plugin parameters', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.HUD.EXT.TARGET;

    // Assert
    expect(Metadata.TargetFrameX).toBe(400);
    expect(Metadata.TargetFrameY).toBe(0);
    expect(Metadata.TargetFrameWidth).toBe(320);
    expect(Metadata.TargetFrameHeight).toBe(252);
  });

  it('parses the gauge image coordinates from plugin parameters', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.HUD.EXT.TARGET;

    // Assert
    expect(Metadata.BackgroundGaugeImageX).toBe(0);
    expect(Metadata.BackgroundGaugeImageY).toBe(0);
    expect(Metadata.MiddlegroundGaugeImageX).toBe(2);
    expect(Metadata.MiddlegroundGaugeImageY).toBe(2);
    expect(Metadata.ForegroundGaugeImageX).toBe(2);
    expect(Metadata.ForegroundGaugeImageY).toBe(3);
  });

  it('parses the gauge image filenames from plugin parameters', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.HUD.EXT.TARGET;

    // Assert
    expect(Metadata.BackgroundFilename).toBe('img/hud/target-gauge-background');
    expect(Metadata.ForegroundFilename).toBe('img/hud/target-gauge-foreground');
  });

  it('parses the gauge enablement flags as booleans from plugin parameters', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.HUD.EXT.TARGET;

    // Assert
    expect(Metadata.EnableHP).toBe(true);
    expect(Metadata.EnableMP).toBe(true);
    expect(Metadata.EnableTP).toBe(true);
  });

  it('parses the gauge scale and rotation values from plugin parameters', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.HUD.EXT.TARGET;

    // Assert
    expect(Metadata.HpGaugeScaleX).toBe(2.0);
    expect(Metadata.HpGaugeScaleY).toBe(1.0);
    expect(Metadata.HpGaugeRotation).toBe(0);
    expect(Metadata.MpGaugeScaleX).toBe(1.0);
    expect(Metadata.MpGaugeScaleY).toBe(0.5);
    expect(Metadata.MpGaugeRotation).toBe(0);
    expect(Metadata.TpGaugeScaleX).toBe(0.3);
    expect(Metadata.TpGaugeScaleY).toBe(0.4);
    expect(Metadata.TpGaugeRotation).toBe(270);
  });

  it('initializes empty aliased maps for every hooked class', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.HUD.EXT.TARGET;

    // Assert
    expect(Aliased.Game_System).toBeInstanceOf(Map);
    expect(Aliased.Hud_Manager).toBeInstanceOf(Map);
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.Scene_Map).toBeInstanceOf(Map);
    expect(Aliased.Window_TargetFrame).toBeInstanceOf(Map);
  });

  it('registers the notetag regular expressions used by this plugin', () =>
  {
    // Arrange & Act
    const { RegExp: regexes } = globalThis.J.HUD.EXT.TARGET;

    // Assert
    expect('<targetFrameText:hello world>').toMatch(regexes.TargetFrameText);
    expect('<targetFrameIcon:64>').toMatch(regexes.TargetFrameIcon);
    expect('<hideTargetFrame>').toMatch(regexes.HideTargetFrame);
    expect('<hideTargetFrameText>').toMatch(regexes.HideTargetText);
    expect('<hideTargetHpBar>').toMatch(regexes.HideTargetHP);
    expect('<hideTargetMpBar>').toMatch(regexes.HideTargetMP);
    expect('<hideTargetTpBar>').toMatch(regexes.HideTargetTP);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: downgrade the already-installed J-Base metadata below TARGET's required floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJHudTarget();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/target/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // reset back to a satisfying version so later tests in the suite are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });
});
//endregion plugins/hud/ext/target/_metadata/metadata.test.js
