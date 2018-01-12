var game;

var gameOptions = {
    gameWidth: 800,
    gameHeight: 800,
    tileSize: 100,
    fieldSize: {
        rows: 8,
        cols: 8
    },
    colors: [0xff0000, 0x0000ff, 0x00ff00, 0xffff00]
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.stage.backgroundColor = 0x222;
        game.load.image("tiles", "assets/sprites/tile.png");
    },
    create: function() {
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        this.createLevel();
    },
    createLevel: function() {
        this.canPick = true;
        
         this.tilesArray = [];
         this.tileGroup = game.add.group();
         this.tileGroup.x = (game.width - gameOptions.tileSize * gameOptions.fieldSize.cols) / 2;
         this.tileGroup.y = (game.height - gameOptions.tileSize * gameOptions.fieldSize.rows) / 2;

         for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
             this.tilesArray[i] = [];
             for (var j = 0; j < gameOptions.fieldSize.cols; j++) {
                 this.addTile(i, j);
             }
         }

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
            var posX = e.x - this.tileGroup.x;
            var posY = e.y - this.tileGroup.y;

            var pickedRow = Math.floor(posY / gameOptions.tileSize);
            var pickedCol = Math.floor(posX / gameOptions.tileSize);

            if(pickedRow >= 0 && pickedCol >= 0 && pickedRow < gameOptions.fieldSize.rows && pickedCol < gameOptions.fieldSize.cols) {
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
        for (var i = 0; i < this.filled.length; i++) {
            var tween = game.add.tween(this.tilesArray[this.filled[i].y][this.filled[i].x].tileSprite).to({
                alpha:0
            }, 300, Phaser.Easing.Linear.None, true);

            this.tilePool.push(this.tilesArray[this.filled[i].y][this.filled[i].x].tileSprite);

            tween.onComplete.add(function(e) {
                if(tween.manager.getAll().length == 1) {
                    this.fillVerticalHoles();
                }
            }, this);

            this.tilesArray[this.filled[i].y][this.filled[i].x].isEmpty = true;
        }
    },
    fillVerticalHoles: function() {
        var filled = false;

        for (var i = gameOptions.fieldSize.rows - 2; i >= 0; i--) {
            for (var j = 0; j < gameOptions.fieldSize.cols; j++) {
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

        for (i = 0; i < gameOptions.fieldSize.cols; i++) {
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
        for (var i = row + 1; i < gameOptions.fieldSize.rows; i++) {
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
                this.canPick = true;
            }
        }, this);
    },
    tilesInColumn: function(col) {
        var result = 0;

        for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
            if(!this.tilesArray[i][col].isEmpty) {
                result++;
            }
        }
        return result;
    },
    floodFill: function(p, n) {
        if(p.x < 0 || p.y < 0 || p.x >= gameOptions.fieldSize.cols || p.y >= gameOptions.fieldSize.rows){
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