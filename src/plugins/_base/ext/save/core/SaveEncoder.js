//region SaveEncoder
import SaveEncodeError from './SaveEncodeError.js';
import SaveCodecIndex from './SaveCodecIndex.js';

/**
 * Turns the live object graph into the plain data a savefile holds.
 *
 * The walk is type-directed rather than type-blind, which is the whole point of the exercise: the
 * engine's own encoder asks every one of ~1,700 nodes what it is and stamps the answer onto it,
 * whereas this one asks the *registry* what a value's constructor means and consults that type's
 * declarations. The tag still gets written - see {@link #encodeInstance} - but as redundancy for a
 * human reader and an integrity check, not as the mechanism.
 *
 * Nothing here mutates the value being encoded. That is not a stylistic preference: the engine's
 * `JsonEx._encode` writes its tags back onto the live objects, which is invisible for plain shapes
 * and destructive for anything whose encoded form differs from its runtime form.
 */
class SaveEncoder
{
  /**
   * How deep the walk will follow a graph before giving up on it.
   *
   * There is no cycle detection, deliberately- the shapes being encoded are trees, and a general
   * cycle check would cost a `Set` insertion on every one of thousands of nodes to catch a bug that
   * should not exist. The ceiling is the cheap version: it turns an unreadable stack overflow into an
   * error naming the path that ran away.
   *
   * It covers the default walk only. A codec with an `encode` override re-enters {@link #encode} at
   * depth zero, so a cycle threaded through one- a `Map` holding a value that points back at the map
   * - still overflows the stack rather than reporting a path.
   * @type {number}
   */
  static maxDepth = 100;

  /**
   * Encodes any value into its plain data form.
   * @param {object|Array|Map|Set|string|number|boolean|null} value The value to encode.
   * @param {string=} path The JSON path of this value, used for error context.
   * @param {number=} depth How many levels down the graph this call sits.
   * @returns {object|Array|string|number|boolean|null} The plain data form, safe to hand to `JSON.stringify`.
   */
  static encode(value, path = '$', depth = 0)
  {
    // refuse to follow a graph that has clearly stopped being a tree.
    if (depth >= this.maxDepth) throw SaveEncodeError.tooDeep(path, this.maxDepth);

    // null is a value worth persisting and must not be confused with an absent field.
    if (value === null) return value;

    // dispatch on the engine's own type tag rather than a type keyword or a prototype-chain test,
    // both of which this codebase bans and neither of which separates a Map from a plain object.
    const tag = Object.prototype.toString.call(value);

    // arrays keep their shape; each element carries its index into the path so an error can name it.
    if (tag === '[object Array]')
    {
      return value.map((element, index) => this.encode(element, `${path}[${index}]`, depth + 1));
    }

    // anything that is not an object at all is already plain data.
    if (tag !== '[object Object]' && tag !== '[object Map]' && tag !== '[object Set]')
    {
      return value;
    }

    // a plain object carries no type of its own- walk its keys and keep the shape as-is.
    if (tag === '[object Object]' && value.constructor === Object)
    {
      return this.encodePlainObject(value, null, path, depth);
    }

    // everything left is a class instance, including Map and Set, both of which are registered.
    return this.encodeInstance(value, path, depth);
  }

  /**
   * Encodes a class instance through its registered codec.
   * @param {object} value The instance to encode.
   * @param {string} path The JSON path of this value.
   * @param {number} depth How many levels down the graph this call sits.
   * @returns {object} The tagged plain data form.
   */
  static encodeInstance(value, path, depth)
  {
    const codec = SaveCodecIndex.forInstance(value);

    // an unregistered class is a declaration bug, and catching it here puts the error in front of
    // whoever added the field rather than in front of a player whose save decoded into rubble.
    if (codec === null) throw SaveEncodeError.unregisteredType(path, value.constructor.name);

    // a type whose stored shape genuinely differs from its runtime shape replaces the walk outright.
    const encoded = codec.hasEncodeOverride()
      ? codec.runEncode(value, path)
      : this.encodePlainObject(value, codec, path, depth);

    // the tag is redundant with the type map by design: size is a non-goal, and writing it makes the
    // file self-describing to a human, gives the decoder something to recover from, and buys a free
    // integrity check when the two disagree.
    encoded['@'] = codec.id();

    return encoded;
  }

  /**
   * Encodes the own enumerable keys of an object into a fresh container.
   *
   * This serves both plain objects and registered instances, because the walk is the same either
   * way- what differs is that an instance brings declarations with it. The `transientNode` argument
   * is the walker's position in those declarations, which is why the recursion carries it: a
   * transient like `_j._base._cachedAllNotes` is three plain objects deep, and the skip has to still
   * apply down there.
   * @param {object} value The object whose keys are being encoded.
   * @param {SaveCodec|null} codec The codec owning these declarations, or null for a plain object.
   * @param {string} path The JSON path of this object.
   * @param {number} depth How many levels down the graph this call sits.
   * @returns {object} A fresh plain object holding the encoded keys.
   */
  static encodePlainObject(value, codec, path, depth)
  {
    // start the walk at the root of this codec's transient tree, or nowhere for a plain object.
    const transientNode = codec === null
      ? null
      : codec.transientTree();

    return this.encodeKeys(value, codec, transientNode, path, depth);
  }

