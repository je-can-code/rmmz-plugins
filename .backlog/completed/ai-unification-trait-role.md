# AI unification + trait/role expansion

Merged on branch `feature/jabs-ai-unification` (PR #29).

## Delivered

- `JABS_BattleMemory` moved to core, shared by enemies and allies.
- Shared filter/decide/support methods lifted into `JABS_AI` base class.
- `JABS_BattlerRole` model added (six roles: leader, follower, guardian, ward, solo, sentinel).
- `JABS_EnemyAI` rewritten: `switch(this)` bug fixed; four new traits (cleanser, buffer, tactical, berserker); coordination decoupled.
- `JABS_AllyAI` de-duplicated against base class; two bugs fixed.
- `JABS_AiManager` coordination routing moved out of AI into manager.
- Sentinel: disengage when target leaves home sight radius.
- Guardian: retarget to protect nearby ward-role allies under attack.
- Ward role is passive; no behavioral code runs on wards directly.
