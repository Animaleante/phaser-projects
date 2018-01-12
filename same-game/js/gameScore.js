var game;

var gameOptions = {
    gameWidth: 2200,
    gameHeight: 1400,
    tileSize: 100,
    fieldSize: {
        rows: 10,
        cols: 20
    },
    colors: [0xdb0a5b, 0x19b5fe, 0x00b16a, 0xf7ca18],
    localStorageName: "samegame"
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        // game.stage.backgroundColor = 0x222;

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        game.load.image("tiles", "assets/sprites/tile.png");
        game.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
    },
    create: function() {
        this.score = 0;
        this.savedData = localStorage.getItem(gameOptions.localStorageName) == null ? {score:0} : JSON.parse(localStorage.getItem(gameOptions.localStorageName));
        this.scoreText = game.add.bitmapText(10, 10, "font", "", 72);
        var bestScoreText = game.add.bitmapText(game.width - 10, 10, "font", "BEST SCORE: " + this.savedData.score.toString(), 72);
        this.gameText = game.add.bitmapText(game.width / 2, game.height - 50, "font", "SAMEGAME", 90);
        this.gameText.anchor.set(0.5,1);
        bestScoreText.anchor.set(1,0);
        this.updateScore();

        this.createLevel();
    },
    createLevel: function() {
        this.canPick = true;

         this.tilesArray = [];
         this.tileGroup = game.add.group();
         var background = game.add.tileSprite(0, 0, gameOptions.tileSize * gameOptions.fieldSize.cols, gameOptions.tileSize * gameOptions.fieldSize.rows, "tiles");
         background.alpha = 0.2;
         this.tileGroup.add(background);
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
        theTile.width = gameOptions.tileSize;
        theTile.height = gameOptions.tileSize;
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
                this.score += this.filled.length * (this.filled.length - 2);
                this.updateScore();

                this.canPick = false;
                this.destroyTiles();
            }
        }
    },
    destroyTiles: function() {
        for (var i = 0; i < this.filled.length; i++) {
            var tween = game.add.tween(this.tilesArray[this.filled[i].y][this.filled[i].x]).to({
                alpha:0
            }, 150, Phaser.Easing.Linear.None, true);
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
            this.checkForMoves();
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
                this.checkForMoves();
            }
        }, this);

        this.tilesArray[fromRow][fromCol] = null;
    },
    checkForMoves: function() {
        var noMoves = true;
        var boardCleared = true;

        for (var i = 0; i < gameOptions.fieldSize.rows; i++) {
            for (var j = 0; j < gameOptions.fieldSize.cols; j++) {
                if(this.tilesArray[i][j] != null) {
                    boardCleared = false;
                    this.filled = [];
                    this.filled.length = 0;
                    this.floodFill(this.tilesArray[i][j].coordinate, this.tilesArray[i][j].value);
                    if(this.filled.length > 1) {
                        noMoves = false;
                        break;
                    }
                }
            }

            if(!noMoves) {
                break;
            }
        }

        if(noMoves) {
            if(boardCleared) {
                this.gameText.text = "CONGRATULATIONS!!!";
            } else {
                this.gameText.text = "NO MORE MOVES!";
            }

            var bestScore = Math.max(this.score, this.savedData.score);
            localStorage.setItem(gameOptions.localStorageName, JSON.stringify({
                score: bestScore
            }));
            game.time.events.add(Phaser.Timer.SECOND * 5, function() {
                game.state.start("TheGame");
            }, this);
        }
    },
    updateScore: function() {
        this.scoreText.text = "SCORE: " + this.score.toString();
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