  /**
   * Encodes the own enumerable keys of an object, honoring the transient declarations in scope.
   * @param {object} value The object whose keys are being encoded.
   * @param {SaveCodec|null} codec The codec that owns the declarations, or null when none apply.
   * @param {{value: Function|null, children: Map<string, object>}|null} transientNode The walker's
   * position in the transient tree, or null when nothing below here is declared transient.
   * @param {string} path The JSON path of this object.
   * @param {number} depth How many levels down the graph this call sits.
   * @returns {object} A fresh plain object holding the encoded keys.
   */
  static encodeKeys(value, codec, transientNode, path, depth)
  {
    // build into a fresh container so the live object is never touched.
    const encoded = {};

    Object.keys(value)
      .forEach(key =>
      {
        // the engine's own encoder may have left a tag on this object; ours is written by the caller.
        if (key === '@') return;

        const childPath = `${path}.${key}`;

        // find this key's position in the declarations, if the declarations reach this far.
        const childNode = transientNode === null
          ? null
          : transientNode.children.get(key) ?? null;

        // a declared transient is never written; the decoder re-seeds it from its factory instead.
        if (childNode !== null && childNode.value !== null) return;

        const child = value[key];

        // a typed field must be declared by its owner, so that adding one is a deliberate act.
        this.assertTypedFieldDeclared(child, codec, key, childPath);

        // a plain object below a declaration waypoint keeps walking with that waypoint, so a nested
        // transient is still skipped; everything else re-enters the general walk.
        encoded[key] = this.encodeChild(child, childNode, childPath, depth);
      });

    return encoded;
  }

  /**
   * Encodes one child value, keeping the declaration walk in step with the data walk when it can.
   *
   * Note what is *not* forwarded: the codec. Declarations describe the direct keys of the instance
   * that owns them, so once the walk descends into a namespace object those keys are no longer that
   * codec's to police - only the transient waypoint travels down, because a transient path is
   * explicitly written to reach that far.
   * @param {object|Array|Map|Set|string|number|boolean|null} child The value being encoded.
   * @param {{value: Function|null, children: Map<string, object>}|null} childNode The child's
   * position in the transient tree, or null when nothing below it is declared.
   * @param {string} childPath The JSON path of the child.
   * @param {number} depth How many levels down the graph this call sits.
   * @returns {object|Array|string|number|boolean|null} The encoded child.
   */
  static encodeChild(child, childNode, childPath, depth)
  {
    // once the declarations run out there is nothing left to keep in step, and the general walk takes
    // over- which is also the path every value that is not a plain namespace object takes.
    if (childNode === null || childNode.children.size === 0)
    {
      return this.encode(child, childPath, depth + 1);
    }

    if (child === null) return child;

    if (Object.prototype.toString.call(child) !== '[object Object]') return this.encode(child, childPath, depth + 1);

    if (child.constructor !== Object) return this.encode(child, childPath, depth + 1);

    // a plain object with declarations still below it: keep descending with both walks aligned.
    return this.encodeKeys(child, null, childNode, childPath, depth + 1);
  }

  /**
   * Throws when a field holds a class instance its owner's type map never declared.
   *
   * This is a completeness check on the declaration rather than anything the decoder needs, and it
   * fires at save time on purpose: it forces every newly-added typed field to be classified by the
   * person who added it, while they still remember why it is there.
   *
   * It applies only to the direct keys of a registered class. A plain object has no declarations of
   * its own, so a class instance nested inside a namespace object is checked by nothing here- what
   * protects that case is the encoder refusing to encode an unregistered type at all.
   * @param {object|Array|Map|Set|string|number|boolean|null} child The value held at the field.
   * @param {SaveCodec|null} codec The codec that owns the field, or null for a plain object.
   * @param {string} key The field name.
   * @param {string} childPath The JSON path of the field.
   */
  static assertTypedFieldDeclared(child, codec, key, childPath)
  {
    // a plain object declares nothing and is therefore checked against nothing.
    if (codec === null) return;

    if (child === null) return;

    // only the class-instance case is policed. Map and Set are self-describing and unambiguous to
    // decode without a declaration, so demanding one for them would be busywork.
    if (Object.prototype.toString.call(child) !== '[object Object]') return;

    if (child.constructor === Object) return;

    // the declaration may be a direct field or the head of a dotted path; either counts.
    if (codec.typedTree()
      .children.has(key)) return;

    if (codec.typedValuesTree()
      .children.has(key)) return;

    throw SaveEncodeError.undeclaredTypedField(childPath, codec.id(), key, child.constructor.name);
  }
}

export default SaveEncoder;
//endregion SaveEncoder