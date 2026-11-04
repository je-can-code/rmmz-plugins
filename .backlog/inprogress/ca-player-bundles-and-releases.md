# Chef Adventure: player bundles and releases

## Severity

**High.** Jeremy, 2026-10-17, pausing it to get back to mapping: "slap a high priority/severity" on it. This is
how Chef Adventure reaches players for 1.0.0 at Christmas, and the first half is already built but untested and
uncommitted, which is exactly the state work goes missing in.

## Gain

A player downloads one archive for their OS, double-clicks, and plays: no NW.js, no plugins, no setup. Every
merge into `ca`'s `main` publishes one automatically, with its own version. The game is free, and always will be.

## Source

- `ca/docs/distribution.md`: the plan, every decision, the open questions, the test recipes and the measured
  sizes. **Read it first; this item does not repeat it.**
- `ca/tools/bundle/index.js` (`bun run bundle`), `ca/tools/bundle/nwjs.json` (the NW.js pin, `v0.118.0`),
  `ca/tools/bundle/readmes/` (the player README for each OS)
- `ca/tools/validate/checks/start.js`, its entry in `checks.js` and `index.js`, and three controls in
  `selftest.js` (look for `checkStart`)
- `ca/.gitignore` (`dist/`, `.cache/`), `ca/package.json` (the `bundle` script), `ca/CLAUDE.md` (the
  "start position" row and "Bundling the game for players"), `ca/docs/main.md` (link to the plan)

## Context

Built 2026-10-15 and paused 2026-10-17. Everything above is **uncommitted in `ca`'s working tree**, which has
been on `main` since #102 merged; it goes onto the next CA branch. The three `tools/validate` files it touches
also carry another session's uncommitted `scripts` check, so commit them together.

`bun run bundle` builds four archives in about 100 seconds: Windows 494 MB, Linux 479 MB, macOS arm64 456 MB,
macOS x64 472 MB. The `dev` builds from 2026-10-15 are still in `ca/dist/`, and rebuilding is one command. The
Linux bundle has booted headless to the title screen and written `save/config.json` from a fresh install.
Windows and Mac have not been run.

Settled along the way, with the reasoning in the doc: free forever; no paid signing or notarization (README steps
instead); NW.js `v0.118.0`, which Jeremy plays on daily; not MZ's built-in Deployment; one script, run locally
and by CI; every merge into `main` is its own release; versions start at `v0.7.0`, with a `bump:minor` label per
remaining dungeon (Nimbus `v0.8.0`, Subterranean `v0.9.0`) and `bump:major` for the Frozen Fortress (`v1.0.0`).

## Work

1. **Test the bundles**, using the recipes in the doc's Testing section:
   - Linux: extract it, run `./chef-adventure`, play a bit.
   - Windows: `umu-run "Chef Adventure.exe"` from inside the folder, or wine-staging, on a virtual display.
   - Mac, on Madeleine's 16-inch MacBook Pro: the build for her chip, moved to Applications, ad-hoc signed
     **before** its first launch, then Open Anyway, then **opened a second time**. The first boot writes a save
     inside the app; if macOS calls the app damaged on launch two, saves have to move out of the app before any
     release.
2. **Name the Mac app.** Its `Info.plist` still says `nwjs`, which is what Privacy & Security, the menu bar and the
   dock show. Rename before signing.
3. **The release workflow:** on a push to `main`, after validate, run `bun run bundle --version vX.Y.Z` (the Mac
   targets on a macOS runner, so `codesign` signs them), work out the version from the last tag and the merged
   PR's `bump:*` label, and publish a GitHub Release holding every bundle.
4. **The labels:** create `bump:minor` and `bump:major`, and put the reminder in the PR template and in the git
   section of `ca/CLAUDE.md`.
5. **Settle the doc's open questions:** whether releases keep the Intel Mac build, whether docs-only merges
   release, and icons.

## Definition of done

- [ ] in `ca`, `bun run validate` and `bun run validate:selftest` are green
- [ ] each bundle reaches the title screen on its own OS (Linux done 2026-10-15), and the Mac one opens again
      after its first save
- [ ] Privacy & Security, the menu bar and the dock all call the Mac app Chef Adventure
- [ ] merging a pull request into `ca`'s `main` produces a GitHub Release holding every bundle, versioned from
      the last tag and that PR's `bump:*` label

## Notes

- At every CA pull request, remind Jeremy about the `bump:*` label (his standing ask, 2026-10-14).
- Later, before 1.0.0: prune the images and audio the game never uses (the doc's "Later" section).
