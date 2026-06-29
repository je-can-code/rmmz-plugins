//region RPGManager
import RPG_Base from './../database/base/RPG_Base.js';
import JsonMapper from './../_utilities/JsonMapper.js';
import ArrayHelper from './../_utilities/ArrayHelper.js';

/**
 * A utility class for handling common database-related translations.
 */
class RPGManager
{
  //region caching
  /**
   * The cache for storing parsed note data.
   * @type {WeakMap<object, Map<string, any>>}
   */
  static _cache = new WeakMap();

  /**
   * The metrics for this manager.
   * @type {{ hits: number, misses: number }}
   */
  static _metrics = {
    hits: 0,
    misses: 0,
  };

  /**
   * Gets or initializes the cache for the given object.
   * @param {object} object The object to get or initialize the cache for.
   * @returns {Map<string, any>} The cache for the object.
   */
  static getOrCreateCacheForObject(object)
  {
    // resolve to the underlying source object so clones share a cache entry with their original.
    const cacheTarget = object instanceof RPG_Base
      ? object._original()
      : object;

    // check if the cache for this object already exists.
    const cacheHit = this._cache.get(cacheTarget);

    // if it does exist, return it.
    if (cacheHit) return cacheHit;

    // it doesn't exist yet, so create it.
    const newCache = new Map();
    this._cache.set(cacheTarget, newCache);

    // return the newly created cache.
    return newCache;
  }

  /**
   * Gets the cached data for the given object and tag key.
   * @param {object} object The object to get the cached data for.
   * @param {string} tagKey The tag key to get the cached data for.
   * @param {Function} computeFn The function to compute the data if it doesn't exist.
   * @returns {any} The cached data for the object and tag key.
   */
  static cached(object, tagKey, computeFn)
  {
    // grab the cache for this object.
    const cache = this.getOrCreateCacheForObject(object);

    // check if the cache is missing this tag.
    if (cache.has(tagKey) === false)
    {
      this._metrics.misses++;

      // compute the data and cache it.
      const data = computeFn();
      cache.set(tagKey, data);
    }
    else
    {
      this._metrics.hits++;
    }

    // return the cached data.
    return cache.get(tagKey);
  }

  /**
   * Invalidates the cache for the given object.
   * @param {object} object The object to invalidate the cache for.
   * @returns {boolean} True if the cache was invalidated, false otherwise.
   */
  static invalidate(object)
  {
    // resolve to the same cache key used by getOrCreateCacheForObject so the delete actually hits.
    const cacheTarget = object instanceof RPG_Base
      ? object._original()
      : object;
    return this._cache.delete(cacheTarget);
  }

  /**
   * Clears the cache for all objects.
   */
  static clearCache()
  {
    this._cache = new WeakMap();
  }

  //endregion caching

  //region chance
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
   * A quick and re-usable means of rolling for chance using a weighted model against a map of (key=id,val=weight).
   * @param {Map<any,number>} map The map of key-value pairs to choose from.
   * @param {number} totalWeight The total weight of all values in the map.
   * @returns {any|null} The chosen key or null if no valid choice is found.
   */
  static weightedMapChoice(map, totalWeight)
  {
    // if there is no total weight, then this doesn't work.
    if (totalWeight <= 0) return null;

    // bless me, RNGesus.
    let r = Math.random() * totalWeight;

    // iterate over each entry in the map.
    for (const [ key, val ] of map)
    {
      // if the value is empty, then skip it.
      if (val <= 0) continue;

      // decrement the remaining weight.
      r -= val;

      // check if the random number is less than zero.
      if (r < 0) return key;
    }

    // somehow, we didn't find anything, so return null.
    return null;
  }
  //endregion chance

