//region JABS_RespawnRecord
/**
 * A single pending (or permanent) respawn for one authored event on one map.
 *
 * Written the moment a battler dies and read every time something asks whether that event may
 * become a battler again. The `due` value is a plain number whose unit belongs entirely to the
 * method that scheduled it- playtime frames for core's "seconds" method, or whatever comparable
 * scalar an extension's method encodes its appointments into. This class never interprets `due`;
 * only the registered method that produced it can.
 */
class JABS_RespawnRecord
{
  /**
   * The reserved method name meaning "this battler never returns".
   * @type {string}
   */
  static PERMANENT_METHOD = 'never';

  /**
   * @param {string} method The respawn method that scheduled this record.
   * @param {string} param The raw tag parameter the method was scheduled with.
   * @param {number} due The method-defined moment at which the battler may return.
   */
  constructor(method, param, due)
  {
    this.initMembers(method, param, due);
  }

  /**
   * Initializes the members of this class.
   * @param {string} method The respawn method that scheduled this record.
   * @param {string} param The raw tag parameter the method was scheduled with.
   * @param {number} due The method-defined moment at which the battler may return.
   */
  initMembers(method, param, due)
  {
    /**
     * The respawn method that scheduled this record.
     * @type {string}
     */
    this.method = method;

    /**
     * The raw tag parameter the method was scheduled with.
     * Kept for diagnostics and for methods whose due-ness depends on more than the scalar.
     * @type {string}
     */
    this.param = param;

    /**
     * The method-defined moment at which the battler may return.
     * The unit is owned by the method; compare it only through that method's own due check.
     * @type {number}
     */
    this.due = due;
  }

  /**
   * Whether this record represents a battler that never returns.
   * @returns {boolean}
   */
  isPermanent()
  {
    return this.method === JABS_RespawnRecord.PERMANENT_METHOD;
  }
}

export default JABS_RespawnRecord;

/**
 * Respawn records live in the registry map on `Game_System` and thus survive into a savefile-
 * permanence records are the whole point of surviving. The seed is explicit because
 * {@link JABS_RespawnRecord.initMembers} takes its values as parameters, and the decoder never
 * runs a constructor; the defaults are the cold equivalents of an unscheduled record.
 */
SerializableRegistry.register(JABS_RespawnRecord, {
  id: 'jabs-respawn-record',
  aliases: [ 'JABS_RespawnRecord' ],
  seed: instance =>
  {
    instance.method = String.empty;
    instance.param = String.empty;
    instance.due = 0;
  },
});
//endregion JABS_RespawnRecord