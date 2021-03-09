import { Bitmap, Sprite, $gameSystem } from '../../../ts';
/**
 * A sprite that displays some static text.
 */
class Sprite_StateTimer extends Sprite {
    constructor(stateData) {
        super(null);
        Sprite.prototype.initialize.call(this);
        this.setup(stateData);
    }
    setup(stateData) {
        this.initMembers(stateData);
        this.loadBitmap();
    }
    /**
     * Initializes the properties associated with this sprite.
     * @param {object} stateData The state data associated with this sprite.
     */
    initMembers(stateData) {
        this._j = {};
        this._j._stateData = stateData;
    }
    /**
     * Loads the bitmap into the sprite.
     */
    loadBitmap() {
        this.bitmap = new Bitmap(this.bitmapWidth(), this.bitmapHeight());
        this.bitmap.fontFace = this.fontFace();
        this.bitmap.fontSize = this.fontSize();
        this.bitmap.drawText(this._j._text, 0, 0, this.bitmapWidth(), this.bitmapHeight(), "center");
    }
    update() {
        Sprite.prototype.update.call(this);
        this.updateCooldownText();
    }
    updateCooldownText() {
        this.bitmap.clear();
        const durationRemaining = (this._j._stateData.duration / 60).toFixed(1);
        this.bitmap.drawText(durationRemaining.toString(), 0, 0, this.bitmapWidth(), this.bitmapHeight(), "center");
    }
    /**
     * Determines the width of the bitmap accordingly to the length of the string.
     */
    bitmapWidth() {
        return 40;
    }
    /**
     * Determines the width of the bitmap accordingly to the length of the string.
     */
    bitmapHeight() {
        return this.fontSize() * 3;
    }
    /**
     * Determines the font size for text in this sprite.
     */
    fontSize() {
        return $gameSystem.mainFontSize() - 10;
    }
    /**
     * determines the font face for text in this sprite.
     */
    fontFace() {
        return $gameSystem.numberFontFace();
    }
}
