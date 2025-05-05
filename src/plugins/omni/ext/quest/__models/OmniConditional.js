//region OmniConditional
class OmniConditional
{
  questKey = String.empty;
  objectiveId = null;
  state = 0;

  constructor(questKey, objectiveId = null, state = OmniQuest.States.Active)
  {
    this.questKey = questKey;
    this.objectiveId = objectiveId;
    this.state = state;
  }
}

//endregion OmniConditional