//region plugins/message/ext/chatter/__models/chatter-profile.test.js
import { describe, expect, it } from 'vitest';

import ChatterProfile from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterProfile.js';

/**
 * A profile is three layers of authoring flattened into one object, and the flattening is where it
 * can go wrong quietly: a merge that dropped a field would leave a character on a default nobody
 * asked for, which looks exactly like a default somebody did.
 *
 * So the override fixtures below give every field a value different from both the class default and
 * from each other. A merge that copied the wrong field into the right one would survive a fixture
 * where two of them happened to agree.
 */
describe('J-Message-Chatter ChatterProfile (direct src import)', () =>
{
  it('starts with nothing to say', () =>
  {
    // Arrange & Act
    const profile = ChatterProfile.default();

    // Assert- a default profile is the shape of the settings, not a character with opinions.
    expect(profile.lines()).toEqual([]);
    expect(profile.hasLines()).toBe(false);
  });

  it('starts on the defaults a project that has configured nothing gets', () =>
  {
    // Arrange & Act
    const profile = ChatterProfile.default();

    // Assert
    expect(profile.radius()).toBe(5);
    expect(profile.cooldown()).toBe(600);
    expect(profile.delay()).toBe(300);
    expect(profile.duration()).toBe(180);
    expect(profile.speed()).toBe(2);
    expect(profile.position()).toBe('top');
    expect(profile.background()).toBe('window');
  });

  it('draws an ordinary bubble by default', () =>
  {
    // Arrange & Act
    const profile = ChatterProfile.default();

    // Assert- the Show Text Background dropdown's own first entry, which is what chatter has always
    // been drawn as.
    expect(profile.backgroundType()).toBe(0);
  });

  it('draws a dimmed bubble for a character asked to think rather than speak', () =>
  {
    // Arrange
    const profile = ChatterProfile.fromValues({ background: 'dim' });

    // Act
    const background = profile.backgroundType();

    // Assert
    expect(background).toBe(1);
  });

  it('draws no bubble at all for a character asked for a transparent one', () =>
  {
    // Arrange
    const profile = ChatterProfile.fromValues({ background: 'transparent' });

    // Act
    const background = profile.backgroundType();

    // Assert
    expect(background).toBe(2);
  });

  it('falls back to an ordinary bubble for a background nobody recognises', () =>
  {
    // Arrange- a typo in a hand-written config, which is the only way one of these gets in.
    const profile = ChatterProfile.fromValues({ background: 'frosted' });

    // Act
    const background = profile.backgroundType();

    // Assert- the transparent form would vanish the backdrop entirely and read as the plugin being
    // broken, where an ordinary bubble at least stays legible while somebody finds the typo.
    expect(background).toBe(0);
  });

  it('reports a character with a pool as having something to say', () =>
  {
    // Arrange
    const profile = ChatterProfile.fromValues({ lines: [ 'Lovely weather.' ] });

    // Act
    const hasLines = profile.hasLines();

    // Assert
    expect(hasLines).toBe(true);
  });

  it('hangs beneath a character asked to sit at the bottom', () =>
  {
    // Arrange
    const profile = ChatterProfile.fromValues({ position: 'bottom' });

    // Act
    const below = profile.prefersBelow();

    // Assert
    expect(below).toBe(true);
  });

  it('floats above a character asked to sit in the middle', () =>
  {
    // Arrange- the near miss for `bottom`: middle is a real position an author can write, and it
    // puts a bubble above a character exactly as `top` does.
    const profile = ChatterProfile.fromValues({ position: 'middle' });

    // Act
    const below = profile.prefersBelow();

    // Assert
    expect(below).toBe(false);
  });

  it('leaves every field alone when the values say nothing', () =>
  {
    // Arrange
    const base = ChatterProfile.fromValues({
      lines: [ 'Half price today.' ],
      radius: 9,
      cooldown: 111,
      delay: 222,
      duration: 333,
      speed: 4,
      position: 'bottom',
      background: 'dim',
    });

    // Act
    const merged = ChatterProfile.overriddenBy(base, {});

    // Assert
    expect(merged.lines()).toEqual([ 'Half price today.' ]);
    expect(merged.radius()).toBe(9);
    expect(merged.cooldown()).toBe(111);
    expect(merged.delay()).toBe(222);
    expect(merged.duration()).toBe(333);
    expect(merged.speed()).toBe(4);
    expect(merged.position()).toBe('bottom');
    expect(merged.background()).toBe('dim');
  });

  it('takes every field the values do supply', () =>
  {
    // Arrange- each number is distinct from every other, so a merge reading the wrong key would put
    // a recognisably wrong value somewhere rather than landing on a plausible one.
    const base = ChatterProfile.default();

    // Act
    const merged = ChatterProfile.overriddenBy(base, {
      lines: [ 'Anything I can get you?' ],
      radius: 9,
      cooldown: 111,
      delay: 222,
      duration: 333,
      speed: 4,
      position: 'bottom',
      background: 'dim',
    });

    // Assert
    expect(merged.background()).toBe('dim');
    expect(merged.lines()).toEqual([ 'Anything I can get you?' ]);
    expect(merged.radius()).toBe(9);
    expect(merged.cooldown()).toBe(111);
    expect(merged.delay()).toBe(222);
    expect(merged.duration()).toBe(333);
    expect(merged.speed()).toBe(4);
    expect(merged.position()).toBe('bottom');
  });

  it('keeps an authored zero rather than falling back over it', () =>
  {
    // Arrange- a zero is a real answer for every one of these: no wait, no cooldown, no earshot
    // beyond the tile they stand on, and a speed of zero meaning the whole line at once.
    const base = ChatterProfile.default();

    // Act
    const merged = ChatterProfile.overriddenBy(base, {
      radius: 0,
      cooldown: 0,
      delay: 0,
      duration: 0,
      speed: 0,
    });

    // Assert
    expect(merged.radius()).toBe(0);
    expect(merged.cooldown()).toBe(0);
    expect(merged.delay()).toBe(0);
    expect(merged.duration()).toBe(0);
    expect(merged.speed()).toBe(0);
  });

  it('lays authored values over the defaults when there is no profile to merge onto', () =>
  {
    // Arrange & Act
    const profile = ChatterProfile.fromValues({ radius: 2 });

    // Assert- the one value given is taken, and everything else is still the default.
    expect(profile.radius()).toBe(2);
    expect(profile.cooldown()).toBe(600);
  });

  it('leaves the profile it merged from untouched', () =>
  {
    // Arrange
    const base = ChatterProfile.default();

    // Act
    ChatterProfile.overriddenBy(base, { radius: 9 });

    // Assert- the configured default is merged onto once per event on the map, so mutating it would
    // have the first chatty NPC on a map decide the radius for every one after them.
    expect(base.radius()).toBe(5);
  });
});
//endregion plugins/message/ext/chatter/__models/chatter-profile.test.js