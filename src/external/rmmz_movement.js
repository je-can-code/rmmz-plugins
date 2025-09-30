// https://github.com/gsioteam/rmmz_movement/blob/master/index.js

const _Game_CharacterBase_isMoving = Game_CharacterBase.prototype.isMoving;
Game_CharacterBase.prototype.isMoving = function()
{
  if (this._movePressing)
  {
    return true;
  }
  return _Game_CharacterBase_isMoving.call(this);
}

Game_Player.prototype.updateDashing = function()
{
  if (this.isMoving() && !this._movePressing)
  {
    return;
  }
  if (this.canMove() && !this.isInVehicle() && !$gameMap.isDashDisabled())
  {
    this._dashing =
      this.isDashButtonPressed() || $gameTemp.isDestinationValid();
  }
  else
  {
    this._dashing = false;
  }
};

Game_Player.prototype.moveByInput = function()
{
  if ((!this.isMoving() || this._movePressing) && this.canMove())
  {
    let direction = Input.dir8;
    if (direction > 0)
    {
      $gameTemp.clearDestination();
      if (!this._movePressing)
      {
        this._resetCachePosition();
        var followers = this._followers._data;
        for (let follower of followers)
        {
          follower._resetCachePosition();
        }
      }

      this.setMovementSuccess(false);

      direction = this._moveByInput(direction);
      if (direction > 0) this.setDirection(direction);

      if (this.isMovementSucceeded())
      {
        this._followersMove(0);
        this._movePressing = true;
      }
      else
      {
        this._followersMove(2);
        this._movePressing = false;
        this.checkEventTriggerTouchFront(direction);
      }
      return;
    }
    else if ($gameTemp.isDestinationValid())
    {
      this._x = Math.round(this._x);
      this._y = Math.round(this._y);
      const x = $gameTemp.destinationX();
      const y = $gameTemp.destinationY();
      direction = this.findDirectionTo(x, y);

      if (direction > 0)
      {
        this.executeMove(direction);
      }
      this._followersMove(1);
      return;
    }
  }
  this._followersMove(2);
  this._movePressing = false;
};

