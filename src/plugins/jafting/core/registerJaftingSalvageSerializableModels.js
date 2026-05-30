//region registerJaftingSalvageSerializableModels
import JaftingSalvageLedgerRow from './__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from './__models/JaftingSalvageLedgerSnapshot.js';
import JaftingSalvagePartyLedgerBag from './__models/JaftingSalvagePartyLedgerBag.js';

/**
 * Registers JAFTING salvage ledger models with {@link SerializableRegistry}.
 */
SerializableRegistry.register(JaftingSalvageLedgerRow);
SerializableRegistry.register(JaftingSalvageLedgerSnapshot);
SerializableRegistry.register(JaftingSalvagePartyLedgerBag);
//endregion registerJaftingSalvageSerializableModels