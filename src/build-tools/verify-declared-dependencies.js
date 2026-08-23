//region verify-declared-dependencies
/**
 * Verifies that every cross-ship namespace a plugin reaches for at runtime is declared as a
 * dependency in that plugin's `_annotations.js`.
 *
 * `verify:ships` already forbids one ship from importing another ship's source, and that boundary
 * is airtight because it is a build-time concern - the bundler cannot silently reach across trees.
 * The runtime boundary had no equivalent. Once a ship is loaded its namespace is a global, and any
 * other ship can read `J.SOMETHING.Whatever` with nothing checking that the owning plugin was
 * installed, was loaded first, or was ever mentioned as a dependency.
 *
 * That gap is not theoretical. Three ships were reaching across it with no declaration at all:
 *
 *   crit/core   - calls `J.EXTEND.Metadata.registerNonCombiningKey()` eight times during boot while
 *                 declaring only J-Base and J-NaturalGrowth. Without J-Extend installed, the boot
 *                 sequence throws.
 *   map/core    - reads `J.ABS.EXT.INPUT.Symbols` for its default keybindings while declaring
 *                 `@orderAfter J-ABS`. Those symbols belong to J-ABS-InputManager, a different ship
 *                 entirely, and J-ABS being present says nothing about whether it is.
 *   time/core   - augments `JABS_StandardController.prototype` and reads `J.ABS.EXT.INPUT.Symbols`
 *                 while declaring no dependencies whatsoever.
 *
 * All three are latent rather than live: the consumer game loads every one of these together, so
 * the crash never happens in practice. That is exactly what makes a gate the right answer instead
 * of three edits - the edits fix today's three, and the gate fixes the shape.
 *
 * ## What counts as a declaration
 *
 * Either `@base <PluginName>` or `@orderAfter <PluginName>`. The gate deliberately does not care
 * which. `@base` asserts a hard requirement and `@orderAfter` asserts only an ordering, and which
 * one is correct depends on whether the reference sits behind a namespace guard - a question this
 * gate does not try to answer, because answering it needs scope analysis and getting it wrong
 * means rejecting correct code. Requiring *either* is the part that is unambiguously true: a ship
 * whose behavior depends on another ship must name it, whether or not it can survive its absence.
 *
 * ## How ownership is resolved
 *
 * Namespaces are not declared anywhere central, so the map is derived. Each ship's
 * `_metadata/initialization.js` stamps exactly one namespace with its own metadata instance -
 * `J.SDP.Metadata = new J_SdpPluginMetadata(...)` - and that self-identification is what makes a
 * ship the owner of that namespace. J-Base is the one ship that assigns a plain object instead, so
 * ownership there falls back to the shortest namespace it declares outright.
 *
 * Extensions defensively shell-declare their parents (`J.ABS.EXT ||= {}`) so they have something to
 * hang themselves off, which means a namespace can appear in several ships' bootstrap. Those ties
 * break toward the ship whose *owned* namespace is a prefix of the contested one: `J.ABS.EXT` is
 * claimed by four ships, and only J-ABS owns a namespace (`J.ABS`) that contains it.
 *
 * References resolve by longest matching prefix, which is what keeps `J.ABS.EXT.INPUT.Symbols` from
 * resolving to J-ABS when J-ABS-InputManager is the ship that actually defines it.
 *
 * Usage:
 *   node src/build-tools/verify-declared-dependencies.js
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import Logger, { LogStyle } from './logger.js';

const SRC_PLUGINS_DIR = './src/plugins';

/**
 * Individual dependencies a ship may reference without declaring. Exemptions are per edge rather
 * than per ship, so allowing one reviewed case never blinds the gate to that ship's future ones.
 * Additions require a written justification here.
 *
 * J-ABS -> J-ABS-DangerIndicator cannot be declared, because J-ABS-DangerIndicator declares
 * `@base J-ABS` and MZ's vocabulary would need both to load after the other. The reference is
 * `JABS_BattlerCoreDataBuilder` reading the extension's configured default, and it is the case
 * CLAUDE.md describes as "core does not know about extensions; extensions alias into core" - so
 * the real repair is J-ABS-DangerIndicator supplying that default into core rather than core
 * reaching out for it. Exempted here because a declaration cannot express it either way.
 * @type {Array<{dependent: string, dependency: string}>}
 */
