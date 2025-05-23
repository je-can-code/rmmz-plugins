//region RPGManager
/**
 * A utility class for handling common database-related translations.
 */
class RPGManager
{
  /**
   * A quick and re-usable means of rolling for a chance of success.
   * This will roll `rollForPositive` times in an effort to get a successful roll.
   * If success is found and `rollsForNegative` is greater than 0, additional rolls of success will
   * be required or the negative rolls will undo the success.
   * @param {number} percentOfSuccess The percent chance of success.
   * @param {number=} rollForPositive The number of positive rolls to find success; defaults to 1.
   * @param {number=} rollForNegative The number of negative rolls to follow success; defaults to 0.
   * @returns {boolean} True if success, false otherwise.
   */
  static chanceIn100(percentOfSuccess, rollForPositive = 1, rollForNegative = 0)
  {
    // 0% chance skills should never trigger.
    if (percentOfSuccess <= 0) return false;

    // default fail.
    let success = false;

    // keep rolling for positive while we have positive rolls and aren't already successful.
    while (rollForPositive && !success)
    {
      // roll for effect!
      const chance = Math.randomInt(100) + 1;

      // check if the roll meets the chance criteria.
      if (chance <= percentOfSuccess)
      {
        // flag for success!
        success = true;
      }

      // decrement the positive roll counter.
      // eslint-disable-next-line no-param-reassign
      rollForPositive--;
    }

    // if successful and we have negative rerolls, lets get fight RNG for success!
    if (success && rollForNegative)
    {
      // keep rolling for negative while we have negative rerolls and are still successful.
      while (rollForNegative && success)
      {
        // roll for effect!
        const chance = Math.randomInt(100) + 1;

        // check if the roll meets the chance criteria.
        if (chance <= percentOfSuccess)
        {
          // we keep our flag! (this time...)
          success = true;
        }
        // we didn't meet the chance criteria this time.
        else
        {
          // undo our success and stop rolling :(
          return false;
        }

        // decrement the negative reroll counter.
        // eslint-disable-next-line no-param-reassign
        rollForNegative--;
      }
    }

    // return our successes (or failure).
    return success;
  }

