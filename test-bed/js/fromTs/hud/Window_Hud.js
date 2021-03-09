import { $gameMessage, $gameParty, $gamePlayer, ImageManager, Window_Base } from '../..';
/**
 * The built-in Hud window that contains all of the leader's info in realtime.
 */
class Window_Hud extends Window_Base {
    constructor(rect) {
        super(rect);
        this.initialize(rect);
    }
    /**
     * Initializes the entire Hud.
     * @param {Rectangle} rect The rectangle object that defines the shape of this HUD.
     */
    initialize(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this.opacity = 0;
        this.initMembers();
    }
    /**
     * Initializes the various variables required for the HUD.
     */
    initMembers() {
        /**
         * The actor being managed within this Hud.
         */
        this._actor = null;
        /**
         * The dictionary of sprites for this window, used for gauges and numbers.
         */
        this._hudSprites = {};
        /**
         * Whether or not the hud should be visible.
         */
        this._enabled = true;
    }
    /**
     * Refreshes the hud and forces a recreation of all sprites.
     */
    refresh() {
        this.contents.clear();
        const keys = Object.keys(this._hudSprites);
        keys.forEach(key => {
            this._hudSprites[key].destroy();
            delete this._hudSprites[key];
        });
        this._hudSprites = {};
    }
    /**
     * The update cycle. Refreshes values as-needed and handles all the drawing.
     */
    update() {
        Window_Base.prototype.update.call(this);
        if (this.canUpdate()) {
            this.drawHud();
        }
        else {
            this.refresh();
        }
    }
    /**
     * Toggles whether or not this hud is enabled.
     * @param {boolean} toggle Toggles the hud to be visible and operational.
     */
    toggle(toggle = !this._enabled) {
        this._enabled = toggle;
    }
    /**
     * Whether or not the hud actually has an actor to display data for.
     * @returns {boolean} True if there is an actor to update, false otherwise.
     */
    canUpdate() {
        if (!$gameParty || !$gameParty.leader() || !this.contents ||
            !this._enabled || !J.Hud.Metadata.Active || $gameMessage.isBusy()) {
            return false;
        }
        return true;
    }
    /**
     * Draws the contents of the Hud.
     */
    drawHud() {
        const actor = $gameParty.leader();
        this._actor = actor;
        this.drawFace(this._actor.faceName(), this._actor.faceIndex(), 0, 0, 128, 72);
        this.drawHudGaugeSprites();
        this.drawHudNumberSprites();
        this.drawStates();
        //this.drawSideviewBattler(); // need to figure out how sideview battlers work.
        if (this.playerInterference()) {
            this.interferenceOpacity();
        }
        else {
            this.refreshOpacity();
        }
    }
    /**
     * Determines whether or not the player is in the way (or near it) of this window.
     * @returns {boolean} True if the player is in the way, false otherwise.
     */
    playerInterference() {
        const player = $gamePlayer;
        const playerX = player.screenX();
        const playerY = player.screenY();
        if (playerX < this.width && playerY < this.height) {
            return true;
        }
        return false;
    }
    /**
     * Reduces opacity of all sprites when the player is in the way.
     */
    interferenceOpacity() {
        const sprites = this._hudSprites;
        const keys = Object.keys(sprites);
        keys.forEach(key => {
            const sprite = sprites[key];
            if (sprite.opacity > 64)
                sprite.opacity -= 15;
            if (sprite.opacity < 64)
                sprite.opacity += 1;
        });
    }
    /**
     * Reverts the opacity to normal when the player is no longer in the way.
     */
    refreshOpacity() {
        const sprites = this._hudSprites;
        const keys = Object.keys(sprites);
        keys.forEach(key => {
            const sprite = sprites[key];
            if (sprite.opacity < 255)
                sprite.opacity += 15;
            if (sprite.opacity > 255)
                sprite.opacity = 255;
        });
    }
    /**
     * A component of the Hud-drawing: draws the status gauges.
     */
    drawHudGaugeSprites() {
        this.placeGaugeSprite("hp", 100, 0, 200, 24, 14);
        this.placeGaugeSprite("mp", 100, 25, 200, 24, 14);
        this.placeGaugeSprite("tp", 100, 44, 200, 20, 8);
        this.placeGaugeSprite("time", 0, 72, 128, 22, 20);
    }
    /**
     * A component of the Hud-drawing: draws the numbers to match the gauges.
     */
    drawHudNumberSprites() {
        this.placeNumberSprite("hp", 90, -2, 5);
        this.placeNumberSprite("mp", 90, 26, 0);
        this.placeNumberSprite("tp", 0, 44, 0);
        this.placeNumberSprite("xp", -80, 80, -2);
        this.placeNumberSprite("lvl", -160, 60, -7);
    }
    /**
     * Draws all state-related data for the hud.
     */
    drawStates() {
        this.hideExpiredStates();
        const iconWidth = ImageManager.iconWidth;
        if (!this._actor.states().length)
            return;
        if (J.ABS && J.ABS.Metadata.Enabled) {
            const player = $gameBattleMap.getPlayerMapBattler();
            this._actor.states().forEach((state, i) => {
                const stateData = player.getStateData(state.id);
                if (stateData && stateData.active) {
                    this.drawState(state, 124 + i * iconWidth, 70);
                }
            });
        }
    }
    /**
     * Hides the sprites associated with a given state id.
     */
    hideExpiredStates() {
        if (J.ABS && J.ABS.Metadata.Enabled) {
            const allStateData = $gameBattleMap.getPlayerMapBattler().getAllStateData();
            Object.keys(allStateData).forEach(stateKey => {
                Object.keys(this._hudSprites).forEach(spriteKey => {
                    const match = `state-${stateKey}`;
                    if (spriteKey.includes(match) && !allStateData[stateKey].active) {
                        this._hudSprites[spriteKey].hide();
                    }
                });
            });
        }
    }
    /**
     * Draws a single state icon and it's duration timer.
     * @param {object} state The state afflicted on the character to draw.
     * @param {number} x The `x` coordinate to draw this state at.
     * @param {number} y The `y` coordinate to draw this state at.
     */
    drawState(state, x, y) {
        if (J.ABS && J.ABS.Metadata.Enabled) {
            const stateData = $gameBattleMap.getPlayerMapBattler().getStateData(state.id);
            this.placeStateIconSprite(state.id, state.iconIndex, x, y);
            this.placeStateTimerSprite(state.id, stateData, x, y);
        }
    }
    /**
     * Places the state icon at the designated location.
     * @param {number} id The id of the state.
     * @param {number} iconIndex The index of the icon associated with this state.
     * @param {number} x The `x` coordinate to draw this state at.
     * @param {number} y The `y` coordinate to draw this state at.
     */
    placeStateIconSprite(id, iconIndex, x, y) {
        const key = "actor%1-state-%2-icon".format(this._actor.actorId(), id);
        const sprite = this.createStateIconSprite(key, iconIndex);
        sprite.move(x, y);
        sprite.show();
    }
    /**
     * Places the timer sprite at a designated location.
     * @param {number} id The id of the state.
     * @param {object} stateData The data of the state.
     * @param {number} x The `x` coordinate to draw this state at.
     * @param {number} y The `y` coordinate to draw this state at.
     */
    placeStateTimerSprite(id, stateData, x, y) {
        const key = "actor%1-state-%2-timer".format(this._actor.actorId(), id);
        const sprite = this.createStateTimerSprite(key, stateData);
        sprite.move(x, y);
        sprite.show();
    }
    /**
     * Generates the state icon sprite representing an afflicted state.
     * @param {string} key The key of this sprite.
     * @param {number} iconIndex The icon index of this sprite.
     */
    createStateIconSprite(key, iconIndex) {
        const sprites = this._hudSprites;
        if (sprites[key]) {
            return sprites[key];
        }
        else {
            const sprite = new Sprite_Icon(iconIndex);
            sprites[key] = sprite;
            this.addInnerChild(sprite);
            return sprite;
        }
    }
    /**
     * Generates the state icon sprite representing an afflicted state.
     * @param {string} key The key of this sprite.
     * @param {number} stateData The state data associated with this state.
     */
    createStateTimerSprite(key, stateData) {
        const sprites = this._hudSprites;
        if (sprites[key]) {
            return sprites[key];
        }
        else {
            const sprite = new Sprite_StateTimer(stateData);
            sprites[key] = sprite;
            this.addInnerChild(sprite);
            return sprite;
        }
    }
    /**
     * Places an actor value at a designated location with the given parameters.
     * @param {string} type One of: "hp"/"mp"/"tp".
     * @param {number} x The origin `x` coordinate.
     * @param {number} y The origin `y` coordinate.
     * @param {number} fontSizeMod The variance of font size for this value.
     */
    placeNumberSprite(type, x, y, fontSizeMod) {
        const key = "actor%1-number-%2".format(this._actor.actorId(), type);
        const sprite = this.createNumberSprite(key, type, fontSizeMod);
        sprite.move(x, y);
        sprite.show();
    }
    /**
     * Generates the number sprite that keeps in sync with an actor's value.
     * @param {string} key The name of this number sprite.
     * @param {string} type One of: "hp"/"mp"/"tp".
     * @param {number} fontSizeMod The variance of font size for this value.
     */
    createNumberSprite(key, type, fontSizeMod) {
        const sprites = this._hudSprites;
        if (sprites[key]) {
            return sprites[key];
        }
        else {
            const sprite = new Sprite_ActorValue(this._actor, type, fontSizeMod);
            sprites[key] = sprite;
            this.addInnerChild(sprite);
            return sprite;
        }
    }
    /**
     * Places a gauge at a designated location with the given parameters.
     * @param {string} type One of: "hp"/"mp"/"tp". Determines color and value.
     * @param {number} x The origin `x` coordinate.
     * @param {number} y The origin `y` coordinate.
     * @param {number} bw The width of the bitmap for the gauge- also the width of the gauge.
     * @param {number} bh The height of the bitmap for the gauge.
     * @param {number} gh The height of the gauge itself.
     */
    placeGaugeSprite(type, x, y, bw, bh, gh) {
        const key = "actor%1-gauge-%2".format(this._actor.actorId(), type);
        const sprite = this.createGaugeSprite(key, bw, bh, gh);
        sprite.setup(this._actor, type);
        sprite.move(x, y);
        sprite.show();
    }
    /**
     * Creates and handles the sprite for this gauge.
     * @param {string} key The name of this gauge graphic.
     * @param {number} bw The width of the bitmap for this graphic.
     * @param {number} bh The height of the bitmap for this graphic.
     * @param {number} gh The height of the gauge of this graphic.
     */
    createGaugeSprite(key, bw, bh, gh) {
        const sprites = this._hudSprites;
        if (sprites[key]) {
            return sprites[key];
        }
        else {
            const sprite = new Sprite_MapGauge(bw, bh, gh);
            sprite.scale.x = 1.0; // change to match the window size?
            sprite.scale.y = 1.0;
            sprites[key] = sprite;
            this.addInnerChild(sprite);
            return sprite;
        }
    }
}