const ALLOWLIST = [
  {
    dependent: 'J-ABS',
    dependency: 'J-ABS-DangerIndicator',
  },
];

/**
 * Plugins that never need declaring because every ship in the repository already requires them to
 * be loaded for anything at all to work. J-Base defines the plugin metadata base class, the
 * registries, and the hydrated database models, so a ship referencing it is not expressing an
 * optional dependency - it is expressing that it is a J plugin.
 * @type {string[]}
 */
const ALWAYS_AVAILABLE_PLUGINS = [ 'J-Base' ];

/**
 * Files inside a ship that are not scanned for references. The annotations file is where
 * dependencies get declared and is mostly prose describing what the plugin interoperates with, so
 * scanning it would report every plugin it merely mentions.
 * @type {string[]}
 */
const IGNORED_FILENAMES = [ '_annotations.js' ];

/**
 * Removes comment content from source text so that namespaces named in prose are never mistaken
 * for runtime references. Line structure is preserved because violations are reported by line
 * number, so each stripped line is replaced by an empty one rather than removed.
 * @param {string} contents Raw source text.
 * @returns {string[]} The code-only lines, index-aligned with the original file.
 */
function stripComments(contents)
{
  const lines = contents.split('\n');
  let insideBlockComment = false;

  return lines.map(line =>
  {
    // a block comment that opened on an earlier line swallows this one until it closes.
    if (insideBlockComment === true)
    {
      const closeIndex = line.indexOf('*/');
      if (closeIndex === -1) return '';

      insideBlockComment = false;
      return line.slice(closeIndex + 2);
    }

    // an unterminated block comment opening on this line swallows everything after it.
    const openIndex = line.indexOf('/*');
    if (openIndex !== -1 && line.indexOf('*/', openIndex) === -1)
    {
      insideBlockComment = true;
      return line.slice(0, openIndex);
    }

    // a line comment swallows only its own tail.
    const lineCommentIndex = line.indexOf('//');
    if (lineCommentIndex === -1) return line;

    return line.slice(0, lineCommentIndex);
  });
}

/**
 * The dependency tags this gate understands, in the exact casing the MZ plugin manager requires.
 * MZ matches these case-sensitively and silently ignores anything it does not recognize, so a
 * mis-cased tag is not a weaker declaration - it is no declaration at all, sitting in the file
 * looking like one. That failure is invisible from both directions: the editor never complains,
 * and this gate would read the ship as simply not declaring the dependency.
 * @type {string[]}
 */
const DEPENDENCY_TAGS = [ 'base', 'orderAfter', 'orderBefore' ];

/**
 * Collects dependency tags whose casing does not match what MZ actually parses.
 * @param {string} annotationsPath Repository-relative path to the annotations file, for reporting.
 * @param {string} annotationsText Raw text of the ship's `_metadata/_annotations.js`.
 * @returns {string[]} Violation messages, one per mis-cased tag.
 */
function collectMalformedTagViolations(annotationsPath, annotationsText)
{
  const violations = [];
  const lines = annotationsText.split('\n');
  const tagPattern = /^\s*\*\s*@(base|orderAfter|orderBefore)\b/i;

  lines.forEach((line, lineIndex) =>
  {
    const match = tagPattern.exec(line);
    if (match === null) return;

    // the captured tag is only correct when it matches a canonical spelling exactly.
    const [ , writtenTag ] = match;
    if (DEPENDENCY_TAGS.includes(writtenTag)) return;

    const lowered = writtenTag.toLowerCase();
    const canonical = DEPENDENCY_TAGS.find(tag => tag.toLowerCase() === lowered);

    violations.push(
      `${annotationsPath}:${lineIndex + 1}: \`@${writtenTag}\` is mis-cased and MZ ignores it — ` +
      `write \`@${canonical}\` so the declaration actually takes effect`
    );
  });

  return violations;
}

