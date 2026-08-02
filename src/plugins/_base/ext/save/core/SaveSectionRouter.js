//region SaveSectionRouter
import SaveDocument from './SaveDocument.js';
import SaveEncoder from './SaveEncoder.js';
import SaveDecoder from './SaveDecoder.js';

/**
 * Splits one slot into the files it is written as, and puts it back together on load.
 *
 * Two transformations happen here, and they are independent of each other:
 *
 * 1. **Top-level keys are grouped into sections** - `party` into `party.json`, the rest of the
 *    vanilla ten into `world.json` and `actors.json` - per {@link SaveDocument}.
 * 2. **`_j.<plugin>` slices are lifted off their hosts** into `systems/<plugin>.json`, keyed by
 *    which host they came from, so one plugin's state is one file rather than being scattered across
 *    seven objects that happened to be nearby at runtime.
 *
 * **Runtime homes do not change.** `$gameParty._j._omni` is still exactly where it was; only the
 * file layout differs, and the codec knows both ends. No plugin needs refactoring to be reorganized.
 *
 * ### Why the lift happens after encoding, and the merge before decoding
 *
 * The lift moves subtrees out of the **encoded plain data**, never out of the live objects. Reaching
 * into `$gameParty` to pull `_j._omni` off it before encoding would be mutating live state during a
 * save, which is precisely the defect that made the engine's own `JsonEx._encode` dangerous.
 *
 * The merge is the mirror image and its ordering matters more. Slices go back into the plain data
 * **before** anything is decoded, because a host's transients are re-seeded during its own decode: a
 * fresh `JABS_Timer` is written to `_j._regions._skills._timer` as the last step of decoding a
 * `Game_Player`. Merging a `_j._regions` slice onto the finished object afterwards would replace the
 * namespace wholesale and take the freshly-seeded timer with it.
 *
 * ### What is not routed
 *
 * `$gameMap._events` is never walked, on either side. Every `_j.*` slice on a map event has a
 * map-session lifetime and is dropped by the `Game_Event` codec itself, so there is nothing here to
 * lift and no `events` key in a system file.
 *
 * ### A missing host is not an error
 *
 * Follower counts change, vehicles get removed, an actor leaves the roster. A slice whose host is
 * gone is reported and dropped; a host with no slice keeps whatever `seed` gave it, which is the
 * normal case for every plugin added since the save was written.
 */
class SaveSectionRouter
{
  /**
   * The directory system files live in, relative to the generation root.
   * @type {string}
   */
  static systemsDirectory = 'systems/';

  /**
   * The tag written at the top of a system file, so it is identifiable on sight.
   * @type {string}
   */
  static sectionTag = 'save-section';

  /**
   * Which section file each registered `_j` namespace is lifted into, keyed by namespace.
   * @type {Map<string, string>}
   */
  static _routedNamespaces = new Map();

  /**
   * Gets the registered `_j` namespaces and the file each is lifted into.
   * @returns {Map<string, string>} The section base names, keyed by `_j` namespace key.
   */
  static routedNamespaces()
  {
    return this._routedNamespaces;
  }

  /**
   * Declares that a plugin's `_j` namespace should be lifted into a system file of its own.
   *
   * Registration is what makes this happen; an unregistered namespace simply stays inline on its
   * host and is written with it. That is deliberate on two counts. It keeps the router keyed on a
   * list of real plugins rather than on whatever `Object.keys(_j)` happens to return - four keys on
   * `_j` hold a boolean or an array rather than a namespace, and a naive router would cheerfully
   * write `systems/_textPopRequest.json` containing `false`. And it means a plugin opting in is a
   * layout change and nothing else: nothing is lost by not opting in.
   * @param {string} namespaceKey The key on `_j`, ex: `_abs`.
   * @param {string} sectionBaseName The file name without directory or extension, ex: `abs`.
   */
  static registerNamespace(namespaceKey, sectionBaseName)
  {
    this.routedNamespaces()
      .set(namespaceKey, `${this.systemsDirectory}${sectionBaseName}.json`);
  }

  //region encode
  /**
   * Turns a live save-contents object into the set of section files a generation is written from.
   * @param {object} contents The save contents, keyed as `DataManager.makeSaveContents` builds it.
   * @returns {Object<string, object>} The plain data of each section, keyed by file name.
   */
  static toSections(contents)
  {
    const encoded = {};

    // encode each top-level key independently, so an error names the key it came from rather than
    // reporting a path from a root nobody wrote.
    Object.keys(contents)
      .forEach(key =>
      {
        encoded[key] = SaveEncoder.encode(contents[key], `$.${key}`);
      });

    const sections = this.liftSystemSlices(encoded);

    // whatever is left after the lift is grouped into its section file.
    Object.keys(encoded)
      .forEach(key =>
      {
        const sectionName = SaveDocument.sectionFor(key);

        sections[sectionName] ||= {};
        sections[sectionName][key] = encoded[key];
      });

    return sections;
  }

  /**
   * Moves every registered `_j` namespace out of the encoded hosts and into system files.
   * @param {Object<string, object>} encoded The encoded top-level keys, modified in place.
   * @returns {Object<string, object>} The system sections, keyed by file name.
   */
  static liftSystemSlices(encoded)
  {
    const sections = {};

    const hosts = this.encodedHosts(encoded);

    this.routedNamespaces()
      .forEach((sectionName, namespaceKey) =>
      {
        const lifted = this.liftNamespace(hosts, namespaceKey);

        // a plugin with nothing on any host writes no file at all, rather than an empty one.
        if (Object.keys(lifted).length === 0) return;

        sections[sectionName] = {
          '@': this.sectionTag,
          plugin: namespaceKey,
          hosts: lifted,
        };
      });

    return sections;
  }

