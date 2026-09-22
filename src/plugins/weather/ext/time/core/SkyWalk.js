//region SkyWalk
import SkyStates from './SkyStates.js';

/**
 * How the sky gets from what it is now to what it is next.
 *
 * **Two axes, walked separately.** The condition steps through a per-season transition graph, and
 * the strength takes a bounded step up or down a three-rung ladder. Authoring one graph over every
 * (type, intensity) pair instead would be thirty nodes and nine hundred possible edges, for a
 * result no better than two small mechanisms that each do one thing.
 *
 * It also matches how weather actually reads. A day that goes overcast, then lightly rainy, then
 * properly rainy, then eases back off is two gentle sequences happening at once - not one sequence
 * through a large alphabet of compound states.
 *
 * **Every roll is handed in.** Nothing here calls `Math.random`, which is what lets a whole
 * simulated year be asserted to exact values rather than to ranges, and what lets the settling-day
 * behaviour be proven rather than observed.
 */
class SkyWalk
{
  /**
   * How far along the ladder one step of the strength walk moves.
   * @type {{hold: number, up: number, down: number}}
   */
  static Steps = {
    down: -1,
    hold: 0,
    up: 1,
  };

  /**
   * The answer to "how far is it from here to there" when there is no route at all.
   * @type {number}
   */
  static Unreachable = -1;

  /**
   * Takes the sky one phase forward.
   *
   * The moment is handed over as one object rather than as three arguments because it is one
   * thing - *when this phase is* - and because a signature that grows a positional every time the
   * calendar gains an opinion is a signature nobody can call correctly from memory.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{type: string, intensity: string}} state What the sky is now.
   * @param {{season: string, month: number, isSettling: boolean}} when The phase being rolled for.
   * @param {{type: number, intensity: number}} rolls A fresh roll per axis, each in [0, 1).
   * @returns {{type: string, intensity: string}} What the sky is next.
   */
  static next(sky, state, when, rolls)
  {
    const type = when.isSettling === true
      ? SkyWalk.settlingType(sky, state.type, when.season)
      : SkyWalk.nextType(sky, state.type, when, rolls.type);

    const drifted = SkyWalk.nextIntensity(state.intensity, rolls.intensity, sky.intensityDrift);

    // the strength is clamped by whatever the sky is about to become rather than by what it was, so
    // a drift into `monsoon` arrives heavy no matter what it was doing on the way in.
    const intensity = SkyStates.clampIntensity(sky, type, drifted);

    return {
      type,
      intensity,
    };
  }

  /**
   * The condition the sky moves to next, rolled against this season's graph and this month's lean.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} currentType What the sky is now.
   * @param {{season: string, month: number, isSettling: boolean}} when The phase being rolled for.
   * @param {number} roll A roll in [0, 1).
   * @returns {string}
   */
  static nextType(sky, currentType, when, roll)
  {
    const candidates = SkyWalk.candidatesFor(sky, currentType, when.season);
    const leaned = SkyWalk.leanToward(candidates, SkyWalk.leanOf(sky, when.month));

    return SkyWalk.pickWeighted(leaned, roll);
  }

  /**
   * What a given month leans toward, as a multiplier per condition.
   *
   * **A season says what is possible; a month says what is likely.** Sakura is a spring condition
   * and a fortnight of it, not a season of it; a monsoon belongs to October rather than to autumn
   * at large; the deep snow is December and January and has visibly let go by February. None of
   * that can be said in a transition graph, because a graph has no idea what day it is.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {number} month The month, 1 through 12.
   * @returns {object} Condition names to multipliers; empty when this month leans nowhere.
   */
  static leanOf(sky, month)
  {
    if (sky.months === undefined) return {};

    const lean = sky.months[month];

    if (lean === undefined) return {};

    return lean;
  }

  /**
   * Scales a set of candidates by what the month wants more and less of.
   *
   * **Applied here and deliberately not inside {@link SkyWalk.candidatesFor}.** That method also
   * answers `hopsTo`, which asks what the graph *can* reach - and a condition a month has scaled
   * to zero is still reachable, just not today. Folding the lean in there would make a settling
   * day in January believe half its graph had vanished.
   * @param {{type: string, weight: number}[]} candidates What the graph offers.
   * @param {object} lean Condition names to multipliers.
   * @returns {{type: string, weight: number}[]}
   */
  static leanToward(candidates, lean)
  {
    return candidates.map(candidate => ({
      type: candidate.type,
      weight: candidate.weight * SkyWalk.multiplierFor(lean, candidate.type),
    }));
  }

