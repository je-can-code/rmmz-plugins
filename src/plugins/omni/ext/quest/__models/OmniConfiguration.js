//region OmniConfiguration
import OmniTag from './OmniTag.js';
import OmniQuest from './OmniQuest.js';
import OmniCategory from './OmniCategory.js';
/**
 * A class representing the data shape of the Questopedia configuration.
 */
class OmniConfiguration
{
  /**
   * The quest metadata from the config file.
   * @type {OmniQuest[]}
   */
  quests = Array.empty;

  /**
   * The tag metadata from the config file.
   * @type {OmniTag[]}
   */
  tags = Array.empty;

  /**
   * The category metadata from the config file.
   * @type {OmniCategory[]}
   */
  categories = Array.empty;

  /**
   *
   * @param {OmniQuest[]} quests The quest metadata.
   * @param {OmniTag[]} tags The tag metadata.
   * @param {OmniCategory[]} categories The category metadata.
   */
  constructor(quests, tags, categories)
  {
    this.quests = quests;
    this.tags = tags;
    this.categories = categories;
  }
}

export default OmniConfiguration;
//endregion OmniConfiguration