/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Message
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Message
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ChoiceList`.
   * Initialized in: none.
   * Written in: {@link Scene_Message#createChoiceListWindow}.
   * Read in: {@link Scene_Message#associateWindows}, {@link Scene_Message#createChoiceListWindow}.
   */
  _choiceListWindow: Window_ChoiceList;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_EventItem`.
   * Initialized in: none.
   * Written in: {@link Scene_Message#createEventItemWindow}.
   * Read in: {@link Scene_Message#associateWindows}, {@link Scene_Message#createEventItemWindow}.
   */
  _eventItemWindow: Window_EventItem;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Gold`.
   * Initialized in: none.
   * Written in: {@link Scene_Message#createGoldWindow}.
   * Read in: {@link Scene_Message#associateWindows}, {@link Scene_Message#createGoldWindow}.
   */
  _goldWindow: Window_Gold;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Message`.
   * Initialized in: none.
   * Written in: {@link Scene_Message#createMessageWindow}.
   * Read in: {@link Scene_Message#associateWindows}, {@link Scene_Message#cancelMessageWait}, {@link Scene_Message#createMessageWindow}, {@link Scene_Message#isMessageWindowClosing}.
   */
  _messageWindow: Window_Message;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_NameBox`.
   * Initialized in: none.
   * Written in: {@link Scene_Message#createNameBoxWindow}.
   * Read in: {@link Scene_Message#associateWindows}, {@link Scene_Message#createNameBoxWindow}.
   */
  _nameBoxWindow: Window_NameBox;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_NumberInput`.
   * Initialized in: none.
   * Written in: {@link Scene_Message#createNumberInputWindow}.
   * Read in: {@link Scene_Message#associateWindows}, {@link Scene_Message#createNumberInputWindow}.
   */
  _numberInputWindow: Window_NumberInput;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ScrollText`.
   * Initialized in: none.
   * Written in: {@link Scene_Message#createScrollTextWindow}.
   * Read in: {@link Scene_Message#createScrollTextWindow}.
   */
  _scrollTextWindow: Window_ScrollText;
  /**
   * Performs associate windows.
   */
  associateWindows(): void;
  /**
   * Performs cancel message wait.
   */
  cancelMessageWait(): void;
  /**
   * Creates all windows.
   */
  createAllWindows(): void;
  /**
   * Creates choice list window.
   */
  createChoiceListWindow(): void;
  /**
   * Creates event item window.
   */
  createEventItemWindow(): void;
  /**
   * Creates gold window.
   */
  createGoldWindow(): void;
  /**
   * Creates message window.
   */
  createMessageWindow(): void;
  /**
   * Creates name box window.
   */
  createNameBoxWindow(): void;
  /**
   * Creates number input window.
   */
  createNumberInputWindow(): void;
  /**
   * Creates scroll text window.
   */
  createScrollTextWindow(): void;
  /**
   * Gets event item window rect.
   * @returns The result.
   */
  eventItemWindowRect(): Rectangle;
  /**
   * Gets gold window rect.
   * @returns The result.
   */
  goldWindowRect(): Rectangle;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether message window closing.
   * @returns True if message window closing; false otherwise.
   */
  isMessageWindowClosing(): boolean;
  /**
   * Gets message window rect.
   * @returns The result.
   */
  messageWindowRect(): Rectangle;
  /**
   * Gets scroll text window rect.
   * @returns The result.
   */
  scrollTextWindowRect(): Rectangle;
}
