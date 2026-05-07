/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Message
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Message
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setBackground}.<br/>
   * Read in: {@link Game_Message#background}.<br/>
   */
  _background: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setChoiceBackground}.<br/>
   * Read in: {@link Game_Message#choiceBackground}.<br/>
   */
  _choiceBackground: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | (n: number) => void`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#onChoice}, {@link Game_Message#setChoiceCallback}.<br/>
   * Read in: {@link Game_Message#onChoice}.<br/>
   */
  _choiceCallback: null | (n: number) => void;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setChoices}.<br/>
   * Read in: {@link Game_Message#choiceCancelType}.<br/>
   */
  _choiceCancelType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setChoices}.<br/>
   * Read in: {@link Game_Message#choiceDefaultType}.<br/>
   */
  _choiceDefaultType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setChoicePositionType}.<br/>
   * Read in: {@link Game_Message#choicePositionType}.<br/>
   */
  _choicePositionType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[] | string[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setChoices}.<br/>
   * Read in: {@link Game_Message#choices}, {@link Game_Message#isChoice}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Game_Message#isChoice}.<br/>
   */
  _choices: unknown[] | string[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setFaceImage}.<br/>
   * Read in: {@link Game_Message#faceIndex}.<br/>
   */
  _faceIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setFaceImage}.<br/>
   * Read in: {@link Game_Message#faceName}.<br/>
   */
  _faceName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setItemChoice}.<br/>
   * Read in: {@link Game_Message#itemChoiceItypeId}.<br/>
   */
  _itemChoiceItypeId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setItemChoice}.<br/>
   * Read in: {@link Game_Message#isItemChoice}, {@link Game_Message#itemChoiceVariableId}.<br/>
   */
  _itemChoiceVariableId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setNumberInput}.<br/>
   * Read in: {@link Game_Message#numInputMaxDigits}.<br/>
   */
  _numInputMaxDigits: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setNumberInput}.<br/>
   * Read in: {@link Game_Message#isNumberInput}, {@link Game_Message#numInputVariableId}.<br/>
   */
  _numInputVariableId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setPositionType}.<br/>
   * Read in: {@link Game_Message#positionType}.<br/>
   */
  _positionType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setScroll}.<br/>
   * Read in: {@link Game_Message#scrollMode}.<br/>
   */
  _scrollMode: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setScroll}.<br/>
   * Read in: {@link Game_Message#scrollNoFast}.<br/>
   */
  _scrollNoFast: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setScroll}.<br/>
   * Read in: {@link Game_Message#scrollSpeed}.<br/>
   */
  _scrollSpeed: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}, {@link Game_Message#setSpeakerName}.<br/>
   * Read in: {@link Game_Message#speakerName}.<br/>
   */
  _speakerName: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Message#clear}.<br/>
   * Read in: {@link Game_Message#add}, {@link Game_Message#allText}, {@link Game_Message#hasText}, {@link Game_Message#newPage}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Game_Message#hasText}, {@link Game_Message#newPage}.<br/>
   * - `push()`: {@link Game_Message#add}.<br/>
   */
  _texts: unknown[];
  /**
   * Performs add.
   * @param text The text parameter.
   */
  add(text: string): void;
  /**
   * Gets all text.
   * @returns The result.
   */
  allText(): string;
  /**
   * Gets background.
   * @returns The result.
   */
  background(): number;
  /**
   * Gets choice background.
   * @returns The result.
   */
  choiceBackground(): number;
  /**
   * Gets choice cancel type.
   * @returns The result.
   */
  choiceCancelType(): number;
  /**
   * Gets choice default type.
   * @returns The result.
   */
  choiceDefaultType(): number;
  /**
   * Gets choice position type.
   * @returns The result.
   */
  choicePositionType(): number;
  /**
   * Gets choices.
   * @returns The result.
   */
  choices(): string[];
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Gets face index.
   * @returns The result.
   */
  faceIndex(): number;
  /**
   * Gets face name.
   * @returns The result.
   */
  faceName(): string;
  /**
   * Determines whether text.
   * @returns True if text; false otherwise.
   */
  hasText(): boolean;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether busy.
   * @returns True if busy; false otherwise.
   */
  isBusy(): boolean;
  /**
   * Determines whether choice.
   * @returns True if choice; false otherwise.
   */
  isChoice(): boolean;
  /**
   * Determines whether item choice.
   * @returns True if item choice; false otherwise.
   */
  isItemChoice(): boolean;
  /**
   * Determines whether number input.
   * @returns True if number input; false otherwise.
   */
  isNumberInput(): boolean;
  /**
   * Determines whether rtl.
   * @returns True if rtl; false otherwise.
   */
  isRTL(): boolean;
  /**
   * Gets item choice itype id.
   * @returns The result.
   */
  itemChoiceItypeId(): number;
  /**
   * Gets item choice variable id.
   * @returns The result.
   */
  itemChoiceVariableId(): number;
  /**
   * Performs new page.
   */
  newPage(): void;
  /**
   * Gets num input max digits.
   * @returns The result.
   */
  numInputMaxDigits(): number;
  /**
   * Gets num input variable id.
   * @returns The result.
   */
  numInputVariableId(): number;
  /**
   * Performs on choice.
   * @param n The n parameter.
   */
  onChoice(n: number): void;
  /**
   * Gets position type.
   * @returns The result.
   */
  positionType(): number;
  /**
   * Gets scroll mode.
   * @returns The result.
   */
  scrollMode(): boolean;
  /**
   * Gets scroll no fast.
   * @returns The result.
   */
  scrollNoFast(): boolean;
  /**
   * Gets scroll speed.
   * @returns The result.
   */
  scrollSpeed(): number;
  /**
   * Sets background.
   * @param background The background parameter.
   */
  setBackground(background: number): void;
  /**
   * Sets choice background.
   * @param background The background parameter.
   */
  setChoiceBackground(background: number): void;
  /**
   * Sets choice callback.
   * @param callback The callback parameter.
   */
  setChoiceCallback(callback: (n: number) => void): void;
  /**
   * Sets choice position type.
   * @param positionType The positionType parameter.
   */
  setChoicePositionType(positionType: number): void;
  /**
   * Sets choices.
   * @param choices The choices parameter.
   * @param defaultType The defaultType parameter.
   * @param cancelType The cancelType parameter.
   */
  setChoices(choices: string[], defaultType: number, cancelType: number): void;
  /**
   * Sets face image.
   * @param faceName The faceName parameter.
   * @param faceIndex The faceIndex parameter.
   */
  setFaceImage(faceName: string, faceIndex: number): void;
  /**
   * Sets item choice.
   * @param variableId The variableId parameter.
   * @param itemType The itemType parameter.
   */
  setItemChoice(variableId: number, itemType: number): void;
  /**
   * Sets number input.
   * @param variableId The variableId parameter.
   * @param maxDigits The maxDigits parameter.
   */
  setNumberInput(variableId: number, maxDigits: number): void;
  /**
   * Sets position type.
   * @param positionType The positionType parameter.
   */
  setPositionType(positionType: number): void;
  /**
   * Sets scroll.
   * @param speed The speed parameter.
   * @param noFast The noFast parameter.
   */
  setScroll(speed: number, noFast: boolean): void;
  /**
   * Sets speaker name.
   * @param speakerName The speakerName parameter.
   */
  setSpeakerName(speakerName: string): void;
  /**
   * Gets speaker name.
   * @returns The result.
   */
  speakerName(): string;
}
