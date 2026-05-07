/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Interpreter
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Interpreter
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `RPG_InterpreterBranchMap`.<br/>
   * Initialized in: {@link Game_Interpreter#initialize}.<br/>
   * Written in: {@link Game_Interpreter#initialize}.<br/>
   * Read in: {@link Game_Interpreter#command111}, {@link Game_Interpreter#command301}, {@link Game_Interpreter#command402}, {@link Game_Interpreter#command403}, {@link Game_Interpreter#command411}, {@link Game_Interpreter#command601}, {@link Game_Interpreter#command602}, {@link Game_Interpreter#command603}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#setupChoices}.<br/>
   */
  _branch: RPG_InterpreterBranchMap;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#command205}, {@link Game_Interpreter#command212}, {@link Game_Interpreter#command213}.<br/>
   * Read in: {@link Game_Interpreter#command205}, {@link Game_Interpreter#command212}, {@link Game_Interpreter#command213}, {@link Game_Interpreter#updateWaitMode}.<br/>
   */
  _characterId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Interpreter`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setupChild}, {@link Game_Interpreter#updateChild}.<br/>
   * Read in: {@link Game_Interpreter#setupChild}, {@link Game_Interpreter#updateChild}.<br/>
   */
  _childInterpreter: null | Game_Interpreter;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string | unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#command108}, {@link Game_Interpreter#terminate}.<br/>
   * Read in: {@link Game_Interpreter#command108}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Game_Interpreter#command108}.<br/>
   */
  _comments: string | unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Game_Interpreter#initialize}.<br/>
   * Written in: {@link Game_Interpreter#initialize}.<br/>
   * Read in: {@link Game_Interpreter#checkOverflow}, {@link Game_Interpreter#setupChild}.<br/>
   */
  _depth: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setup}.<br/>
   * Read in: {@link Game_Interpreter#character}, {@link Game_Interpreter#command111}, {@link Game_Interpreter#command117}, {@link Game_Interpreter#command123}, {@link Game_Interpreter#command214}, {@link Game_Interpreter#eventId}.<br/>
   */
  _eventId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Interpreter#initialize}.<br/>
   * Written in: {@link Game_Interpreter#checkFreeze}, {@link Game_Interpreter#initialize}.<br/>
   * Read in: {@link Game_Interpreter#checkFreeze}.<br/>
   */
  _frameCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Interpreter#initialize}.<br/>
   * Written in: {@link Game_Interpreter#checkFreeze}, {@link Game_Interpreter#initialize}.<br/>
   * Read in: none.<br/>
   */
  _freezeChecker: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Game_Interpreter#initialize}.<br/>
   * Written in: {@link Game_Interpreter#executeCommand}, {@link Game_Interpreter#initialize}.<br/>
   * Read in: {@link Game_Interpreter#command111}, {@link Game_Interpreter#command301}, {@link Game_Interpreter#command402}, {@link Game_Interpreter#command403}, {@link Game_Interpreter#command411}, {@link Game_Interpreter#command413}, {@link Game_Interpreter#command601}, {@link Game_Interpreter#command602}, {@link Game_Interpreter#command603}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#setupChoices}, {@link Game_Interpreter#skipBranch}.<br/>
   */
  _indent: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#command101}, {@link Game_Interpreter#command105}, {@link Game_Interpreter#command108}, {@link Game_Interpreter#command113}, {@link Game_Interpreter#command115}, {@link Game_Interpreter#command302}, {@link Game_Interpreter#command355}, {@link Game_Interpreter#command413}, {@link Game_Interpreter#executeCommand}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#skipBranch}.<br/>
   * Read in: {@link Game_Interpreter#command113}, {@link Game_Interpreter#currentCommand}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#nextEventCode}, {@link Game_Interpreter#skipBranch}.<br/>
   */
  _index: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setup}, {@link Game_Interpreter#terminate}.<br/>
   * Read in: {@link Game_Interpreter#command113}, {@link Game_Interpreter#command115}, {@link Game_Interpreter#command119}, {@link Game_Interpreter#currentCommand}, {@link Game_Interpreter#isRunning}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#loadImages}, {@link Game_Interpreter#nextEventCode}, {@link Game_Interpreter#skipBranch}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Game_Interpreter#command113}, {@link Game_Interpreter#command115}, {@link Game_Interpreter#command119}.<br/>
   */
  _list: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setup}.<br/>
   * Read in: {@link Game_Interpreter#command111}, {@link Game_Interpreter#command123}, {@link Game_Interpreter#isOnCurrentMap}.<br/>
   */
  _mapId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#updateWaitCount}, {@link Game_Interpreter#wait}.<br/>
   * Read in: {@link Game_Interpreter#updateWaitCount}.<br/>
   */
  _waitCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setWaitMode}, {@link Game_Interpreter#updateWaitMode}.<br/>
   * Read in: {@link Game_Interpreter#updateWaitMode}.<br/>
   */
  _waitMode: string;
  /**
   * Performs change hp.
   * @param target The target parameter.
   * @param value The value parameter.
   * @param allowDeath The allowDeath parameter.
   */
  changeHp(target: unknown, value: unknown, allowDeath: unknown): void;
  /**
   * Gets character.
   * @param param The param parameter.
   * @returns The result.
   */
  character(param: unknown): unknown;
  /**
   * Gets check freeze.
   * @returns The result.
   */
  checkFreeze(): boolean;
  /**
   * Performs check overflow.
   */
  checkOverflow(): void;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Gets command101.
   * @param params The params parameter.
   * @returns The result.
   */
  command101(params: unknown): boolean;
  /**
   * Gets command102.
   * @param params The params parameter.
   * @returns The result.
   */
  command102(params: unknown): boolean;
  /**
   * Gets command103.
   * @param params The params parameter.
   * @returns The result.
   */
  command103(params: unknown): boolean;
  /**
   * Gets command104.
   * @param params The params parameter.
   * @returns The result.
   */
  command104(params: unknown): boolean;
  /**
   * Gets command105.
   * @param params The params parameter.
   * @returns The result.
   */
  command105(params: unknown): boolean;
  /**
   * Gets command108.
   * @param params The params parameter.
   * @returns The result.
   */
  command108(params: unknown): boolean;
  /**
   * Gets command109.
   * @returns The result.
   */
  command109(): boolean;
  /**
   * Gets command111.
   * @param params The params parameter.
   * @returns The result.
   */
  command111(params: unknown): boolean;
  /**
   * Gets command112.
   * @returns The result.
   */
  command112(): boolean;
  /**
   * Gets command113.
   * @returns The result.
   */
  command113(): boolean;
  /**
   * Gets command115.
   * @returns The result.
   */
  command115(): boolean;
  /**
   * Gets command117.
   * @param params The params parameter.
   * @returns The result.
   */
  command117(params: unknown): boolean;
  /**
   * Gets command118.
   * @returns The result.
   */
  command118(): boolean;
  /**
   * Gets command119.
   * @param params The params parameter.
   * @returns The result.
   */
  command119(params: unknown): boolean;
  /**
   * Gets command121.
   * @param params The params parameter.
   * @returns The result.
   */
  command121(params: unknown): boolean;
  /**
   * Gets command122.
   * @param params The params parameter.
   * @returns The result.
   */
  command122(params: unknown): boolean;
  /**
   * Gets command123.
   * @param params The params parameter.
   * @returns The result.
   */
  command123(params: unknown): boolean;
  /**
   * Gets command124.
   * @param params The params parameter.
   * @returns The result.
   */
  command124(params: unknown): boolean;
  /**
   * Gets command125.
   * @param params The params parameter.
   * @returns The result.
   */
  command125(params: unknown): boolean;
  /**
   * Gets command126.
   * @param params The params parameter.
   * @returns The result.
   */
  command126(params: unknown): boolean;
  /**
   * Gets command127.
   * @param params The params parameter.
   * @returns The result.
   */
  command127(params: unknown): boolean;
  /**
   * Gets command128.
   * @param params The params parameter.
   * @returns The result.
   */
  command128(params: unknown): boolean;
  /**
   * Gets command129.
   * @param params The params parameter.
   * @returns The result.
   */
  command129(params: unknown): boolean;
  /**
   * Gets command132.
   * @param params The params parameter.
   * @returns The result.
   */
  command132(params: unknown): boolean;
  /**
   * Gets command133.
   * @param params The params parameter.
   * @returns The result.
   */
  command133(params: unknown): boolean;
  /**
   * Gets command134.
   * @param params The params parameter.
   * @returns The result.
   */
  command134(params: unknown): boolean;
  /**
   * Gets command135.
   * @param params The params parameter.
   * @returns The result.
   */
  command135(params: unknown): boolean;
  /**
   * Gets command136.
   * @param params The params parameter.
   * @returns The result.
   */
  command136(params: unknown): boolean;
  /**
   * Gets command137.
   * @param params The params parameter.
   * @returns The result.
   */
  command137(params: unknown): boolean;
  /**
   * Gets command138.
   * @param params The params parameter.
   * @returns The result.
   */
  command138(params: unknown): boolean;
  /**
   * Gets command139.
   * @param params The params parameter.
   * @returns The result.
   */
  command139(params: unknown): boolean;
  /**
   * Gets command140.
   * @param params The params parameter.
   * @returns The result.
   */
  command140(params: unknown): boolean;
  /**
   * Gets command201.
   * @param params The params parameter.
   * @returns The result.
   */
  command201(params: unknown): boolean;
  /**
   * Gets command202.
   * @param params The params parameter.
   * @returns The result.
   */
  command202(params: unknown): boolean;
  /**
   * Gets command203.
   * @param params The params parameter.
   * @returns The result.
   */
  command203(params: unknown): boolean;
  /**
   * Gets command204.
   * @param params The params parameter.
   * @returns The result.
   */
  command204(params: unknown): boolean;
  /**
   * Gets command205.
   * @param params The params parameter.
   * @returns The result.
   */
  command205(params: unknown): boolean;
  /**
   * Gets command206.
   * @returns The result.
   */
  command206(): boolean;
  /**
   * Gets command211.
   * @param params The params parameter.
   * @returns The result.
   */
  command211(params: unknown): boolean;
  /**
   * Gets command212.
   * @param params The params parameter.
   * @returns The result.
   */
  command212(params: unknown): boolean;
  /**
   * Gets command213.
   * @param params The params parameter.
   * @returns The result.
   */
  command213(params: unknown): boolean;
  /**
   * Gets command214.
   * @returns The result.
   */
  command214(): boolean;
  /**
   * Gets command216.
   * @param params The params parameter.
   * @returns The result.
   */
  command216(params: unknown): boolean;
  /**
   * Gets command217.
   * @returns The result.
   */
  command217(): boolean;
  /**
   * Gets command221.
   * @returns The result.
   */
  command221(): boolean;
  /**
   * Gets command222.
   * @returns The result.
   */
  command222(): boolean;
  /**
   * Gets command223.
   * @param params The params parameter.
   * @returns The result.
   */
  command223(params: unknown): boolean;
  /**
   * Gets command224.
   * @param params The params parameter.
   * @returns The result.
   */
  command224(params: unknown): boolean;
  /**
   * Gets command225.
   * @param params The params parameter.
   * @returns The result.
   */
  command225(params: unknown): boolean;
  /**
   * Gets command230.
   * @param params The params parameter.
   * @returns The result.
   */
  command230(params: unknown): boolean;
  /**
   * Gets command231.
   * @param params The params parameter.
   * @returns The result.
   */
  command231(params: unknown): boolean;
  /**
   * Gets command232.
   * @param params The params parameter.
   * @returns The result.
   */
  command232(params: unknown): boolean;
  /**
   * Gets command233.
   * @param params The params parameter.
   * @returns The result.
   */
  command233(params: unknown): boolean;
  /**
   * Gets command234.
   * @param params The params parameter.
   * @returns The result.
   */
  command234(params: unknown): boolean;
  /**
   * Gets command235.
   * @param params The params parameter.
   * @returns The result.
   */
  command235(params: unknown): boolean;
  /**
   * Gets command236.
   * @param params The params parameter.
   * @returns The result.
   */
  command236(params: unknown): boolean;
  /**
   * Gets command241.
   * @param params The params parameter.
   * @returns The result.
   */
  command241(params: unknown): boolean;
  /**
   * Gets command242.
   * @param params The params parameter.
   * @returns The result.
   */
  command242(params: unknown): boolean;
  /**
   * Gets command243.
   * @returns The result.
   */
  command243(): boolean;
  /**
   * Gets command244.
   * @returns The result.
   */
  command244(): boolean;
  /**
   * Gets command245.
   * @param params The params parameter.
   * @returns The result.
   */
  command245(params: unknown): boolean;
  /**
   * Gets command246.
   * @param params The params parameter.
   * @returns The result.
   */
  command246(params: unknown): boolean;
  /**
   * Gets command249.
   * @param params The params parameter.
   * @returns The result.
   */
  command249(params: unknown): boolean;
  /**
   * Gets command250.
   * @param params The params parameter.
   * @returns The result.
   */
  command250(params: unknown): boolean;
  /**
   * Gets command251.
   * @returns The result.
   */
  command251(): boolean;
  /**
   * Gets command261.
   * @param params The params parameter.
   * @returns The result.
   */
  command261(params: unknown): boolean;
  /**
   * Gets command281.
   * @param params The params parameter.
   * @returns The result.
   */
  command281(params: unknown): boolean;
  /**
   * Gets command282.
   * @param params The params parameter.
   * @returns The result.
   */
  command282(params: unknown): boolean;
  /**
   * Gets command283.
   * @param params The params parameter.
   * @returns The result.
   */
  command283(params: unknown): boolean;
  /**
   * Gets command284.
   * @param params The params parameter.
   * @returns The result.
   */
  command284(params: unknown): boolean;
  /**
   * Gets command285.
   * @param params The params parameter.
   * @returns The result.
   */
  command285(params: unknown): boolean;
  /**
   * Gets command301.
   * @param params The params parameter.
   * @returns The result.
   */
  command301(params: unknown): boolean;
  /**
   * Gets command302.
   * @param params The params parameter.
   * @returns The result.
   */
  command302(params: unknown): boolean;
  /**
   * Gets command303.
   * @param params The params parameter.
   * @returns The result.
   */
  command303(params: unknown): boolean;
  /**
   * Gets command311.
   * @param params The params parameter.
   * @returns The result.
   */
  command311(params: unknown): boolean;
  /**
   * Gets command312.
   * @param params The params parameter.
   * @returns The result.
   */
  command312(params: unknown): boolean;
  /**
   * Gets command313.
   * @param params The params parameter.
   * @returns The result.
   */
  command313(params: unknown): boolean;
  /**
   * Gets command314.
   * @param params The params parameter.
   * @returns The result.
   */
  command314(params: unknown): boolean;
  /**
   * Gets command315.
   * @param params The params parameter.
   * @returns The result.
   */
  command315(params: unknown): boolean;
  /**
   * Gets command316.
   * @param params The params parameter.
   * @returns The result.
   */
  command316(params: unknown): boolean;
  /**
   * Gets command317.
   * @param params The params parameter.
   * @returns The result.
   */
  command317(params: unknown): boolean;
  /**
   * Gets command318.
   * @param params The params parameter.
   * @returns The result.
   */
  command318(params: unknown): boolean;
  /**
   * Gets command319.
   * @param params The params parameter.
   * @returns The result.
   */
  command319(params: unknown): boolean;
  /**
   * Gets command320.
   * @param params The params parameter.
   * @returns The result.
   */
  command320(params: unknown): boolean;
  /**
   * Gets command321.
   * @param params The params parameter.
   * @returns The result.
   */
  command321(params: unknown): boolean;
  /**
   * Gets command322.
   * @param params The params parameter.
   * @returns The result.
   */
  command322(params: unknown): boolean;
  /**
   * Gets command323.
   * @param params The params parameter.
   * @returns The result.
   */
  command323(params: unknown): boolean;
  /**
   * Gets command324.
   * @param params The params parameter.
   * @returns The result.
   */
  command324(params: unknown): boolean;
  /**
   * Gets command325.
   * @param params The params parameter.
   * @returns The result.
   */
  command325(params: unknown): boolean;
  /**
   * Gets command326.
   * @param params The params parameter.
   * @returns The result.
   */
  command326(params: unknown): boolean;
  /**
   * Gets command331.
   * @param params The params parameter.
   * @returns The result.
   */
  command331(params: unknown): boolean;
  /**
   * Gets command332.
   * @param params The params parameter.
   * @returns The result.
   */
  command332(params: unknown): boolean;
  /**
   * Gets command333.
   * @param params The params parameter.
   * @returns The result.
   */
  command333(params: unknown): boolean;
  /**
   * Gets command334.
   * @param params The params parameter.
   * @returns The result.
   */
  command334(params: unknown): boolean;
  /**
   * Gets command335.
   * @param params The params parameter.
   * @returns The result.
   */
  command335(params: unknown): boolean;
  /**
   * Gets command336.
   * @param params The params parameter.
   * @returns The result.
   */
  command336(params: unknown): boolean;
  /**
   * Gets command337.
   * @param params The params parameter.
   * @returns The result.
   */
  command337(params: unknown): boolean;
  /**
   * Gets command339.
   * @param params The params parameter.
   * @returns The result.
   */
  command339(params: unknown): boolean;
  /**
   * Gets command340.
   * @returns The result.
   */
  command340(): boolean;
  /**
   * Gets command342.
   * @param params The params parameter.
   * @returns The result.
   */
  command342(params: unknown): boolean;
  /**
   * Gets command351.
   * @returns The result.
   */
  command351(): boolean;
  /**
   * Gets command352.
   * @returns The result.
   */
  command352(): boolean;
  /**
   * Gets command353.
   * @returns The result.
   */
  command353(): boolean;
  /**
   * Gets command354.
   * @returns The result.
   */
  command354(): boolean;
  /**
   * Gets command355.
   * @returns The result.
   */
  command355(): boolean;
  /**
   * Gets command356.
   * @param params The params parameter.
   * @returns The result.
   */
  command356(params: unknown): boolean;
  /**
   * Gets command357.
   * @param params The params parameter.
   * @returns The result.
   */
  command357(params: unknown): boolean;
  /**
   * Gets command402.
   * @param params The params parameter.
   * @returns The result.
   */
  command402(params: unknown): boolean;
  /**
   * Gets command403.
   * @returns The result.
   */
  command403(): boolean;
  /**
   * Gets command411.
   * @returns The result.
   */
  command411(): boolean;
  /**
   * Gets command413.
   * @returns The result.
   */
  command413(): boolean;
  /**
   * Gets command601.
   * @returns The result.
   */
  command601(): boolean;
  /**
   * Gets command602.
   * @returns The result.
   */
  command602(): boolean;
  /**
   * Gets command603.
   * @returns The result.
   */
  command603(): boolean;
  /**
   * Gets current command.
   * @returns The result.
   */
  currentCommand(): unknown;
  /**
   * Gets event id.
   * @returns The result.
   */
  eventId(): unknown;
  /**
   * Gets execute command.
   * @returns The result.
   */
  executeCommand(): boolean;
  /**
   * Gets fade speed.
   * @returns The result.
   */
  fadeSpeed(): number;
  /**
   * Gets game data operand.
   * @param _type The type parameter.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @returns The result.
   */
  gameDataOperand(_type: unknown, param1: unknown, param2: unknown): number;
  /**
   * Initializes initialize.
   * @param depth The depth parameter.
   */
  initialize(depth: unknown): void;
  /**
   * Determines whether on current map.
   * @returns True if on current map; false otherwise.
   */
  isOnCurrentMap(): boolean;
  /**
   * Determines whether running.
   * @returns True if running; false otherwise.
   */
  isRunning(): boolean;
  /**
   * Performs iterate actor ex.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @param callback The callback parameter.
   */
  iterateActorEx(param1: unknown, param2: unknown, callback: unknown): void;
  /**
   * Performs iterate actor id.
   * @param param The param parameter.
   * @param callback The callback parameter.
   */
  iterateActorId(param: unknown, callback: unknown): void;
  /**
   * Performs iterate actor index.
   * @param param The param parameter.
   * @param callback The callback parameter.
   */
  iterateActorIndex(param: unknown, callback: unknown): void;
  /**
   * Performs iterate battler.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @param callback The callback parameter.
   */
  iterateBattler(param1: unknown, param2: unknown, callback: unknown): void;
  /**
   * Performs iterate enemy index.
   * @param param The param parameter.
   * @param callback The callback parameter.
   */
  iterateEnemyIndex(param: unknown, callback: unknown): void;
  /**
   * Performs jump to.
   * @param index The index parameter.
   */
  jumpTo(index: unknown): void;
  /**
   * Performs load images.
   */
  loadImages(): void;
  /**
   * Gets next event code.
   * @returns The result.
   */
  nextEventCode(): number;
  /**
   * Gets operate value.
   * @param operation The operation parameter.
   * @param operandType The operandType parameter.
   * @param operand The operand parameter.
   * @returns The result.
   */
  operateValue(operation: unknown, operandType: unknown, operand: unknown): unknown;
  /**
   * Performs operate variable.
   * @param variableId The variableId parameter.
   * @param operationType The operationType parameter.
   * @param value The value parameter.
   */
  operateVariable(variableId: unknown, operationType: unknown, value: unknown): void;
  /**
   * Gets picture point.
   * @param params The params parameter.
   * @returns The result.
   */
  picturePoint(params: unknown): unknown;
  /**
   * Performs plugin command.
   */
  pluginCommand(): void;
  /**
   * Sets wait mode.
   * @param waitMode The waitMode parameter.
   */
  setWaitMode(waitMode: unknown): void;
  /**
   * Performs setup.
   * @param list The list parameter.
   * @param eventId The eventId parameter.
   */
  setup(list: unknown, eventId: unknown): void;
  /**
   * Performs setup child.
   * @param list The list parameter.
   * @param eventId The eventId parameter.
   */
  setupChild(list: unknown, eventId: unknown): void;
  /**
   * Performs setup choices.
   * @param params The params parameter.
   */
  setupChoices(params: unknown): void;
  /**
   * Performs setup item choice.
   * @param params The params parameter.
   */
  setupItemChoice(params: unknown): void;
  /**
   * Performs setup num input.
   * @param params The params parameter.
   */
  setupNumInput(params: unknown): void;
  /**
   * Gets setup reserved common event.
   * @returns The result.
   */
  setupReservedCommonEvent(): boolean;
  /**
   * Performs skip branch.
   */
  skipBranch(): void;
  /**
   * Performs terminate.
   */
  terminate(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates child.
   * @returns The result.
   */
  updateChild(): boolean;
  /**
   * Updates wait.
   * @returns The result.
   */
  updateWait(): unknown;
  /**
   * Updates wait count.
   * @returns The result.
   */
  updateWaitCount(): boolean;
  /**
   * Updates wait mode.
   * @returns The result.
   */
  updateWaitMode(): unknown;
  /**
   * Gets video file ext.
   * @returns The result.
   */
  videoFileExt(): string;
  /**
   * Performs wait.
   * @param duration The duration parameter.
   */
  wait(duration: unknown): void;
}
