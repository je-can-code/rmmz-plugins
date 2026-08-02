//region SaveDecoder
import SaveDecodeError from './SaveDecodeError.js';
import SerializableRegistry from './../SerializableRegistry.js';

/**
 * Rebuilds live objects out of the plain data a savefile holds.
 *
 * Two properties of this walk are worth understanding before changing it.
 *
 * **It never runs a constructor.** Instances are built with `Object.create(prototype)`, the same
 * contract `JsonEx._decode` has via `setPrototypeOf`, because a constructor takes arguments a file
 * does not have and does real work a load must not repeat - `Game_Actor.prototype.initialize` runs
 * `setup()`. That is also why `#private` fields are banned in registered classes: a restored object
 * carries the prototype without ever having been branded, so the first `this.#anything` throws.
 *
 * **It can rebuild a file whose tags have been stripped.** Type maps, not tags, are what the decoder
 * is authoritative on; the tags are redundancy. Hand-edit a section down to bare JSON and it still
 * comes back correctly, which is the difference between a save format a developer can work with and
 * one they can only read.
 */
class SaveDecoder
{
  /**
   * Decodes plain data back into live objects.
   * @param {*} data The plain data to decode.
   * @param {Function|null=} expectedType The constructor the containing type map declares here, or
   * null when nothing declared it.
   * @param {string=} path The JSON path of this value, used for error context.
   * @returns {*} The rebuilt value.
   */
  static decode(data, expectedType = null, path = '$')
  {
    // null is a real persisted value and must survive as itself.
    if (data === null) return data;

    const tag = Object.prototype.toString.call(data);

    // an array's declared type describes its *elements*, so it forwards rather than consuming it.
    if (tag === '[object Array]')
    {
      return data.map((element, index) => this.decode(element, expectedType, `${path}[${index}]`));
    }

    // anything that is not an object came out of JSON as itself already.
    if (tag !== '[object Object]') return data;

    // a tagged node names its own type, and that name is checked against whatever expected it.
    if (data['@']) return this.decodeTagged(data, expectedType, path);

    // an untagged node at a declared position rebuilds from the declaration alone.
    if (expectedType !== null) return this.decodeDeclared(data, expectedType, path);

    // an untagged node nobody declared is a plain object; keep its shape and walk its keys.
    return this.decodeKeys(data, null, null, null, path);
  }

  /**
   * Decodes a node that carries its own type tag.
   * @param {object} data The tagged plain data.
   * @param {Function|null} expectedType The constructor the containing type map declared, or null.
   * @param {string} path The JSON path of this node.
   * @returns {object} The rebuilt instance.
   */
  static decodeTagged(data, expectedType, path)
  {
    const codec = SerializableRegistry.codecById(data['@']);

    // a tag naming nothing means the file and the installed plugins disagree, and guessing a plain
    // object in its place would only move the failure somewhere with no trace of its cause.
    if (codec === null) throw SaveDecodeError.unknownSaveId(path, data['@']);

    // the tag and the type map are redundant by design; this is the integrity check that buys.
    if (expectedType !== null && codec.type() !== expectedType)
    {
      const expectedCodec = SerializableRegistry.codecForConstructor(expectedType);
      const expectedId = expectedCodec === null
        ? expectedType.name
        : expectedCodec.id();

      throw SaveDecodeError.typeMismatch(path, expectedId, codec.id());
    }

    return this.decodeWith(data, codec, path);
  }

  /**
   * Decodes an untagged node using only the constructor its position declares.
   *
   * This is the branch that makes a hand-edited file work.
   * @param {object} data The untagged plain data.
   * @param {Function} expectedType The declared constructor.
   * @param {string} path The JSON path of this node.
   * @returns {object} The rebuilt instance.
   */
  static decodeDeclared(data, expectedType, path)
  {
    const codec = SerializableRegistry.codecForConstructor(expectedType);

    // with no tag to fall back on, an unregistered declared type leaves nothing to rebuild from.
    if (codec === null) throw SaveDecodeError.unregisteredDeclaredType(path, expectedType.name);

    return this.decodeWith(data, codec, path);
  }

