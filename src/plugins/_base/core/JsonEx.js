//region JsonEx
import SerializableRegistry from './SerializableRegistry.js';

/**
 * Extends {@link JsonEx._encode}.<br/>
 * Also encodes native `Map`/`Set` instances. Their real key/value storage lives in an engine-internal
 * slot invisible to `Object.keys()`, so without this they never match the original algorithm's
 * `[object Object]`/`[object Array]` type-tag gate below and get silently serialized as an empty `{}`
 * by the raw `JSON.stringify()` call in {@link JsonEx.stringify}.
 */
J.BASE.Aliased.JsonEx.set('_encode', JsonEx._encode);
JsonEx._encode = function(value, depth)
{
  // enforce the same recursion ceiling the original algorithm uses, before doing anything else.
  if (depth >= this.maxDepth)
  {
    throw new Error('Object too deep');
  }

  // a Map's real entries live outside Object.keys()' reach, so encode them into a plain, restorable
  // shape up front instead of letting them fall through to the generic walk below (which would skip
  // them entirely, since their type tag isn't "[object Object]"/"[object Array]").
  if (value instanceof Map)
  {
    return {
      '@': 'Map',
      entries: [ ...value.entries() ].map(([ key, val ]) => [ this._encode(key, depth + 1), this._encode(val, depth + 1) ]),
    };
  }

  // a Set's real values have the same engine-internal-slot problem as a Map's entries above.
  if (value instanceof Set)
  {
    return {
      '@': 'Set',
      values: [ ...value ].map(val => this._encode(val, depth + 1)),
    };
  }

  // determine the type of value we're working with.
  const type = Object.prototype.toString.call(value);

  // handle objects and arrays only.
  if (type === '[object Object]' || type === '[object Array]')
  {
    // grab the constructor's name so it can be tagged for restoration later, unless it's a plain shape.
    const constructorName = value.constructor.name;
    if (constructorName !== 'Object' && constructorName !== 'Array')
    {
      value['@'] = constructorName;
    }

    // recursively encode every key on this object/array.
    for (const key of Object.keys(value))
    {
      value[key] = this._encode(value[key], depth + 1);
    }
  }

  // return the fully-encoded value.
  return value;
};

/**
 * Extends {@link JsonEx._decode}.<br/>
 * Also resolves constructors via {@link SerializableRegistry} before falling back to the engine's
 * default `window[className]` lookup, and reconstructs `Map`/`Set` instances encoded by the
 * {@link JsonEx._encode} extension above.
 */
J.BASE.Aliased.JsonEx.set('_decode', JsonEx._decode);
JsonEx._decode = function(value)
{
  // determine the type of object we're working with.
  const type = Object.prototype.toString.call(value);

  // handle objects and arrays only.
  if (type === '[object Object]' || type === '[object Array]')
  {
    // Map/Set were tagged '@': 'Map'/'Set' by the _encode extension above, with their real state moved
    // into an entries/values array- their internal storage can't be restored by Object.setPrototypeOf
    // like an ordinary class below, so reconstruct them directly via their real constructor instead.
    if (value['@'] === 'Map')
    {
      return new Map(value.entries.map(([ key, val ]) => [ this._decode(key), this._decode(val) ]));
    }

    if (value['@'] === 'Set')
    {
      return new Set(value.values.map(val => this._decode(val)));
    }

    // check if this object has a constructor tag.
    if (value['@'])
    {
      // grab the constructor name from the tag.
      const constructorName = value['@'];

      // resolve the constructor by registry-first, window-second.
      const constructor = SerializableRegistry.resolve(constructorName) || window[constructorName];

      // if the constructor could be resolved, then set the prototype.
      if (constructor)
      {
        Object.setPrototypeOf(value, constructor.prototype);
      }
    }

    // recursively decode all keys for this object.
    Object.keys(value)
      .forEach(key =>
      {
        value[key] = this._decode(value[key]);
      });
  }

  // return the fully-decoded value.
  return value;
};
//endregion JsonEx