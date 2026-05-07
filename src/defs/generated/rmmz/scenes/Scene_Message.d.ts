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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _choiceListWindow: Window_ChoiceList;
  _eventItemWindow: Window_EventItem;
  _goldWindow: Window_Gold;
  _messageWindow: Window_Message;
  _nameBoxWindow: Window_NameBox;
  _numberInputWindow: Window_NumberInput;
  _scrollTextWindow: Window_ScrollText;
  associateWindows(): void;
  cancelMessageWait(): void;
  createAllWindows(): void;
  createChoiceListWindow(): void;
  createEventItemWindow(): void;
  createGoldWindow(): void;
  createMessageWindow(): void;
  createNameBoxWindow(): void;
  createNumberInputWindow(): void;
  createScrollTextWindow(): void;
  eventItemWindowRect(): Rectangle;
  goldWindowRect(): Rectangle;
  initialize(): void;
  isMessageWindowClosing(): boolean;
  messageWindowRect(): Rectangle;
  scrollTextWindowRect(): Rectangle;
}