  /**
   * How much a month wants one particular condition.
   *
   * One by default, which leaves the graph's own weight exactly as authored - so a month names
   * only the conditions it has something to say about.
   * @param {object} lean Condition names to multipliers.
   * @param {string} type The condition being weighed.
   * @returns {number}
   */
  static multiplierFor(lean, type)
  {
    if (lean[type] === undefined) return 1;

    return lean[type];
  }

  /**
   * Where the sky could go from here, and how much each is wanted.
   *
   * Targets are filtered against the season's own `allowed` list, so a graph shared between seasons
   * cannot leak snow into summer even if somebody authors the edge.
   *
   * **A state with nowhere legal to go falls back to every legal state, equally weighted.** That is
   * a recovery rather than a guard: the ordinary path can never reach it, because a settling day
   * hands each season over at `clear` and `clear` is allowed everywhere. A debug clock jump from
   * winter straight into summer *can* - it lands the sky mid-graph holding `snow` in a season that
   * forbids it - and the sky picking a legal condition beats the sky freezing.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} currentType What the sky is now.
   * @param {string} seasonName The season, lowercase.
   * @returns {{type: string, weight: number}[]}
   */
  static candidatesFor(sky, currentType, seasonName)
  {
    const season = sky.seasons[seasonName];

    if (season === undefined) return [];

    const row = season.transitions[currentType];

    if (row === undefined) return SkyWalk.anyOf(season);

    const candidates = Object.keys(row)
      .filter(target => season.allowed.includes(target))
      .map(target => ({
        type: target,
        weight: row[target],
      }));

    if (candidates.length === 0) return SkyWalk.anyOf(season);

    return candidates;
  }

  /**
   * Every condition a season permits, wanted equally.
   * @param {object} season One season's block of the sky configuration.
   * @returns {{type: string, weight: number}[]}
   */
  static anyOf(season)
  {
    return season.allowed.map(target => ({
      type: target,
      weight: 1,
    }));
  }

  /**
   * Picks one weighted candidate.
   *
   * Weights are relative and need not sum to anything, because a config an author can edit is one
   * where adding a condition does not mean rebalancing every number around it.
   * @param {{type: string, weight: number}[]} candidates What could be picked, and how much.
   * @param {number} roll A roll in [0, 1).
   * @returns {string} The chosen type, or an empty string when there was nothing to choose from.
   */
  static pickWeighted(candidates, roll)
  {
    if (candidates.length === 0) return String.empty;

    const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);

    // every weight being zero is an authoring mistake rather than a distribution; the first entry is
    // at least a condition this season permits.
    if (total <= 0) return candidates[0].type;

    let remaining = roll * total;

    // walk the candidates subtracting as we go; whichever one the roll runs out inside is the pick.
    const found = candidates.find(candidate =>
    {
      remaining -= candidate.weight;

      return remaining < 0;
    });

    // floating point can leave the roll a hair past the end of the last band.
    if (found === undefined) return candidates[candidates.length - 1].type;

