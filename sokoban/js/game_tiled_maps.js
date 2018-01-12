var game;

var gameOptions = {
    gameWidth: 320,
    gameHeight: 320,
    tileSize: 40,
    gameSpeed: 100
};

var level = [];

var EMPTY = 0;
var WALL = 1;
var SPOT = 2;
var CRATE = 3;
var PLAYER = 4;

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("ThePreload", ThePreload);
    game.state.add("TheGame", TheGame);
    // game.state.start("TheGame", true, false, 0);
    game.state.start("ThePreload");
};

var ThePreload = function(){};
ThePreload.prototype = {
    preload: function() {
        game.load.spritesheet("tiles", "assets/sprites/tiles.png", gameOptions.tileSize, gameOptions.tileSize);

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        var request = new XMLHttpRequest();
        request.overrideMimeType("application/json");
        request.open("GET", "map.json", true);
        request.onreadystatechange = function() {
            if(request.readyState == 4 && request.status == "200") {
                var jsonLevels = JSON.parse(request.responseText);

                for (var k = 0; k < jsonLevels.layers.length; k++) {
                    level[k] = [];

                    for (var i = 0; i < jsonLevels.layers[k].height; i++) {
                        level[k][i] = [];

                        for (var j = 0; j < jsonLevels.layers[k].width; j++) {
                            level[k][i][j] = jsonLevels.layers[k].data[i * jsonLevels.layers[k].width + j] - 1;
                        }
                    }
                }

                game.state.start("TheGame", true, false, 0);
            }
        };
        request.send();
    }
};

var TheGame = function(){};

