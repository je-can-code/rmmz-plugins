//region RPG_Base
import ApTypeKey from './../_models/ApTypeKey.js';

/**
 * Extends {@link #buildAptitudeTeachings}.<br/>
 * Also appends typed teachables parsed from `<aptitudeTyped:[skillId, requiredAp, domain, idOrName]>`.
 */
J.APT.EXT.TYPED.Aliased.RPG_Base.set('buildAptitudeTeachings', RPG_Base.prototype.buildAptitudeTeachings);
RPG_Base.prototype.buildAptitudeTeachings = function()
{
  // perform original logic.
  /** @type {AptitudeTeachable[]} */
  // perform original logic.
  const base = J.APT.EXT.TYPED.Aliased.RPG_Base.get('buildAptitudeTeachings')
    .call(this);

  // extract typed tuples like [skillId, requiredAp, domain, idOrName].
  /** @type {Array<[number, number, string, string|number]>} */
  const raw = RPGManager.getArraysFromNotesByRegex(this, J.APT.EXT.TYPED.RegExp.AptitudeTeachableTyped);

  // map into enriched AptitudeTeachables.
  const typed = raw
    .map(([ skillId, requiredAp, domain, idOrName ]) =>
    {
      // resolve id through ApManager (single source of truth).
      const dom = String(domain)
        .trim()
        .toLowerCase();
      const id = ApManager.resolveDomainId(dom, idOrName);

      // skip unresolvable entries.
      if (Number.isNaN(id) === true) return null;

      // construct a standard teachable.
      const t = new AptitudeTeachable(skillId, requiredAp);

      // derive the typed requirement key.
      const key = new ApTypeKey(dom, id)

      // attach the typed requirement as a proper model.
      t.setApTypeKey(key);

      // return the enriched teachable.
      return t;
    })
    .filter(t => !!t);

  // return merged list.
  return base.concat(typed);
};
//endregion RPG_Base