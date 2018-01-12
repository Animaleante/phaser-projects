var PlayerSnake = function(game, spriteKey, x, y) {
    Snake.call(this, game, spriteKey, x, y);

    this.cursors = game.input.keyboard.createCursorKeys();

    var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    var self = this;

    spaceKey.onDown.add(this.spaceKeyDown, this);
    spaceKey.onUp.add(this.spaceKeyUp, this);

    this.addDestroyedCallback(function() {
        spaceKey.onDown.remove(this.spaceKeyDown, this);
        spaceKey.onUp.remove(this.spaceKeyUp, this);
    }, this);
};

PlayerSnake.prototype = Object.create(Snake.prototype);
PlayerSnake.prototype.constructor = PlayerSnake;

PlayerSnake.prototype.spaceKeyDown = function(e)
{
    this.speed = this.fastSpeed;
};

PlayerSnake.prototype.spaceKeyUp = function(e)
{
    this.speed = this.slowSpeed;
};

PlayerSnake.prototype.tempUpdate = PlayerSnake.prototype.update;
PlayerSnake.prototype.update = function() {
    var mousePosX = this.game.input.activePointer.worldX;
    var mousePosY = this.game.input.activePointer.worldY;

    var headX = this.head.body.x;
    var headY = this.head.body.y;

    var angle = (180*Math.atan2(mousePosX - headX, mousePosY - headY) / Math.PI);

    if(angle > 0) {
        angle = 180-angle;
    } else {
        angle = -180-angle;
    }

    var dif = this.head.body.angle - angle;

    if(this.cursors.left.isDown) {
        this.head.body.rotateLeft(this.rotationSpeed);
    } else if(this.cursors.right.isDown) {
        this.head.body.rotateRight(this.rotationSpeed);
    } else if(dif < 0 && dif > -180 || dif > 180) {
        this.head.body.rotateRight(this.rotationSpeed);
    } else if(dif > 0 && dif < 180 || dif < -180) {
        this.head.body.rotateLeft(this.rotationSpeed);
    }

    this.tempUpdate();
};