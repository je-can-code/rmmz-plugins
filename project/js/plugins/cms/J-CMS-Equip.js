//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.1.0 CMS_E] A redesign of the equip menu.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @base J-CMS-Main
 * @orderAfter J-Base
 * @orderAfter J-CMS-Main
 * @help
 * ============================================================================
 * This is a redesign of the equipment menu.
 * It includes the ability to see more parameters when changing equips.
 * You can also now press the square button (or equivalent of) to view the
 * detailed information relating to JABS (if applicable).
 * ============================================================================
 * NOTE ABOUT NOTETAGS:
 * This plugin has no notetags of its own- it is purely a scene/window
 * redesign of the native equip menu.
 * ============================================================================
 * CHANGELOG:
 * - 1.1.0
 *    Added a context action on the equip slot list to unequip the
 *    currently-selected slot directly, without opening the item list.
 *    Renamed slot-window handler symbols pagedown/pageup to
 *    actor-next/actor-prev.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 */

//#region src/plugins/cms/ext/equip/_metadata/_pluginMetadata.js
var J_CmsEquip_PluginMetadata = class extends PluginMetadata {
	/**
	* Constructor.
	* @param {string} name The plugin name.
	* @param {string} version The plugin version.
	*/
	constructor(name, version) {
		super(name, version);
	}
};

//#endregion
//#region src/plugins/cms/ext/equip/_metadata/initialization.js
/**
* The core where all of my extensions live: in the `J` object.
*/
globalThis.J ||= {};
(() => {
	const requiredBaseVersion = "3.2.0";
	const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
	if (hasBaseRequirement === false) {
		throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
	}
})();
/**
* The plugin umbrella that governs all things related to this plugin.
*/
J.CMS_E = {};
/**
* The `metadata` associated with this plugin, such as version.
*/
J.CMS_E.Metadata = new J_CmsEquip_PluginMetadata("J-CMS-Equip", "1.1.0");
J.CMS_E.Aliased = {
	Scene_Equip: new Map(),
	Window_EquipItem: new Map(),
	Window_EquipSlot: new Map()
};

