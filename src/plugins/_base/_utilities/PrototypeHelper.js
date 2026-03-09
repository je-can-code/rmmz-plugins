//region Prototype Helper
// TODO: consider using this.
/**
 * A helper class for wiring up properties and getters for RPG Maker database objects.
 */
class PrototypeHelper
{
  /**
   * Wires up a property + getter for number tags on a single database object.
   */
  static defineJabsNumberTag(proto, propName, getName, regex, required)
  {
    // Define the public getter method once.
    proto[getName] = function()
    {
      // Extract and return the numeric value based on the provided regex
      // using the current instance as the database object context.
      return RPGManager.getNumberFromNoteByRegex(this, regex, required);
    };

    // Define the property that calls the getter.
    Object.defineProperty(proto, propName, {
      get: function()
      {
        // Proxy through the method for symmetry and testability.
        return this[getName]();
      },
    });
  }

  /**
   * Wires up a property + getter for string tags on a single database object.
   */
  static defineStringTag(proto, propName, getName, regex, nullIfEmpty)
  {
    // Define the public getter method once.
    proto[getName] = function()
    {
      // Extract and return the string value from notes via RPGManager.
      return RPGManager.getStringFromNoteByRegex(this, regex, nullIfEmpty);
    };

    // Define the property that calls the getter.
    Object.defineProperty(proto, propName, {
      get: function()
      {
        // Proxy through the method for symmetry and testability.
        return this[getName]();
      },
    });
  }

  /**
   * Wires up a property + getter for array-of-numbers tags on a single database object.
   */
  static defineNumbersArrayTag(proto, propName, getName, regex, nullIfEmpty)
  {
    // Define the public getter method once.
    proto[getName] = function()
    {
      // Extract and return the numeric array based on the provided regex.
      return RPGManager.getNumbersFromNoteByRegex(this, regex, nullIfEmpty);
    };

    // Define the property that calls the getter.
    Object.defineProperty(proto, propName, {
      get: function()
      {
        // Proxy through the method for symmetry and testability.
        return this[getName]();
      },
    });
  }

  /**
   * Wires a property + getter that aggregates across multiple database objects.
   * You supply a function that, at runtime, returns the collection to inspect.
   */
  static defineAggregateNumberTag(proto, propName, getName, regex, nullIfEmpty, collectionGetter)
  {
    // Define the public getter method once.
    proto[getName] = function()
    {
      // Obtain the collection (ex: states, equips, etc.) from this instance.
      const datas = collectionGetter.call(this);

      // Extract and return the aggregated numeric value across the collection.
      return RPGManager.getNumberFromAllNotesByRegex(datas, regex, nullIfEmpty);
    };

    // Define the property that calls the getter.
    Object.defineProperty(proto, propName, {
      get: function()
      {
        // Proxy through the method for symmetry and testability.
        return this[getName]();
      },
    });
  }
}

//endregion Prototype Helper