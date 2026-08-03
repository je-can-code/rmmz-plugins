//region JaftingRefinementLineage
/**
 * The complete provenance of one refined equip: what it was made from, in what slot it lives, and
 * the dismantle stamp it was born with.
 *
 * **This is what a save stores instead of the refined equip itself.** `JaftingManager` produces a
 * refined row by a pure, deterministic function of its two inputs - parse the traits after the
 * divider, merge them with keep-better semantics, clone the base, rename with the `+N` suffix - so
 * the row is *derivable*, and a derivable thing persisted by value is a thing that stops following
 * its source. Store the whole equip and rebalancing a base weapon's ATK never reaches the refined
 * descendants a player is actually carrying. Store the lineage and every load replays them against
 * whatever the database says today.
 *
 * A node is one of two things, and {@link #isLeaf} is the test:
 *
 * - a **leaf**, naming a database row by {@link #kind} and {@link #id}; or
 * - a **refinement**, holding a {@link #base} and a {@link #material} that are themselves nodes.
 *
 * The recursion is not decorative. A material may itself have been refined, and the moment it is
 * consumed its `$data*` slot is reclaimed and blanked by {@link JaftingSalvageManager} - so by the
 * time a save is written there is nothing left in the datastore to point at. The provenance has to
 * travel inside the node that needs it.
 *
 * One field is genuinely stored rather than derived, and it is the exception worth understanding:
 * {@link #ledger}. The dismantle stamp attached to a refined output is built by
 * `JaftingSalvageManager.buildRefinementOutputLedger`, which reads the *party's* salvage bags for the
 * specific stack slot the material was drawn from - and those bags are pruned by the very `gainItem`
 * that consumes it. It is an input captured at a moment, not a derivation, so replay cannot
 * reproduce it and the node carries it verbatim.
 */
class JaftingRefinementLineage
{
  /**
   * The `$dataWeapons` / `$dataArmors` slot this refinement was allocated, or `0` on a leaf.
   *
   * Stored rather than derived from replay order on purpose: a reordered, deduplicated, or
   * partially-failed lineage list can never silently repoint an inventory entry at the wrong item
   * when every node names its own slot. It is also the field
   * `JaftingSalvageManager.reclaimDynamicWeaponSlot` matches on when the last copy leaves the party.
   * @type {number}
   */
  index = 0;

  /**
   * Which datastore a leaf's row lives in: `w`, `a`, or `i`.
   *
   * The same letters the salvage ledger uses, so the two vocabularies do not drift apart.
   * @type {string}
   */
  kind = String.empty;

  /**
   * The database row id a leaf names, or `0` on a refinement.
   * @type {number}
   */
  id = 0;

  /**
   * The equip that was improved, as its own node, or `null` on a leaf.
   * @type {JaftingRefinementLineage|null}
   */
  base = null;

  /**
   * The equip that was consumed, as its own node, or `null` on a leaf.
   * @type {JaftingRefinementLineage|null}
   */
  material = null;

  /**
   * The dismantle stamp this output was born with, or `null` when it had none.
   * @type {JaftingSalvageLedgerSnapshot|null}
   */
  ledger = null;

  /**
   * Builds the node that names a database row directly.
   * @param {string} kind The datastore letter: `w`, `a`, or `i`.
   * @param {number} id The database row id.
   * @returns {JaftingRefinementLineage}
   */
  static leaf(kind, id)
  {
    const lineage = new JaftingRefinementLineage();

    lineage.kind = kind;

    lineage.id = id;

    return lineage;
  }

  /**
   * Builds the node describing one refinement step.
   * @param {number} index The datastore slot the output was allocated.
   * @param {JaftingRefinementLineage} base The node describing the equip that was improved.
   * @param {JaftingRefinementLineage} material The node describing the equip that was consumed.
   * @param {JaftingSalvageLedgerSnapshot|null} ledger The dismantle stamp captured at commit time.
   * @returns {JaftingRefinementLineage}
   */
  static refinement(index, base, material, ledger)
  {
    const lineage = new JaftingRefinementLineage();

    lineage.index = index;

    lineage.base = base;

    lineage.material = material;

    lineage.ledger = ledger;

    return lineage;
  }

  /**
   * Determines whether this node names a database row rather than describing a refinement.
   *
   * The base is the discriminator rather than the index, because a leaf and a refinement both have
   * a meaningful position in a datastore and only a refinement has inputs.
   * @returns {boolean}
   */
  isLeaf()
  {
    return this.base === null;
  }
}

export default JaftingRefinementLineage;

/**
 * Registered so the save pipeline can write and rebuild a lineage tree. The two nested nodes and the
 * captured ledger are declared, because everything below the top node is an instance the decoder
 * has to be told the type of when the tags are stripped by hand.
 */
SerializableRegistry.register(JaftingRefinementLineage, {
  id: 'jafting-refinement-lineage',
  aliases: [ 'JaftingRefinementLineage' ],
  typed: {
    base: JaftingRefinementLineage,
    material: JaftingRefinementLineage,
    ledger: JaftingSalvageLedgerSnapshot,
  },
  seed: instance => Object.assign(instance, new JaftingRefinementLineage()),
});
//endregion JaftingRefinementLineage