/**
 * Plugins that are legitimately declared but live outside this repository, so no ship defines them.
 * Additions require a written justification here.
 *
 * There are none at present. `Cyclone-Movement` was the last one and its declaration outlived the
 * support it described by some margin.
 * @type {string[]}
 */
const THIRD_PARTY_PLUGINS = [];

/**
 * Collects declarations naming a plugin that does not exist.
 *
 * MZ resolves these against plugin *filenames*, exactly and case-sensitively, so `J-ABS-Food` does
 * not find `J-ABS-FOOD` and `J-Natural` does not find `J-NaturalGrowth`. A near-miss is not a
 * weaker dependency, it is an inert line that reads exactly like a real one - which is why five of
 * them accumulated here unnoticed, two naming plugins that had been renamed and three naming
 * plugins that never had that name at all.
 * @param {string} annotationsPath Repository-relative path to the annotations file, for reporting.
 * @param {string} annotationsText Raw text of the ship's `_metadata/_annotations.js`.
 * @param {Set<string>} knownPluginNames Every plugin name defined in this repository.
 * @returns {string[]} Violation messages, one per unresolvable declaration.
 */
function collectUnknownDependencyViolations(annotationsPath, annotationsText, knownPluginNames)
{
  const violations = [];
  const lines = annotationsText.split('\n');
  const tagPattern = /^\s*\*\s*@(?:base|orderAfter|orderBefore)\s+(\S+)/;

  lines.forEach((line, lineIndex) =>
  {
    const match = tagPattern.exec(line);
    if (match === null) return;

    const [ , declaredName ] = match;
    if (knownPluginNames.has(declaredName)) return;
    if (THIRD_PARTY_PLUGINS.includes(declaredName)) return;

    // a near-miss on casing or naming is the common cause, so point at the closest real name.
    const lowered = declaredName.toLowerCase();
    const nearMiss = [ ...knownPluginNames ].find(name => name.toLowerCase() === lowered);
    const hint = nearMiss === undefined
      ? 'no plugin by that name exists — correct it, or add it to THIRD_PARTY_PLUGINS if external'
      : `did you mean \`${nearMiss}\`?`;

    violations.push(`${annotationsPath}:${lineIndex + 1}: declares \`${declaredName}\` — ${hint}`);
  });

  return violations;
}

/**
 * Finds every namespace a ship's bootstrap file declares, in source order.
 *
 * Only shell declarations count - the ones establishing a container rather than storing a value.
 * A bootstrap file assigns plenty of top-level leaves that are data, not structure
 * (`J.ABS.EXT.INPUT.Symbols.DPadUp = JabsInputSymbols.DPadUp`), and admitting those as namespaces
 * makes a reference to one resolve to *itself*, which then reads as a bare presence probe and gets
 * waived. The three shell spellings all end the statement in `{}`, and nothing that stores a real
 * value does.
 * @param {string} initializationText Raw text of the ship's `_metadata/initialization.js`.
 * @returns {string[]} Declared namespaces such as `J.ABS.EXT.SHIELD`.
 */
function collectDeclaredNamespaces(initializationText)
{
  const declarationPattern = /^(J\.[A-Za-z0-9_.]*?)\s*(?:\|\|)?=.*\{\}\s*;?\s*$/gm;
  const matches = [ ...initializationText.matchAll(declarationPattern) ];

  return matches.map(([ , namespace ]) => namespace);
}

/**
 * Determines which single namespace a ship claims as its own. A ship self-identifies by stamping
 * its metadata instance onto its namespace; J-Base assigns a plain object instead, so the shortest
 * outright declaration stands in for it.
 * @param {string} initializationText Raw text of the ship's `_metadata/initialization.js`.
 * @returns {string} The owned namespace, or an empty string when the ship declares none.
 */