//#endregion
//#region src/plugins/cms/ext/equip/windows/Window_MoreEquipData.js
/**
* A window designed to display "more" data associated with the equipment.
*/
var Window_MoreEquipData = class extends Window_MoreData {
	constructor(rect) {
		super(rect);
		this.contentsBack.paintOpacity = 255;
	}
	/**
	* Compiles the "more data" for the currently selected equipment.
	*/
	makeCommandList() {
		super.makeCommandList();
		if (!this.canBuildCommands()) {
			this.adjustWindowHeight();
			return;
		}
		this.buildCommands();
		this.adjustWindowHeight();
	}
	/**
	* Determines whether or not commands for the "more data" window can be built.
	* @returns {boolean} True if the commands can be built, false otherwise.
	*/
	canBuildCommands() {
		if (!this.item) return false;
		if (!this.actor) return false;
		return true;
	}
	/**
	* Build all commands for this particular hovered item.
	*/
	buildCommands() {
		this.addJaftingRefinementData();
		this.addBaseParameterData();
		this.addJabsEquipmentData();
		this.addEquipmentTraitData();
	}
	/**
	* Add any applicable base parameter commands from the equipment.
	*/
	addBaseParameterData() {
		const forEacher = (value, paramIdIndex) => {
			if (!value) return;
			const baseValue = this.item.params[paramIdIndex];
			const commandName = `${TextManager.param(paramIdIndex)}: ${baseValue}`;
			const command = new WindowCommandBuilder(commandName).setIconIndex(IconManager.param(paramIdIndex)).build();
			this.addBuiltCommand(command);
		};
		this.item.params.forEach(forEacher, this);
	}
	/**
	* Adds all commands related to JABS on the equipment.
	*/
	addJabsEquipmentData() {
		this.addHitsCommand();
		this.addSkillCommands();
		this.addSpeedBoostCommand();
	}
	/**
	* Adds per-connection bonus hit lines from scoped JABS tags, plus a weapon hit-count summary.
	*/
	addHitsCommand() {
		const { item } = this;
		const isWeapon = item.isWeapon();
		const globalHits = item.jabsBonusHitsScopeGlobal;
		const basicHits = item.jabsBonusHitsScopeBasic;
		const skillHits = item.jabsBonusHitsScopeSkill;
		const hasAnyScope = globalHits > 0 || basicHits > 0 || skillHits > 0;
		if (hasAnyScope === false && isWeapon === false) return;
		const hitBonusIcon = IconManager.jabsParameterIcon(IconManager.JABS_PARAMETER.BONUS_HITS);
		const pushScopeRow = (label, value) => {
			const text = `${label}: +${value}`;
			const row = new WindowCommandBuilder(text).setIconIndex(hitBonusIcon).build();
			this.addBuiltCommand(row);
		};
		if (globalHits > 0) pushScopeRow("Bonus hits (global)", globalHits);
		if (basicHits > 0) pushScopeRow("Bonus hits (basic)", basicHits);
		if (skillHits > 0) pushScopeRow("Bonus hits (skill)", skillHits);
		if (isWeapon) {
			const weaponHitTotal = 1 + globalHits + basicHits;
			const hitCountRow = new WindowCommandBuilder(`Hit count: x${weaponHitTotal}`).setIconIndex(hitBonusIcon).build();
			this.addBuiltCommand(hitCountRow);
		}
	}
	/**
	* Add the the appropriate skill and combo commands as-needed.
	*/
	addSkillCommands() {
		const { jabsSkillId } = this.item;
		if (!jabsSkillId) return;
		const skill = this.actor.skill(jabsSkillId);
		const comboSkillList = skill.getComboSkillIdList(this.actor);
		let baseAttackSkillCommand = this.item.isArmor() ? `Offhand Skill` : `Attack Skill`;
		const hasCombo = comboSkillList.length > 0;
		if (hasCombo) {
			baseAttackSkillCommand = `Combo Starter`;
		}
		const { name, iconIndex } = skill;
		const attackSkillCommand = `${baseAttackSkillCommand}: \\C[2]${name}\\C[0]`;
		const command = new WindowCommandBuilder(attackSkillCommand).setIconIndex(iconIndex).build();
		this.addBuiltCommand(command);
		if (hasCombo) {
			const forEacher = (comboSkillId, index) => {
				const comboSkill = this.actor.skill(comboSkillId);
				const comboSkillCommandName = `Combo Skill ${index + 1}: \\C[2]${comboSkill.name}\\C[0]`;
				const comboCommand = new WindowCommandBuilder(comboSkillCommandName).setIconIndex(iconIndex).build();
				this.addBuiltCommand(comboCommand);
			};
			comboSkillList.forEach(forEacher, this);
		}
	}
	/**
	* Add any speed boost adjustments from the equipment.
	*/
	addSpeedBoostCommand() {
		const { jabsSpeedBoost } = this.item;
		if (!jabsSpeedBoost) return;
		const speedBoostCommand = `Speed Boost: ${jabsSpeedBoost}`;
		const speedBoostIcon = IconManager.jabsParameterIcon(IconManager.JABS_PARAMETER.SPEED_BOOST);
		const command = new WindowCommandBuilder(speedBoostCommand).setIconIndex(speedBoostIcon).build();
		this.addBuiltCommand(command);
	}
	/**
	* Adds all commands related to JAFTING on the equipment.
	*/
	addJaftingRefinementData() {
		const { jaftingMaxRefineCount, jaftingMaxTraitCount, jaftingNotRefinementBase, jaftingNotRefinementMaterial, jaftingRefinedCount, jaftingUnrefinable } = this.item;
		if (jaftingUnrefinable) {
			const unrefinableCommand = `Unrefinable`;
			const unrefinableIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.UNREFINABLE);
			const unrefinableColor = 2;
			this.addCommand(unrefinableCommand, null, true, null, unrefinableIcon, unrefinableColor);
			return;
		}
		if (jaftingNotRefinementBase) {
			const unrefinableCommand = `Only Refine as Material`;
			const unrefinableIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.NOT_BASE);
			const unrefinableColor = 2;
			this.addCommand(unrefinableCommand, null, true, null, unrefinableIcon, unrefinableColor);
		}
		if (jaftingNotRefinementMaterial) {
			const unrefinableCommand = `Only Refine as Base`;
			const unrefinableIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.NOT_MATERIAL);
			const unrefinableColor = 2;
			this.addCommand(unrefinableCommand, null, true, null, unrefinableIcon, unrefinableColor);
		}
		let maxRefineCommand = `Refinement: ${jaftingRefinedCount}`;
		let maxRefineIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.TIMES_REFINED);
		if (jaftingMaxRefineCount) {
			maxRefineCommand += ` / ${jaftingMaxRefineCount}`;
			if (jaftingMaxRefineCount === jaftingRefinedCount) {
				maxRefineIcon = 91;
			}
		}
		this.addCommand(maxRefineCommand, null, true, null, maxRefineIcon);
		const maxTraitIcon = IconManager.jaftingParameterIcon(IconManager.JAFTING_PARAMETER.MAX_TRAITS);
		const currentTraitCount = JaftingManager.parseTraits(this.item).length;
		let maxTraitCommand = `Transferable Traits: ${currentTraitCount}`;
		if (jaftingMaxTraitCount) {
			maxTraitCommand += ` / ${jaftingMaxTraitCount}`;
		}
		this.addCommand(maxTraitCommand, null, true, null, maxTraitIcon);
	}
	/**
	* Adds all trait commands on the equipment.
	*/
	addEquipmentTraitData() {
		const allTraits = this.item.traits;
		if (!allTraits.length) return;
		const xparamNoPercents = [
			0,
			2,
			7,
			8,
			9
		];
		const sparamNoPercents = [1];
		const dividerIndex = allTraits.findIndex((trait) => trait.code === J.BASE.Traits.NO_DISAPPEAR);
		const hasDivider = dividerIndex !== -1;
		if (hasDivider) {
			this.addCommand(`BASE TRAITS`, null, true, null, 16, 30);
		}
		allTraits.forEach((t) => {
			const convertedTrait = new JAFTING_Trait(t.code, t.dataId, t.value);
			let commandName = convertedTrait.nameAndValue;
			let commandColor = 0;
			switch (convertedTrait._code) {
				case 21:
					const paramId = convertedTrait._dataId;
					const paramBase = this.actor.paramBase(paramId);
					const bonus = paramBase * (convertedTrait._value - 1);
					const sign = bonus >= 0 ? "+" : "-";
					commandName += ` \\C[6](${sign}${bonus.toFixed(2)})\\C[0]`;
					break;
				case 22:
					const xparamId = convertedTrait._dataId;
					if (xparamNoPercents.includes(xparamId)) {
						commandName = commandName.replace("%", String.empty);
					}
					break;
				case 23:
					const sparamId = convertedTrait._dataId;
					if (sparamNoPercents.includes(sparamId)) {
						commandName = commandName.replace("%", String.empty);
					}
					break;
				case 63:
					commandName = convertedTrait.name;
					commandColor = 30;
					break;
			}
			const commandIcon = IconManager.trait(convertedTrait);
			this.addCommand(commandName, null, true, null, commandIcon, commandColor);
		});
	}
};

