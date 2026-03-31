//region plugins/escribe/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadEscribePluginVm } from './escribe-vm.js';

describe('J-Escriptions metadata (out/J-Escriptions.js)', () =>
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
    expect(sandbox.J.ESCRIBE.Metadata.Name).toBe('J-Escriptions');
    expect(sandbox.J.ESCRIBE.Metadata.Version).toBe('1.0.0');
    expect(sandbox.J.ESCRIBE.RegExp.Text.test('<text:Hello>')).toBe(true);
  });
});
//endregion plugins/escribe/metadata.test.js
