var BotSnake = function(game, spriteKey, x, y) {
    Snake.call(this, game, spriteKey, x, y);
    this.trend = 1;
};

BotSnake.prototype = Object.create(Snake.prototype);
BotSnake.prototype.constructor = BotSnake;
BotSnake.prototype.tempUpdate = BotSnake.prototype.update;

BotSnake.prototype.update = function() {
    this.head.body.setZeroRotation();

    if(Util.randomInt(1,20) == 1) {
        this.trend *= -1;
    }

    this.head.body.rotateRight(this.trend * this.rotationSpeed);
    this.tempUpdate();
};