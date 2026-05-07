/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Followers
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Followers
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _data: unknown[];
  _gathering: boolean;
  _visible: boolean;
  areGathered(): boolean;
  areGathering(): boolean;
  areMoving(): boolean;
  data(): Game_Follower[];
  follower(index: number): Game_Follower;
  gather(): void;
  hide(): void;
  initialize(): void;
  isSomeoneCollided(x: number, y: number): boolean;
  isVisible(): boolean;
  jumpAll(): void;
  refresh(): void;
  reverseData(): Game_Follower[];
  setup(): void;
  show(): void;
  synchronize(x: number, y: number, d: number): void;
  update(): void;
  updateMove(): void;
  visibleFollowers(): Game_Follower[];
}
