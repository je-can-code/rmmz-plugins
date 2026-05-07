/**
 * Tuple aliases and `$data*` rows that do not have a matching `class RPG_*` under src/plugins.
 * Hydrated rows (`RPG_Actor`, `RPG_Item`, …) are typed only by those classes so Go to Declaration lands on your implementations.
 * Regenerate: `bun run defs:generate`
 */

declare global
{
  /**
   * Editor indices 0–7: max HP, max MP, attack, defense, m.attack, m.defense, agility, luck.
   */
  type RPG_CoreParam8 = readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  /**
   * Class experience formula inputs from the database editor (four coefficients).
   */
  type RPG_ExpParams4 = readonly [number, number, number, number];

  /**
   * Eight per-stat level curves; each inner array is indexed by character level.
   */
  type RPG_ClassCurveBundle = readonly [
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
    number[],
  ];

  /**
   * Map tree metadata (`$dataMapInfos` entries) — no J-Base hydrated class for this row shape.
   */
  interface RPG_MapInfo
  {
    id: number;
    expanded: boolean;
    name: string;
    order: number;
    parentId: number;
    scrollX: number;
    scrollY: number;
    quick?: boolean;
  }
}

export {};
