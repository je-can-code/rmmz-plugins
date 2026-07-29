//region Window_Base
import QuestManager from './../managers/QuestManager.js';
/**
 * Overwrites {@link Window_Base#translateQuestTextCode}.
 * Supplies the real quest translation now that the Questopedia system is present.
 * @param {string} text The text that has a text code in it.
 * @returns {string} The new text to parse.
 */
Window_Base.prototype.translateQuestTextCode = function(text)
{
  // translate every quest text code into its icon-and-name form.
  return text.replace(/\\quest\[([\w.-]+)]/gi, (_, p1) =>
  {
    // determine the quest key.
    const questKey = p1 ?? String.empty;

    // if no key was provided, then do not parse the quest.
    if (!questKey) return text;

    // grab the quest by its key.
    const quest = QuestManager.quest(questKey);

    // if the quest doesn't exist, then do not parse the quest.
    if (!quest) return text;

    // grab the name of the quest.
    const questName = quest.name()
    //   .replace(/[\\]{1}(.)/gi, originalText =>
    // {
    //   return `\\${originalText}`;
    // });

    // for quests, the icon displayed is the category icon instead.
    const questIconIndex = QuestManager.category(quest.categoryKey).iconIndex;

    // return the constructed replacement string.
    return `\\I[${questIconIndex}]\\C[1]${questName}\\C[0]`;
  });
};
//endregion Window_Base
