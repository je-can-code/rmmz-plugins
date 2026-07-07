//region plugins/apt/ext/typed/ap-type-models.test.js
import { describe, expect, it } from 'vitest';

import ApTypeDisplayInfo from '../../../../../src/plugins/apt/ext/typed/_models/ApTypeDisplayInfo.js';
import ApTypeGrant from '../../../../../src/plugins/apt/ext/typed/_models/ApTypeGrant.js';
import ApTypeKey from '../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js';

describe('ApTypeKey', () =>
{
  it('coerces domain and id to their declared types', () =>
  {
    const key = new ApTypeKey('element', '3');

    expect(key.domain).toBe('element');
    expect(key.id).toBe(3);
  });

  it('equals compares by domain and id, not by reference', () =>
  {
    const a = new ApTypeKey('element', 3);
    const b = new ApTypeKey('element', 3);
    const differentId = new ApTypeKey('element', 4);
    const differentDomain = new ApTypeKey('weapontype', 3);

    expect(a.equals(b)).toBe(true);
    expect(a.equals(differentId)).toBe(false);
    expect(a.equals(differentDomain)).toBe(false);
  });

  it('exposes the known domain type constants', () =>
  {
    expect(ApTypeKey.DomainType).toEqual({
      Element: 'element',
      Weapon: 'weapontype',
      Skill: 'skilltype',
    });
  });
});

describe('ApTypeGrant', () =>
{
  it('coerces amount/id and normalizes domain to trimmed lowercase', () =>
  {
    const grant = new ApTypeGrant('10', '  Element  ', '3');

    expect(grant.amount).toBe(10);
    expect(grant.domain).toBe('element');
    expect(grant.id).toBe(3);
  });

  it('toKey builds an ApTypeKey matching this grant\'s domain and id', () =>
  {
    const grant = new ApTypeGrant(10, 'weapontype', 7);
    const key = grant.toKey();

    expect(key).toBeInstanceOf(ApTypeKey);
    expect(key.domain).toBe('weapontype');
    expect(key.id).toBe(7);
  });

  it('two grants with the same domain/id produce keys that are equal', () =>
  {
    const grantA = new ApTypeGrant(10, 'Element', 3);
    const grantB = new ApTypeGrant(999, 'ELEMENT', 3);

    expect(grantA.toKey().equals(grantB.toKey())).toBe(true);
  });
});

describe('ApTypeDisplayInfo', () =>
{
  it('coerces name and icon to their declared types', () =>
  {
    const info = new ApTypeDisplayInfo('Fire', '64');

    expect(info.name).toBe('Fire');
    expect(info.icon).toBe(64);
  });
});
//endregion plugins/apt/ext/typed/ap-type-models.test.js
