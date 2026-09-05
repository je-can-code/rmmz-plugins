//region StatistopediaService
/**
 * Turns two very different stores into one list of labelled rows.
 *
 * The Statistopedia has no data of its own. Its numbers come from J-ABS-Metrics' game variables and
 * from the party's {@link StatistopediaRecords}, and reconciling those two shapes is the entire job
 * of this class. It exists as a service rather than as window code because a window that computes
 * what it draws cannot be tested without standing one up, and every rate in here is arithmetic worth
 * asserting on directly.
 *
 * Rows are built, never drawn. The window iterates whatever comes back and knows nothing about what
 * any of it means.
 */
class StatistopediaService
{
  /**
   * The value shown where a number cannot honestly be computed yet.
   *
   * A rate with nothing in its denominator is not zero- zero percent is a claim about a player who
   * tried and failed, and showing it to someone who has not swung yet is a lie the menu tells on its
   * own behalf.
   * @type {string}
   */
  static NO_DATA = 'n/a';

  /**
   * The sections the Statistopedia pages through, in the order they are presented.
   *
   * The order is a narrowing: what you did, how you held up, what you reached for, what you set a
   * record at, and where you were when it happened.
   * @type {Array<{key: string, name: string, iconIndex: number}>}
   */
  static SECTIONS = [
    {
      key: 'combat',
      name: 'Combat',
      iconIndex: 77,
    },
    {
      key: 'defense',
      name: 'Defense',
      iconIndex: 81,
    },
    {
      key: 'usage',
      name: 'Habits',
      iconIndex: 79,
    },
    {
      key: 'records',
      name: 'Records',
      iconIndex: 87,
    },
    {
      key: 'world',
      name: 'World',
      iconIndex: 190,
    },
  ];

  /**
   * Constructor.
   * A static class though, so don't build it.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The sections available to page through.
   * @returns {Array<{key: string, name: string, iconIndex: number}>}
   */
  static sections()
  {
    return StatistopediaService.SECTIONS;
  }

  /**
   * Builds the rows for one section.
   *
   * An unrecognized key yields no rows rather than throwing, because the only thing that can supply
   * a key is the section list above- so a miss means the cycle and this switch have drifted apart,
   * and a blank panel says that more usefully at runtime than a crash does.
   * @param {string} sectionKey The key of the section to build.
   * @returns {Array<{label: string, value: string}>}
   */
  static rowsFor(sectionKey)
  {
    switch (sectionKey)
    {
      case 'combat':
        return StatistopediaService.combatRows();
      case 'defense':
        return StatistopediaService.defenseRows();
      case 'usage':
        return StatistopediaService.usageRows();
      case 'records':
        return StatistopediaService.recordsRows();
      case 'world':
        return StatistopediaService.worldRows();
      default:
        return [];
    }
  }

  //region sections
  /**
   * What the party has done to everything else.
   * @returns {Array<{label: string, value: string}>}
   */
  static combatRows()
  {
    const metadata = StatistopediaService.metricsMetadata();
    const records = StatistopediaService.records();

    const kills = StatistopediaService.counter(metadata.enemiesDefeatedVariableId);
    const damageDealt = StatistopediaService.counter(metadata.totalDamageDealtVariableId);
    const crits = StatistopediaService.counter(metadata.numberOfCritsDealtVariableId);
    const evadedByEnemies = StatistopediaService.counter(metadata.attacksEvadedByEnemiesVariableId);
    const hits = records.hitsLanded();
    const swings = hits + evadedByEnemies;

    return [
      StatistopediaService.countRow('Enemies Defeated', kills),
      StatistopediaService.countRow('Total Damage Dealt', damageDealt),
      StatistopediaService.countRow('Biggest Hit', StatistopediaService.counter(metadata.highestDamageDealtVariableId)),
      StatistopediaService.countRow('Critical Hits Landed', crits),
      StatistopediaService.countRow('Biggest Critical', StatistopediaService.counter(metadata.biggestCritDealtVariableId)),
      StatistopediaService.rateRow('Critical Rate', crits, hits),
      StatistopediaService.rateRow('Accuracy', hits, swings),
      StatistopediaService.averageRow('Damage per Kill', damageDealt, kills),
    ];
  }

