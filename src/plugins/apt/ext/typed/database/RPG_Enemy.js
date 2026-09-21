//region RPG_Enemy
import ApTypeKey from './../_models/ApTypeKey.js';
import ApTypeGrant from './../_models/ApTypeGrant.js';

/**
 * The explicit typed AP rewards from `<apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]>`.
 * @returns {ApTypeGrant[]}
 */
RPG_Enemy.prototype.typedApRewards = function()
{
  // pull raw tuples like [amount, domain, idOrName].
  const raw = RPGManager.getArraysFromNotesByRegex(this, J.APT.EXT.TYPED.RegExp.ApTypedReward);

  // normalize into resolved records.
  return raw
    .map(([ amount, domain, idOrName ]) =>
    {
      const dom = String(domain)
        // Strip surrounding whitespace before comparison.
        .trim()
        .toLowerCase();
      const id = ApManager.resolveDomainId(dom, idOrName);
      const ap = Number(amount);
      if (!Number.isFinite(ap) || ap <= 0) return null;
      if (!Number.isFinite(id)) return null;
      return new ApTypeGrant(ap, dom, id);
    })
    .filter(entry => !!entry);
};

/**
 * Computes (and caches) inferred enemy element types from database element rates.
 * @returns {ApTypeKey[]}
 */
RPG_Enemy.prototype.inferredTypedElements = function()
{
  // try cache first.
  const cached = $gameTemp.getAptTypedInferredEnemyTypes(this.id);
  if (cached)
  {
    // return cached results mapped to domain records.
    return cached.map(id => new ApTypeKey(ApTypeKey.DomainType.Element, id));
  }

  // compute the element ids from database traits.
  const ids = this.computeInferredTypedElementIds();

  // cache results on Game_Temp.
  $gameTemp.setAptTypedInferredEnemyTypes(this.id, ids);

  // return as domain records.
  return ids.map(id => new ApTypeKey(ApTypeKey.DomainType.Element, id));
};

/**
 * Computes the list of element ids that represent this enemy’s inferred types
 * based on database element rates and naming conventions. No runtime states are considered.
 *
 * The numeric half of this- accumulating rates and deciding which deviate far enough from neutral
 * to be identifying- belongs to {@link RPG_BaseBattler} and is shared with anything else that needs
 * to ask what a battler is. What stays here is the part that is specific to this project's element
 * naming: which deviation *direction* counts depends on how the element is named.
 *
 * Rules overview:
 * - Standard (non-prefixed) elements are alignments when strictly resisted.
 * - Prefixed elements (`vs `, `x `, `tool-`) are taxonomy/attributes when strictly weak to.
 * - No cap; exclusions (names or ids) only apply to the resistance-alignment path.
 *
 * @returns {number[]} The list of inferred element ids.
 */
RPG_Enemy.prototype.computeInferredTypedElementIds = function()
{
  // thresholds and exclusions from metadata.
  const resistThreshold = J.APT.EXT.TYPED.Metadata.ResistThreshold;
  const slayerThreshold = J.APT.EXT.TYPED.Metadata.SlayerWeaknessThreshold;

  // the candidate ids are everything deviating far enough from neutral in either direction.
  const candidates = this.inferredElementIds(resistThreshold, slayerThreshold);

  // the rates themselves decide which direction each candidate deviated in.
  const rates = this.elementRates();

  // normalize the configured exclusions into ids and lowercased names.
  const excludedIds = this.excludedAlignmentIds();
  const excludedNames = this.excludedAlignmentNames();

  // partition the candidates by how their element is named.
  return candidates.filter(elementId =>
  {
    // resolve the element's name to learn which naming convention it follows.
    const name = String($dataSystem.elements[elementId])
      .trim()
      .toLowerCase();

    // a prefixed element is taxonomy, and only a weakness to it is identifying.
    if (RPG_Enemy.isPrefixedElementName(name)) return rates[elementId] > slayerThreshold;

    // an excluded element never contributes an alignment, whatever its rate.
    if (excludedIds.has(elementId)) return false;
    if (excludedNames.has(name)) return false;

    // everything else is a standard element, where resistance is what aligns the battler.
    return rates[elementId] < resistThreshold;
  });
};

/**
 * Whether an element name follows one of the prefixed naming conventions.
 *
 * The three prefixes all mark an element as describing *what a battler is* rather than what kind of
 * damage it takes, which is why they are read from the weakness side instead of the resistance one.
 * @param {string} elementName The already-lowercased, already-trimmed element name.
 * @returns {boolean}
 */
RPG_Enemy.isPrefixedElementName = function(elementName)
{
  // slayer taxonomy, attribute tags, and tool interactions, in that order.
  return elementName.startsWith('vs ') || elementName.startsWith('x ') || elementName.startsWith('tool-');
};

/**
 * The configured alignment exclusions that were authored as element ids.
 * @returns {Set<number>}
 */
RPG_Enemy.prototype.excludedAlignmentIds = function()
{
  const excluded = J.APT.EXT.TYPED.Metadata.ExcludedAlignmentElements;

  // an entry that parses as a number was authored as an id.
  const ids = excluded
    .map(entry => Number(entry))
    .filter(entry => Number.isFinite(entry));

  return new Set(ids);
};

/**
 * The configured alignment exclusions that were authored as element names.
 * @returns {Set<string>}
 */
RPG_Enemy.prototype.excludedAlignmentNames = function()
{
  const excluded = J.APT.EXT.TYPED.Metadata.ExcludedAlignmentElements;

  // anything that did not parse as a number was authored as a name.
  const names = excluded
    .filter(entry => !Number.isFinite(Number(entry)))
    .map(entry => String(entry)
      .trim()
      .toLowerCase());

  return new Set(names);
};
//endregion RPG_Enemy