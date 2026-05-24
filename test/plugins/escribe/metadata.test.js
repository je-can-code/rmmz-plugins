//region plugins/escribe/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadEscribePluginVm } from './escribe-vm.js';

describe('J-Escriptions metadata (out/escribe/J-Escriptions.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadEscribePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('initializes J.ESCRIBE metadata and regex', () =>
  {
    expect(sandbox.J.ESCRIBE.Metadata.name).toBe('J-Escriptions');
    expect(sandbox.J.ESCRIBE.Metadata.version.major).toBe(1);
    expect(sandbox.J.ESCRIBE.Metadata.version.minor).toBe(0);
    expect(sandbox.J.ESCRIBE.Metadata.version.patch).toBe(0);
    expect(sandbox.J.ESCRIBE.RegExp.Text.test('<text:Hello>')).toBe(true);
  });
});
//endregion plugins/escribe/metadata.test.js