TheGame.prototype = {
    init: function(currentLevel) {
        this.currentLevel = currentLevel;
    },
    /*preload: function() {
        game.load.spritesheet("tiles", "assets/sprites/tiles.png", gameOptions.tileSize, gameOptions.tileSize);

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;
    },*/
    create: function() {
        this.undoArray = [];
        this.crates = [];

        this.drawLevel();

        game.input.onTap.add(this.handleTap, this);
        game.input.onDown.add(this.beginSwipe, this);
    },
    drawLevel: function() {
        this.staticAssetsGroup = game.add.group();
        this.movingAssetsGroup = game.add.group();

        this.crates.length = 0;

        for (var i = 0; i < level[this.currentLevel].length; i++) {
            this.crates[i] = [];

            for (var j = 0; j < level[this.currentLevel][i].length; j++) {
                this.crates[i][j] = null;

                switch(level[this.currentLevel][i][j]) {
                    case PLAYER:
                    case PLAYER + SPOT:
                        this.player = game.add.sprite(gameOptions.tileSize * j, gameOptions.tileSize * i, "tiles");
                        this.player.frame = level[this.currentLevel][i][j];
                        this.player.posX = j;
                        this.player.posY = i;

                        this.movingAssetsGroup.add(this.player);

                        var tile = game.add.sprite(gameOptions.tileSize * j, gameOptions.tileSize * i, "tiles");
                        tile.frame = level[this.currentLevel][i][j] - PLAYER;

                        this.staticAssetsGroup.add(tile);
                        break;
                    case CRATE:
                    case CRATE + SPOT:
                        this.crates[i][j] = game.add.sprite(gameOptions.tileSize * j, gameOptions.tileSize * i, "tiles");
                        this.crates[i][j].frame = level[this.currentLevel][i][j];

                        this.movingAssetsGroup.add(this.crates[i][j]);

                        var tile = game.add.sprite(gameOptions.tileSize * j, gameOptions.tileSize * i, "tiles");
                        tile.frame = level[this.currentLevel][i][j] - CRATE;

                        this.staticAssetsGroup.add(tile);
                        break;
                    default:
                        var tile = game.add.sprite(gameOptions.tileSize * j, gameOptions.tileSize * i, "tiles");
                        tile.frame = level[this.currentLevel][i][j];

                        this.staticAssetsGroup.add(tile);
                }
            }
        }
    },
    handleTap: function(pointer, doubleTap) {
        if(doubleTap) {
            if(this.undoArray.length > 0) {
                var undoLevel = this.undoArray.pop();

                this.staticAssetsGroup.destroy();
                this.movingAssetsGroup.destroy();

                level[this.currentLevel] = [];
                level[this.currentLevel] = this.copyArray(undoLevel);

                this.drawLevel();
            }
        }
    },
    beginSwipe: function() {
        game.input.onDown.remove(this.beginSwipe, this);
        game.input.onUp.add(this.endSwipe, this);
    },
    endSwipe: function(e) {
        game.input.onUp.remove(this.endSwipe, this);

        var swipeTime = e.timeUp - e.timeDown;
        var swipeDistance = Phaser.Point.subtract(e.position, e.positionDown);
        var swipeMagnitude = swipeDistance.getMagnitude();
        var swipeNormal = Phaser.Point.normalize(swipeDistance);

        if(swipeMagnitude > 20 && swipeTime < 1000 && (Math.abs(swipeNormal.y) > 0.8 || Math.abs(swipeNormal.x) > 0.8)) {
            if(swipeNormal.x > 0.8) {
                this.checkMove(1,0);
            } else if(swipeNormal.x < -0.8) {
                this.checkMove(-1,0);
            }

            if(swipeNormal.y > 0.8) {
                this.checkMove(0,1);
            } else if(swipeNormal.y < -0.8) {
                this.checkMove(0,-1);
            }
        } else {
            game.input.onDown.add(this.beginSwipe, this);
        }
    },
    checkMove: function(deltaX, deltaY) {
        if(this.isWalkable(this.player.posX + deltaX, this.player.posY + deltaY)) {
            this.undoArray.push(this.copyArray(level[this.currentLevel]));
            this.movePlayer(deltaX, deltaY);
            return;
        }

        if(this.isCrate(this.player.posX + deltaX, this.player.posY + deltaY)) {
            if(this.isWalkable(this.player.posX + 2 * deltaX, this.player.posY + 2 * deltaY)) {
                this.undoArray.push(this.copyArray(level[this.currentLevel]));
                this.moveCrate(deltaX, deltaY);
                this.movePlayer(deltaX, deltaY);
                return;
            }
        }
    },
    isWalkable: function(posX, posY) {
        return level[this.currentLevel][posY][posX] == EMPTY || level[this.currentLevel][posY][posX] == SPOT;
    },
    isCrate: function(posX, posY) {
        return level[this.currentLevel][posY][posX] == CRATE || level[this.currentLevel][posY][posX] == CRATE + SPOT;
    },
    movePlayer: function(deltaX, deltaY) {
        var playerTween = game.add.tween(this.player).to({
            x: this.player.x + deltaX * gameOptions.tileSize,
            y: this.player.y + deltaY * gameOptions.tileSize
        }, gameOptions.gameSpeed, Phaser.Easing.Linear.None, true);

        playerTween.onComplete.add(function() {
            game.input.onDown.add(this.beginSwipe, this);
            this.player.frame = level[this.currentLevel][this.player.posY][this.player.posX];

            if(this.isLevelSoldved()) {
                this.currentLevel++;
                this.game.state.start("TheGame", true, false, this.currentLevel);
            }
        }, this);

        level[this.currentLevel][this.player.posY][this.player.posX] -= PLAYER;
        this.player.posX += deltaX;
        this.player.posY += deltaY;
        level[this.currentLevel][this.player.posY][this.player.posX] += PLAYER;
    },
    moveCrate: function(deltaX, deltaY) {
        var crateTween = game.add.tween(this.crates[this.player.posY + deltaY][this.player.posX + deltaX]).to({
            x: this.crates[this.player.posY + deltaY][this.player.posX + deltaX].x + deltaX * gameOptions.tileSize,
            y: this.crates[this.player.posY + deltaY][this.player.posX + deltaX].y + deltaY * gameOptions.tileSize
        }, gameOptions.gameSpeed, Phaser.Easing.Linear.None, true);

        crateTween.onComplete.add(function() {
            this.crates[this.player.posY + deltaY][this.player.posX + deltaX].frame = level[this.currentLevel][this.player.posY + deltaY][this.player.posX + deltaX];
        }, this);

        this.crates[this.player.posY + 2 * deltaY][this.player.posX + 2 * deltaX] = this.crates[this.player.posY + deltaY][this.player.posX + deltaX];
        this.crates[this.player.posY + deltaY][this.player.posX + deltaX] = null;
        level[this.currentLevel][this.player.posY + deltaY][this.player.posX + deltaX] -= CRATE;
        level[this.currentLevel][this.player.posY + 2 * deltaY][this.player.posX + 2 * deltaX] += CRATE;
    },
    isLevelSoldved: function() {
        for (var i = 0; i < level[this.currentLevel].length; i++) {
            for (var j = 0; j < level[this.currentLevel][i].length; j++) {
                // console.log(level[this.currentLevel][i][j]);
                if(level[this.currentLevel][i][j] == CRATE) {
                    return false;
                }
            }
        }
        return true;
    },
    copyArray: function(a) {
        var newArray = a.slice(0);
        for (var i = newArray.length - 1; i >= 0; i--) {
            if(newArray[i] instanceof Array) {
                newArray[i] = this.copyArray(newArray[i]);
            }
        }

        return newArray;
    }
};