  /**
   * Rebuilds an instance through a resolved codec, honoring any decode override it carries.
   * @param {object} data The plain data for this node.
   * @param {SaveCodec} codec The codec describing the target type.
   * @param {string} path The JSON path of this node.
   * @returns {object} The rebuilt instance.
   */
  static decodeWith(data, codec, path)
  {
    // a type whose stored shape genuinely differs from its runtime shape replaces the walk outright.
    if (codec.hasDecodeOverride()) return codec.runDecode(data, path);

    // build the shell without running the constructor, then establish every field's default on it
    // before anything from the file lands- so a field added after this save was written comes back
    // at its seeded value rather than as `undefined`. that is what lets fields be added without a
    // migration, and it is worth more than the microseconds it costs.
    const instance = Object.create(codec.type().prototype);
    codec.seed(instance);

    this.decodeKeys(data, codec, codec.typedTree(), codec.typedValuesTree(), path, instance);

    // transients land last and win over everything, because a transient is by definition not what
    // the file says. the factory receives the finished instance so an eager cache- one nothing
    // rebuilds lazily on a miss- can repopulate itself from the fields that just decoded.
    codec.transients()
      .forEach((factory, transientPath) => this.assignAtPath(instance, transientPath, factory(instance)));

    return instance;
  }

  /**
   * Decodes every key of a plain data object onto a target, keeping the type declarations in step.
   * @param {object} data The plain data whose keys are being decoded.
   * @param {SaveCodec|null} codec The codec owning the declarations, or null for a plain object.
   * @param {{value: Function|null, children: Map<string, object>}|null} typedNode The walker's
   * position in the type tree, or null when nothing below here is declared.
   * @param {{value: Function|null, children: Map<string, object>}|null} typedValuesNode The walker's
   * position in the dictionary-value type tree, or null.
   * @param {string} path The JSON path of this object.
   * @param {object=} target The object to assign onto; a fresh plain object when omitted.
   * @returns {object} The target, populated.
   */
  static decodeKeys(data, codec, typedNode, typedValuesNode, path, target = {})
  {
    Object.keys(data)
      .forEach(key =>
      {
        // the type tag is metadata about the node, not a field of the object it describes.
        if (key === '@') return;

        const childPath = `${path}.${key}`;

        const typedChild = typedNode === null
          ? null
          : typedNode.children.get(key) ?? null;

        const typedValuesChild = typedValuesNode === null
          ? null
          : typedValuesNode.children.get(key) ?? null;

        const decoded = this.decodeChild(data[key], typedChild, typedValuesChild, childPath);

        target[key] = this.mergeOverSeeded(target[key], decoded);
      });

    return target;
  }

  /**
   * Lays a decoded value over whatever `seed` already established at the same position.
   *
   * Plain objects merge; everything else replaces. That distinction is what makes `seed` mean
   * anything below the top level of a class. Consider `_j`: the seed runs the whole `initMembers`
   * chain and builds every plugin's namespace, and then the file arrives holding a `_j` written
   * before half those plugins existed. A plain assignment would replace the complete namespace with
   * the partial one, and every plugin added since the save was written would find its own state
   * missing - which is exactly the failure `seed` exists to prevent, reintroduced one level down.
   *
   * Merging instead means the file wins wherever it has something to say and the seeded default
   * survives wherever it does not. Instances, arrays, `Map`s, and primitives replace outright, since
   * a decoded instance is already the complete answer for its position.
   * @param {*} seeded Whatever the seed left at this position, which is usually nothing.
   * @param {*} decoded The value the file produced.
   * @returns {*} The value to assign.
   */
  static mergeOverSeeded(seeded, decoded)
  {
    if (this.isPlainObject(seeded) === false) return decoded;

    if (this.isPlainObject(decoded) === false) return decoded;

    Object.keys(decoded)
      .forEach(key =>
      {
        seeded[key] = this.mergeOverSeeded(seeded[key], decoded[key]);
      });

    return seeded;
  }