//#endregion
//#region src/plugins/cms/ext/equip/scenes/Scene_Equip.js
/**
* Initializes this scene.
*/
Scene_Equip.prototype.initialize = function() {
	Scene_MenuBase.prototype.initialize.call(this);
	this._j = this._j || {};
	this._j.moreVisible = false;
};
/**
* Overwrites {@link #createButtons}.<br/>
* Removes the buttons because fuck the buttons.
*/
Scene_Equip.prototype.createButtons = function() {};
/**
* Overwrites {@link #create}.<br/>
* Removes the command window, because who even uses optimize?
*/
Scene_Equip.prototype.create = function() {
	Scene_MenuBase.prototype.create.call(this);
	this.createHelpWindow();
	this.createStatusWindow();
	this.createMoreDataWindow();
	this.createSlotWindow();
	this.createItemWindow();
	this.refreshActor();
	this._slotWindow.activate();
	this._slotWindow.select(0);
	this._slotWindow.onIndexChange();
};
/**
* Overwrites {@link #buttonAreaHeight}.<br/>
* Replaces the button area height with 0 because fuck buttons.
* @returns {number}
*/
Scene_Equip.prototype.buttonAreaHeight = () => 0;
/**
* Overwrites {@link #statusWidth}.<br/>
* Modifies the width of the equip status window.
*/
Scene_Equip.prototype.statusWidth = () => 1024;
/**
* Overwrites {@link #helpWindowRect}.<br/>
* Changes the width to be what we want it to be.
* @returns {Rectangle}
*/
Scene_Equip.prototype.helpWindowRect = function() {
	const wx = 0;
	const wy = this.helpAreaTop();
	const ww = this.statusWidth();
	const wh = this.helpAreaHeight();
	return new Rectangle(wx, wy, ww, wh);
};
/**
* Overwrites {@link #slotWindowRect}.<br/>
* Modifies the size of the equip slots window.
* @returns {Rectangle}
*/
Scene_Equip.prototype.slotWindowRect = function() {
	const wx = this.statusWidth();
	const wy = this.mainAreaTop();
	const ww = Graphics.boxWidth - this.statusWidth();
	const wh = this.slotWindowHeight(6);
	return new Rectangle(wx, wy, ww, wh);
};
/**
* Calculates the slot window height based on slot count.
* @param {number} equipSlotCount The number of slots.
* @returns {number} The calculated height for the slot window.
*/
Scene_Equip.prototype.slotWindowHeight = (equipSlotCount) => 48 * equipSlotCount;
/**
* Toggles the visibility of the "more" window.
*/
Scene_Equip.prototype.switchToMoreDataFromEquipSlots = function() {
	this._j.moreVisible = !this._j.moreVisible;
	if (this._j.moreVisible) {
		this._slotWindow.refreshMoreData();
		this._slotWindow.deactivate();
		this._moreDataWindow.setHandler("cancel", this.backToSlotsList.bind(this));
		this._moreDataWindow.show();
		this._moreDataWindow.activate();
		this._moreDataWindow.select(0);
	} else {
		this._moreDataWindow.hide();
		this._moreDataWindow.deactivate();
		this._moreDataWindow.deselect();
		this._slotWindow.activate();
	}
};
/**
* Toggles the visibility of the "more" window.
*/
Scene_Equip.prototype.switchToMoreDataFromEquipItems = function() {
	this._j.moreVisible = !this._j.moreVisible;
	if (this._j.moreVisible) {
		this._itemWindow.refreshMoreData();
		this._itemWindow.deactivate();
		this._moreDataWindow.setHandler("cancel", this.backToItemsList.bind(this));
		this._moreDataWindow.show();
		this._moreDataWindow.activate();
		this._moreDataWindow.select(0);
	} else {
		this._moreDataWindow.hide();
		this._moreDataWindow.deactivate();
		this._moreDataWindow.deselect();
		this._itemWindow.activate();
	}
};
/**
* Extends the slot window to include our additional actions.
*/
J.CMS_E.Aliased.Scene_Equip.set("createSlotWindow", Scene_Equip.prototype.createSlotWindow);
Scene_Equip.prototype.createSlotWindow = function() {
	J.CMS_E.Aliased.Scene_Equip.get("createSlotWindow").call(this);
	this._slotWindow.setHandler("more", this.switchToMoreDataFromEquipSlots.bind(this));
	this._slotWindow.setHandler("context", this.onContextUnequipSlot.bind(this));
	this._slotWindow.setHandler("actor-next", this.nextActor.bind(this));
	this._slotWindow.setHandler("actor-prev", this.previousActor.bind(this));
	this._slotWindow.setMoreDataWindow(this._moreDataWindow);
};
/**
* Handles the contextual unequip action from the slot window.
* Removes the item in the currently focused equip slot, if any.
*/
Scene_Equip.prototype.onContextUnequipSlot = function() {
	if (this._slotWindow.active === false) {
		return;
	}
	const slotId = this._slotWindow.index();
	this.actor().changeEquip(slotId, null);
	this._statusWindow.refresh();
	this._slotWindow.refresh();
	this._itemWindow.refresh();
	this.refreshActor();
	this._slotWindow.activate();
};
/**
* Overwrites {@link #createItemWindow}.<br/>
* Prevents hiding the item window.
*/
Scene_Equip.prototype.createItemWindow = function() {
	const rect = this.itemWindowRect();
	this._itemWindow = new Window_EquipItem(rect);
	this._itemWindow.setHelpWindow(this._helpWindow);
	this._itemWindow.setStatusWindow(this._statusWindow);
	this._itemWindow.setHandler("more", this.switchToMoreDataFromEquipItems.bind(this));
	this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
	this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
	this._itemWindow.setMoreDataWindow(this._moreDataWindow);
	this._slotWindow.setItemWindow(this._itemWindow);
	this.addWindow(this._itemWindow);
};
/**
* Creates the more data window.
*/
Scene_Equip.prototype.createMoreDataWindow = function() {
	const rect = this.moreDataRect();
	this._moreDataWindow = new Window_MoreEquipData(rect);
	this._moreDataWindow.hide();
	this._moreDataWindow.deactivate();
	this._moreDataWindow.deselect();
	this._moreDataWindow.opacity = 255;
	this.addWindow(this._moreDataWindow);
};
Scene_Equip.prototype.moreDataRect = function() {
	const width = 500;
	const wx = this.statusWidth() - width - 4;
	const wy = this.slotWindowRect().y - 4;
	const ww = width;
	const wh = Graphics.boxHeight - wy;
	return new Rectangle(wx, wy, ww, wh);
};
Scene_Equip.prototype.backToSlotsList = function() {
	this.switchToMoreDataFromEquipSlots();
};
Scene_Equip.prototype.backToItemsList = function() {
	this.switchToMoreDataFromEquipItems();
};
/**
* Gets the rectangle that defines the shape of this window.
* @returns {Rectangle}
*/
Scene_Equip.prototype.itemWindowRect = function() {
	const wx = this.statusWidth();
	const wy = this.mainAreaTop() + this._slotWindow.height;
	const ww = Graphics.boxWidth - this.statusWidth();
	const wh = Graphics.boxHeight - wy;
	return new Rectangle(wx, wy, ww, wh);
};
/**
* Overwrites {@link #onSlotOk}.<br/>
* Prevents hiding the equip window.
*/
Scene_Equip.prototype.onSlotOk = function() {
	this._itemWindow.activate();
	this._itemWindow.select(0);
};
/**
* Overwrites {@link #onSlotCancel}.<br/>
* Replaces the slot cancel functionality with the end of the scene.
*/
Scene_Equip.prototype.onSlotCancel = function() {
	this.popScene();
};
/**
* Overwrites {@link #hideItemWindow}.<br/>
* Prevents hiding the item window.
*/
Scene_Equip.prototype.hideItemWindow = function() {
	this._slotWindow.activate();
	this._itemWindow.deselect();
};
/**
* Overwrites {@link #onActorChange}.<br/>
* Prevents trying to activate a window that was removed from the scene.
*/
Scene_Equip.prototype.onActorChange = function() {
	Scene_MenuBase.prototype.onActorChange.call(this);
	this.refreshActor();
	this.hideItemWindow();
};
/**
* Extends the actor refresh to include the more data window.
*/
J.CMS_E.Aliased.Scene_Equip.set("refreshActor", Scene_Equip.prototype.refreshActor);
Scene_Equip.prototype.refreshActor = function() {
	J.CMS_E.Aliased.Scene_Equip.get("refreshActor").call(this);
	const actor = this.actor();
	this._moreDataWindow.setActor(actor);
};