  /**
   * Pulls one namespace off every host that carries it.
   * @param {Object<string, object>} hosts The encoded hosts, keyed by host kind.
   * @param {string} namespaceKey The key on `_j` to lift.
   * @returns {object} The lifted slices, keyed by host kind then by host key.
   */
  static liftNamespace(hosts, namespaceKey)
  {
    const lifted = {};

    Object.keys(hosts)
      .forEach(hostKind =>
      {
        const members = hosts[hostKind];

        Object.keys(members)
          .forEach(hostKey =>
          {
            const host = members[hostKey];
            const slice = this.namespaceOf(host, namespaceKey);

            if (slice === null) return;

            // the slice moves rather than being copied: leaving it behind would write it twice, and
            // the copy inside the host would be the one the decoder saw first.
            delete host._j[namespaceKey];

            lifted[hostKind] ||= {};
            lifted[hostKind][hostKey] = slice;
          });
      });

    return lifted;
  }
  //endregion encode

  //region decode
  /**
   * Turns a set of read section files back into one save-contents object.
   * @param {Object<string, object>} sections The plain data of each section, keyed by file name.
   * @returns {object} The decoded save contents, keyed as `DataManager.extractSaveContents` wants.
   */
  static fromSections(sections)
  {
    const encoded = {};

    // the ordinary sections rebuild the flat shape the contents object had before it was split.
    Object.keys(sections)
      .filter(sectionName => sectionName.startsWith(this.systemsDirectory) === false)
      .forEach(sectionName =>
      {
        Object.assign(encoded, sections[sectionName]);
      });

    Object.keys(sections)
      .filter(sectionName => sectionName.startsWith(this.systemsDirectory))
      .forEach(sectionName => this.placeSystemSlices(encoded, sections[sectionName]));

    const contents = {};

    Object.keys(encoded)
      .forEach(key =>
      {
        contents[key] = SaveDecoder.decode(encoded[key], null, `$.${key}`);
      });

    return contents;
  }

  /**
   * Puts every slice from one system file back onto the host it came from.
   * @param {Object<string, object>} encoded The encoded top-level keys, modified in place.
   * @param {object} section The system file's plain data.
   */
  static placeSystemSlices(encoded, section)
  {
    const hosts = this.encodedHosts(encoded);
    const namespaceKey = section.plugin;

    Object.keys(section.hosts)
      .forEach(hostKind =>
      {
        const members = section.hosts[hostKind];

        Object.keys(members)
          .forEach(hostKey =>
          {
            const host = hosts[hostKind]
              ? hosts[hostKind][hostKey]
              : undefined;

            // the host this slice belongs to is gone: an actor left the roster, a follower slot
            // shrank, a vehicle was removed. say so once and move on- the save is still good.
            if (!host)
            {
              console.warn(
                `[save] dropping the '${namespaceKey}' slice for ${hostKind}.${hostKey}; that host `
                + 'is not in this save.');

              return;
            }

            host._j ||= {};
            host._j[namespaceKey] = members[hostKey];
          });
      });
  }
  //endregion decode

  /**
   * Collects every host that can carry a `_j` namespace, keyed by kind and then by host key.
   *
   * There are seven kinds, and the one that is easy to miss is `map` itself - `$gameMap` carries
   * `_j._levelSync`, `_j._omni`, and `_j._regions`, including the only `J_Timer` in a whole save.
   * `$gameMap._events` is deliberately absent; see the class summary.
   * @param {Object<string, object>} encoded The encoded top-level keys.
   * @returns {Object<string, Object<string, object>>} The hosts, keyed by kind then by host key.
   */
  static encodedHosts(encoded)
  {
    const hosts = {
      system: {},
      party: {},
      player: {},
      map: {},
      actors: {},
      followers: {},
      vehicles: {},
    };

    // the four singletons are their own single member, keyed by the empty-ish key `self`, so every
    // host kind reads the same way downstream rather than needing a branch per kind.
    if (encoded.system) hosts.system.self = encoded.system;

    if (encoded.party) hosts.party.self = encoded.party;

    if (encoded.player) hosts.player.self = encoded.player;

    if (encoded.map) hosts.map.self = encoded.map;

    // the actor store is sparse and indexed by actor id, so the id is the key- an actor leaving the
    // roster must not shift everyone else's slice onto the wrong battler.
    if (encoded.actors && encoded.actors._data)
    {
      encoded.actors._data.forEach((actor, index) =>
      {
        if (actor) hosts.actors[String(index)] = actor;
      });
    }

    if (encoded.player && encoded.player._followers && encoded.player._followers._data)
    {
      encoded.player._followers._data.forEach((follower, index) =>
      {
        if (follower) hosts.followers[String(index)] = follower;
      });
    }

    // vehicles are keyed by type rather than by position, because `boat` says what it is and `0`
    // only says where it happened to sit in an array the engine builds.
    if (encoded.map && encoded.map._vehicles)
    {
      encoded.map._vehicles.forEach((vehicle, index) =>
      {
        if (!vehicle) return;

        hosts.vehicles[vehicle._type ? vehicle._type : String(index)] = vehicle;
      });
    }

    return hosts;
  }

  /**
   * Reads one `_j` namespace off an encoded host.
   * @param {object} host The encoded host.
   * @param {string} namespaceKey The key on `_j` to read.
   * @returns {object|null} The slice, or null when this host does not carry that namespace.
   */
  static namespaceOf(host, namespaceKey)
  {
    if (!host._j) return null;

    if (!host._j[namespaceKey]) return null;

    return host._j[namespaceKey];
  }
}

export default SaveSectionRouter;
//endregion SaveSectionRouter