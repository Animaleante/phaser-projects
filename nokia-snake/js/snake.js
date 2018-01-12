var DIRECTION = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3
};

var Snake = function(game, x, y) {
    this.game = game;

    this.headPosition = new Phaser.Point(x,y);

    this.body = this.game.add.group();

    // this.head = this.body.create(x * 16, y * 16, 'body');
    // this.head.setOrigin(0);

    this.head = this.game.add.sprite(x*16, y*16, 'body');
    this.head.tint = 0x193300;
    this.head.anchor.set(0);
    this.body.add(this.head);

    this.alive = true;

    this.speed = 100;

    this.moveTime = 0;

    this.tail = new Phaser.Point(x, y);

    this.heading = DIRECTION.RIGHT;
    this.direction = DIRECTION.RIGHT
};

Snake.prototype.update = function(time)
{
    var self = this;

    if(time >= self.moveTime) {
        return self.move(time);
    }

    return false;
};

Snake.prototype.faceLeft = function()
{
    var self = this;

    if(self.direction == DIRECTION.UP || self.direction == DIRECTION.DOWN) {
        self.heading = DIRECTION.LEFT;
    }
};

Snake.prototype.faceRight = function()
{
    var self = this;

    if(self.direction == DIRECTION.UP || self.direction == DIRECTION.DOWN) {
        self.heading = DIRECTION.RIGHT;
    }
};

Snake.prototype.faceUp = function()
{
    var self = this;

    if(self.direction == DIRECTION.LEFT || self.direction == DIRECTION.RIGHT) {
        self.heading = DIRECTION.UP;
    }
};

Snake.prototype.faceDown = function()
{
    var self = this;

    if(self.direction == DIRECTION.LEFT || self.direction == DIRECTION.RIGHT) {
        self.heading = DIRECTION.DOWN;
    }
};

Snake.prototype.move = function(time)
{
    var self = this;

    switch(self.heading) {
        case DIRECTION.LEFT:
            self.headPosition.x = Phaser.Math.wrap(self.headPosition.x - 1, 0, 40);
            break;
        case DIRECTION.RIGHT:
            self.headPosition.x = Phaser.Math.wrap(self.headPosition.x + 1, 0, 40);
            break;
        case DIRECTION.UP:
            self.headPosition.y = Phaser.Math.wrap(self.headPosition.y - 1, 0, 30);
            break;
        case DIRECTION.DOWN:
            self.headPosition.y = Phaser.Math.wrap(self.headPosition.y + 1, 0, 30);
            break;
    }

    self.direction = self.heading;

    // self.body.shiftPosition(self.headPosition.x * 16, self.headPosition.y * 16, 1);
    var lastPosX = self.headPosition.x * 16;
    var lastPosY = self.headPosition.y * 16;

    self.body.forEach(function(child) {
        var tempLastPostX = child.position.x;
        var tempLastPostY = child.position.y;

        child.position.set(lastPosX, lastPosY);

        lastPosX = tempLastPostX;
        lastPosY = tempLastPostY;
    });

    this.tail.x = lastPosX;
    this.tail.y = lastPosY;

    var hitBody = false;

    /*this.body.forEach(function(child) {
        if(child === this.head) return;

        if(this.head.x === child.x && this.head.y === child.y)
            hitBody = true;
    });*/

    for (var i = 0; i < this.body.children.length; i++) {
        if(this.body.children[i] === this.head) continue;

        if(this.head.x === this.body.children[i].x && this.head.y === this.body.children[i].y) {
            hitBody = true;
            break;
        }
    }

    if(hitBody) {
        this.alive = false;
        return false;
    } else {
        self.moveTime = time + self.speed;
        return true;
    }
};

Snake.prototype.grow = function()
{
    var newPart = this.game.add.sprite(this.tail.x, this.tail.y, 'body');
    newPart.tint = 0x193300;
    newPart.anchor.set(0);
    this.body.add(newPart);
};

Snake.prototype.collideWithFood = function(food)
{
    if(this.head.x === food.spr.x && this.head.y === food.spr.y) {
        this.grow();
        food.eat();

        if(this.speed > 20 && food.total % 5 === 0) {
            this.speed -= 5;
        }

        return true;
    }

    return false;
};

Snake.prototype.updateGrid = function(grid)
{
    this.body.forEach(function(child) {
        var bx = child.x / 16;
        var by = child.y / 16;

        grid[by][bx] = false;
    });

    return grid;
};