Game_Player.prototype._moveByInput = function(direction)
{
  let roundX = Math.round(this._x);
  let roundY = Math.round(this._y);
  let distencePerFrame = this.distancePerFrame();

  let downTest = (offset = 0) =>
  {
    return this.canPass(roundX + offset, Math.floor(this._y + distencePerFrame), 2);
  }
  let upTest = (offset = 0) =>
  {
    return this.canPass(roundX + offset, Math.ceil(this._y - distencePerFrame), 8);
  }
  let leftTest = (offset = 0) =>
  {
    return this.canPass(Math.ceil(this._x - distencePerFrame), roundY + offset, 4);
  }
  let rightTest = (offset = 0) =>
  {
    return this.canPass(Math.floor(this._x + distencePerFrame), roundY + offset, 6);
  }

  let walkStep = () =>
  {
    this.increaseSteps();
    this.checkEventTriggerHere([ 1, 2 ]);
  }

  switch (direction)
  {
    case 1:
    {
      let canLeft = leftTest(), canDown = downTest();
      if (canLeft && canDown)
      {
        if (leftTest(1))
        {
          this.setMovementSuccess(true);
          let dis = this.distancePerFrame() / Math.SQRT2;
          this._y += dis;
          this._x -= dis;
          if (Math.round(this._y) > roundY || Math.round(this._x) < roundX)
          {
            walkStep();
          }
          return 2;
        }
        else if (this.x - roundX < roundY - this.y)
        {
          return this._moveByInput(4);
        }
        else
        {
          return this._moveByInput(2);
        }
      }
      else if (canLeft)
      {
        return this._moveByInput(4);
      }
      else if (canDown)
      {
        return this._moveByInput(2);
      }
      else
      {
        direction = 2;
      }
      break;
    }
    case 3:
    {
      let canRight = rightTest(), canDown = downTest();
      if (canRight && canDown)
      {
        if (rightTest(1))
        {
          this.setMovementSuccess(true);
          let dis = this.distancePerFrame() / Math.SQRT2;
          this._y += dis;
          this._x += dis;
          if (Math.round(this._y) > roundY || Math.round(this._x) > roundX)
          {
            walkStep();
          }
          return 2;
        }
        else if (roundX - this.x < roundY - this.y)
        {
          return this._moveByInput(6);
        }
        else
        {
          return this._moveByInput(2);
        }
      }
      else if (canRight)
      {
        return this._moveByInput(6);
      }
      else if (canDown)
      {
        return this._moveByInput(2);
      }
      else
      {
        direction = 2;
      }
      break;
    }
    case 7:
    {
      let canLeft = leftTest(), canUp = upTest();
      if (canLeft && canUp)
      {
        if (leftTest(-1))
        {
          this.setMovementSuccess(true);
          let dis = this.distancePerFrame() / Math.SQRT2;
          this._y -= dis;
          this._x -= dis;
          if (Math.round(this._y) < roundY || Math.round(this._x) < roundX)
          {
            walkStep();
          }
          return 8;
        }
        else if (this.x - roundX < this.y - roundY)
        {
          return this._moveByInput(4);
        }
        else
        {
          return this._moveByInput(8);
        }
      }
      else if (canLeft)
      {
        return this._moveByInput(4);
      }
      else if (canUp)
      {
        return this._moveByInput(8);
      }
      else
      {
        direction = 8;
      }
      break;
    }
    case 9:
    {
      let canRight = rightTest(), canUp = upTest();
      if (canRight && canUp)
      {
        if (rightTest(-1))
        {
          this.setMovementSuccess(true);
          let dis = this.distancePerFrame() / Math.SQRT2;
          this._y -= dis;
          this._x += dis;
          if (Math.round(this._y) < roundY || Math.round(this._x) > roundX)
          {
            walkStep();
          }
          return 8;
        }
        else if (roundX - this.x < this.y - roundY)
        {
          return this._moveByInput(6);
        }
        else
        {
          return this._moveByInput(8);
        }
      }
      else if (canRight)
      {
        return this._moveByInput(6);
      }
      else if (canUp)
      {
        return this._moveByInput(8);
      }
      else
      {
        direction = 8;
      }
      break;
    }
    case 2:
    {
      if (downTest())
      {
        this.setMovementSuccess(true);
        this._y += this.distancePerFrame();
        if (Math.round(this._y) > roundY)
        {
          walkStep();
        }
        if (this._x > roundX && !downTest(1) ||
          this._x < roundX && !downTest(-1))
        {
          this._x = roundX;
        }
        return direction;
      }
      break;
    }
    case 8:
    {
      if (upTest())
      {
        this.setMovementSuccess(true);
        this._y -= this.distancePerFrame();
        if (Math.round(this._y) < roundY)
        {
          walkStep();
        }
        if (this._x > roundX && !upTest(1) ||
          this._x < roundX && !upTest(-1))
        {
          this._x = roundX;
        }
        return direction;
      }
      break;
    }
    case 4:
    {
      if (leftTest())
      {
        this.setMovementSuccess(true);
        this._x -= this.distancePerFrame();
        if (Math.round(this._x) < roundX)
        {
          walkStep();
        }
        if (this._y > roundY && !leftTest(1) ||
          this._y < roundY && !leftTest(-1))
        {
          this._y = roundY;
        }
        return direction;
      }
      break;
    }
    case 6:
    {
      if (rightTest())
      {
        this.setMovementSuccess(true);
        this._x += this.distancePerFrame();
        if (Math.round(this._x) > roundX)
        {
          walkStep();
        }
        if (this._y > roundY && !rightTest(1) ||
          this._y < roundY && !rightTest(-1))
        {
          this._y = roundY;
        }
        return direction;
      }
      break;
    }
  }
  return direction;
};