  //region strings
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
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : String.empty;
    }

    // define the unique key for this regex and option set.
    const key = `str:${structure.source}::${structure.flags}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getStringFromNoteByRegex(databaseData, structure, nullIfEmpty)
    );
  }

  /**
   * Gets the last instance of a string matching the regex from the given database object.
   * @param {RPG_BaseItem} databaseData The database object to inspect.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {string|null} The string matching the structure, {@link String.empty} if not found, or null with the flag.
   */
  static #getStringFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // build a non-global, non-sticky scanner to avoid lastIndex side effects across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

    // initialize the value.
    let val = String.empty;

    // get the note data from this object.
    const lines = databaseData.note.split(/[\r\n]+/);

    // iterate over each valid line of the note.
    lines.forEach(line =>
    {
      // grab the regex execution result for this note line.
      const result = scan.exec(line);

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
   * Gathers all string instances matching the regex from the given database object.
   * @param {RPG_BaseItem} databaseData The database object to inspect.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {string[]|null} The array of strings matching the structure, or an empty array if not found, or null.
   */
  static getStringsFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : Array.empty;
    }

    // define the unique key for this regex and option set.
    const key = `str[]:${structure.source}::${structure.flags}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getStringsFromNoteByRegex(databaseData, structure, nullIfEmpty)
    );
  }

  /**
   * Gathers all string instances matching the regex from the given database object.
   * @param {RPG_BaseItem} databaseData The database object to inspect.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {string[]|null} The array of strings matching the structure, or an empty array if not found, or null.
   */
  static #getStringsFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // build a non-global, non-sticky scanner to avoid lastIndex side effects across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

    // initialize the value.
    const val = [];

    // get the note data from this skill.
    const lines = databaseData.note.split(/[\r\n]+/);

    // iterate over each valid line of the note.
    lines.forEach(line =>
    {
      // grab the regex execution result for this note line.
      const result = scan.exec(line);

      // skip if we somehow encounter something amiss here.
      if (result === null) return;

      // extract the captured formula.
      const [ /* skip first index */, stringResult ] = result;

      // set this to what we found.
      val.push(stringResult);
    });

    // validate the actual findings to evaluate return values.
    if (val.length === 0)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : [];
    }

    // return the found value.
    return val;
  }

  //endregion strings

  //region numbers
  /**
   * Gets the last numeric value based on the provided regex structure.
   *
   * If the optional flag `nullIfEmpty` receives true passed in, then the result of
   * this will be `null` instead of the default 0 as an indicator we didn't find
   * anything from the notes of this skill.
   *
   * This can handle both integers and decimal numbers.
   * @param {RPG_Base} databaseData The database object to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean=} nullIfEmpty Whether or not to return 0 if not found, or null.
   * @returns {number|null} The last value from the notes of this object, or zero/null.
   */
  static getNumberFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : 0;
    }

    // define the unique key for this regex and option set.
    const key = `num:${structure.source}::${structure.flags}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getNumberFromNoteByRegex(databaseData, structure, nullIfEmpty)
    );
  }

  /**
   * Gets the last numeric value based on the provided regex structure.
   * @param {RPG_Base} databaseData The database object to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean=} nullIfEmpty Whether or not to return 0 if not found, or null.
   * @returns {number|null} The last value from the notes of this object, or zero/null.
   */
  static #getNumberFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // build a non-global, non-sticky scanner to avoid lastIndex side effects across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

    // get the note data from this skill.
    const lines = databaseData.note.split(/[\r\n]+/);

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
      const result = scan.exec(line);

      // skip if we somehow encounter something amiss here.
      if (result === null) return;

      // extract the captured formula.
      const [ /* skip first index */, numericResult ] = result;

      // regular parse it and update the value.
      val = parseFloat(numericResult);
    });

    // check if we found anything.
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
   * Gathers all numbers found in arrays on the database object provided.
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
    // validate we have a database object to work with.
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : Array.empty;
    }

    // define the unique key for this regex and option set.
    const key = `num[]:${structure.source}::${structure.flags}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getNumbersFromNoteByRegex(databaseData, structure, nullIfEmpty)
    );
  }

  /**
   * Gathers all numbers found in arrays on the database object provided.
   * @param {RPG_Base} databaseData The database object to inspect.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean=} nullIfEmpty Whether or not to return [] if not found, or null.
   * @returns {number[]|null}
   */
  static #getNumbersFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // initialize the collection.
    let vals = [];

    // capture what we found.
    const found = this.getArrayFromNotesByRegex(databaseData, structure, true, true);

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

  //endregion numbers

  //region eval numbers
  /**
   * Get the eval'd formula of all matching values from the notes of a single database object.
   * @param {RPG_Base} databaseData The database object to parse the notes of.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {number} baseParam The base parameter value for use within the formula(s) as the "b"; defaults to 0.
   * @param {RPG_BaseBattler=} context The context of which the formula(s) are using as the "a"; defaults to null.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {number|null} The calculated result from all formula summed together.
   */
  static getResultFromNoteByRegex(databaseData, structure, baseParam, context = null, nullIfEmpty = false)
  {
    // if we have no matching notes, then short circuit.
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // return null or 0 depending on provided options.
      return nullIfEmpty
        ? null
        : 0;
    }

    // define the unique key for this regex and option set.
    const key = `eval:${structure.source}::${structure.flags}::${baseParam}${this.#getEvalCacheContextSuffix(context)}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getResultFromNoteByRegex(databaseData, structure, baseParam, context, nullIfEmpty)
    );
  }

  /**
   * Builds a cache-key fragment for formula evaluation when battler context can change.
   * Without this, {@code a.level} (and similar) would stay frozen at the first value cached per note object.
   * @param {RPG_BaseBattler|null} context The formula context ("a").
   * @returns {string} Suffix to append to eval cache keys, or empty when there is no context.
   */
  static #getEvalCacheContextSuffix(context)
  {
    // no context means no level-sensitive cache busting is needed.
    if (!context) return '';

    // all battlers expose getLevel() via J-Level; append it to bust the cache per level.
    return `::ctxLvl=${context.getLevel()}`;
  }

  /**
   * Get the eval'd formula of all matching values from the notes of a single database object.
   * @param {RPG_Base} databaseData The database object to parse the notes of.
   * @param {RegExp} structure The RegExp structure to find values for.
   * @param {number} baseParam The base parameter value for use within the formula(s) as the "b"; defaults to 0.
   * @param {RPG_BaseBattler=} context The context of which the formula(s) are using as the "a"; defaults to null.
   * @param {boolean=} nullIfEmpty Whether or not to return null if we found nothing; defaults to false.
   * @returns {number|null} The calculated result from all formula summed together.
   */
  static #getResultFromNoteByRegex(databaseData, structure, baseParam, context = null, nullIfEmpty = false)
  {
    // get the note data from this object.
    const lines = databaseData.note.split(/[\r\n]+/);

    // initialize the value.
    let val = 0;

    // establish a variable to be used as "a" in the formula- the battler.
     
    const a = context;

    // establish a variable to be used as "b" in the formula- the base parameter value.
    // eslint-disable-next-line no-unused-vars
    const b = baseParam;

    // establish a variable to be used as "v" in the formula- access to variables if needed.
    // eslint-disable-next-line no-unused-vars
    const v = $gameVariables._data;

    // build a non-global, non-sticky scanner so `/g` patterns do not carry lastIndex across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

    // iterate over each valid line of the note.
    lines.forEach(line =>
    {
      // grab the regex execution result for this note line.
      const result = scan.exec(line);

      // if there is no result, then skip.
      if (result === null) return;

      // extract the captured formula.
      const [ , formula ] = result;

      // use diapers when evaluating the formula.
      try
      {
        // evaluate the formula/value with the scoped context variables.
        const evalResult = new Function('a', 'b', 'v', `return (${formula})`)(a, b, v)
          .toFixed(3);

        // add it to the running total.
        val += parseFloat(evalResult);
      }
      catch (error)
      {
        console.error(`An error occurred while evaluating the formula: [${formula}].`);
        console.error(error);
      }
    });

    if (!val && nullIfEmpty)
    {
      return null;
    }

    // return the calculated summed value.
    return val;
  }

  /**
   * Gets the eval'd formulai of all values from the notes of a collection of database objects.
   * It is intended that the regex structure provided will be a numeric formula.
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
      val += this.getResultFromNoteByRegex(databaseData, structure, baseParam, context);
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

  //endregion eval numbers

  //region booleans
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
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : false;
    }

    // define the unique key for this regex and option set.
    const key = `bool:${structure.source}::${structure.flags}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#checkForBooleanFromNoteByRegex(databaseData, structure, nullIfEmpty)
    );
  }

  /**
   * Gets whether or not there is a matching regex tag on this database entry.
   * @param {RPG_Base} databaseData The regular expression to filter notes by.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} nullIfEmpty Whether or not to return `false` if not found, or null.
   * @returns {boolean|null} The found value from the notes of this object, or empty/null.
   */
  static #checkForBooleanFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // build a non-global, non-sticky scanner to avoid lastIndex side effects across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

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
      const hasStructure = scan.test(line);

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
    if (hasMatch === false && nullIfEmpty)
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
      nullIfEmpty
    ));

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

  //endregion booleans

  //region arrays
  /**
   * Gets an array of arrays based on the provided regex structure.
   *
   * This accepts a regex structure, assuming the capture group is an array of values
   * all wrapped in hard brackets [].
   *
   * If the optional flag `tryParse` is true, then it will attempt to parse out
   * the array of values as well, including translating strings to numbers/booleans
   * and keeping array structures all intact.
   * @param {RPG_Base} databaseData The database object to parse notes from.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} tryParse Whether or not to attempt to parse the found array.
   * @param {boolean} nullIfEmpty Whether or not to return null if nothing is found.
   * @returns {any[][]|null} The array of arrays from the notes, or null.
   */
  static getArraysFromNotesByRegex(databaseData, structure, tryParse = true, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : [];
    }

    // define the unique key for this regex and option set.
    const key = `any[][]:${structure.source}::${structure.flags}::tryParse=${tryParse}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getArraysFromNotesByRegex(databaseData, structure, tryParse, nullIfEmpty)
    );
  }

  /**
   * Gets an array of arrays based on the provided regex structure.
   * @param {RPG_Base} databaseData The database object to parse notes from.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} tryParse Whether or not to attempt to parse the found array.
   * @param {boolean} nullIfEmpty Whether or not to return null if nothing is found.
   * @returns {any[][]|null} The array of arrays from the notes, or null.
   */
  static #getArraysFromNotesByRegex(databaseData, structure, tryParse = true, nullIfEmpty = false)
  {
    // build a non-global, non-sticky scanner to avoid lastIndex side effects across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

    // get the note data from this skill.
    const lines = databaseData.note.split(/[\r\n]+/);

    // initialize the value.
    let val = [];

    // default to not having a match.
    let hasMatch = false;

    // iterate the note data array.
    lines.forEach(line =>
    {
      // grab the regex execution result for this note line.
      const result = scan.exec(line);

      // if there is no result, then skip.
      if (result === null) return;

      // extract the captured formula.
      const [ , match ] = result;

      // parse the value out of the regex capture group.
      val.push(match);

      // flag that we found a match.
      hasMatch = true;
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

  /**
   * Gets a single array based on the provided regex structure.
   *
   * This accepts a regex structure, assuming the capture group is an array of values
   * all wrapped in hard brackets [].
   *
   * If the optional flag `tryParse` is true, then it will attempt to parse out
   * the array of values as well, including translating strings to numbers/booleans
   * and keeping array structures all intact.
   * @param {RPG_Base} databaseData The contents of the note of a given object.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} tryParse Whether or not to attempt to parse the found array.
   * @param {boolean=} nullIfEmpty If this is true and nothing is found, null will be returned instead of empty array.
   * @returns {any[]|null} The array from the notes, or null.
   */
  static getArrayFromNotesByRegex(databaseData, structure, tryParse = true, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : [];
    }

    // define the unique key for this regex and option set.
    const key = `any[]:${structure.source}::${structure.flags}::tryParse=${tryParse}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getArrayFromNotesByRegex(databaseData, structure, tryParse, nullIfEmpty)
    );
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
   * @param {RPG_Base} databaseData The contents of the note of a given object.
   * @param {RegExp} structure The regular expression to filter notes by.
   * @param {boolean} tryParse Whether or not to attempt to parse the found array.
   * @param {boolean=} nullIfEmpty If this is true and nothing is found, null will be returned instead of empty array.
   * @returns {any[]|null} The array from the notes, or null.
   */
  static #getArrayFromNotesByRegex(databaseData, structure, tryParse = true, nullIfEmpty = false)
  {
    // build a non-global, non-sticky scanner to avoid lastIndex side effects across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

    // get the note data from this skill.
    const lines = databaseData.note.split(/[\r\n]+/);

    // initialize the value.
    let val = null;

    // default to not having a match.
    let hasMatch = false;

    // iterate the note data array.
    lines.forEach(line =>
    {
      // check if this line matches the given regex structure.
      if (line.match(structure))
      {
        // extract the captured formula.
        const [ , result ] = scan.exec(line);

        // parse the value out of the regex capture group.
        val = JsonMapper.parseObject(result);

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

  //region on-chance effects
  /**
   * Collects all {@link JABS_OnChanceEffect}s from a single database objects.
   * @param {RPG_Base} databaseData The database object to retrieve on-chance effects from.
   * @param {RegExp} structure The on-chance-effect-templated regex structure to parse for.
   * @returns {JABS_OnChanceEffect[]} All found on-chance effects on this database object.
   */
  static getOnChanceEffectsFromDatabaseObject(databaseData, structure)
  {
    // scan the object for matching on-chance data based on the given regex.
    const foundDatas = this.getArraysFromNotesByRegex(databaseData, structure, true);

    // if we found no data, then don't bother.
    if (!foundDatas) return [];

    // determine the key based on the regexp provided.
    const key = J.BASE.Helpers.getKeyFromRegexp(structure);

    // a mapper function for mapping array data points to an on-chance effect.
    const mapper = data =>
    {
      // extract the data points from the array found.
      const [ skillId, chance, hitTypeString ] = data;

      // resolve the optional hit type string to its numeric constant.
      const hitType = RPGManager.resolveHitTypeString(hitTypeString);

      // return the built on-chance effect with the given data.
      return new JABS_OnChanceEffect(skillId, chance ?? 100, key, hitType);
    };

    // map all the found on-chance effects.
    const mappedOnChanceEffects = foundDatas.map(mapper, this);

    // return what we found.
    return mappedOnChanceEffects;
  }

  /**
   * Resolves an optional hit type string from a notetag into its numeric constant.
   * Accepts "physical", "magical", or "certain" (case-insensitive).
   * Returns null when the string is absent or unrecognised, meaning any hit type matches.
   * @param {string|undefined} str The raw string from the parsed notetag array.
   * @returns {number|null}
   */
  static resolveHitTypeString(str)
  {
    if (!str) return null;

    switch (str.toLowerCase())
    {
      case 'physical': return Game_Action.HITTYPE_PHYSICAL;
      case 'magical':  return Game_Action.HITTYPE_MAGICAL;
      case 'certain':  return Game_Action.HITTYPE_CERTAIN;
      default:         return null;
    }
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

  //endregion on-chance effects
  //endregion arrays

  //region captures
  /**
   * Gets all capture groups (excluding the full match) for every note line that matches the regex.
   *
   * Each matching line contributes one entry to the result array. The entry is an array of strings
   * corresponding to the capture groups for that match (index 1..n of the RegExp exec result).
   *
   * Example:
   *   Regex: /<on-(hit|use):affect-(self|allies|target|enemies|all):\[([+\-/ ().\w]+)]>/gi
   *   Line:  "<on-hit:affect-self:[a.atk * 400]>"
   *   Pushes: [ "hit", "self", "a.atk * 400" ]
   *
   * @param {RPG_BaseItem} databaseData The database object to inspect.
   * @param {RegExp} structure The regular expression to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return [] if not found, or null.
   * @returns {string[][]|null} An array of capture arrays, or null.
   */
  static getAllCapturesFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // validate the incoming data object.
    if (this.#canParsedatabaseData(databaseData) === false)
    {
      // handle the return.
      return nullIfEmpty
        ? null
        : [];
    }

    // define the unique key for this regex and option set.
    const key = `captures:${structure.source}::${structure.flags}::nullIfEmpty=${nullIfEmpty}`;

    // grab the result (potentially cached).
    return this.cached(
      databaseData,
      key,
      () => this.#getAllCapturesFromNoteByRegex(databaseData, structure, nullIfEmpty)
    );
  }

  /**
   * Gets all capture groups (excluding the full match) for every note line that matches the regex.
   * @param {RPG_BaseItem} databaseData The database object to inspect.
   * @param {RegExp} structure The regular expression to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return [] if not found, or null.
   * @returns {string[][]|null} An array of capture arrays, or null.
   */
  static #getAllCapturesFromNoteByRegex(databaseData, structure, nullIfEmpty = false)
  {
    // build a non-global, non-sticky scanner to avoid lastIndex side effects across lines.
    const safeFlags = structure.flags
      .replace('g', '')
      .replace('y', '');
    const scan = new RegExp(structure.source, safeFlags);

    // get the note data from this object (split by newlines).
    const lines = databaseData.note.split(/[\r\n]+/);

    // initialize the collection of capture arrays.
    const captures = [];

    // iterate over each valid line of the note.
    lines.forEach(line =>
    {
      // execute the structure against this line.
      const result = scan.exec(line);

      // skip if it didn’t match.
      if (!result) return;

      // slice off the full match, keep only capture groups 1..n.
      const groups = result.slice(1);

      // push the capture group array.
      captures.push(groups);
    });

    // check if we found nothing and want null.
    if (captures.length === 0 && nullIfEmpty)
    {
      // return null.
      return null;
    }

    // return all captures.
    return captures;
  }

  /**
   * Gets all capture arrays from a collection of database objects.
   *
   * See {@link RPGManager.getAllCapturesFromNoteByRegex} for details on the shape
   * of the returned values for each matching tag.
   *
   * @param {RPG_BaseItem[]} databaseDatas The database objects to inspect.
   * @param {RegExp} structure The regular expression to find values for.
   * @param {boolean=} nullIfEmpty Whether or not to return [] if not found, or null.
   * @returns {string[][]|null} All capture arrays found across all provided objects.
   */
  static getAllCapturesFromAllNotesByRegex(databaseDatas, structure, nullIfEmpty = false)
  {
    // initialize the collection of capture arrays.
    const captures = [];

    // iterate over each of the database objects for inspection.
    databaseDatas.forEach(databaseData =>
    {
      // gather captures from this one object.
      const found = this.getAllCapturesFromNoteByRegex(databaseData, structure);

      // if any found, concatenate into the running collection.
      if (found.length)
      {
        captures.push(...found);
      }
    }, this);

    // return null if nothing found and nullIfEmpty requested.
    if (!captures.length && nullIfEmpty)
    {
      return null;
    }

    // return captures (possibly empty array).
    return captures;
  }

  //endregion captures

  /**
   * Determines whether the database object can have its note parsed.
   * @param {RPG_Base} databaseData The database object to inspect.
   * @returns {boolean} True if it can be parsed, false otherwise.
   */
  static #canParsedatabaseData(databaseData)
  {
    // non-objects cannot be parsed.
    if (!databaseData) return false;

    // objects without a note cannot be parsed.
    if (databaseData && !databaseData.note) return false;

    // this can be parsed!
    return true;
  }
}

export default RPGManager;
//endregion RPGManager