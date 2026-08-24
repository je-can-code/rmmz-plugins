// models load before initialization: constructing the metadata immediately decorates every
// difficulty layer, and the accessor that decoration calls is installed by DifficultyMetadata.js.
import './__models/AffixEffects.js';
import './__models/DifficultyMetadata.js';

import './_metadata/initialization.js';

import './_metadata/JPassiveAffix_PluginMetadata.js';
import './objects/Game_Event.js';
import './objects/Game_Temp.js';
import './scenes/Scene_Boot.js';