  /**
   * Gets the last instance of a string matching the regex from the given database object.
   * @param {RPG_BaseItem} databaseData The database object to inspect.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {string|null} The string matching the structure, {@link String.empty} if not found, or null with the flag.
   */
  static getStringFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (!databaseData)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : String.empty;
    }

    // initialize the value.
    let val = String.empty;

    // get the note data from this skill.
    const lines = databaseData.note.split(/[\r\n]+/);

    // validate the notes to ensure there even are any.
    if (lines.length === 0)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : String.empty;
    }

    // iterate over each valid line of the note.
    lines.forEach(line =>
    {
      // grab the regex execution result for this note line.
      const result = structure.exec(line);

      // skip if we somehow encounter something amiss here.
      if (result === null) return;

      // extract the captured formula.
      const [ /* skip first index */, stringResult ] = result;

      // set this to what we found.
      val = stringResult;
    });

    // validate the actual findings to evaluate return values.
    if (!val)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : String.empty;
    }

    // return the found value.
    return val;
  }

  /**
   * Gets the last instance of a string matching the regex from the given database object collection.
   * @param {RPG_BaseItem[]} databaseDatas The database objects to inspect.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {string|null} A string if "nullIfEmpty=false", null otherwise.
   */
  static getStringFromAllNotesByRegex(databaseDatas, structure, nullIfEmpty = false)
  {
    // initialize the value.
    let val = String.empty;

    // iterate over each of the database objects for inspection.
    databaseDatas.forEach(databaseData =>
    {
      // capture what we found.
      const found = this.getStringFromNoteByRegex(databaseData, structure, nullIfEmpty);

      // validate we found something.
      if (found)
      {
        // and update the value with that finding.
        val = found;
      }
    }, this);

    // validate the actual value that was found.
    if (!val)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : String.empty;
    }

    // return what we found.
    return val;
  }

  /**
   * Gets the last numeric value based on the provided regex structure.
   *
   * This accepts a regex structure, assuming the capture group is an numeric value,
   * and adds all values together from each line in the notes that match the provided
   * regex structure.
   *
   * If the optional flag `nullIfEmpty` receives true passed in, then the result of
   * this will be `null` instead of the default 0 as an indicator we didn't find
   * anything from the notes of this skill.
   *
   * This can handle both integers and decimal numbers.
   * @param {RPG_Base} databaseData The database object to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean=} nullIfEmpty Whether or not to return 0 if not found, or null.
   * @returns {number|null} The combined value added from the notes of this object, or zero/null.
   */
  static getNumberFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (!databaseData)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : 0;
    }

    // get the note data from this skill.
    const lines = databaseData.note?.split(/[\r\n]+/) ?? [];

    // if we have no matching notes, then short circuit.
    if (!lines.length)
    {
      // return null or 0 depending on provided options.
      return nullIfEmpty
        ? null
        : 0;
    }

    // initialize the value.
    let val = null;

    // iterate over each valid line of the note.
    lines.forEach(line =>
    {
      // grab the regex execution result for this note line.
      const result = structure.exec(line);

      // skip if we somehow encounter something amiss here.
      if (result === null) return;

      // extract the captured formula.
      const [ /* skip first index */, numericResult ] = result;

      // regular parse it and add it to the running total.
      val = parseFloat(numericResult);
    });

    if (val === null)
    {
      // return null or 0 depending on provided options.
      return nullIfEmpty
        ? null
        : 0;
    }

    // return the value.
    return val;
  }

  /**
   * Gets the last numeric value based on the provided regex structure from a collection of database objects.
   *
   * This accepts a regex structure, assuming the capture group is an numeric value,
   * and adds all values together from each line in the notes that match the provided
   * regex structure.
   *
   * If the optional flag `nullIfEmpty` receives true passed in, then the result of
   * this will be `null` instead of the default 0 as an indicator we didn't find
   * anything from the notes of this skill.
   *
   * This can handle both integers and decimal numbers.
   * @param {RPG_Base[]} databaseDatas The database object to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean=} nullIfEmpty Whether or not to return 0 if not found, or null.
   * @returns {number|null} The combined value added from the notes of this object, or zero/null.
   */
  static getNumberFromAllNotesByRegex(databaseDatas, structure, nullIfEmpty = false)
  {
    // initialize the value.
    let val = 0;

    // iterate over each of the database objects for inspection.
    databaseDatas.forEach(databaseData =>
    {
      // capture what we found.
      const found = this.getNumberFromNoteByRegex(databaseData, structure, nullIfEmpty);

      // validate we found something.
      if (found)
      {
        // and update the value with that finding.
        val = found;
      }
    }, this);

    // validate the actual value that was found.
    if (!val)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : String.empty;
    }

    // return what we found.
    return val;
  }

  /**
   * Gets all numbers found in arrays on the database object provided.
   *
   * This accepts a regex structure, assuming the capture group is an numeric value,
   * and adds all values together from each line in the notes that match the provided
   * regex structure.
   *
   * If the optional flag `nullIfEmpty` receives true passed in, then the result of
   * this will be `null` instead of the default [] as an indicator we didn't find
   * anything from the notes of this skill.
   *
   * This can handle both integers and decimal numbers.
   * @param {RPG_Base} databaseData The database object to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean=} nullIfEmpty Whether or not to return [] if not found, or null.
   * @returns {number[]|null}
   */
  static getNumbersFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // initialize the collection.
    let vals = [];

    // validate we have a database object to work with.
    if (!databaseData)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : vals;
    }

    // capture what we found.
    const found = this.getArrayFromNotesByRegex(databaseData, structure, true);

    // validate we found something.
    if (found !== null)
    {
      // and update the value with that finding.
      vals = found;
    }

    // validate the actual value that was found.
    if (!vals.length)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : vals;
    }

    // filter out any possible nulls that we found.
    const noNullVals = vals.filter(ArrayHelper.NoNulls, this);

    // return what we found.
    return noNullVals;
  }

  /**
   * Gets all numbers found in arrays across the collection of database objects provided.
   *
   * This accepts a regex structure, assuming the capture group is an numeric value,
   * and adds all values together from each line in the notes that match the provided
   * regex structure.
   *
   * If the optional flag `nullIfEmpty` receives true passed in, then the result of
   * this will be `null` instead of the default [] as an indicator we didn't find
   * anything from the notes of this skill.
   *
   * This can handle both integers and decimal numbers.
   * @param {RPG_Base[]} databaseDatas The database object to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean=} nullIfEmpty Whether or not to return [] if not found, or null.
   * @returns {number|null} The combined value added from the notes of this object, or zero/null.
   */
  static getNumbersFromAllNotesByRegex(databaseDatas, structure, nullIfEmpty = false)
  {
    // initialize the collection.
    const vals = [];

    // iterate over each of the database objects for inspection.
    databaseDatas.forEach(databaseData =>
    {
      // capture what we found.
      const found = this.getNumbersFromNoteByRegex(databaseData, structure, true);

      // validate we found something.
      if (found !== null)
      {
        // and update the value with that finding.
        vals.push(...found);
      }
    }, this);

    // validate the actual value that was found.
    if (!vals.length)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : vals;
    }

    // return what we found.
    return noNullVals;
  }

  /**
   * Gets the sum of all values from the notes of a collection of database objects.
   * @param {RPG_BaseItem[]} databaseDatas The collection of database objects.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {number|null} A number if "nullIfEmpty=false", null otherwise.
   */
  static getSumFromAllNotesByRegex(databaseDatas, structure, nullIfEmpty = false)
  {
    // check to make sure we have a collection to work with.
    if (!databaseDatas.length)
    {
      // short circuit with null if we are using the flag, or 0 otherwise.
      return nullIfEmpty
        ? null
        : 0;
    }

    // initialize the value to 0.
    let val = 0;

    // iterate over each database object to get the values.
    databaseDatas.forEach(databaseData =>
    {
      // add the value from all the notes of each database object.
      val += this.getNumberFromNoteByRegex(databaseData, structure);
    });

    // check if we turned up empty and are using the nullIfEmpty flag.
    if (!val && nullIfEmpty)
    {
      // we are both, so return null.
      return null;
    }

    // return the value, or 0.
    return val;
  }

  /**
   * Gets the eval'd formulai of all values from the notes of a collection of database objects.
   * @param {RPG_BaseItem[]} databaseDatas The collection of database objects.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {number} baseParam The base parameter value for use within the formula(s) as the "b"; defaults to 0.
   * @param {RPG_BaseBattler=} context The context of which the formula(s) are using as the "a"; defaults to null.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {number|null} The calculated result from all formula summed together.
   */
  static getResultsFromAllNotesByRegex(databaseDatas, structure, baseParam = 0, context = null, nullIfEmpty = false)
  {
    // check to make sure we have a collection to work with.
    if (!databaseDatas.length)
    {
      // short circuit with null if we are using the flag, or 0 otherwise.
      return nullIfEmpty
        ? null
        : 0;
    }

    // initialize the value to 0.
    let val = 0;

    // scan all the database datas.
    databaseDatas.forEach(databaseData =>
    {
      // add the eval'd formulas from all the notes of each database object.
      val += databaseData.getResultsFromNotesByRegex(structure, baseParam, context);
    });

    // check if we turned up empty and are using the nullIfEmpty flag.
    if (!val && nullIfEmpty)
    {
      // we are both, so return null.
      return null;
    }

    // return the value, or 0.
    return val;
  }

  /**
   * Collects all {@link JABS_OnChanceEffect}s from the list of database objects.
   * @param {RPG_Base[]} databaseDatas The list of database objects to parse.
   * @param {RegExp} structure The on-chance-effect-templated regex structure to parse for.
   * @returns {JABS_OnChanceEffect[]}
   */
  static getOnChanceEffectsFromDatabaseObjects(databaseDatas, structure)
  {
    // initialize the collection.
    const onChanceEffects = [];

    // scan all the database datas.
    databaseDatas.forEach(databaseData =>
    {
      // build concrete on-chance-effects for each instance on the checkable.
      const onChanceEffectList = this.getOnChanceEffectsFromDatabaseObject(databaseData, structure);

      // add it to the collection.
      onChanceEffects.push(...onChanceEffectList);
    });

    // return what was found.
    return onChanceEffects;
  }

  /**
   * Collects all {@link JABS_OnChanceEffect}s from a single database objects.
   * @param {RPG_Base} databaseData The database object to retrieve on-chance effects from.
   * @param {RegExp} structure The on-chance-effect-templated regex structure to parse for.
   * @returns {JABS_OnChanceEffect[]} All found on-chance effects on this database object.
   */
  static getOnChanceEffectsFromDatabaseObject(databaseData, structure)
  {
    // scan the object for matching on-chance data based on the given regex.
    const foundDatas = databaseData.getArraysFromNotesByRegex(structure);

    // if we found no data, then don't bother.
    if (!foundDatas) return [];

    // determine the key based on the regexp provided.
    const key = J.BASE.Helpers.getKeyFromRegexp(structure);

    // a mapper function for mapping array data points to an on-chance effect.
    const mapper = data =>
    {
      // extract the data points from the array found.
      const [ skillId, chance ] = data;

      // return the built on-chance effect with the given data.
      return new JABS_OnChanceEffect(skillId, chance ?? 100, key);
    };

    // map all the found on-chance effects.
    const mappedOnChanceEffects = foundDatas.map(mapper, this);

    // return what we found.
    return mappedOnChanceEffects;
  }

  /**
   * Gets whether or not there is a matching regex tag on this database entry.
   *
   * Do be aware of the fact that with this type of tag, we are checking only
   * for existence, not the value. As such, it will be `true` if found, and `false` if
   * not, which may not be accurate. Pass `true` to the `nullIfEmpty` to obtain a
   * `null` instead of `false` when missing, or use a string regex pattern and add
   * something like `<someKey:true>` or `<someKey:false>` for greater clarity.
   *
   * This accepts a regex structure, but does not leverage a capture group.
   *
   * If the optional flag `nullIfEmpty` receives true passed in, then the result of
   * this will be `null` instead of the default `false` as an indicator we didn't find
   * anything from the notes of this skill.
   * @param {RPG_Base} databaseData The regular expression to filter notes by.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} nullIfEmpty Whether or not to return `false` if not found, or null.
   * @returns {boolean|null} The found value from the notes of this object, or empty/null.
   */
  static checkForBooleanFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (!databaseData)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : false;
    }

    // get the note data from this skill.
    const lines = databaseData.note.split(/[\r\n]+/);

    // initialize the value.
    let val = false;

    // default to not having a match.
    let hasMatch = false;

    // iterate over each valid line of the note.
    lines.forEach(line =>
    {
      // grab the regex execution result for this note line.
      const hasStructure = structure.test(line);

      // skip if we somehow encounter something amiss here.
      if (hasStructure)
      {
        // parse the value out of the regex capture group.
        val = true;

        // flag that we found a match.
        hasMatch = true;
      }
    });

    // check if we didn't find a match, and we want null instead of empty.
    if (!hasMatch && nullIfEmpty)
    {
      // return null.
      return null;
    }
    // we want a "false" or the found value.
    else
    {
      // return the found value.
      return val;
    }
  }

  /**
   * Gets whether or not there is a matching regex tag from a collection of database objects.
   *
   * Do be aware of the fact that with this type of tag, we are checking only
   * for existence, not the value. As such, it will be `true` if found, and `false` if
   * not, which may not be accurate. Pass `true` to the `nullIfEmpty` to obtain a
   * `null` instead of `false` when missing, or use a string regex pattern and add
   * something like `<someKey:true>` or `<someKey:false>` for greater clarity.
   *
   * This accepts a regex structure, but does not leverage a capture group.
   *
   * If the optional flag `nullIfEmpty` receives true passed in, then the result of
   * this will be `null` instead of the default `false` as an indicator we didn't find
   * anything from the notes of this skill.
   * @param {RPG_Base[]} databaseDatas The objects to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} nullIfEmpty Whether or not to return `false` if not found, or null.
   * @returns {boolean|null} The found value from the notes of this object, or empty/null.
   */
  static checkForBooleanFromAllNotesByRegex(databaseDatas, structure, nullIfEmpty = false)
  {
    // get all results from all objects that could have true/false/null values.
    const results = databaseDatas.map(databaseData => this.checkForBooleanFromNoteByRegex(
      databaseData,
      structure,
      nullIfEmpty));

    // filter away the non-values.
    const onlyTrueRemains = results
      .filter(result => result !== null)
      .filter(result => result !== false);

    // check if we have any truthy values remaining.
    if (onlyTrueRemains.length === 0)
    {
      // check if we turned up empty and are using the nullIfEmpty flag.
      if (nullIfEmpty)
      {
        // we are both, so return null.
        return null;
      }

      // we didn't find it.
      return false;
    }

    // by this point, we know we found at least one true.
    return true;
  }

  /**
   * Gets an array of arrays based on the provided regex structure.
   *
   * This accepts a regex structure, assuming the capture group is an array of values
   * all wrapped in hard brackets [].
   *
   * If the optional flag `tryParse` is true, then it will attempt to parse out
   * the array of values as well, including translating strings to numbers/booleans
   * and keeping array structures all intact.
   * @param {RPG_Base} databaseObject The database object to parse notes from.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} tryParse Whether or not to attempt to parse the found array.
   * @returns {any[][]|null} The array of arrays from the notes, or null.
   */
  static getArraysFromNotesByRegex(databaseObject, structure, tryParse = true)
  {
    // get the note data from this skill.
    const noteLines = databaseObject.note.split(/[\r\n]+/);

    // initialize the value.
    let val = [];

    // default to not having a match.
    let hasMatch = false;

    // iterate the note data array.
    noteLines.forEach(line =>
    {
      // check if this line matches the given regex structure.
      if (line.match(structure))
      {
        // extract the captured formula.
        const [ , result ] = structure.exec(line);

        // parse the value out of the regex capture group.
        val.push(result);

        // flag that we found a match.
        hasMatch = true;
      }
    });

    // if we didn't find a match, return null instead of attempting to parse.
    if (!hasMatch) return null;

    // check if we're going to attempt to parse it, too.
    if (tryParse)
    {
      // attempt the parsing.
      val = val.map(JsonMapper.parseObject, JsonMapper);
    }

    // return the found value.
    return val;
  }

  /**
   * Gets a single array based on the provided regex structure.
   *
   * This accepts a regex structure, assuming the capture group is an array of values
   * all wrapped in hard brackets [].
   *
   * If the optional flag `tryParse` is true, then it will attempt to parse out
   * the array of values as well, including translating strings to numbers/booleans
   * and keeping array structures all intact.
   * @param {string} databaseObject The contents of the note of a given object.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} tryParse Whether or not to attempt to parse the found array.
   * @param {boolean=} nullIfEmpty If this is true and nothing is found, null will be returned instead of empty array.
   * @returns {any[]|null} The array from the notes, or null.
   */
  static getArrayFromNotesByRegex(databaseObject, structure, tryParse = true, nullIfEmpty = false)
  {
    // get the note data from this skill.
    const noteLines = databaseObject.note.split(/[\r\n]+/);

    // initialize the value.
    let val = null;

    // default to not having a match.
    let hasMatch = false;

    // iterate the note data array.
    noteLines.forEach(line =>
    {
      // check if this line matches the given regex structure.
      if (line.match(structure))
      {
        // extract the captured formula.
        const [ , result ] = structure.exec(line);

        // parse the value out of the regex capture group.
        val = JSON.parse(result);

        // flag that we found a match.
        hasMatch = true;
      }
    });

    // if we didn't find a match, return null instead of attempting to parse.
    if (!hasMatch)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : [];
    }

    // check if we're going to attempt to parse it, too.
    if (tryParse)
    {
      // attempt the parsing.
      val = val.map(JsonMapper.parseObject, JsonMapper);
    }

    // return the found value.
    return val;
  }
}

//endregion RPGManager