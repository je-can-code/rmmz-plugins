//region registerOmniStatsSaveCodecs
import StatistopediaRecords from './__models/StatistopediaRecords.js';

/**
 * Declares the statistopedia's records as a class instance rather than a plain bag of fields.
 *
 * Without this the encoder throws by name at save time, which is the loud half of the save contract
 * working as intended: a field holding an instance has to say so, or a decoded save would hand back
 * an object with the right data and none of the methods that read it.
 *
 * J-Base owns the `Game_Party` registration, so this extends it rather than re-registering- the
 * caches every other omni extension keeps on the party are theirs to declare, and this one is ours.
 */
SerializableRegistry.extend(Game_Party, {
  typed: {
    '_j._omni._statistopediaRecords': StatistopediaRecords,
  },
});
//endregion registerOmniStatsSaveCodecs