//#endregion
//#region src/plugins/cms/ext/equip/windows/Window_EquipItem.js
/**
* Extends the `.initialize()` to include tracking for the more equip data window.
*/
J.CMS_E.Aliased.Window_EquipItem.set("initialize", Window_EquipItem.prototype.initialize);
Window_EquipItem.prototype.initialize = function(rect) {
	J.CMS_E.Aliased.Window_EquipItem.get("initialize").call(this, rect);
	/**
	* The more data window to manipulate.
	* @type {Window_MoreEquipData}
	*/
	this._moreDataWindow = null;
};
/**
* Refreshes the more data window.
*/
Window_EquipItem.prototype.refreshMoreData = function() {
	this.onIndexChange();
};
/**
* Updates the "more" window to point to the new index's item.
*/
Window_EquipItem.prototype.onIndexChange = function() {
	this._moreDataWindow.setItem(this.item());
};
/**
* Associates the more equip data window to this one for observation.
* @param {Window_MoreEquipData} moreDataWindow The window to attach to this.
*/
Window_EquipItem.prototype.setMoreDataWindow = function(moreDataWindow) {
	this._moreDataWindow = moreDataWindow;
};

//#endregion
//#region src/plugins/cms/ext/equip/windows/Window_EquipSlot.js
/**
* Extends the `.initialize()` to include tracking for the more equip data window.
*/
J.CMS_E.Aliased.Window_EquipSlot.set("initialize", Window_EquipSlot.prototype.initialize);
Window_EquipSlot.prototype.initialize = function(rect) {
	J.CMS_E.Aliased.Window_EquipSlot.get("initialize").call(this, rect);
	/**
	* The more data window to manipulate.
	* @type {Window_MoreEquipData}
	*/
	this._moreDataWindow = null;
};
/**
* Refreshes the more data window.
*/
Window_EquipSlot.prototype.refreshMoreData = function() {
	this.onIndexChange();
};
/**
* Updates the "more" window to point to the new index's item.
*/
Window_EquipSlot.prototype.onIndexChange = function() {
	this._moreDataWindow.setItem(this.item());
};
/**
* Associates the more equip data window to this one for observation.
* @param {Window_MoreEquipData} moreDataWindow The window to attach to this.
*/
Window_EquipSlot.prototype.setMoreDataWindow = function(moreDataWindow) {
	this._moreDataWindow = moreDataWindow;
};

