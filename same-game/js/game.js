var game;

var gameOptions = {
    gameWidth: 800,
    gameHeight: 800,
    tileSize: 100,
    fieldSize: {
        rows: 8,
        cols: 8
    },
    colors: [0xff0000, 0x0000ff, 0x0000ff, 0xffff00]
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
    },
    addTile: function(row, col) {
        var tileXPos = col * gameOptions.tileSize + gameOptions.tileSize / 2;
        var tileYPos = row * gameOptions.tileSize + gameOptions.tileSize / 2;
        var theTile = game.add.button(tileXPos, tileYPos, "tiles", this.pickTile, this);
        theTile.anchor.set(0.5);
        theTile.value = game.rnd.integerInRange(0, gameOptions.colors.length -1);
        theTile.tint = gameOptions.colors[theTile.value];
        theTile.coordinate = new Phaser.Point(col, row);
        this.tilesArray[row][col] = theTile;
        this.tileGroup.add(theTile);
    },
    pickTile: function(e) {
        if(this.canPick) {
            this.filled = [];
            this.filled.length = 0;
            this.floodFill(e.coordinate, e.value);

            if(this.filled.length > 1) {
                this.canPick = false;
                this.destroyTiles();
            }
        }
    },
    destroyTiles: function() {
        for (var i = 0; i < this.filled.length; i++) {
            var tween = game.add.tween(this.tilesArray[this.filled[i].y][this.filled[i].x]).to({
                alpha:0
            }, 300, Phaser.Easing.Linear.None, true);
            tween.onComplete.add(function(e) {
                e.destroy();

                if(tween.manager.getAll().length == 1) {
                    this.fillVerticalHoles();
                }
            }, this);

            this.tilesArray[this.filled[i].y][this.filled[i].x] = null
        }
    },
    fillVerticalHoles: function() {
        var filled = false;

        for (var i = gameOptions.fieldSize.rows - 2; i >= 0; i--) {
            for (var j = 0; j < gameOptions.fieldSize.cols; j++) {
                if(this.tilesArray[i][j] != null) {
                    var holesBelow = 0;
                    for (var z = i + 1; z < gameOptions.fieldSize.rows; z++) {
                        if(this.tilesArray[z][j] == null) {
                            holesBelow++;
                        }
                    }

                    if(holesBelow) {
                        filled = true;
                        this.moveDownTile(i, j, i + holesBelow);
                    }
                }
            }
        }

        if(!filled) {
            this.fillHorizontalHoles();
        }
    },
    moveDownTile: function(fromRow, fromCol, toRow) {
        this.tilesArray[toRow][fromCol] = this.tilesArray[fromRow][fromCol];
        this.tilesArray[toRow][fromCol].coordinate = new Phaser.Point(fromCol, toRow);

        var tween = game.add.tween(this.tilesArray[toRow][fromCol]).to({
            y: toRow * gameOptions.tileSize + gameOptions.tileSize / 2
        }, 250, Phaser.Easing.Linear.None, true);

        tween.onComplete.add(function(e) {
            if(tween.manager.getAll().length == 1) {
                this.fillHorizontalHoles();
            }
        }, this);

        this.tilesArray[fromRow][fromCol] = null;
    },
    fillHorizontalHoles: function() {
        var filled = false;

        for (var i = 0; i < gameOptions.fieldSize.cols - 1; i++) {
            if(this.tilesInColumn(i) == 0) {
                for (var j = i+1; j < gameOptions.fieldSize.cols; j++) {
                    if(this.tilesInColumn(j) != 0) {
                        for (var z = 0; z < gameOptions.fieldSize.rows; z++) {
                            if(this.tilesArray[z][j] != null) {
                                filled = true;
                                this.moveLeftTile(z, j, i);
                            }
                        }
                        break;
                    }
                }
            }
        }

        if(!filled) {
            this.canPick = true;
        }
    },
    moveLeftTile: function(fromRow, fromCol, toCol) {
        this.tilesArray[fromRow][toCol] = this.tilesArray[fromRow][fromCol];
        this.tilesArray[fromRow][toCol].coordinate = new Phaser.Point(toCol, fromRow);

        var tween = game.add.tween(this.tilesArray[fromRow][toCol]).to({
            x: toCol * gameOptions.tileSize + gameOptions.tileSize / 2
        }, 250, Phaser.Easing.Bounce.Out, true);

        tween.onComplete.add(function(e) {
            if(tween.manager.getAll().length == 1) {
                this.canPick = true;
            }
        }, this);

        this.tilesArray[fromRow][fromCol] = null;
    },
    tilesInColumn: function(col) {
        var result = 0;

        for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
            if(this.tilesArray[i][col] != null) {
                result++;
            }
        }
        return result;
    },
    floodFill: function(p, n) {
        if(p.x < 0 || p.y < 0 || p.x >= gameOptions.fieldSize.cols || p.y >= gameOptions.fieldSize.rows){
            return;
        }

        if(this.tilesArray[p.y][p.x] != null && this.tilesArray[p.y][p.x].value == n && !this.pointInArray(p)) {
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