function findOwnedNamespace(initializationText)
{
  const metadataPattern = /^(J\.[A-Za-z0-9_.]*?)\.Metadata\s*=\s*new\s/gm;
  const metadataMatches = [ ...initializationText.matchAll(metadataPattern) ];

  // the common case: exactly one namespace carries this ship's metadata instance.
  if (metadataMatches.length > 0) return metadataMatches[0][1];

  // fall back to the shortest outright declaration, which is the root this ship established.
  const outrightPattern = /^(J\.[A-Za-z0-9_.]*?)\s*=\s*\{\}/gm;
  const outrightMatches = [ ...initializationText.matchAll(outrightPattern) ];
  if (outrightMatches.length === 0) return String();

  const declared = outrightMatches.map(match => match[1]);
  const sortedByLength = declared.sort((left, right) => left.length - right.length);

  return sortedByLength[0];
}

/**
 * Reads the identity of a single ship: what it is called, what namespace it owns, what namespaces
 * it declares, and which plugins it names as dependencies.
 * @param {string} shipDirectory Repository-relative path to the ship's root directory.
 * @returns {Promise<{directory: string, pluginName: string, declaredPluginName: string,
 *   ownedNamespace: string, declaredNamespaces: string[], declaredDependencies: Set<string>,
 *   tagViolations: string[], annotationsPath: string, annotationsText: string}>}
 */
async function readShipIdentity(shipDirectory)
{
  const initializationPath = path.join(shipDirectory, '_metadata/initialization.js');
  const annotationsPath = path.join(shipDirectory, '_metadata/_annotations.js');

  const initializationText = await fs.readFile(initializationPath, 'utf-8');
  const annotationsText = await fs.readFile(annotationsPath, 'utf-8');

  // the name a declaration must use is the shipped *filename*, which the vite config's input key
  // decides. `meta.js` carries a PLUGIN_NAME that usually agrees but is not authoritative and has
  // drifted on several ships, so reading it here would have the gate validating declarations
  // against a name RPG Maker never sees.
  const configs = await glob(`${shipDirectory}/vite.config.*.js`);
  const [ configPath ] = configs;
  const configText = await fs.readFile(configPath, 'utf-8');
  const [ , inputKey ] = /'([^']*)':\s*path\.resolve/.exec(configText);
  const pluginName = path.basename(inputKey);

  // read separately so the two can be compared; see the agreement check in main().
  const metaPath = path.join(shipDirectory, '_metadata/meta.js');
  const metaText = await fs.readFile(metaPath, 'utf-8');
  const [ , declaredPluginName ] = /PLUGIN_NAME\s*=\s*'([^']+)'/.exec(metaText);

  // anchored to the tag position MZ actually reads: a line whose first content after the comment
  // asterisk is the tag. Without the anchor, CHANGELOG prose describing a declaration ("Fixed a
  // self-referencing @base/@orderAfter J-HUD declaration") parses as the declaration itself, which
  // would let a note about removing a dependency satisfy the gate on behalf of the removal.
  //
  // matched case-sensitively on purpose: this must agree with what MZ itself parses, and the
  // mis-cased spellings it ignores are reported separately rather than quietly honored here.
  const dependencyPattern = /^\s*\*\s*@(?:base|orderAfter)\s+(\S+)/gm;
  const dependencyMatches = [ ...annotationsText.matchAll(dependencyPattern) ];
  const declaredDependencies = new Set(dependencyMatches.map(([ , dependency ]) => dependency));

  const normalizedAnnotationsPath = path.normalize(annotationsPath);

  return {
    directory: shipDirectory,
    pluginName,
    declaredPluginName,
    ownedNamespace: findOwnedNamespace(initializationText),
    declaredNamespaces: collectDeclaredNamespaces(initializationText),
    declaredDependencies,
    tagViolations: collectMalformedTagViolations(normalizedAnnotationsPath, annotationsText),
    annotationsPath: normalizedAnnotationsPath,
    annotationsText,
  };
}

/**
 * Decides which of several ships claiming the same namespace actually owns it. Shell declarations
 * written by extensions lose to the ship whose own namespace contains the contested one, and an
 * exact match on a ship's owned namespace beats everything.
 * @param {string} namespace The contested namespace.
 * @param {Array<object>} claimants Ship identities that declare it.
 * @returns {object} The owning ship identity.
 */
