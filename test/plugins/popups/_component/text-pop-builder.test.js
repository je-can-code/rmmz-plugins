//region plugins/popups/_component/text-pop-builder.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from './fixtures/install-popups-host-globals.js';

describe('J-Popups TextPopBuilder (direct src import)', () =>
{
  let TextPopBuilder;
  let Map_TextPop;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.J_EventEmitter } = await import('../../../../src/plugins/_base/core/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../src/plugins/popups/core/_metadata/initialization.js');

    ({ default: Map_TextPop } = await import('../../../../src/plugins/popups/core/_models/Map_TextPop.js'));
    ({ default: TextPopBuilder } = await import('../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));
  });

  it('build() concatenates the prefix, floored value, and suffix', () =>
  {
    // Arrange
    const builder = new TextPopBuilder(12.3)
      .setPrefix('+')
      .setSuffix('!')
      .setCritical(true)
      .setHealing(true)
      .setIconIndex(5)
      .setTextColorIndex(7)
      .setPopupType(Map_TextPop.Types.HpDamage)
      .setXVariance(3)
      .setYVariance(-2);

    // Act
    const popup = builder.build();

    // Assert
    expect(popup.value).toBe('+13!');
  });

  it('build() carries the critical flag', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(12.3).setCritical(true).build();

    // Assert
    expect(popup.critical).toBe(true);
  });

  it('build() carries the healing flag', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(12.3).setHealing(true).build();

    // Assert
    expect(popup.healing).toBe(true);
  });

  it('build() carries the icon index', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(12.3).setIconIndex(5).build();

    // Assert
    expect(popup.iconIndex).toBe(5);
  });

  it('build() carries the text color index', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(12.3).setTextColorIndex(7).build();

    // Assert
    expect(popup.textColorIndex).toBe(7);
  });

  it('build() carries the popup type', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(12.3).setPopupType(Map_TextPop.Types.HpDamage).build();

    // Assert
    expect(popup.popupType).toBe(Map_TextPop.Types.HpDamage);
  });

  it('build() carries the x/y coordinate variance', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(12.3).setXVariance(3).setYVariance(-2).build();

    // Assert
    expect(popup.coordinateVariance).toEqual([ 3, -2 ]);
  });

  it('floors a negative numeric value and strips the hyphen from the display value', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(-1.2).build();

    // Assert
    expect(popup.value).toBe('2');
  });

  it('treats a negative numeric value as healing by default', () =>
  {
    // Arrange
    const popup = new TextPopBuilder(-1.2).build();

    // Assert
    expect(popup.healing).toBe(true);
  });
});
//endregion plugins/popups/_component/text-pop-builder.test.js