    return found.type;
  }

  /**
   * The condition the sky moves to when it is being steered toward the season handover.
   *
   * Deterministic rather than rolled, because the whole point of a settling day is that the next
   * season starts from a known state. Each phase takes the neighbour that sits closest to
   * `settleTo`, so a monsoon walks down through the graph over the day rather than snapping out of
   * itself - and the incoming season inherits somewhere neutral to start biasing from.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} currentType What the sky is now.
   * @param {string} seasonName The season, lowercase.
   * @returns {string}
   */
  static settlingType(sky, currentType, seasonName)
  {
    const target = sky.settleTo;

    // already there, and a settling day is not a reason to leave.
    if (currentType === target) return target;

    const candidates = SkyWalk.candidatesFor(sky, currentType, seasonName);

    if (candidates.length === 0) return currentType;

    return SkyWalk.closestTo(sky, candidates, target, seasonName);
  }

  /**
   * Which candidate stands nearest the settling condition.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {{type: string, weight: number}[]} candidates Where the sky could go from here.
   * @param {string} target The condition being walked toward.
   * @param {string} seasonName The season, lowercase.
   * @returns {string}
   */
  static closestTo(sky, candidates, target, seasonName)
  {
    let best = candidates[0].type;
    let shortest = Number.MAX_SAFE_INTEGER;

    candidates.forEach(candidate =>
    {
      const hops = SkyWalk.hopsTo(sky, candidate.type, target, seasonName);

      // a candidate with no route to the settling state is no use on a settling day, however much
      // the graph otherwise wants it.
      if (hops === SkyWalk.Unreachable) return;

      if (hops < shortest)
      {
        shortest = hops;
        best = candidate.type;
      }
    });

    return best;
  }

  /**
   * How many steps it takes to get from one condition to another inside a season's graph.
   *
   * Breadth-first, so the answer is the shortest route rather than the first one found. Used on
   * settling days to choose a direction, and at load time to prove every condition can actually
   * reach the settling state within the six phases a day has to offer.
   * @param {object} sky The parsed `sky` block of `config.weather.json`.
   * @param {string} fromType Where the walk starts.
   * @param {string} targetType Where it is trying to get to.
   * @param {string} seasonName The season, lowercase.
   * @returns {number} The number of steps, or {@link SkyWalk.Unreachable} when there is no route.
   */
  static hopsTo(sky, fromType, targetType, seasonName)
  {
    if (fromType === targetType) return 0;

    const seen = new Set([ fromType ]);
    let frontier = [ fromType ];
    let distance = 0;

    // each pass expands the whole frontier by one step, so the first sighting of the target is by
    // definition the shortest route to it.
    while (frontier.length > 0)
    {
      distance++;

      const next = [];

      frontier.forEach(type =>
      {
        SkyWalk.candidatesFor(sky, type, seasonName)
          .forEach(candidate =>
          {
            if (seen.has(candidate.type) === true) return;

            seen.add(candidate.type);
            next.push(candidate.type);
          });
      });

      if (next.includes(targetType) === true) return distance;

      frontier = next;
    }

    return SkyWalk.Unreachable;
  }

  /**
   * Takes the strength one rung up or down, or leaves it where it is.
   *
   * Bounded to a single rung because that is what makes a sequence read as weather. A strength free
   * to jump from light to heavy produces a day that argues with itself, which is exactly how a
   * player learns the sky is dice rather than a system.
   * @param {string} currentIntensity The strength now.
   * @param {number} roll A roll in [0, 1).
   * @param {{hold: number, up: number, down: number}} drift How much each move is wanted.
   * @returns {string}
   */
  static nextIntensity(currentIntensity, roll, drift)
  {
    const { Ladder } = SkyStates;
    const current = Ladder.indexOf(currentIntensity);
    const step = SkyWalk.stepFor(roll, drift);
    const wanted = current + step;

    // the ends of the ladder are walls rather than wraps: heavy rain does not roll over into light.
    //
    // this also answers a strength that is not on the ladder at all - a hand-edited save, or a
    // config naming a rung that does not exist. Such a one indexes at -1, and every step from
    // there lands at or below zero, so the wall puts it on the bottom rung without a branch of its
    // own that would have to be kept agreeing with this one.
    const clamped = Math.min(Math.max(wanted, 0), Ladder.length - 1);

    return Ladder[clamped];
  }

  /**
   * Which way one step of the strength walk goes.
   * @param {number} roll A roll in [0, 1).
   * @param {{hold: number, up: number, down: number}} drift How much each move is wanted.
   * @returns {number} One of {@link SkyWalk.Steps}.
   */
  static stepFor(roll, drift)
  {
    const candidates = [
      {
        type: 'hold',
        weight: drift.hold,
      },
      {
        type: 'up',
        weight: drift.up,
      },
      {
        type: 'down',
        weight: drift.down,
      },
    ];

    const chosen = SkyWalk.pickWeighted(candidates, roll);

    return SkyWalk.Steps[chosen];
  }
}

export default SkyWalk;
//endregion SkyWalk