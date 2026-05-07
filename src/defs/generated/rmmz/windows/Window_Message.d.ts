/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Message
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Message extends Window_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#updateBackground}.<br/>
   * Read in: {@link Window_Message#areSettingsChanged}, {@link Window_Message#updateBackground}.<br/>
   */
  _background: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#setChoiceListWindow}.<br/>
   * Read in: {@link Window_Message#isAnySubWindowActive}, {@link Window_Message#startInput}.<br/>
   */
  _choiceListWindow: null | Window_Base;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#setEventItemWindow}.<br/>
   * Read in: {@link Window_Message#isAnySubWindowActive}, {@link Window_Message#startInput}.<br/>
   */
  _eventItemWindow: null | Window_Base;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#loadMessageFace}, {@link Window_Message#updateLoading}.<br/>
   * Read in: {@link Window_Message#updateLoading}.<br/>
   */
  _faceBitmap: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#setGoldWindow}.<br/>
   * Read in: {@link Window_Message#processEscapeCharacter}, {@link Window_Message#terminateMessage}, {@link Window_Message#updatePlacement}.<br/>
   */
  _goldWindow: null | Window_Base;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#clearFlags}, {@link Window_Message#processEscapeCharacter}, {@link Window_Message#processNewLine}.<br/>
   * Read in: {@link Window_Message#shouldBreakHere}.<br/>
   */
  _lineShowFast: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#setNameBoxWindow}.<br/>
   * Read in: {@link Window_Message#startMessage}, {@link Window_Message#synchronizeNameBox}, {@link Window_Message#updateSpeakerName}.<br/>
   */
  _nameBoxWindow: null | Window_Base;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#setNumberInputWindow}.<br/>
   * Read in: {@link Window_Message#isAnySubWindowActive}, {@link Window_Message#startInput}.<br/>
   */
  _numberInputWindow: null | Window_Base;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#clearFlags}, {@link Window_Message#processEscapeCharacter}.<br/>
   * Read in: {@link Window_Message#onEndOfText}.<br/>
   */
  _pauseSkip: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#updatePlacement}.<br/>
   * Read in: {@link Window_Message#areSettingsChanged}, {@link Window_Message#updatePlacement}.<br/>
   */
  _positionType: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#clearFlags}, {@link Window_Message#updateShowFast}.<br/>
   * Read in: {@link Window_Message#shouldBreakHere}.<br/>
   */
  _showFast: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | object`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#initMembers}, {@link Window_Message#onEndOfText}, {@link Window_Message#startMessage}.<br/>
   * Read in: {@link Window_Message#startMessage}, {@link Window_Message#updateInput}, {@link Window_Message#updateMessage}.<br/>
   */
  _textState: null | object;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_Message#cancelWait}, {@link Window_Message#initMembers}, {@link Window_Message#startWait}, {@link Window_Message#updateWait}.<br/>
   * Read in: {@link Window_Message#isWaiting}, {@link Window_Message#updateWait}.<br/>
   */
  _waitCount: number;
  /**
   * Gets are settings changed.
   * @returns The result.
   */
  areSettingsChanged(): boolean;
  /**
   * Determines whether break here.
   * @param textState The textState parameter.
   * @returns True if break here; false otherwise.
   */
  canBreakHere(textState: object): boolean;
  /**
   * Determines whether start.
   * @returns True if start; false otherwise.
   */
  canStart(): boolean;
  /**
   * Performs cancel wait.
   */
  cancelWait(): void;
  /**
   * Performs check to not close.
   */
  checkToNotClose(): void;
  /**
   * Clears flags.
   */
  clearFlags(): void;
  /**
   * Gets does continue.
   * @returns The result.
   */
  doesContinue(): boolean;
  /**
   * Performs draw message face.
   */
  drawMessageFace(): void;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether any sub window active.
   * @returns True if any sub window active; false otherwise.
   */
  isAnySubWindowActive(): boolean;
  /**
   * Determines whether end of text.
   * @param textState The textState parameter.
   * @returns True if end of text; false otherwise.
   */
  isEndOfText(textState: object): boolean;
  /**
   * Determines whether triggered.
   * @returns True if triggered; false otherwise.
   */
  isTriggered(): boolean;
  /**
   * Determines whether waiting.
   * @returns True if waiting; false otherwise.
   */
  isWaiting(): boolean;
  /**
   * Performs load message face.
   */
  loadMessageFace(): void;
  /**
   * Gets needs new page.
   * @param textState The textState parameter.
   * @returns The result.
   */
  needsNewPage(textState: object): boolean;
  /**
   * Gets new line x.
   * @param textState The textState parameter.
   * @returns The result.
   */
  newLineX(textState: object): number;
  /**
   * Performs new page.
   * @param textState The textState parameter.
   */
  newPage(textState: object): void;
  /**
   * Performs on end of text.
   */
  onEndOfText(): void;
  /**
   * Performs process control character.
   * @param textState The textState parameter.
   * @param c The c parameter.
   */
  processControlCharacter(textState: object, c: string): void;
  /**
   * Performs process escape character.
   * @param code The code parameter.
   * @param textState The textState parameter.
   */
  processEscapeCharacter(code: string, textState: object): void;
  /**
   * Performs process new line.
   * @param textState The textState parameter.
   */
  processNewLine(textState: object): void;
  /**
   * Performs process new page.
   * @param textState The textState parameter.
   */
  processNewPage(textState: object): void;
  /**
   * Sets choice list window.
   * @param choiceListWindow The choiceListWindow parameter.
   */
  setChoiceListWindow(choiceListWindow: Window_Base): void;
  /**
   * Sets event item window.
   * @param eventItemWindow The eventItemWindow parameter.
   */
  setEventItemWindow(eventItemWindow: Window_Base): void;
  /**
   * Sets gold window.
   * @param goldWindow The goldWindow parameter.
   */
  setGoldWindow(goldWindow: Window_Base): void;
  /**
   * Sets name box window.
   * @param nameBoxWindow The nameBoxWindow parameter.
   */
  setNameBoxWindow(nameBoxWindow: Window_Base): void;
  /**
   * Sets number input window.
   * @param numberInputWindow The numberInputWindow parameter.
   */
  setNumberInputWindow(numberInputWindow: Window_Base): void;
  /**
   * Gets should break here.
   * @param textState The textState parameter.
   * @returns The result.
   */
  shouldBreakHere(textState: object): boolean;
  /**
   * Gets start input.
   * @returns The result.
   */
  startInput(): boolean;
  /**
   * Performs start message.
   */
  startMessage(): void;
  /**
   * Performs start pause.
   */
  startPause(): void;
  /**
   * Performs start wait.
   * @param count The count parameter.
   */
  startWait(count: number): void;
  /**
   * Performs synchronize name box.
   */
  synchronizeNameBox(): void;
  /**
   * Performs terminate message.
   */
  terminateMessage(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates background.
   */
  updateBackground(): void;
  /**
   * Updates input.
   * @returns The result.
   */
  updateInput(): boolean;
  /**
   * Updates loading.
   * @returns The result.
   */
  updateLoading(): boolean;
  /**
   * Updates message.
   * @returns The result.
   */
  updateMessage(): boolean;
  /**
   * Updates placement.
   */
  updatePlacement(): void;
  /**
   * Updates show fast.
   */
  updateShowFast(): void;
  /**
   * Updates speaker name.
   */
  updateSpeakerName(): void;
  /**
   * Updates wait.
   * @returns The result.
   */
  updateWait(): boolean;
}