function resolveClaim(namespace, claimants)
{
  // an exact match is definitive: that ship stamped its metadata onto this very namespace.
  const exact = claimants.find(ship => ship.ownedNamespace === namespace);
  if (exact !== undefined) return exact;

  // otherwise the owner is whichever claimant owns the most specific enclosing namespace.
  const enclosing = claimants.filter(ship => namespace.startsWith(`${ship.ownedNamespace}.`));
  const sortedBySpecificity = enclosing.sort((left, right) =>
    right.ownedNamespace.length - left.ownedNamespace.length);

  return sortedBySpecificity[0];
}

/**
 * Builds the namespace-to-owning-ship map across every ship in the repository.
 * @param {Array<object>} identities Every ship identity.
 * @returns {Map<string, object>} Namespace to the ship identity that owns it.
 */
function buildOwnershipMap(identities)
{
  const claims = new Map();

  // gather every ship that declares each namespace, including defensive shell declarations.
  identities.forEach(ship =>
  {
    ship.declaredNamespaces.forEach(namespace =>
    {
      if (!claims.has(namespace)) claims.set(namespace, []);
      claims.get(namespace)
        .push(ship);
    });
  });

  const ownership = new Map();

  // reduce each namespace's claimants to the single ship that genuinely owns it.
  claims.forEach((claimants, namespace) =>
  {
    const owner = resolveClaim(namespace, claimants);
    if (owner !== undefined) ownership.set(namespace, owner);
  });

  return ownership;
}

/**
 * Decides whether a reference is a presence probe rather than a genuine dependency.
 *
 * There are two unrelated relationships that both look like "ship A mentions ship B", and treating
 * them the same is what makes a dependency gate cry wolf:
 *
 *   `if (J.PASSIVE)`            - a probe. It asks whether an optional sibling is installed and
 *                                 behaves correctly either way. This is the one cross-plugin check
 *                                 the codebase blesses, and declaring `@base` for it would assert a
 *                                 hard requirement that demonstrably is not one.
 *   `J.EXTEND.Metadata.foo()`   - a dependency. It reads *through* the namespace into the sibling's
 *                                 contents, which only exist once that sibling has loaded.
 *
 * Stopping at the owned namespace is necessary but not sufficient, because a bare namespace can
 * still be consumed as a value rather than tested - `const { Symbols } = J.ABS.EXT.INPUT` and
 * `const rx = J.RESOURCES.EXT.ABS.RegExp` both reach a sibling's contents without ever reading a
 * property in the reference itself. So the reference must also sit in a guard position: negated,
 * joined by a boolean operator, opening an `if`, or testing a ternary.
 * @param {string} reference The referenced token, such as `J.ABS.EXT.INPUT.Symbols`.
 * @param {string} namespace The owned namespace it resolved to.
 * @param {string} line The source line containing the reference.
 * @param {string} nextLine The line following it, which may carry a wrapped ternary.
 * @param {number} referenceIndex Column at which the reference begins.
 * @returns {boolean} True when the reference only tests whether the sibling is present.
 */