  /**
   * Decodes one child value against whatever its position declares.
   * @param {*} child The plain data being decoded.
   * @param {{value: Function|null, children: Map<string, object>}|null} typedChild The child's
   * position in the type tree, or null.
   * @param {{value: Function|null, children: Map<string, object>}|null} typedValuesChild The child's
   * position in the dictionary-value type tree, or null.
   * @param {string} childPath The JSON path of the child.
   * @returns {*} The decoded child.
   */
  static decodeChild(child, typedChild, typedValuesChild, childPath)
  {
    // a field declared as a dictionary of instances has its *values* decoded, not itself- the
    // difference matters because a plain object at a typed position is otherwise indistinguishable
    // from one instance's untagged data.
    if (typedValuesChild !== null && typedValuesChild.value !== null)
    {
      return this.decodeDictionary(child, typedValuesChild.value, childPath);
    }

    // a field declared to hold an instance passes that constructor down as the expected type.
    if (typedChild !== null && typedChild.value !== null)
    {
      return this.decode(child, typedChild.value, childPath);
    }

    // a namespace object with declarations still below it keeps both walks aligned.
    if (this.isPlainObject(child) && this.hasDeclarationsBelow(typedChild, typedValuesChild))
    {
      return this.decodeKeys(child, null, typedChild, typedValuesChild, childPath);
    }

    return this.decode(child, null, childPath);
  }

  /**
   * Decodes a plain-object dictionary whose values are all instances of one declared type.
   * @param {object} data The dictionary's plain data.
   * @param {Function} valueType The constructor every value holds.
   * @param {string} path The JSON path of the dictionary.
   * @returns {object} A fresh dictionary holding the decoded values.
   */
  static decodeDictionary(data, valueType, path)
  {
    const decoded = {};

    Object.keys(data)
      .forEach(key =>
      {
        decoded[key] = this.decode(data[key], valueType, `${path}.${key}`);
      });

    return decoded;
  }

  /**
   * Determines whether a value is a plain object rather than an instance, array, or primitive.
   * @param {*} value The value to classify.
   * @returns {boolean}
   */
  static isPlainObject(value)
  {
    if (value === null) return false;

    if (Object.prototype.toString.call(value) !== '[object Object]') return false;

    return value.constructor === Object;
  }

  /**
   * Determines whether either declaration tree still has anything to say below this point.
   * @param {{value: Function|null, children: Map<string, object>}|null} typedChild The child's
   * position in the type tree, or null.
   * @param {{value: Function|null, children: Map<string, object>}|null} typedValuesChild The child's
   * position in the dictionary-value type tree, or null.
   * @returns {boolean}
   */
  static hasDeclarationsBelow(typedChild, typedValuesChild)
  {
    if (typedChild !== null && typedChild.children.size > 0) return true;

    return typedValuesChild !== null && typedValuesChild.children.size > 0;
  }

  /**
   * Assigns a value at a dotted path on an instance, creating the namespace objects along the way.
   *
   * The waypoints are created rather than assumed because a transient may be declared deeper than
   * anything else on the instance has reason to build- a plugin namespace that only exists to hold
   * one cache, on a save written before that plugin was installed.
   * @param {object} instance The instance to assign onto.
   * @param {string} path The dotted path to assign at.
   * @param {*} value The value to assign.
   */
  static assignAtPath(instance, path, value)
  {
    const segments = path.split('.');

    // walk to the object that directly owns the final segment, building namespaces as needed.
    let node = instance;
    segments.slice(0, -1)
      .forEach(segment =>
      {
        node[segment] ||= {};
        node = node[segment];
      });

    node[segments[segments.length - 1]] = value;
  }
}

export default SaveDecoder;
//endregion SaveDecoder