  /**
   * What everything else has done to the party.
   * @returns {Array<{label: string, value: string}>}
   */
  static defenseRows()
  {
    const metadata = StatistopediaService.metricsMetadata();
    const records = StatistopediaService.records();

    const parries = StatistopediaService.counter(metadata.numberOfParriesVariableId);
    const preciseParries = StatistopediaService.counter(metadata.numberOfPreciseParriesVariableId);
    const guardedHits = StatistopediaService.counter(metadata.numberOfGuardedHitsVariableId);
    const prevented = StatistopediaService.counter(metadata.damagePreventedByGuardingVariableId);
    const critsTaken = StatistopediaService.counter(metadata.numberOfCritsTakenVariableId);

    // the precise tally is a subset of the total, so the passive count is whatever is left over.
    const passiveParries = parries - preciseParries;

    return [
      StatistopediaService.countRow('Deaths', StatistopediaService.counter(metadata.numberOfDeathsVariableId)),
      StatistopediaService.countRow('Allies Downed', StatistopediaService.counter(metadata.alliesDownedVariableId)),
      StatistopediaService.countRow('Total Damage Taken', StatistopediaService.counter(metadata.totalDamageTakenVariableId)),
      StatistopediaService.countRow('Worst Hit Taken', StatistopediaService.counter(metadata.highestDamageTakenVariableId)),
      StatistopediaService.countRow('Critical Hits Taken', critsTaken),
      StatistopediaService.rateRow('Critical Rate Against You', critsTaken, records.hitsTaken()),
      StatistopediaService.countRow('Parries', parries),
      StatistopediaService.countRow('Parries on Purpose', preciseParries),
      StatistopediaService.countRow('Parries by Luck', passiveParries),
      StatistopediaService.countRow('Glancing Blows', StatistopediaService.counter(metadata.numberOfGlancingBlowsVariableId)),
      StatistopediaService.countRow('Attacks Evaded', StatistopediaService.counter(metadata.attacksEvadedByPartyVariableId)),
      StatistopediaService.countRow('Damage Stopped by Guarding', prevented),
      StatistopediaService.averageRow('Stopped per Guarded Hit', prevented, guardedHits),
    ];
  }

  /**
   * What the party reaches for.
   * @returns {Array<{label: string, value: string}>}
   */
  static usageRows()
  {
    const metadata = StatistopediaService.metricsMetadata();

    return [
      StatistopediaService.countRow('Mainhand Swings', StatistopediaService.counter(metadata.mainhandSkillUsageVariableId)),
      StatistopediaService.countRow('Offhand Swings', StatistopediaService.counter(metadata.offhandSkillUsageVariableId)),
      StatistopediaService.countRow('Equipped Skills Used', StatistopediaService.counter(metadata.assignedSkillUsageVariableId)),
      StatistopediaService.countRow('Dodges', StatistopediaService.counter(metadata.dodgeSkillUsageVariableId)),
      StatistopediaService.countRow('Guards Raised', StatistopediaService.counter(metadata.guardActivationsVariableId)),
      StatistopediaService.countRow('Tools Used', StatistopediaService.counter(metadata.toolUsageVariableId)),
      StatistopediaService.countRow('Items Used', StatistopediaService.counter(metadata.usableItemUsageVariableId)),
    ];
  }

  /**
   * The superlatives: the single best number the party ever put up.
   * @returns {Array<{label: string, value: string}>}
   */
  static recordsRows()
  {
    const records = StatistopediaService.records();
    const closestCall = records.lowestHpSurvived();

    return [
      StatistopediaService.countRow('Longest Kill Streak', records.longestKillStreak()),
      StatistopediaService.countRow('Current Kill Streak', records.currentKillStreak()),
      StatistopediaService.countRow('Biggest Overkill', records.biggestOverkill()),
      StatistopediaService.closestCallRow(closestCall),
      StatistopediaService.favoriteWeaponRow(),
      StatistopediaService.favoriteSkillRow(),
      StatistopediaService.nemesisRow(),
    ];
  }