//#endregion
//#region src/plugins/cms/ext/equip/windows/Window_EquipStatus.js
/**
* Overwrites {@link #lineHeight}.<br/>
* Matches the status scene's line height so both screens read identically.
* @returns {number}
*/
Window_EquipStatus.prototype.lineHeight = function() {
	return 32;
};
/**
* Overwrites {@link #makeFontSmaller}.<br/>
* Matches the status scene's reduced font step.
*/
Window_EquipStatus.prototype.makeFontSmaller = function() {
	if (this.contents.fontSize >= 24) {
		this.contents.fontSize -= 6;
	}
};
/**
* Overwrites {@link #makeFontBigger}.<br/>
* Matches the status scene's expanded font step.
*/
Window_EquipStatus.prototype.makeFontBigger = function() {
	if (this.contents.fontSize <= 96) {
		this.contents.fontSize += 6;
	}
};
/**
* Overwrites {@link #drawAllParams}.<br/>
* Renders every registered parameter — vanilla b/x/s params and every custom one alike — through
* the shared {@link ParameterCatalogRenderer}, grouped and chromed identically to the status
* scene's page 1 (Combat/Vitality/Precision/Defensive/Haste/Fate). This is the same catalog data
* the status scene reads, so nothing shown here can drift out of sync with what the player already
* knows from that screen.
*
* When a `_tempActor` is present (the player is hovering a candidate piece of equipment), each row
* renders "current → projected" instead of a bare value, so the impact of the swap is visible
* without leaving this window.
*/
Window_EquipStatus.prototype.drawAllParams = function() {
	const { rowGap } = ParameterCatalogRenderer.PAGE_LAYOUT;
	const columnLayout = ParameterCatalogRenderer.computeThreeColumnLayout(this);
	let cursorY = 0;
	if (columnLayout) {
		const columnXs = [columnLayout.leftX, columnLayout.middleX];
		ParameterCatalogRenderer.PAGE_GROUP_ROW_GROUPS.forEach((rowGroups) => {
			const rowHeights = rowGroups.map((groupId, columnIndex) => {
				return ParameterCatalogRenderer.drawParameterGroup(this, columnXs[columnIndex], cursorY, groupId, columnLayout.columnWidth, this._actor, this._tempActor);
			});
			const tallestSection = Math.max(...rowHeights);
			cursorY += tallestSection + rowGap;
		});
		return;
	}
	const fallbackWidth = this.innerWidth;
	ParameterCatalogRenderer.PAGE_GROUP_ROW_GROUPS.forEach((rowGroups) => {
		rowGroups.forEach((groupId) => {
			const groupHeight = ParameterCatalogRenderer.drawParameterGroup(this, 0, cursorY, groupId, fallbackWidth, this._actor, this._tempActor);
			cursorY += groupHeight + rowGap;
		});
	});
};

//#endregion
//# sourceMappingURL=J-CMS-Equip.js.map