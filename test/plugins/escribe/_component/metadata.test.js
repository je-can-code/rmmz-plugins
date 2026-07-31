//region plugins/escribe/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../../_base/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

describe('J-Escriptions metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.PluginManager = { parameters: () => ({}) };

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.2.0';
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-Escriptions';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../src/plugins/escribe/core/_metadata/initialization.js');
  });

  it('builds a working Text regex from the initialized RegExp table', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ESCRIBE.RegExp.Text.test('<text:Hello>')).toBe(true);
  });

  it('captures the whole description, spaces and punctuation included', () =>
  {
    // Arrange & Act
    const match = '<text:A weathered signpost.>'.match(globalThis.J.ESCRIBE.RegExp.Text);

    // Assert
    expect(match[1]).toBe('A weathered signpost.');
  });

  it('captures an icon index', () =>
  {
    // Arrange & Act
    const match = '<icon:87>'.match(globalThis.J.ESCRIBE.RegExp.IconIndex);

    // Assert
    expect(match[1]).toBe('87');
  });

  it('captures a whole-number proximity', () =>
  {
    // Arrange & Act
    const match = '<proximityText:4>'.match(globalThis.J.ESCRIBE.RegExp.ProximityText);

    // Assert
    expect(match[1]).toBe('4');
  });

  it('captures a fractional proximity, since proximity is measured in tiles', () =>
  {
    // Arrange & Act
    const match = '<proximityIcon:2.5>'.match(globalThis.J.ESCRIBE.RegExp.ProximityIcon);

    // Assert
    expect(match[1]).toBe('2.5');
  });

  it('captures a zero proximity', () =>
  {
    // Arrange & Act
    const match = '<proximityText:0>'.match(globalThis.J.ESCRIBE.RegExp.ProximityText);

    // Assert
    expect(match[1]).toBe('0');
  });

  it('refuses a proximity padded with a leading zero', () =>
  {
    // Arrange & Act
    const match = '<proximityText:04>'.match(globalThis.J.ESCRIBE.RegExp.ProximityText);

    // Assert: the number grammar is deliberate, so a padded value is an invalid tag.
    expect(match).toBeNull();
  });
});
//endregion plugins/escribe/_component/metadata.test.js