  /**
   * Where all of it happened.
   * @returns {Array<{label: string, value: string}>}
   */
  static worldRows()
  {
    const metadata = StatistopediaService.metricsMetadata();
    const records = StatistopediaService.records();

    const visited = records.visitedMapIds();

    return [
      StatistopediaService.countRow('Places Visited', visited.size),
      StatistopediaService.countRow('Steps Taken', $gameParty.steps()),
      StatistopediaService.countRow('Things Broken', StatistopediaService.counter(metadata.destructiblesDestroyedVariableId)),
      StatistopediaService.deadliestPlaceRow(),
      StatistopediaService.busiestPlaceRow(),
    ];
  }

  //endregion sections

  //region superlative rows
  /**
   * Builds the closest-call row, which reads differently before the first one happens.
   * @param {number} closestCall The lowest hp ever survived at, or zero if there is none yet.
   * @returns {{label: string, value: string}}
   */
  static closestCallRow(closestCall)
  {
    // zero is the model's way of saying nothing has been recorded, not a survival at zero hp.
    if (closestCall === 0)
    {
      return StatistopediaService.row('Closest Call', StatistopediaService.NO_DATA);
    }

    return StatistopediaService.row('Closest Call', `${StatistopediaService.number(closestCall)} hp`);
  }

  /**
   * Builds the row naming whichever weapon has dealt the most damage.
   * @returns {{label: string, value: string}}
   */
  static favoriteWeaponRow()
  {
    const records = StatistopediaService.records();
    const leader = StatistopediaService.largestEntry(records.damageByWeaponId());

    if (leader === null)
    {
      return StatistopediaService.row('Favorite Weapon', StatistopediaService.NO_DATA);
    }

    const weapon = $dataWeapons.at(leader.key);
    const damage = StatistopediaService.number(leader.value);

    return StatistopediaService.row('Favorite Weapon', `${weapon.name} (${damage})`);
  }

  /**
   * Builds the row naming whichever skill has been used the most.
   * @returns {{label: string, value: string}}
   */
  static favoriteSkillRow()
  {
    const records = StatistopediaService.records();
    const leader = StatistopediaService.largestEntry(records.usageBySkillId());

    if (leader === null)
    {
      return StatistopediaService.row('Most-Used Skill', StatistopediaService.NO_DATA);
    }

    const skill = $dataSkills.at(leader.key);
    const uses = StatistopediaService.number(leader.value);

    return StatistopediaService.row('Most-Used Skill', `${skill.name} (${uses})`);
  }

  /**
   * Builds the row naming whichever enemy the party has killed the most of.
   * @returns {{label: string, value: string}}
   */
  static nemesisRow()
  {
    const records = StatistopediaService.records();
    const leader = StatistopediaService.largestEntry(records.killsByEnemyId());

    if (leader === null)
    {
      return StatistopediaService.row('Most Slain', StatistopediaService.NO_DATA);
    }

    const enemy = $dataEnemies.at(leader.key);
    const kills = StatistopediaService.number(leader.value);

    return StatistopediaService.row('Most Slain', `${enemy.name} (${kills})`);
  }

  /**
   * Builds the row naming wherever the player has died the most.
   * @returns {{label: string, value: string}}
   */
  static deadliestPlaceRow()
  {
    const records = StatistopediaService.records();
    const leader = StatistopediaService.largestEntry(records.deathsByMapId());

    if (leader === null)
    {
      return StatistopediaService.row('Deadliest Place', StatistopediaService.NO_DATA);
    }

    const name = StatistopediaService.mapName(leader.key);
    const deaths = StatistopediaService.number(leader.value);

    return StatistopediaService.row('Deadliest Place', `${name} (${deaths})`);
  }

  /**
   * Builds the row naming wherever the party has killed the most.
   * @returns {{label: string, value: string}}
   */
  static busiestPlaceRow()
  {
    const records = StatistopediaService.records();
    const leader = StatistopediaService.largestEntry(records.killsByMapId());

    if (leader === null)
    {
      return StatistopediaService.row('Busiest Hunting Ground', StatistopediaService.NO_DATA);
    }

    const name = StatistopediaService.mapName(leader.key);
    const kills = StatistopediaService.number(leader.value);

    return StatistopediaService.row('Busiest Hunting Ground', `${name} (${kills})`);
  }

