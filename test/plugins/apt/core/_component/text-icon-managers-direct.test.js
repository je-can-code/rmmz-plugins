//region plugins/apt/core/_component/text-icon-managers-direct.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('TextManager / IconManager aptitude additions (direct src import)', () =>
{
  beforeAll(async () =>
  {
    // both files patch onto the bare `TextManager`/`IconManager` globals RMMZ provides ambiently;
    // stub them as plain objects before importing the patch files.
    globalThis.TextManager = {};
    globalThis.IconManager = {};

    await import('../../../../../src/plugins/apt/core/managers/TextManager.js');
    await import('../../../../../src/plugins/apt/core/managers/IconManager.js');
  });

  afterAll(() =>
  {
    delete globalThis.TextManager;
    delete globalThis.IconManager;
  });

  it('TextManager.aptRate returns the display label', () =>
  {
    expect(globalThis.TextManager.aptRate()).toBe('Aptitude UP');
  });

  it('TextManager.aptRateDescription returns a two-line description', () =>
  {
    const description = globalThis.TextManager.aptRateDescription();

    expect(description).toEqual([
      'Bonus multiplier applied to aptitude point gains.',
      'Higher values accelerate skill mastery through aptitude tracks.',
    ]);
  });

  it('IconManager.aptRate returns the fixed icon index', () =>
  {
    expect(globalThis.IconManager.aptRate()).toBe(79);
  });
});
//endregion plugins/apt/core/_component/text-icon-managers-direct.test.js
