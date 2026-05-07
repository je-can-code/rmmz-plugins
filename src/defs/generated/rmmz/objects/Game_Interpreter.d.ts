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
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: {@link Game_Interpreter#initialize}.
   * Written in: {@link Game_Interpreter#initialize}.
   * Read in: {@link Game_Interpreter#command111}, {@link Game_Interpreter#command301}, {@link Game_Interpreter#command402}, {@link Game_Interpreter#command403}, {@link Game_Interpreter#command411}, {@link Game_Interpreter#command601}, {@link Game_Interpreter#command602}, {@link Game_Interpreter#command603}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#setupChoices}.
   */
  _branch: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#command205}, {@link Game_Interpreter#command212}, {@link Game_Interpreter#command213}.
   * Read in: {@link Game_Interpreter#command205}, {@link Game_Interpreter#command212}, {@link Game_Interpreter#command213}, {@link Game_Interpreter#updateWaitMode}.
   */
  _characterId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Interpreter`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setupChild}, {@link Game_Interpreter#updateChild}.
   * Read in: {@link Game_Interpreter#setupChild}, {@link Game_Interpreter#updateChild}.
   */
  _childInterpreter: null | Game_Interpreter;
  /**
   * Inferred engine backing field.
   *
   * Type: `string | unknown[]`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#command108}, {@link Game_Interpreter#terminate}.
   * Read in: {@link Game_Interpreter#command108}.
   *
   * Consumed by:
   * - `push()`: {@link Game_Interpreter#command108}.
   */
  _comments: string | unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Interpreter#initialize}.
   * Written in: {@link Game_Interpreter#initialize}.
   * Read in: {@link Game_Interpreter#checkOverflow}, {@link Game_Interpreter#setupChild}.
   */
  _depth: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setup}.
   * Read in: {@link Game_Interpreter#character}, {@link Game_Interpreter#command111}, {@link Game_Interpreter#command117}, {@link Game_Interpreter#command123}, {@link Game_Interpreter#command214}, {@link Game_Interpreter#eventId}.
   */
  _eventId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Interpreter#initialize}.
   * Written in: {@link Game_Interpreter#checkFreeze}, {@link Game_Interpreter#initialize}.
   * Read in: {@link Game_Interpreter#checkFreeze}.
   */
  _frameCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Interpreter#initialize}.
   * Written in: {@link Game_Interpreter#checkFreeze}, {@link Game_Interpreter#initialize}.
   * Read in: none.
   */
  _freezeChecker: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Interpreter#initialize}.
   * Written in: {@link Game_Interpreter#executeCommand}, {@link Game_Interpreter#initialize}.
   * Read in: {@link Game_Interpreter#command111}, {@link Game_Interpreter#command301}, {@link Game_Interpreter#command402}, {@link Game_Interpreter#command403}, {@link Game_Interpreter#command411}, {@link Game_Interpreter#command413}, {@link Game_Interpreter#command601}, {@link Game_Interpreter#command602}, {@link Game_Interpreter#command603}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#setupChoices}, {@link Game_Interpreter#skipBranch}.
   */
  _indent: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#command101}, {@link Game_Interpreter#command105}, {@link Game_Interpreter#command108}, {@link Game_Interpreter#command113}, {@link Game_Interpreter#command115}, {@link Game_Interpreter#command302}, {@link Game_Interpreter#command355}, {@link Game_Interpreter#command413}, {@link Game_Interpreter#executeCommand}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#skipBranch}.
   * Read in: {@link Game_Interpreter#command113}, {@link Game_Interpreter#currentCommand}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#nextEventCode}, {@link Game_Interpreter#skipBranch}.
   */
  _index: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Array<{ code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] }>`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setup}, {@link Game_Interpreter#terminate}.
   * Read in: {@link Game_Interpreter#command113}, {@link Game_Interpreter#command115}, {@link Game_Interpreter#command119}, {@link Game_Interpreter#currentCommand}, {@link Game_Interpreter#isRunning}, {@link Game_Interpreter#jumpTo}, {@link Game_Interpreter#loadImages}, {@link Game_Interpreter#nextEventCode}, {@link Game_Interpreter#skipBranch}.
   *
   * Consumed by:
   * - `.length`: {@link Game_Interpreter#command113}, {@link Game_Interpreter#command115}, {@link Game_Interpreter#command119}.
   */
  _list: null | Array<{ code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] }>;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setup}.
   * Read in: {@link Game_Interpreter#command111}, {@link Game_Interpreter#command123}, {@link Game_Interpreter#isOnCurrentMap}.
   */
  _mapId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#updateWaitCount}, {@link Game_Interpreter#wait}.
   * Read in: {@link Game_Interpreter#updateWaitCount}.
   */
  _waitCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Game_Interpreter#clear}, {@link Game_Interpreter#setWaitMode}, {@link Game_Interpreter#updateWaitMode}.
   * Read in: {@link Game_Interpreter#updateWaitMode}.
   */
  _waitMode: string;
  /**
   * Performs change hp.
   * @param target The target parameter.
   * @param value The value parameter.
   * @param allowDeath The allowDeath parameter.
   */
  changeHp(target: Game_Battler, value: number, allowDeath: boolean): void;
  /**
   * Gets character.
   * @param param The param parameter.
   * @returns The result.
   */
  character(param: number): null | number;
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
  command101(params: readonly [string, number, number, number, string]): boolean;
  /**
   * Gets command102.
   * @param params The params parameter.
   * @returns The result.
   */
  command102(params: readonly [readonly string[], number, number, number, number]): boolean;
  /**
   * Gets command103.
   * @param params The params parameter.
   * @returns The result.
   */
  command103(params: readonly [number, number]): boolean;
  /**
   * Gets command104.
   * @param params The params parameter.
   * @returns The result.
   */
  command104(params: readonly [number, number]): boolean;
  /**
   * Gets command105.
   * @param params The params parameter.
   * @returns The result.
   */
  command105(params: readonly [number, number]): boolean;
  /**
   * Gets command108.
   * @param params The params parameter.
   * @returns The result.
   */
  command108(params: readonly [string]): boolean;
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
  command111(params: readonly (number | string | boolean | object | null)[]): boolean;
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
  command117(params: readonly [number]): boolean;
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
  command119(params: readonly [string]): boolean;
  /**
   * Gets command121.
   * @param params The params parameter.
   * @returns The result.
   */
  command121(params: readonly [number, number, number]): boolean;
  /**
   * Gets command122.
   * @param params The params parameter.
   * @returns The result.
   */
  command122(params: readonly (number | string | boolean | object | null)[]): boolean;
  /**
   * Gets command123.
   * @param params The params parameter.
   * @returns The result.
   */
  command123(params: readonly [string, number]): boolean;
  /**
   * Gets command124.
   * @param params The params parameter.
   * @returns The result.
   */
  command124(params: readonly [number, number]): boolean;
  /**
   * Gets command125.
   * @param params The params parameter.
   * @returns The result.
   */
  command125(params: readonly [number, number, number]): boolean;
  /**
   * Gets command126.
   * @param params The params parameter.
   * @returns The result.
   */
  command126(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command127.
   * @param params The params parameter.
   * @returns The result.
   */
  command127(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command128.
   * @param params The params parameter.
   * @returns The result.
   */
  command128(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command129.
   * @param params The params parameter.
   * @returns The result.
   */
  command129(params: readonly [number, number, number]): boolean;
  /**
   * Gets command132.
   * @param params The params parameter.
   * @returns The result.
   */
  command132(params: readonly [{ name: string; pan: number; pitch: number; volume: number }]): boolean;
  /**
   * Gets command133.
   * @param params The params parameter.
   * @returns The result.
   */
  command133(params: readonly [{ name: string; pan: number; pitch: number; volume: number }]): boolean;
  /**
   * Gets command134.
   * @param params The params parameter.
   * @returns The result.
   */
  command134(params: readonly [number]): boolean;
  /**
   * Gets command135.
   * @param params The params parameter.
   * @returns The result.
   */
  command135(params: readonly [number]): boolean;
  /**
   * Gets command136.
   * @param params The params parameter.
   * @returns The result.
   */
  command136(params: readonly [number]): boolean;
  /**
   * Gets command137.
   * @param params The params parameter.
   * @returns The result.
   */
  command137(params: readonly [number]): boolean;
  /**
   * Gets command138.
   * @param params The params parameter.
   * @returns The result.
   */
  command138(params: readonly [readonly [number, number, number, number]]): boolean;
  /**
   * Gets command139.
   * @param params The params parameter.
   * @returns The result.
   */
  command139(params: readonly [{ name: string; pan: number; pitch: number; volume: number }]): boolean;
  /**
   * Gets command140.
   * @param params The params parameter.
   * @returns The result.
   */
  command140(params: readonly [number, { name: string; pan: number; pitch: number; volume: number }]): boolean;
  /**
   * Gets command201.
   * @param params The params parameter.
   * @returns The result.
   */
  command201(params: readonly [number, number, number, number, number, number]): boolean;
  /**
   * Gets command202.
   * @param params The params parameter.
   * @returns The result.
   */
  command202(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command203.
   * @param params The params parameter.
   * @returns The result.
   */
  command203(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command204.
   * @param params The params parameter.
   * @returns The result.
   */
  command204(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command205.
   * @param params The params parameter.
   * @returns The result.
   */
  command205(params: readonly [number, number]): boolean;
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
  command211(params: readonly [number]): boolean;
  /**
   * Gets command212.
   * @param params The params parameter.
   * @returns The result.
   */
  command212(params: readonly [number, number, number]): boolean;
  /**
   * Gets command213.
   * @param params The params parameter.
   * @returns The result.
   */
  command213(params: readonly [number, number, number]): boolean;
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
  command216(params: readonly [number]): boolean;
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
  command223(params: readonly [[number, number, number, number], number]): boolean;
  /**
   * Gets command224.
   * @param params The params parameter.
   * @returns The result.
   */
  command224(params: readonly [[number, number, number, number], number]): boolean;
  /**
   * Gets command225.
   * @param params The params parameter.
   * @returns The result.
   */
  command225(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command230.
   * @param params The params parameter.
   * @returns The result.
   */
  command230(params: readonly [number]): boolean;
  /**
   * Gets command231.
   * @param params The params parameter.
   * @returns The result.
   */
  command231(params: readonly [number, string, number, number, number, number, number, number, number, number]): boolean;
  /**
   * Gets command232.
   * @param params The params parameter.
   * @returns The result.
   */
  command232(params: readonly [number, number, number, number, number, number, number, number, number, number, number, number, number]): boolean;
  /**
   * Gets command233.
   * @param params The params parameter.
   * @returns The result.
   */
  command233(params: readonly [number, number]): boolean;
  /**
   * Gets command234.
   * @param params The params parameter.
   * @returns The result.
   */
  command234(params: readonly [number, [number, number, number, number], number]): boolean;
  /**
   * Gets command235.
   * @param params The params parameter.
   * @returns The result.
   */
  command235(params: readonly [number]): boolean;
  /**
   * Gets command236.
   * @param params The params parameter.
   * @returns The result.
   */
  command236(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command241.
   * @param params The params parameter.
   * @returns The result.
   */
  command241(params: readonly [{ name: string; pan: number; pitch: number; volume: number }]): boolean;
  /**
   * Gets command242.
   * @param params The params parameter.
   * @returns The result.
   */
  command242(params: readonly [number]): boolean;
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
  command245(params: readonly [{ name: string; pan: number; pitch: number; volume: number }]): boolean;
  /**
   * Gets command246.
   * @param params The params parameter.
   * @returns The result.
   */
  command246(params: readonly [number]): boolean;
  /**
   * Gets command249.
   * @param params The params parameter.
   * @returns The result.
   */
  command249(params: readonly [{ name: string; pan: number; pitch: number; volume: number }]): boolean;
  /**
   * Gets command250.
   * @param params The params parameter.
   * @returns The result.
   */
  command250(params: readonly [{ name: string; pan: number; pitch: number; volume: number }]): boolean;
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
  command261(params: readonly [string]): boolean;
  /**
   * Gets command281.
   * @param params The params parameter.
   * @returns The result.
   */
  command281(params: readonly [number]): boolean;
  /**
   * Gets command282.
   * @param params The params parameter.
   * @returns The result.
   */
  command282(params: readonly [number]): boolean;
  /**
   * Gets command283.
   * @param params The params parameter.
   * @returns The result.
   */
  command283(params: readonly [number, number]): boolean;
  /**
   * Gets command284.
   * @param params The params parameter.
   * @returns The result.
   */
  command284(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command285.
   * @param params The params parameter.
   * @returns The result.
   */
  command285(params: readonly (number | string | boolean | object | null)[]): boolean;
  /**
   * Gets command301.
   * @param params The params parameter.
   * @returns The result.
   */
  command301(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command302.
   * @param params The params parameter.
   * @returns The result.
   */
  command302(params: readonly (number | string | boolean | object | null)[]): boolean;
  /**
   * Gets command303.
   * @param params The params parameter.
   * @returns The result.
   */
  command303(params: readonly [number, number]): boolean;
  /**
   * Gets command311.
   * @param params The params parameter.
   * @returns The result.
   */
  command311(params: readonly [number, number, number, number, number, number]): boolean;
  /**
   * Gets command312.
   * @param params The params parameter.
   * @returns The result.
   */
  command312(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command313.
   * @param params The params parameter.
   * @returns The result.
   */
  command313(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command314.
   * @param params The params parameter.
   * @returns The result.
   */
  command314(params: readonly [number, number]): boolean;
  /**
   * Gets command315.
   * @param params The params parameter.
   * @returns The result.
   */
  command315(params: readonly [number, number, number, number, number, number]): boolean;
  /**
   * Gets command316.
   * @param params The params parameter.
   * @returns The result.
   */
  command316(params: readonly [number, number, number, number, number, number]): boolean;
  /**
   * Gets command317.
   * @param params The params parameter.
   * @returns The result.
   */
  command317(params: readonly [number, number, number, number, number, number]): boolean;
  /**
   * Gets command318.
   * @param params The params parameter.
   * @returns The result.
   */
  command318(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command319.
   * @param params The params parameter.
   * @returns The result.
   */
  command319(params: readonly [number, number, number]): boolean;
  /**
   * Gets command320.
   * @param params The params parameter.
   * @returns The result.
   */
  command320(params: readonly [number, string]): boolean;
  /**
   * Gets command321.
   * @param params The params parameter.
   * @returns The result.
   */
  command321(params: readonly [number, number, number]): boolean;
  /**
   * Gets command322.
   * @param params The params parameter.
   * @returns The result.
   */
  command322(params: readonly [number, string, number, string, number, string]): boolean;
  /**
   * Gets command323.
   * @param params The params parameter.
   * @returns The result.
   */
  command323(params: readonly [number, number, number]): boolean;
  /**
   * Gets command324.
   * @param params The params parameter.
   * @returns The result.
   */
  command324(params: readonly [number, string]): boolean;
  /**
   * Gets command325.
   * @param params The params parameter.
   * @returns The result.
   */
  command325(params: readonly [number, string]): boolean;
  /**
   * Gets command326.
   * @param params The params parameter.
   * @returns The result.
   */
  command326(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command331.
   * @param params The params parameter.
   * @returns The result.
   */
  command331(params: readonly [number, number, number, number, number]): boolean;
  /**
   * Gets command332.
   * @param params The params parameter.
   * @returns The result.
   */
  command332(params: readonly [number, number, number, number]): boolean;
  /**
   * Gets command333.
   * @param params The params parameter.
   * @returns The result.
   */
  command333(params: readonly [number, number, number]): boolean;
  /**
   * Gets command334.
   * @param params The params parameter.
   * @returns The result.
   */
  command334(params: readonly [number]): boolean;
  /**
   * Gets command335.
   * @param params The params parameter.
   * @returns The result.
   */
  command335(params: readonly [number]): boolean;
  /**
   * Gets command336.
   * @param params The params parameter.
   * @returns The result.
   */
  command336(params: readonly [number, number]): boolean;
  /**
   * Gets command337.
   * @param params The params parameter.
   * @returns The result.
   */
  command337(params: readonly [number, number, number]): boolean;
  /**
   * Gets command339.
   * @param params The params parameter.
   * @returns The result.
   */
  command339(params: readonly [number, number, number, number]): boolean;
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
  command342(params: readonly [number, number, number, number]): boolean;
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
  command356(params: readonly [string]): boolean;
  /**
   * Gets command357.
   * @param params The params parameter.
   * @returns The result.
   */
  command357(params: readonly [string, string, object, string]): boolean;
  /**
   * Gets command402.
   * @param params The params parameter.
   * @returns The result.
   */
  command402(params: readonly [number]): boolean;
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
  currentCommand(): { code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] } | undefined;
  /**
   * Gets event id.
   * @returns The result.
   */
  eventId(): number;
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
  gameDataOperand(_type: number, param1: number, param2: number): number;
  /**
   * Initializes initialize.
   * @param depth The depth parameter.
   */
  initialize(depth: number): void;
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
  iterateActorEx(param1: number, param2: number, callback: (battler: Game_Battler) => void): void;
  /**
   * Performs iterate actor id.
   * @param param The param parameter.
   * @param callback The callback parameter.
   */
  iterateActorId(param: number, callback: (battler: Game_Battler) => void): void;
  /**
   * Performs iterate actor index.
   * @param param The param parameter.
   * @param callback The callback parameter.
   */
  iterateActorIndex(param: number, callback: (battler: Game_Battler) => void): void;
  /**
   * Performs iterate battler.
   * @param param1 The param1 parameter.
   * @param param2 The param2 parameter.
   * @param callback The callback parameter.
   */
  iterateBattler(param1: number, param2: number, callback: (battler: Game_Battler) => void): void;
  /**
   * Performs iterate enemy index.
   * @param param The param parameter.
   * @param callback The callback parameter.
   */
  iterateEnemyIndex(param: number, callback: (battler: Game_Battler) => void): void;
  /**
   * Performs jump to.
   * @param index The index parameter.
   */
  jumpTo(index: number): void;
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
  operateValue(operation: number, operandType: number, operand: number): number;
  /**
   * Performs operate variable.
   * @param variableId The variableId parameter.
   * @param operationType The operationType parameter.
   * @param value The value parameter.
   */
  operateVariable(variableId: number, operationType: number, value: number): void;
  /**
   * Gets picture point.
   * @param params The params parameter.
   * @returns The result.
   */
  picturePoint(params: readonly (number | string | boolean | object | null)[]): Point;
  /**
   * Performs plugin command.
   */
  pluginCommand(): void;
  /**
   * Sets wait mode.
   * @param waitMode The waitMode parameter.
   */
  setWaitMode(waitMode: string): void;
  /**
   * Performs setup.
   * @param list The list parameter.
   * @param eventId The eventId parameter.
   */
  setup(list: Array<{ code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] }>, eventId: number): void;
  /**
   * Performs setup child.
   * @param list The list parameter.
   * @param eventId The eventId parameter.
   */
  setupChild(list: Array<{ code: number; indent: number; parameters: readonly (number | string | boolean | object | null)[] }>, eventId: number): void;
  /**
   * Performs setup choices.
   * @param params The params parameter.
   */
  setupChoices(params: readonly [readonly string[], number, number, number, number]): void;
  /**
   * Performs setup item choice.
   * @param params The params parameter.
   */
  setupItemChoice(params: readonly [number, number]): void;
  /**
   * Performs setup num input.
   * @param params The params parameter.
   */
  setupNumInput(params: readonly [number, number]): void;
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
  updateWait(): boolean;
  /**
   * Updates wait count.
   * @returns The result.
   */
  updateWaitCount(): boolean;
  /**
   * Updates wait mode.
   * @returns The result.
   */
  updateWaitMode(): boolean;
  /**
   * Gets video file ext.
   * @returns The result.
   */
  videoFileExt(): string;
  /**
   * Performs wait.
   * @param duration The duration parameter.
   */
  wait(duration: number): void;
}
