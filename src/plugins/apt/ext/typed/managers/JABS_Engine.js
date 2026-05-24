//region JABS_Engine
import ApTypeKey from './../_models/ApTypeKey.js';
import ApTypeGrant from './../_models/ApTypeGrant.js';

if (J.ABS)
{
  /**
   * Extends {@link #gainAptitudeReward}.<br/>
   * Also distributes typed AP from explicit enemy lines and inferred enemy element types.
   * @param {number} ap The untyped AP to gain (from `<ap:N>`).
   * @param {JABS_Battler} actor The map battler that defeated the target.
   * @param {Game_Enemy} enemy The enemy that was defeated.
   */
  J.APT.EXT.TYPED.Aliased.JABS_Engine.set('gainAptitudeReward', JABS_Engine.prototype.gainAptitudeReward);
  JABS_Engine.prototype.gainAptitudeReward = function(ap, actor, enemy)
  {
    // perform original logic for untyped AP distribution and feedback.
    J.APT.EXT.TYPED.Aliased.JABS_Engine.get('gainAptitudeReward')
      .call(this, ap, actor, enemy);

    // configuration knob for inferred enemy elements.
    const implicitEnemyPct = J.APT.EXT.TYPED.Metadata.ImplicitEnemyElementPercent;

    // grab the enemy data from the enemy defeated.
    const enemyData = enemy.enemy();

    // collect explicit typed rewards if present on the enemy.
    const explicitTyped = enemyData.typedApRewards();

    // collect inferred element types (cached on Game_Temp).
    const inferredTypes = enemyData.inferredTypedElements();

    // if there is no typed work to do, skip.
    const hasExplicit = explicitTyped.length > 0;
    const hasInferred = implicitEnemyPct > 0 && inferredTypes.length > 0;
    if (!hasExplicit && !hasInferred) return;

    // award typed AP to all eligible party members.
    $gameParty.members()
      .filter(member => this.canGainAptitudeReward(member, enemy))
      .forEach(member => this.distributeTypedAptitudeRewardsForMember(
        member,
        ap,
        enemy,
        explicitTyped,
        inferredTypes,
        implicitEnemyPct
      ));
  };

  /**
   * Distributes typed AP rewards (explicit and inferred) to a single eligible party member.
   *
   * @param {Game_Actor} member - The party member receiving typed AP.
   * @param {number} baseAp - The base untyped AP amount granted by the enemy.
   * @param {RPG_Enemy} enemy - The defeated enemy database entry.
   * @param {ApTypeGrant[]} explicitTyped - Flat typed rewards from enemy notes.
   * @param {ApTypeKey[]} inferredTypes - Inferred enemy element types from DB rates.
   * @param {number} implicitEnemyPct - Integer percent for inferred enemy types (0-100).
   */
  JABS_Engine.prototype.distributeTypedAptitudeRewardsForMember = function(
    member,
    baseAp,
    enemy,
    explicitTyped,
    inferredTypes,
    implicitEnemyPct
  )
  {
    // identify the JABS battler that owns this member.
    const jabsBattler = JABS_AiManager.getBattlerByUuid(member.getUuid());

    // if somehow we have no battler here, then do nothing.
    if (!jabsBattler) return;

    // apply level scaling multiplier from JABS.
    const levelMultiplier = this.getRewardScalingMultiplier(enemy, jabsBattler);

    // derive the base actual AP (same as untyped path) for percent math.
    const baseActualAp = Math.ceil(baseAp * levelMultiplier);

    // 1) Apply explicit typed lines as flat amounts (scaled like base AP).
    if (explicitTyped.length > 0)
    {
      explicitTyped.forEach(grant =>
      {
        // compute scaled typed AP in favor of the player.
        const actualAp = Math.ceil(grant.amount * levelMultiplier);

        // award the typed AP.
        ApManager.gainTypedAp(member, actualAp, grant.domain, grant.id, 'on-kill:typed:explicit');

        // notify that typed AP was granted so optional extensions can respond.
        this.onTypedApGained(actualAp, jabsBattler.getCharacter(), new ApTypeKey(grant.domain, grant.id));
        this.createLogApTyped(actualAp, jabsBattler, new ApTypeKey(grant.domain, grant.id));
      });
    }

    // 2) Apply inferred enemy element types as percent of base.
    if (implicitEnemyPct > 0 && inferredTypes.length > 0)
    {
      inferredTypes.forEach(key =>
      {
        // compute the bonus from the configured integer percent.
        const bonus = Math.ceil(baseActualAp * implicitEnemyPct / 100);

        // award the typed AP when non-zero.
        if (bonus > 0)
        {
          ApManager.gainTypedAp(member, bonus, key.domain, key.id, 'on-kill:typed:inferred-enemy');
          // notify that typed AP was granted so optional extensions can respond.
          this.onTypedApGained(bonus, jabsBattler.getCharacter(), key);
          this.createLogApTyped(bonus, jabsBattler, key);
        }
      });
    }
  };

  /**
   * Lifecycle event: typed AP was awarded to a battler on the map.
   * Extended by optional plugins (e.g. J-Popups-APT) to surface map feedback.
   * @param {number} apPoints The typed AP amount granted.
   * @param {Game_Character} character The character who received the reward.
   * @param {ApTypeKey} apTypeKey The typed key (domain + id) for labeling.
   */
  // eslint-disable-next-line no-unused-vars
  JABS_Engine.prototype.onTypedApGained = function(apPoints, character, apTypeKey) 
  {};

  /**
   * Creates a typed AP log entry with icon + short label.
   * @param {number} apPoints - The AP gained.
   * @param {JABS_Battler} battler - The battler gaining the AP.
   * @param {ApTypeKey} apTypeKey - The typed key (domain+id) for labeling.
   */
  JABS_Engine.prototype.createLogApTyped = function(apPoints, battler, apTypeKey)
  {
    // if we are not logging, then don't do this.
    if (!J.LOG) return;

    // resolve display parts for this typed key.
    const { name, icon } = ApManager.apTypeDisplay(apTypeKey);

    // eslint-disable-next-line max-len
    const message = `\\C[16]${battler.battlerName()}\\C[0] gained \\C[29]\\*${apPoints}\\*\\C[0] AP \\i[${icon}] [${name}].`;

    // build the log entry (prepend icon with \i[x]).
    const apLog = new ActionLogBuilder()
      .setMessage(message)
      .build();

    // add the log to the action log manager.
    $actionLogManager.addLog(apLog);
  };

}
//endregion JABS_Engine