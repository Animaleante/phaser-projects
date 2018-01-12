var game;

var gameOptions = {
    gameWidth: 800,
    gameHeight: 1300,
    tileSize: 100,
    fieldSize: 8,
    colors: [0xff0000, 0x0000ff, 0x00ff00, 0xffff00]
};

var _HERO = 1;
var _KEY = 2;
var _LOCKEDDOOR = 3;
var _UNLOCKEDDOOR = 4;

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.stage.backgroundColor = 0x222222;
        // game.load.image("tiles", "assets/sprites/tile.png");
        game.load.spritesheet("tiles", "assets/sprites/tiles.png", gameOptions.tileSize, gameOptions.tileSize);
        game.load.image("rotate", "assets/sprites/rotate.png");
    },
    create: function() {
        // game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        this.createLevel();
    },
    createLevel: function() {
        this.canPick = true;
        
         this.tilesArray = [];
         this.tileGroup = game.add.group();

         var specialItemCandidates = [];

         this.tileGroup.x = (game.width - gameOptions.tileSize * gameOptions.fieldSize) / 2;
         this.tileGroup.y = (game.height - gameOptions.tileSize * gameOptions.fieldSize) / 2;

         for (var i = 0; i < gameOptions.fieldSize; i++) {
             this.tilesArray[i] = [];
             for (var j = 0; j < gameOptions.fieldSize; j++) {
                 this.addTile(i, j);
                 specialItemCandidates.push(new Phaser.Point(j, i));
             }
         }

         var heroLocation = Phaser.ArrayUtils.removeRandomItem(specialItemCandidates);
         this.tilesArray[heroLocation.y][heroLocation.x].tileSprite.frame = _HERO;
         this.tilesArray[heroLocation.y][heroLocation.x].value = 10 + _HERO;
         this.tilesArray[heroLocation.y][heroLocation.x].tileSprite.tint = 0xffffff;

         do{
            var keyLocation = Phaser.ArrayUtils.removeRandomItem(specialItemCandidates);
         } while(this.isAdjacent(heroLocation, keyLocation));

         this.tilesArray[keyLocation.y][keyLocation.x].tileSprite.frame = _KEY;
         this.tilesArray[keyLocation.y][keyLocation.x].value = 10 + _KEY;
         this.tilesArray[keyLocation.y][keyLocation.x].tileSprite.tint = 0xffffff;

         do{
            var lockedDoorLocation = Phaser.ArrayUtils.removeRandomItem(specialItemCandidates);
         } while(this.isAdjacent(heroLocation, lockedDoorLocation));

         this.tilesArray[lockedDoorLocation.y][lockedDoorLocation.x].tileSprite.frame = _LOCKEDDOOR;
         this.tilesArray[lockedDoorLocation.y][lockedDoorLocation.x].value = 10 + _LOCKEDDOOR;
         this.tilesArray[lockedDoorLocation.y][lockedDoorLocation.x].tileSprite.tint = 0xffffff;

         var fieldWidth = gameOptions.tileSize * gameOptions.fieldSize;

         this.tileGroup.x = (game.width - fieldWidth) / 2;
         this.tileGroup.y = (game.height - fieldWidth) / 2;

         this.tileGroup.pivot.set(fieldWidth / 2, fieldWidth / 2);
         this.tileGroup.position.set(this.tileGroup.x + this.tileGroup.pivot.x, this.tileGroup.y + this.tileGroup.pivot.y);

         this.tileMask = game.add.graphics(this.tileGroup.x - this.tileGroup.pivot.x, this.tileGroup.y - this.tileGroup.pivot.y);
         this.tileMask.beginFill(0xfff);
         this.tileMask.drawRect(0, 0, fieldWidth, fieldWidth);
         this.tileGroup.mask = this.tileMask;
         this.tileMask.visible = false;

         this.rotateLeft = game.add.button(game.width / 4, this.tileGroup.y + fieldWidth / 2 + gameOptions.tileSize * 0.5, "rotate", function() {
            this.rotateField(-90);
         }, this);
         this.rotateLeft.anchor.set(0.5,0);

         this.rotateRight = game.add.button(game.width / 4 * 3, this.tileGroup.y + fieldWidth / 2 + gameOptions.tileSize * 0.5, "rotate", function() {
            this.rotateField(90);
         }, this);
         this.rotateRight.anchor.set(0.5,0);
         this.rotateRight.scale.x *= -1;

         this.tilePool = [];

         game.input.onDown.add(this.pickTile, this);
    },
    addTile: function(row, col) {
        var tileXPos = col * gameOptions.tileSize + gameOptions.tileSize / 2;
        var tileYPos = row * gameOptions.tileSize + gameOptions.tileSize / 2;
        var theTile = game.add.sprite(tileXPos, tileYPos, "tiles");
        theTile.anchor.set(0.5);
        theTile.width = gameOptions.tileSize;
        theTile.height = gameOptions.tileSize;

        var tileValue = game.rnd.integerInRange(0, gameOptions.colors.length -1);
        theTile.tint = gameOptions.colors[tileValue];

        this.tilesArray[row][col] = {
            tileSprite: theTile,
            isEmpty: false,
            coordinate: new Phaser.Point(col, row),
            value: tileValue
        };

        this.tileGroup.add(theTile);
    },
    pickTile: function(e) {
        if(this.canPick) {
            var posX = e.x - this.tileGroup.x + gameOptions.tileSize * gameOptions.fieldSize / 2;
            var posY = e.y - this.tileGroup.y + gameOptions.tileSize * gameOptions.fieldSize / 2;

            var pickedRow = Math.floor(posY / gameOptions.tileSize);
            var pickedCol = Math.floor(posX / gameOptions.tileSize);

            if(pickedRow >= 0 && pickedCol >= 0 && pickedRow < gameOptions.fieldSize && pickedCol < gameOptions.fieldSize) {
                var pickedTile = this.tilesArray[pickedRow][pickedCol];

                this.filled = [];
                this.filled.length = 0;
                this.floodFill(pickedTile.coordinate, pickedTile.value);

                if(this.filled.length > 1) {
                    this.canPick = false;
                    this.destroyTiles();
                }
            }
        }
    },
    destroyTiles: function() {
        do{
            var element = this.filled.shift();

            var tween = game.add.tween(this.tilesArray[element.y][element.x].tileSprite).to({
                alpha:0
            }, 300, Phaser.Easing.Linear.None, true);

            this.tilePool.push(this.tilesArray[element.y][element.x].tileSprite);

            tween.onComplete.add(function(e) {
                e.frame = 0;

                if(tween.manager.getAll().length == 1) {
                    this.fillVerticalHoles();
                }
            }, this);

            this.tilesArray[element.y][element.x].isEmpty = true;
        } while(this.filled.length);
    },
    fillVerticalHoles: function() {
        var filled = false;

        for (var i = gameOptions.fieldSize - 2; i >= 0; i--) {
            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(!this.tilesArray[i][j].isEmpty) {
                    var holesBelow = this.countSpacesBelow(i, j);

                    if(holesBelow) {
                        filled = true;
                        this.moveDownTile(i, j, i + holesBelow, false);
                    }
                }
            }
        }

        if(!filled) {
            this.canPick = true;
        }

        for (i = 0; i < gameOptions.fieldSize; i++) {
            var topHoles = this.countSpacesBelow(-1, i);

            for (var j = topHoles - 1; j >= 0; j--) {
                var reusedTile = this.tilePool.shift();
                reusedTile.y = (j - topHoles) * gameOptions.tileSize + gameOptions.tileSize / 2;
                reusedTile.x = i * gameOptions.tileSize + gameOptions.tileSize / 2;

                reusedTile.alpha = 1;

                var tileValue = game.rnd.integerInRange(0, gameOptions.colors.length - 1);

                reusedTile.tint = gameOptions.colors[tileValue];

                this.tilesArray[j][i] = {
                    tileSprite: reusedTile,
                    isEmpty: false,
                    coordinate: new Phaser.Point(i, j),
                    value: tileValue
                };

                this.moveDownTile(0, i, j, true);
            }
        }
    },
    countSpacesBelow: function(row, col) {
        var result = 0;
        for (var i = row + 1; i < gameOptions.fieldSize; i++) {
            if(this.tilesArray[i][col].isEmpty) {
                result++;
            }
        }

        return result;
    },
    moveDownTile: function(fromRow, fromCol, toRow, justMove) {
        if(!justMove) {
            var tileToMove = this.tilesArray[fromRow][fromCol].tileSprite;
            var tileValue = this.tilesArray[fromRow][fromCol].value;

            this.tilesArray[toRow][fromCol] = {
                tileSprite: tileToMove,
                isEmpty: false,
                coordinate: new Phaser.Point(fromCol, toRow),
                value: tileValue
            };

            this.tilesArray[fromRow][fromCol].isEmpty = true;
        }

        var distanceToTravel = (toRow * gameOptions.tileSize + gameOptions.tileSize / 2) - this.tilesArray[toRow][fromCol].tileSprite.y;

        var tween = game.add.tween(this.tilesArray[toRow][fromCol].tileSprite).to({
            y: toRow * gameOptions.tileSize + gameOptions.tileSize / 2
        }, distanceToTravel / 2, Phaser.Easing.Linear.None, true);

        tween.onComplete.add(function() {
            if(tween.manager.getAll().length == 1) {
                // this.canPick = true;
                this.endMove();
            }
        }, this);
    },
    tilesInColumn: function(col) {
        var result = 0;

        for (var i = 0; i < gameOptions.fieldSize; i++) {
            if(!this.tilesArray[i][col].isEmpty) {
                result++;
            }
        }
        return result;
    },
    rotateField: function(a) {
        if(this.canPick) {
            this.canPick = false;

            this.tileGroup.mask = null;

            var rotateTween = game.add.tween(this.tileGroup).to({
                angle: a
            }, 500, Phaser.Easing.Bounce.Out, true);

            rotateTween.onComplete.add(function() {
                this.tilesArray = Phaser.ArrayUtils.rotateMatrix(this.tilesArray, -a);

                for (var i = 0; i < gameOptions.fieldSize; i++) {
                    for (var j = 0; j < gameOptions.fieldSize; j++) {
                        this.tilesArray[i][j].tileSprite.angle = 0;
                        this.tilesArray[i][j].tileSprite.x = j * gameOptions.tileSize + gameOptions.tileSize / 2;
                        this.tilesArray[i][j].tileSprite.y = i * gameOptions.tileSize + gameOptions.tileSize / 2;
                        this.tilesArray[i][j].coordinate = new Phaser.Point(j, i);
                    }
                }

                this.tileGroup.angle = 0;
                this.endMove();
                this.tileGroup.mask = this.tileMask;
            }, this);
        }
    },
    endMove: function() {
        this.filled = [];

        for (var i = 0; i < gameOptions.fieldSize; i++) {
            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(this.tilesArray[i][j].value == 10 + _HERO) {
                    if(i != gameOptions.fieldSize -1) {
                        var tileBelowHero = this.tilesArray[i+1][j].value;
                        switch(tileBelowHero) {
                            case 10 + _KEY:
                                this.filled.push(new Phaser.Point(j, i+1));
                                var door = this.findItem(_LOCKEDDOOR);
                                door.tileSprite.frame = _UNLOCKEDDOOR;
                                door.value = 10 + _UNLOCKEDDOOR;
                                break;
                            case 10 + _UNLOCKEDDOOR:
                                this.filled.push(new Phaser.Point(j, i));
                        }
                    }
                }
            }
        }

        if(this.filled.length > 0) {
            this.destroyTiles();
        } else {
            this.canPick = true;
        }
    },
    findItem: function(item) {
        for (var i = 0; i < gameOptions.fieldSize; i++) {
            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(this.tilesArray[i][j].value == 10 + item) {
                    return this.tilesArray[i][j];
                }
            }
        }
    },
    isAdjacent: function(p1, p2) {
        return (Math.abs(p1.x - p2.x) < 2) && (Math.abs(p1.y - p2.y) < 2);
    },
    floodFill: function(p, n) {
        if(p.x < 0 || p.y < 0 || p.x >= gameOptions.fieldSize || p.y >= gameOptions.fieldSize){
            return;
        }

        if(!this.tilesArray[p.y][p.x].isEmpty && this.tilesArray[p.y][p.x].value == n && !this.pointInArray(p)) {
            this.filled.push(p);
            this.floodFill(new Phaser.Point(p.x + 1, p.y), n);
            this.floodFill(new Phaser.Point(p.x - 1, p.y), n);
            this.floodFill(new Phaser.Point(p.x, p.y + 1), n);
            this.floodFill(new Phaser.Point(p.x, p.y - 1), n);
        }
    },
    pointInArray: function(p) {
        for (var i = 0; i < this.filled.length; i++) {
            if(this.filled[i].x == p.x && this.filled[i].y == p.y) {
                return true;
            }
        }
        return false;
    }
};