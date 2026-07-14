//region plugins/popups/_component/game-character-textpops.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPopupsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPopups,
} from './fixtures/install-popups-host-globals.js';

describe('J-Popups Game_Character integration (direct src import)', () =>
{
  let TextPopBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPopupsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.J_EventEmitter } = await import('../../../../src/plugins/_base/models/J_EventEmitter.js'));

    setPluginContextToJPopups();
    await import('../../../../src/plugins/popups/core/_metadata/initialization.js');

    ({ default: TextPopBuilder } = await import('../../../../src/plugins/popups/core/_models/TextPopBuilder.js'));

    // patches globalThis.Game_Character.prototype directly, no vm involved.
    await import('../../../../src/plugins/popups/core/objects/Game_Character.js');
  });

  describe('when popups are not disabled', () =>
  {
    beforeAll(() =>
    {
      globalThis.J.POPUPS.Metadata.disablePopups = false;
    });

    it('hasTextPops is false before any pop is requested', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();

      // Act
      const result = ch.hasTextPops();

      // Assert
      expect(result).toBe(false);
    });

    it('requestTextPop flags hasTextPops as true', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();

      // Act
      ch.requestTextPop();

      // Assert
      expect(ch.hasTextPops()).toBe(true);
    });

    it('addTextPop queues the built popup', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();
      const popup = new TextPopBuilder('x').build();

      // Act
      ch.addTextPop(popup);

      // Assert
      expect(ch.getTextPops().length).toBe(1);
    });

    it('acknowledgeTextPops clears the hasTextPops flag', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();
      ch.requestTextPop();

      // Act
      ch.acknowledgeTextPops();

      // Assert
      expect(ch.hasTextPops()).toBe(false);
    });

    it('emptyDamagePops clears the queued popups', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();
      const popup = new TextPopBuilder('x').build();
      ch.addTextPop(popup);

      // Act
      ch.emptyDamagePops();

      // Assert
      expect(ch.getTextPops().length).toBe(0);
    });
  });

  describe('when disablePopups is true', () =>
  {
    beforeAll(() =>
    {
      globalThis.J.POPUPS.Metadata.disablePopups = true;
    });

    it('requestTextPop does not flag hasTextPops', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();

      // Act
      ch.requestTextPop();

      // Assert
      expect(ch.hasTextPops()).toBe(false);
    });

    it('addTextPop does not queue the popup', () =>
    {
      // Arrange
      const ch = new globalThis.Game_Character();
      ch.initMembers();
      const popup = new TextPopBuilder('x').build();

      // Act
      ch.addTextPop(popup);

      // Assert
      expect(ch.getTextPops().length).toBe(0);
    });
  });
});
//endregion plugins/popups/_component/game-character-textpops.test.js
