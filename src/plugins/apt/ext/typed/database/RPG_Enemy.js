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
  const raw = RPGManager.getArraysFromNotesByRegex(this, J.APT.EXT.TYPED.RegExp.ApTypedReward, true);

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
 * Rules overview:
 * - Standard (non‑prefixed) elements with rate < ResistThreshold are alignments.
 * - Prefixed elements (`vs `, `x `, `tool-`) with rate > SlayerWeaknessThreshold are taxonomy/attributes.
 * - No cap; exclusions (names or ids) only apply to the resistance‑alignment path.
 * - Exclusions only apply to the resistance path.
 *
 * @returns {number[]} The list of inferred element ids.
 */
RPG_Enemy.prototype.computeInferredTypedElementIds = function()
{
  // thresholds and exclusions from metadata.
  const resistThreshold = J.APT.EXT.TYPED.Metadata.ResistThreshold;
  const slayerThreshold = J.APT.EXT.TYPED.Metadata.SlayerWeaknessThreshold;
  const excluded = J.APT.EXT.TYPED.Metadata.ExcludedAlignmentElements;

  // normalize exclusions to sets of ids and lowercase names.
  const excludedIds = new Set();
  const excludedNames = new Set();
  excluded.forEach(entry =>
  {
    // parse numeric ids and collect others as lowercased names.
    const asNum = Number(entry);
    if (Number.isFinite(asNum))
    {
      excludedIds.add(asNum);
    }
    else
    {
      const normalizedName = String(entry)
        .trim()
        .toLowerCase();

      excludedNames.add(normalizedName);
    }
  });

  // local helpers to classify element names.
  const isSlayer = (low) => low.startsWith('vs ');
  const isAttr = (low) => low.startsWith('x ');
  const isTool = (low) => low.startsWith('tool-');

  // compute multiplicative element rates from DB traits.
  const names = $dataSystem.elements;
  const traits = Array.isArray(this.traits) ? this.traits : [];
  const rates = new Array(names.length).fill(1.0);
  for (let i = 0; i < traits.length; i++)
  {
    // check for element-rate trait.
    const t = traits[i];
    if (t && t.code === 11 /* TRAIT_ELEMENT_RATE */)
    {
      // multiply the rate for the target element id.
      const eid = t.dataId;
      rates[eid] = rates[eid] * Number(t.value);
    }
  }

  // evaluate rules and collect ids.
  const inferred = [];
  for (let eid = 0; eid < names.length; eid++)
  {
    // acquire element name and normalized variants.
    const rawName = names[eid];
    if (!rawName) continue;
    const name = String(rawName).trim();
    const low = name.toLowerCase();

    // pull the computed rate for this element id.
    const rate = rates[eid];

    // classify by naming convention.
    const slayer = isSlayer(low);
    const attr = isAttr(low);
    const tool = isTool(low);
    const prefixed = slayer || attr || tool;

    // resistance-as-alignment for standard (non-prefixed) elements.
    if (prefixed === false)
    {
      // skip excluded ids/names for this path.
      if (excludedIds.has(eid)) continue;
      if (excludedNames.has(low)) continue;

      // include when strictly resistant.
      if (rate < resistThreshold)
      {
        inferred.push(eid);
      }
    }

    // slayer/attribute/tool taxonomy when strictly weak.
    if (prefixed === true)
    {
      // include when strictly weak to this prefixed element.
      if (rate > slayerThreshold)
      {
        inferred.push(eid);
      }
    }
  }

  // NOTE: no de-duplication is needed here. the loop above visits each element id exactly once and
  // its two collection paths are mutually exclusive on `prefixed`, so an id can be appended at most
  // one time. the ids are therefore already unique and already in element order.
  return inferred;
};
//endregion RPG_Enemy