function isPresenceProbe(reference, namespace, line, nextLine, referenceIndex)
{
  // reading a property past the namespace is a dependency no matter how it is written.
  if (reference !== namespace) return false;

  const before = line.slice(0, referenceIndex);
  const after = line.slice(referenceIndex + reference.length)
    .trimStart();

  // negation, a boolean join, or the head of a condition all mark this as a test.
  const guardBefore = /(?:\bif\s*\(|\bwhile\s*\(|&&|\|\||!)\s*$/;
  if (guardBefore.test(before) === true) return true;

  // the reference feeding a boolean operator or a ternary is likewise a test.
  const guardAfter = /^(?:&&|\|\||\?)/;
  if (guardAfter.test(after) === true) return true;

  // a condition wrapped onto the following line still tests this reference and nothing else.
  const wrapsOntoNextLine = after === String() && nextLine !== undefined;
  if (wrapsOntoNextLine === false) return false;

  const continuation = /^(?:&&|\|\||\?)/;

  return continuation.test(nextLine.trimStart());
}

/**
 * Decides whether a line sits at module top level, where load order still governs a presence probe.
 *
 * A probe inside a method body runs during gameplay, by which point every plugin has loaded and the
 * order they loaded in cannot matter. The same probe at top level runs *while* plugins are loading,
 * so a sibling that loads later is indistinguishable from one that was never installed - the block
 * silently does not run and the feature goes quietly missing rather than failing loudly.
 *
 * Top level is detected by indentation, which is reliable here only because the formatter is
 * committed and every nested statement is indented. A top-level condition wrapped across lines
 * would read as nested; that costs a missed report, never a false one.
 * @param {string} line The source line containing the reference.
 * @returns {boolean} True when the line begins at column zero.
 */
function isTopLevelLine(line)
{
  return line.length === line.trimStart().length;
}

/**
 * Resolves a namespace reference to the namespace that defines it, by longest matching prefix.
 * This is what distinguishes `J.ABS.EXT.INPUT.Symbols` (J-ABS-InputManager) from a bare `J.ABS`
 * reference (J-ABS), even though one is a prefix of the other.
 * @param {string} reference The referenced token, such as `J.ABS.EXT.INPUT.Symbols`.
 * @param {string[]} knownNamespaces Every namespace with a known owner, longest first.
 * @returns {string} The matching namespace, or an empty string when nothing owns it.
 */
function resolveReferencedNamespace(reference, knownNamespaces)
{
  const match = knownNamespaces.find(namespace =>
    reference === namespace || reference.startsWith(`${namespace}.`));

  if (match === undefined) return String();

  return match;
}

/**
 * Collects the undeclared cross-ship references within a single source file.
 * @param {string} filePath Repository-relative path to the source file, for reporting.
 * @param {string} contents Raw source text.
 * @param {object} ship The identity of the ship that owns this file.
 * @param {Map<string, object>} ownership Namespace to owning ship identity.
 * @param {string[]} knownNamespaces Every owned namespace, longest first.
 * @returns {string[]} Violation messages, one per offending line.
 */
function collectFileViolations(filePath, contents, ship, ownership, knownNamespaces)
{
  const violations = [];
  const codeLines = stripComments(contents);
  const referencePattern = /\bJ\.[A-Za-z0-9_.]+/g;

  codeLines.forEach((line, lineIndex) =>
  {
    [ ...line.matchAll(referencePattern) ].forEach(match =>
    {
      const [ reference ] = match;
      const namespace = resolveReferencedNamespace(reference, knownNamespaces);

      // an unowned namespace belongs to no ship in this repository; nothing to declare.
      if (namespace === String()) return;

      const owner = ownership.get(namespace);

      // a ship referencing its own namespace, or one nested inside it, depends on nothing.
      if (owner.pluginName === ship.pluginName) return;

      // the universally-required plugins are a precondition of being a J plugin at all.
      if (ALWAYS_AVAILABLE_PLUGINS.includes(owner.pluginName)) return;

      // a probe inside a method body asks only whether an optional sibling exists, and the answer
      // is settled long after load order stopped mattering; nothing needs declaring.
      const nextLine = codeLines[lineIndex + 1];
      const probing = isPresenceProbe(reference, namespace, line, nextLine, match.index);
      if (probing === true && isTopLevelLine(line) === false) return;

      // the dependency is satisfied when the annotations name it, by either declaration form.
      if (ship.declaredDependencies.has(owner.pluginName)) return;

      // a reviewed edge that no declaration could express is exempt, this one edge only.
      const exempt = ALLOWLIST.some(entry =>
        entry.dependent === ship.pluginName && entry.dependency === owner.pluginName);
      if (exempt === true) return;

      const location = `${filePath}:${lineIndex + 1}`;
      const preamble = `${location}: \`${namespace}\` belongs to ${owner.pluginName}, which ` +
        `${ship.pluginName} does not declare`;

      // a top-level probe survives the sibling's absence but not its late arrival, so ordering is
      // the whole of what it needs; asserting `@base` would overstate a requirement it does not have.
      if (probing === true)
      {
        violations.push(
          `${preamble} — this probe runs while plugins are loading, so add ` +
          `\`@orderAfter ${owner.pluginName}\` to its _annotations.js or the check silently fails`
        );
        return;
      }

      violations.push(
        `${preamble} — add \`@base ${owner.pluginName}\` (hard requirement) or ` +
        `\`@orderAfter ${owner.pluginName}\` (load order only) to its _annotations.js`
      );
    });
  });

  return violations;
}

/**
 * Scans every source file belonging to a single ship.
 * @param {object} ship The ship identity.
 * @param {Map<string, object>} ownership Namespace to owning ship identity.
 * @param {string[]} knownNamespaces Every owned namespace, longest first.
 * @returns {Promise<string[]>} Violation messages for this ship.
 */
async function collectShipViolations(ship, ownership, knownNamespaces)
{
  const pattern = `${ship.directory}/**/*.js`;
  const files = await glob(pattern);
  const violations = [];

  for (const filePath of files)
  {
    const normalizedPath = path.normalize(filePath);
    const fileName = path.basename(normalizedPath);

    // the annotations file declares dependencies rather than expressing them.
    if (IGNORED_FILENAMES.includes(fileName)) continue;

    const contents = await fs.readFile(filePath, 'utf-8');
    const fileViolations = collectFileViolations(
      normalizedPath, contents, ship, ownership, knownNamespaces);
    violations.push(...fileViolations);
  }

  return violations;
}

/**
 * Finds every ship directory by locating the vite configs that register them, which is the same
 * discovery rule the build itself uses.
 * @returns {Promise<string[]>} Ship root directories.
 */
async function collectShipDirectories()
{
  const configs = await glob(`${SRC_PLUGINS_DIR}/**/vite.config.*.js`);
  const directories = configs.map(configPath => path.dirname(configPath));

  return directories.sort();
}

/**
 * Entry point.
 * @returns {Promise<number>} Exit code — 0 for clean, 1 for violations found.
 */
async function main()
{
  const shipDirectories = await collectShipDirectories();
  const identities = [];

  for (const shipDirectory of shipDirectories)
  {
    const identity = await readShipIdentity(shipDirectory);
    identities.push(identity);
  }

  const ownership = buildOwnershipMap(identities);

  // longest first, so that longest-prefix resolution is a simple find on this list.
  const knownNamespaces = [ ...ownership.keys() ].sort((left, right) => right.length - left.length);

  const violations = [];
  const knownPluginNames = new Set(identities.map(ship => ship.pluginName));

  for (const ship of identities)
  {
    // PLUGIN_NAME must agree with the shipped filename, because two different consumers read the
    // two different values: `PluginManager.setup` keys parameters by the filename, while
    // `PluginMetadata` looks them up by PLUGIN_NAME. When they disagree by more than case - MZ
    // lowercases, so case alone is survivable - `PluginManager.parameters` returns an empty object
    // and every parameter falls through to the hardcoded default at its read site, which is silent
    // and looks exactly like the parameter being set to that default on purpose.
    if (ship.declaredPluginName !== ship.pluginName)
    {
      violations.push(
        `${ship.directory}/_metadata/meta.js: PLUGIN_NAME is \`${ship.declaredPluginName}\` but the ` +
        `ship builds as \`${ship.pluginName}\` — they must match or this plugin's parameters ` +
        `silently resolve to nothing`
      );
    }

    // a mis-cased tag is reported regardless of any exemption; the allowlist excuses an undeclared
    // dependency, not a declaration that silently does nothing.
    violations.push(...ship.tagViolations);

    // likewise a declaration naming a plugin that does not exist, which is inert for the same
    // reason and equally invisible.
    const unknownDependencies = collectUnknownDependencyViolations(
      ship.annotationsPath, ship.annotationsText, knownPluginNames);
    violations.push(...unknownDependencies);

    const shipViolations = await collectShipViolations(ship, ownership, knownNamespaces);
    violations.push(...shipViolations);
  }

  if (violations.length === 0)
  {
    Logger.logAnyway(
      `declared-dependencies verify: OK (${identities.length} ships, all cross-ship references declared).`,
      LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(
    `declared-dependencies verify FAILED: ${violations.length} undeclared reference(s) found.`,
    LogStyle.brightRed);

  for (const message of violations)
  {
    Logger.logAnyway(`  • ${message}`, LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-declared-dependencies