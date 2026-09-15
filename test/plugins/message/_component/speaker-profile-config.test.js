//region plugins/message/_component/speaker-profile-config.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMessageHostGlobals, setPluginContextToJBase, setPluginContextToJMessage } from './fixtures/install-message-host-globals.js';

/**
 * The speaker profile config is the one external config in this codebase that is allowed to be
 * absent, and both halves of that need proving. A project that has never written one must come up
 * on the default profile - which is the engine's own untouched behaviour - because J-Message has
 * shipped without voices for years and every line of dialogue already written has to keep reading
 * exactly as it does. A project that *has* written one must actually get its speakers.
 *
 * Each case reloads the plugin's metadata from scratch against a different filesystem answer, since
 * the config is read once at load time and never again.
 */
describe('J-Message speaker profile config (direct src import)', () =>
{
  /**
   * Boots J-Base and J-Message with the filesystem answering the given config text.
   * @param {?string} rawConfig What the filesystem hands back for the config path, or null for none.
   * @returns {Promise<object>} The freshly loaded profile resolver.
   */
  /**
   * How many times a plugin has been built here, so each gets a name of its own.
   * @type {number}
   */
  let bootCount = 0;

  async function bootWithConfig(rawConfig)
  {
    // only J-Message is rebuilt per case. J-Base's own initialization installs `Array.empty` as a
    // non-configurable property, so importing it a second time in one file throws - and it does not
    // need reimporting anyway, since everything it does lands on globals that are already in place.
    vi.resetModules();

    globalThis.StorageManager.fsReadFile = () => rawConfig;

    setPluginContextToJMessage();

    const metadataModule = await import('../../../../src/plugins/message/core/_metadata/_pluginMetadata.js');
    const resolverModule = await import('../../../../src/plugins/message/core/services/MessageProfileResolver.js');

    // PluginMetadata keeps a registry that refuses a duplicate name and offers no way to empty it,
    // so each case builds its plugin under a name of its own rather than through initialization.js.
    bootCount += 1;
    const uniqueName = `J-Message-${bootCount}`;

    // eslint-disable-next-line no-new
    new metadataModule.default(uniqueName, '1.0.0');

    return resolverModule.default;
  }

  beforeAll(async () =>
  {
    installMessageHostGlobals();

    // every plugin built here is named uniquely, so parameters are looked up under names the
    // fixture never registered; an empty bag is the right answer for all of them.
    globalThis.PluginManager.parameters = () => ({});

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the real loader rather than a stand-in, because the parse and the error reporting are exactly
    // what a project with a malformed config would hit, and a fake would agree with itself.
    const optionsModule = await import('../../../../src/plugins/_base/core/models/ExternalJsonConfigLoaderOptions.js');
    const loaderModule = await import('../../../../src/plugins/_base/core/managers/ExternalJsonConfigLoader.js');
    globalThis.ExternalJsonConfigLoaderOptions = optionsModule.default;
    globalThis.ExternalJsonConfigLoader = loaderModule.default;
  });

  it('leaves every speaker on the engine pace when the project has written no config', async () =>
  {
    // Arrange & Act
    const resolver = await bootWithConfig(null);
    const profile = resolver.resolve('\\N[1]', 'face_je', 0);

    // Assert
    expect(profile.framesPerCharacter).toBe(1);
    expect(profile.hasVoice()).toBe(false);
  });

  it('treats an empty config file the same as an absent one', async () =>
  {
    // Arrange & Act
    const resolver = await bootWithConfig('');
    const profile = resolver.resolve('\\N[1]', 'face_je', 0);

    // Assert
    expect(profile.hasVoice()).toBe(false);
  });

  it('gives a configured speaker their voice', async () =>
  {
    // Arrange
    const rawConfig = JSON.stringify({
      bySpeakerName: {
        '\\N[1]': { voiceSeName: 'Cursor1', voicePitch: 130, framesPerCharacter: 1 },
        '\\N[2]': { voiceSeName: 'Cursor2', voicePitch: 70, framesPerCharacter: 3 },
      },
    });

    // Act
    const resolver = await bootWithConfig(rawConfig);
    const profile = resolver.resolve('\\N[2]', '', 0);

    // Assert
    expect(profile.voiceSeName).toBe('Cursor2');
    expect(profile.voicePitch).toBe(70);
    expect(profile.framesPerCharacter).toBe(3);
  });

  it('distinguishes the configured speakers from one another', async () =>
  {
    // Arrange
    const rawConfig = JSON.stringify({
      bySpeakerName: {
        '\\N[1]': { voiceSeName: 'Cursor1', framesPerCharacter: 1 },
        '\\N[2]': { voiceSeName: 'Cursor2', framesPerCharacter: 3 },
      },
    });

    // Act
    const resolver = await bootWithConfig(rawConfig);
    const profile = resolver.resolve('\\N[1]', '', 0);

    // Assert
    expect(profile.voiceSeName).toBe('Cursor1');
    expect(profile.framesPerCharacter).toBe(1);
  });

  it('still hands an unconfigured speaker the default profile', async () =>
  {
    // Arrange
    const rawConfig = JSON.stringify({
      bySpeakerName: { '\\N[1]': { voiceSeName: 'Cursor1' } },
    });

    // Act
    const resolver = await bootWithConfig(rawConfig);
    const profile = resolver.resolve('Some Passing Stranger', '', 0);

    // Assert
    expect(profile.hasVoice()).toBe(false);
  });
});
//endregion plugins/message/_component/speaker-profile-config.test.js