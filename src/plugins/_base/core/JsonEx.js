//region JsonEx
/**
 * Extends {@link JsonEx._decode}.<br/>
 * Also resolves constructors via {@link SerializableRegistry} before falling back
 * to the engine's default `window[className]` lookup.
 */
J.BASE.Aliased.JsonEx.set('_decode', JsonEx._decode);
JsonEx._decode = function(value)
{
  // determine the type of object we're working with.
  const type = Object.prototype.toString.call(value);

  // handle objects and arrays only.
  if (type === '[object Object]' || type === '[object Array]')
  {
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