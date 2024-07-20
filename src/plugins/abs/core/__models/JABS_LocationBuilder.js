//region JABS_LocationBuilder
/**
 * A builder for creating {@link JABS_Location}s.
 */
class JABS_LocationBuilder
{
  #x = null;
  #y = null;
  #d = null;

  build()
  {
    const newLocation = new JABS_Location(this.#x, this.#y, this.#d);
    this.clear();
    return newLocation;
  }

  clear()
  {
    this.#x = null;
    this.#y = null;
    this.#d = null;
    return this;
  }

  setX(x)
  {
    this.#x = x;
    return this;
  }

  setY(y)
  {
    this.#y = y;
    return this;
  }

  /**
   * Sets the direction of this location to a given numpad-direction.
   * @param {1|2|3|4|6|7|8|9} d One of the 8 cardinal numpad directions.
   * @returns {JABS_LocationBuilder} This builder for fluent-chaining.
   */
  setDirection(d)
  {
    this.#d = d;
    return this;
  }

  facingUp()
  {
    return this.setDirection(J.ABS.Directions.UP);
  }

  facingUpperLeft()
  {
    return this.setDirection(J.ABS.Directions.UPPERLEFT);

  }

  facingUpperRight()
  {
    return this.setDirection(J.ABS.Directions.UPPERRIGHT);

  }

  facingLeft()
  {
    return this.setDirection(J.ABS.Directions.LEFT);

  }

  facingRight()
  {
    return this.setDirection(J.ABS.Directions.RIGHT);

  }

  facingLowerLeft()
  {
    return this.setDirection(J.ABS.Directions.LOWERLEFT);
  }

  facingLowerRight()
  {
    return this.setDirection(J.ABS.Directions.LOWERRIGHT);
  }

  facingDown()
  {
    return this.setDirection(J.ABS.Directions.DOWN);
  }

  /**
   * Face the same direction as another {@link JABS_Location}.
   * @param {JABS_Location} targetLocation The location to copy the facing of.
   */
  faceSame(targetLocation)
  {
    return this.setDirection(targetLocation.d);
  }

  /**
   * Face the opposite direction as another {@link JABS_Location}.
   * @param {JABS_Location} targetLocation The location to reverse the facing of.
   */
  faceReverse(targetLocation)
  {
    switch (targetLocation.d)
    {
      case J.ABS.Directions.LOWERLEFT:
        return this.facingUpperRight();
      case J.ABS.Directions.DOWN:
        return this.facingUp();
      case J.ABS.Directions.LOWERRIGHT:
        return this.facingUpperLeft;
      case J.ABS.Directions.LEFT:
        return this.facingRight();
      case J.ABS.Directions.RIGHT:
        return this.facingLeft();
      case J.ABS.Directions.UPPERLEFT:
        return this.facingLowerRight();
      case J.ABS.Directions.UP:
        return this.facingDown();
      case J.ABS.Directions.UPPERRIGHT:
        this.#d = J.ABS.Directions.LOWERLEFT;
        return this.facingLowerLeft();
      case null:
        console.warn('Attempted to face reverse a null direction.');
        return this.facingUp();
    }
  }
}
//endregion JABS_LocationBuilder