  //endregion superlative rows

  //region helpers
  /**
   * The metadata naming which variable holds which lifetime counter.
   * @returns {JAbsMetrics_PluginMetadata}
   */
  static metricsMetadata()
  {
    return J.ABS.EXT.METRICS.Metadata;
  }

  /**
   * The party's record of everything a variable cannot hold.
   * @returns {StatistopediaRecords}
   */
  static records()
  {
    return $gameParty.getStatistopediaRecords();
  }

  /**
   * Reads one of J-ABS-Metrics' lifetime counters.
   * @param {number} variableId The variable holding the counter.
   * @returns {number}
   */
  static counter(variableId)
  {
    return $gameVariables.value(variableId);
  }

  /**
   * Builds a row from a label and an already-formatted value.
   * @param {string} label The name of the statistic.
   * @param {string} value The value as it should be read.
   * @returns {{label: string, value: string}}
   */
  static row(label, value)
  {
    return {
      label,
      value,
    };
  }

  /**
   * Builds a row from a raw count.
   * @param {string} label The name of the statistic.
   * @param {number} count The count to present.
   * @returns {{label: string, value: string}}
   */
  static countRow(label, count)
  {
    const formatted = StatistopediaService.number(count);

    return StatistopediaService.row(label, formatted);
  }

  /**
   * Builds a row presenting one count as a percentage of another.
   * @param {string} label The name of the statistic.
   * @param {number} numerator The count being measured.
   * @param {number} denominator The count it is measured against.
   * @returns {{label: string, value: string}}
   */
  static rateRow(label, numerator, denominator)
  {
    // nothing to divide into means the rate has not been earned yet, either way.
    if (denominator === 0)
    {
      return StatistopediaService.row(label, StatistopediaService.NO_DATA);
    }

    const percentage = (numerator / denominator) * 100;

    return StatistopediaService.row(label, `${percentage.toFixed(1)}%`);
  }

  /**
   * Builds a row presenting the average of one count across another.
   * @param {string} label The name of the statistic.
   * @param {number} total The running total being spread.
   * @param {number} occurrences How many times it was spread across.
   * @returns {{label: string, value: string}}
   */
  static averageRow(label, total, occurrences)
  {
    if (occurrences === 0)
    {
      return StatistopediaService.row(label, StatistopediaService.NO_DATA);
    }

    const average = Math.round(total / occurrences);

    return StatistopediaService.countRow(label, average);
  }

  /**
   * Finds the largest entry in a keyed tally.
   *
   * Ties resolve to whichever key the map met first, which is insertion order- the enemy you started
   * killing earlier wins a dead heat. Nothing better presents itself, and a tie between two counts
   * this large is not a thing a player will ever witness.
   *
   * This is the one place in this class that returns null, because "no entries" is genuinely
   * different from "an entry whose value is zero" and every caller renders the two differently.
   * @param {Map<number, number>} tally The keyed tally to search.
   * @returns {{key: number, value: number}|null} The largest entry, or null when there are none.
   */
  static largestEntry(tally)
  {
    let leader = null;

    tally.forEach((value, key) =>
    {
      if (leader !== null && value <= leader.value) return;

      leader = {
        key,
        value,
      };
    });

    return leader;
  }

  /**
   * Resolves a map id into the name a player would recognize.
   *
   * The display name is preferred because that is the one shown on screen when the player arrives;
   * the editor name is the fallback for maps that never set one.
   * @param {number} mapId The map to name.
   * @returns {string}
   */
  static mapName(mapId)
  {
    const info = $dataMapInfos.at(mapId);
    const displayName = $gameMap.displayName();

    // the currently-loaded map is the only one whose display name is in memory.
    if (mapId === $gameMap.mapId() && displayName !== String.empty)
    {
      return displayName;
    }

    return info.name;
  }

  /**
   * Formats a number for reading rather than for arithmetic.
   * @param {number} value The number to format.
   * @returns {string}
   */
  static number(value)
  {
    return value.toLocaleString();
  }

  //endregion helpers
}

export default StatistopediaService;
//endregion StatistopediaService