Game_Player.prototype._followersMove = function(move)
{
  this._recordPosition();
  var followers = this._followers._data;

  if (move === 0)
  {
    for (let i = followers.length - 1; i >= 0; i--)
    {
      const precedingCharacter = i > 0
        ? followers[i - 1]
        : $gamePlayer;
      let last = precedingCharacter._lastPosition();
      if (last)
      {
        let follower = followers[i];
        if (Math.abs(last.y - follower._y) > Math.abs(last.x - follower._x))
        {
          if (last.y > follower._y)
          {
            follower.setDirection(2);
          }
          else if (last.y < follower._y)
          {
            follower.setDirection(8);
          }
        }
        else
        {
          if (last.x > follower._x)
          {
            follower.setDirection(6);
          }
          else if (last.x < follower._x)
          {
            follower.setDirection(4);
          }
        }
        follower._x = last.x;
        follower._y = last.y;
        follower._movePressing = true;
        follower._recordPosition();
      }
    }
  }
  else
  {
    for (let follower of followers)
    {
      if (move === 1)
      {
        follower._x = Math.round(follower.x);
        follower._y = Math.round(follower.y);
      }
      follower._movePressing = false;
      follower._recordPosition();
    }
  }
};

Game_CharacterBase.prototype._resetCachePosition = function()
{
  this._posRecords = [];
};

Game_CharacterBase.prototype._recordPosition = function()
{
  if (!this._posRecords)
  {
    this._posRecords = [];
  }
  let last = this._recentPosition();

  function distance(a, b)
  {
    if (!a || !b) return 0;
    let x = a.x - b.x;
    let y = a.y - b.y;
    return Math.sqrt(x * x + y * y);
  }

  let dis = distance(last, this);
  if (dis > 2)
  {
    this._resetCachePosition();
  }
  else if (!last || dis > 0.1)
  {
    this._posRecords.push({
      x: this.x,
      y: this.y
    });
    while (this._posRecords.length > 10)
    {
      this._posRecords.shift();
    }
  }
};

Game_CharacterBase.prototype._lastPosition = function()
{
  if (this._posRecords && this._posRecords.length > 0)
  {
    return this._posRecords[0];
  }
};

Game_CharacterBase.prototype._recentPosition = function()
{
  if (this._posRecords && this._posRecords.length > 0)
  {
    return this._posRecords[this._posRecords.length - 1];
  }
};

Game_Player.prototype.checkEventTriggerHere = function(triggers)
{
  if (this.canStartLocalEvents())
  {
    this.startMapEvent(Math.round(this.x), Math.round(this.y), triggers, false);
  }
};

const _Game_Player_checkEventTriggerThere = Game_Player.prototype.checkEventTriggerThere;
Game_Player.prototype.checkEventTriggerThere = function()
{
  this._x = Math.round(this.x);
  this._y = Math.round(this.y);
  _Game_Player_checkEventTriggerThere.call(this, ...arguments);
}

const _Game_Player_checkEventTriggerTouch = Game_Player.prototype.checkEventTriggerTouch;
Game_Player.prototype.checkEventTriggerTouch = function(x, y)
{
  let roundX = Math.round(x);
  let roundY = Math.round(y);
  if (Math.abs(roundX - x) < 0.3 && Math.abs(roundY - y) < 0.3)
  {
    return _Game_Player_checkEventTriggerTouch.call(this, roundX, roundY);
  }
  else
  {
    return false;
  }
};

const _Game_Character_processMoveCommand = Game_Character.prototype.processMoveCommand;
Game_Character.prototype.processMoveCommand = function()
{
  this._movePressing = false;
  this._x = Math.round(this.x);
  this._y = Math.round(this.y);
  return _Game_Character_processMoveCommand.call(this, ...arguments);
}