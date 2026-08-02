//region plugins/cms/ext/skill/_models/jcms-parameter-kvp.test.js
import { describe, expect, it } from 'vitest';
import JCMS_ParameterKvp from '../../../../../../src/plugins/cms/ext/skill/_models/JCMS_ParameterKvp.js';

describe('JCMS_ParameterKvp', () =>
{
  describe('constructor defaults', () =>
  {
    it('defaults value to null and colorId to 0 when omitted', () =>
    {
      // Arrange/Act
      const kvp = new JCMS_ParameterKvp('ATK');

      // Assert
      expect(kvp.name()).toEqual('ATK');
      expect(kvp.value()).toEqual(null);
      expect(kvp.color()).toEqual(0);
    });
  });

  describe('name', () =>
  {
    it('returns the name provided to the constructor', () =>
    {
      // Arrange
      const kvp = new JCMS_ParameterKvp('DEF', 12, 3);

      // Act
      const result = kvp.name();

      // Assert
      expect(result).toEqual('DEF');
    });
  });

  describe('value', () =>
  {
    it('returns the value provided to the constructor', () =>
    {
      // Arrange
      const kvp = new JCMS_ParameterKvp('DEF', 12, 3);

      // Act
      const result = kvp.value();

      // Assert
      expect(result).toEqual(12);
    });
  });

  describe('color', () =>
  {
    it('returns the colorId provided to the constructor', () =>
    {
      // Arrange
      const kvp = new JCMS_ParameterKvp('DEF', 12, 3);

      // Act
      const result = kvp.color();

      // Assert
      expect(result).toEqual(3);
    });
  });
});
//endregion plugins/cms/ext/skill/_models/jcms-parameter-kvp.test.js
