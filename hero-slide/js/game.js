var game;

var tileSize = 120;
var tileTypes = 5;
var gameArray = [];
var fieldSize = 4;
var tweenDuration = 100;

var direction = {
    left: 2,
    up: 4,
    right: 8,
    down: 16
}

window.onload = function() {
    game = new Phaser.Game(480,480);
    game.state.add("PlayGame", playGame);
    game.state.start("PlayGame");
};

var playGame = function(game){};

playGame.prototype = {
    preload: function() {
        game.load.spritesheet("tiles", "assets/sprites/tiles.png", tileSize, tileSize);
    },
    create: function() {
        for (var i = 0; i < fieldSize; i++) {
            gameArray[i] = [];
            for (var j = 0; j < fieldSize; j++) {
                gameArray[i][j] = {
                    tileValue: 0,
                    tileSprite: null
                };
            }
        }

        this.addItem();

        this.upKey = game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.upKey.onDown.add(this.handleKey, this);
        this.downKey = game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.downKey.onDown.add(this.handleKey, this);
        this.leftKey = game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.leftKey.onDown.add(this.handleKey, this);
        this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.D);
        this.rightKey.onDown.add(this.handleKey, this);

        game.input.onDown.add(this.beginSwipe, this);
    },
    addItem: function() {
        var emptySpots = [];

        for (var i = 0; i < fieldSize; i++) {
            for (var j = 0; j < fieldSize; j++) {
                if(gameArray[i][j].tileValue == 0) {
                    emptySpots.push(new Phaser.Point(j,i));
                }
            }
        }

        var newSpot = Phaser.ArrayUtils.getRandomItem(emptySpots);

        if(newSpot != null) {
            var tileType = game.rnd.between(1, tileTypes);

            gameArray[newSpot.y][newSpot.x] = {
                tileValue: tileType,
                tileSprite: game.add.sprite(newSpot.x * tileSize, newSpot.y * tileSize, "tiles", tileType-1)
            };

            gameArray[newSpot.y][newSpot.x].tileSprite.alpha = 0;

            var fadeTween = game.add.tween(gameArray[newSpot.y][newSpot.x].tileSprite).to({
                alpha: 1
            }, tweenDuration, Phaser.Easing.Linear.None, true);

            fadeTween.onComplete.add(function(e) {
                this.canMove = true;
            }, this);
        }
    },
    handleKey: function(e) {
        switch(e.keyCode) {
            case Phaser.Keyboard.A:
                this.handleMovement(direction.left);
                break;
            case Phaser.Keyboard.W:
                this.handleMovement(direction.up);
                break;
            case Phaser.Keyboard.D:
                this.handleMovement(direction.right);
                break;
            case Phaser.Keyboard.S:
                this.handleMovement(direction.down);
                break;
        }
    },
    moveTile: function(row, col, toRow, toCol) {
        this.movingTiles++;

        var moveTween = game.add.tween(gameArray[row][col].tileSprite).to({
            x: gameArray[row][col].tileSprite.x + tileSize * (toCol - col),
            y: gameArray[row][col].tileSprite.y + tileSize * (toRow - row)
        }, tweenDuration, Phaser.Easing.Linear.None, true);

        moveTween.onComplete.add(function(e) {
            this.endMove();
        }, this);

        gameArray[toRow][toCol] = {
            tileValue: gameArray[row][col].tileValue,
            tileSprite: gameArray[row][col].tileSprite
        };

        gameArray[row][col] = {
            tileValue: 0,
            tileSprite: null
        };

        this.playerMoved = true;
    },
    moveAndRemove: function(row, col, toObject, toRow, toCol) {
        this.movingTiles++;

        var moveTween = game.add.tween(gameArray[row][col].tileSprite).to(toObject, tweenDuration, Phaser.Easing.Linear.None, true);
        moveTween.onComplete.add(function(e) {
            e.destroy();
            this.endMove();
        }, this);

        switch(gameArray[row][col].tileValue) {
            case 4: 
                this.detonations.push(new Phaser.Point(toCol, toRow));
                break;
        }

        gameArray[row][col] = {
            tileValue: 0,
            tileSprite: null
        };
    },
    removeTile: function(row, col) {
        this.movingTiles++;

        var removeTween = game.add.tween(gameArray[row][col].tileSprite).to({
            alpha: 0
        }, tweenDuration, Phaser.Easing.Linear.None, true);

        removeTween.onComplete.add(function(e) {
            this.movingTiles--;

            gameArray[row][col].tileSprite.destroy();
            gameArray[row][col] = {
                tileValue: 0,
                tileSprite: null
            };

            if(this.movingTiles == 0) {
                this.addItem();
            }
        }, this);
    },
    endMove: function() {
        this.movingTiles--;

        if(this.movingTiles == 0) {
            if(this.detonations.length > 0)
                this.handleDetonations();
            else
                this.addItem();
        }
    },
    handleDetonations: function() {
        for (var i = 0; i < this.detonations.length; i++) {
            this.removeTile(this.detonations[i].y, this.detonations[i].x);

            if(this.detonations[i].y - 1 >= 0 && gameArray[this.detonations[i].y-1][this.detonations[i].x].tileValue != 0) {
                this.removeTile(this.detonations[i].y-1, this.detonations[i].x);
            }
            if(this.detonations[i].y + 1 < fieldSize && gameArray[this.detonations[i].y+1][this.detonations[i].x].tileValue != 0) {
                this.removeTile(this.detonations[i].y+1, this.detonations[i].x);
            }
            if(this.detonations[i].x - 1 >= 0 && gameArray[this.detonations[i].y][this.detonations[i].x-1].tileValue != 0) {
                this.removeTile(this.detonations[i].y, this.detonations[i].x-1);
            }
            if(this.detonations[i].x + 1 < fieldSize && gameArray[this.detonations[i].y][this.detonations[i].x+1].tileValue != 0) {
                this.removeTile(this.detonations[i].y, this.detonations[i].x+1);
            }
        }
    },
    beginSwipe: function(e) {
        game.input.onDown.remove(this.beginSwipe, this);
        game.input.onUp.add(this.endSwipe, this);
    },
    endSwipe: function(e) {
        game.input.onDown.remove(this.endSwipe, this);
        game.input.onUp.add(this.beginSwipe, this);

        var swipeTime = e.timeUp - e.timeDown;
        var swipeDistance = Phaser.Point.subtract(e.position, e.positionDown);
        var swipeMagnitude = swipeDistance.getMagnitude();
        var swipeNormal = Phaser.Point.normalize(swipeDistance);

        if(swipeMagnitude > 20 && swipeTime < 1000 && (Math.abs(swipeNormal.x) > 0.8 || Math.abs(swipeNormal.y) > 0.8)) {
            if(swipeNormal.x > 0.8) {
                this.handleMovement(direction.right);
            }
            if(swipeNormal.x < -0.8) {
                this.handleMovement(direction.left);
            }
            if(swipeNormal.y > 0.8) {
                this.handleMovement(direction.down);
            }
            if(swipeNormal.y < -0.8) {
                this.handleMovement(direction.up);
            }
        }
    },
    handleMovement: function(d) {

        this.movingTiles = 0;
        this.playerMoved = false;

        if(this.canMove) {
            this.canMove = false;

            this.detonations = [];
            this.detonations.length = 0;

            switch(d) {
                case direction.left:
                    for (var i = 0; i < fieldSize; i++) {
                        for (var j = 1; j < fieldSize; j++) {
                            if(gameArray[i][j].tileValue != 0 & gameArray[i][j-1].tileValue == 0) {
                                this.moveTile(i, j, i, j-1);
                            } else {
                                if(gameArray[i][j].tileValue != 0 & gameArray[i][j-1].tileValue == gameArray[i][j].tileValue) {
                                    this.moveAndRemove(i, j, {x: gameArray[i][j].tileSprite.x - tileSize}, i, j-1);
                                }
                            }
                        }
                    }
                    break;
                case direction.up:
                    for (var i = 1; i < fieldSize; i++) {
                        for (var j = 0; j < fieldSize; j++) {
                            if(gameArray[i][j].tileValue != 0 & gameArray[i-1][j].tileValue == 0) {
                                this.moveTile(i, j, i-1, j);
                            } else {
                                if(gameArray[i][j].tileValue != 0 & gameArray[i-1][j].tileValue == gameArray[i][j].tileValue) {
                                    this.moveAndRemove(i, j, {y: gameArray[i][j].tileSprite.y - tileSize}, i-1, j);
                                }
                            }
                        }
                    }
                    break;
                case direction.right:
                    for (var i = 0; i < fieldSize; i++) {
                        for (var j = fieldSize-2; j >= 0 ; j--) {
                            if(gameArray[i][j].tileValue != 0 & gameArray[i][j+1].tileValue == 0) {
                                this.moveTile(i, j, i, j+1);
                            } else {
                                if(gameArray[i][j].tileValue != 0 & gameArray[i][j+1].tileValue == gameArray[i][j].tileValue) {
                                    this.moveAndRemove(i, j, {x: gameArray[i][j].tileSprite.x + tileSize}, i, j+1);
                                }
                            }
                        }
                    }
                    break;
                case direction.down:
                    for (var i = fieldSize-2; i >= 0; i--) {
                        for (var j = 0; j < fieldSize; j++) {
                            if(gameArray[i][j].tileValue != 0 & gameArray[i+1][j].tileValue == 0) {
                                this.moveTile(i, j, i+1, j);
                            } else {
                                if(gameArray[i][j].tileValue != 0 & gameArray[i+1][j].tileValue == gameArray[i][j].tileValue) {
                                    this.moveAndRemove(i, j, {y: gameArray[i][j].tileSprite.y + tileSize}, i+1, j);
                                }
                            }
                        }
                    }
                    break;
            }

            // this.handleDetonations();
            // this.addItem();
            if(!this.playerMoved)
                this.canMove = true;
        }
    }
}