var game;

var gameOptions = {
    gameWidth: 700,
    gameHeight: 700,
    fieldSize: 7,
    orbColors: 6,
    orbSize: 100,
    swapSpeed: 200,
    fallSpeed: 1000,
    destroySpeed: 500,
    fastFall: true
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.load.spritesheet("orbs", "assets/sprites/orbs.png", gameOptions.orbSize, gameOptions.orbSize);

        // game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // game.scale.pageAlignHorizontally = true;
        // game.scale.pageAlignVertically = true;
    },
    create: function() {
        this.gameArray = [];
        this.removeMap = [];

        this.drawField();

        this.canPick = true;

        game.input.onDown.add(this.orbSelect, this);
        // game.input.onUp.add(this.orbDeselect, this);
    },
    drawField: function() {
        this.orbGroup = game.add.group();

        for (var i = 0; i < gameOptions.fieldSize; i++) {
            this.gameArray[i] = [];

            for (var j = 0; j < gameOptions.fieldSize; j++) {
                var orb = game.add.sprite(gameOptions.orbSize * j + gameOptions.orbSize / 2, gameOptions.orbSize * i + gameOptions.orbSize / 2, "orbs");
                orb.anchor.set(0.5);
                this.orbGroup.add(orb);

                do {
                    var randomColor = game.rnd.between(0, gameOptions.orbColors - 1);
                    orb.frame = randomColor;
                    this.gameArray[i][j] = {
                        orbColor: randomColor,
                        orbSprite: orb
                    };
                } while(this.isMatch(i, j));
            }
        }

        this.selectedOrb = null;
    },
    orbSelect: function(e) {
        if(this.canPick) {
            var row = Math.floor(e.clientY / gameOptions.orbSize);
            var col = Math.floor(e.clientX / gameOptions.orbSize);
            var pickedOrb = this.gemAt(row, col);

            if(pickedOrb != -1) {
                if(this.selectedOrb == null) {
                    pickedOrb.orbSprite.scale.setTo(1.2);
                    pickedOrb.orbSprite.bringToTop();
                    this.selectedOrb = pickedOrb;

                    game.input.onDown.remove(this.orbSelect, this);
                    game.input.onUp.add(this.orbDeselect, this);
                    game.input.addMoveCallback(this.orbMove, this);
                } else {
                    if(this.areTheSame(pickedOrb, this.selectedOrb)) {
                        this.selectedOrb.orbSprite.scale.setTo(1);
                        this.selectedOrb = null;
                    } else {
                        if(this.areNext(pickedOrb, this.selectedOrb)) {
                            this.selectedOrb.orbSprite.scale.setTo(1);
                            this.swapOrbs(this.selectedOrb, pickedOrb, true);
                        } else {
                            this.selectedOrb.orbSprite.scale.setTo(1);
                            pickedOrb.orbSprite.scale.setTo(1.2);
                            this.selectedOrb = pickedOrb;

                            game.input.onDown.remove(this.orbSelect, this);
                            game.input.onUp.add(this.orbDeselect, this);
                            game.input.addMoveCallback(this.orbMove, this);
                        }
                    }
                }
            }
        }
    },
    orbDeselect: function(e) {
        game.input.onUp.remove(this.orbDeselect, this);
        game.input.deleteMoveCallback(this.orbMove, this);
        game.input.onUp.add(this.orbSelect, this);
    },
    orbMove: function(e, pX, pY) {
        if(e.id == 0) {
            var distX = pX - this.selectedOrb.orbSprite.x;
            var distY = pY - this.selectedOrb.orbSprite.y;

            var deltaRow = 0;
            var deltaCol = 0;

            if(Math.abs(distX) > gameOptions.orbSize / 2) {
                if(distX > 0) {
                    deltaCol = 1;
                } else {
                    deltaCol = -1;
                }
            } else {
                if(Math.abs(distY) > gameOptions.orbSize / 2) {
                    if(distY > 0) {
                        deltaRow = 1;
                    } else {
                        deltaRow = -1;
                    }
                }
            }

            if(deltaRow + deltaCol != 0) {
                var pickedOrb = this.gemAt(this.getOrbRow(this.selectedOrb) + deltaRow, this.getOrbCol(this.selectedOrb) + deltaCol);

                if(pickedOrb != -1) {
                    this.selectedOrb.orbSprite.scale.setTo(1);
                    this.swapOrbs(this.selectedOrb, pickedOrb, true);

                    game.input.deleteMoveCallback(this.orbMove, this);
                }
            }
        }
    },
    swapOrbs: function(orb1, orb2, swapBack) {
        this.canPick = false;

        var fromColor = orb1.orbColor;
        var fromSprite = orb1.orbSprite;
        var toColor = orb2.orbColor;
        var toSprite = orb2.orbSprite;

        this.gameArray[this.getOrbRow(orb1)][this.getOrbCol(orb1)].orbColor = toColor;
        this.gameArray[this.getOrbRow(orb1)][this.getOrbCol(orb1)].orbSprite = toSprite;
        this.gameArray[this.getOrbRow(orb2)][this.getOrbCol(orb2)].orbColor = fromColor;
        this.gameArray[this.getOrbRow(orb2)][this.getOrbCol(orb2)].orbSprite = fromSprite;

        var orb1Tween = game.add.tween(this.gameArray[this.getOrbRow(orb1)][this.getOrbCol(orb1)].orbSprite).to({
            x: this.getOrbCol(orb1) * gameOptions.orbSize + gameOptions.orbSize / 2,
            y: this.getOrbRow(orb1) * gameOptions.orbSize + gameOptions.orbSize / 2
        }, gameOptions.swapSpeed, Phaser.Easing.Linear.None, true);

        var orb2Tween = game.add.tween(this.gameArray[this.getOrbRow(orb2)][this.getOrbCol(orb2)].orbSprite).to({
            x: this.getOrbCol(orb2) * gameOptions.orbSize + gameOptions.orbSize / 2,
            y: this.getOrbRow(orb2) * gameOptions.orbSize + gameOptions.orbSize / 2
        }, gameOptions.swapSpeed, Phaser.Easing.Linear.None, true);

        orb2Tween.onComplete.add(function() {
            if(!this.matchInBoard() && swapBack) {
                this.swapOrbs(orb1, orb2, false);
            } else {
                if(this.matchInBoard()) {
                    this.handleMatches();
                } else {
                    this.canPick = true;
                    this.selectedOrb = null;
                }
            }
        }, this);
    },
    areNext: function(orb1, orb2) {
        return Math.abs(this.getOrbRow(orb1) - this.getOrbRow(orb2)) + Math.abs(this.getOrbCol(orb1) - this.getOrbCol(orb2)) == 1;
    },
    areTheSame: function(orb1, orb2) {
        return this.getOrbRow(orb1) == this.getOrbRow(orb2) && this.getOrbCol(orb1) == this.getOrbCol(orb2);
    },
    gemAt: function(row, col) {
        if(row < 0 || row >= gameOptions.fieldSize || col < 0 || col >= gameOptions.fieldSize) {
            return -1;
        }

        return this.gameArray[row][col];
    },
    getOrbRow: function(orb) {
        return Math.floor(orb.orbSprite.y / gameOptions.orbSize);
    },
    getOrbCol: function(orb) {
        return Math.floor(orb.orbSprite.x / gameOptions.orbSize);
    },
    isHorizontalMatch: function(row, col) {
        return this.gemAt(row, col).orbColor == this.gemAt(row, col - 1).orbColor && this.gemAt(row, col).orbColor == this.gemAt(row, col - 2).orbColor;
    },
    isVerticalMatch: function(row, col) {
        return this.gemAt(row, col).orbColor == this.gemAt(row - 1, col).orbColor && this.gemAt(row, col).orbColor == this.gemAt(row - 2, col).orbColor;
    },
    isMatch: function(row, col) {
        return this.isHorizontalMatch(row, col) || this.isVerticalMatch(row, col);
    },
    matchInBoard: function() {
        for (var i = 0; i < gameOptions.fieldSize; i++) {
            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(this.isMatch(i, j)) {
                    return true;
                }
            }
        }

        return false;
    },
    handleMatches: function() {
        this.removeMap = [];

        for (var i = 0; i < gameOptions.fieldSize; i++) {
            this.removeMap[i] = [];

            for (var j = 0; j < gameOptions.fieldSize; j++) {
                this.removeMap[i].push(0);
            }
        }

        this.handleHorizontalMatches();
        this.handleVerticalMatches();
        this.destroyOrbs();
    },
    handleVerticalMatches: function() {
        for (var i = 0; i < gameOptions.fieldSize; i++) {
            var colorStreak = 1;
            var currentColor = -1;
            var startStreak = 0;

            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(this.gemAt(j, i).orbColor == currentColor) {
                    colorStreak++;
                }

                if(this.gemAt(j, i).orbColor != currentColor || j == gameOptions.fieldSize - 1) {
                    if(colorStreak >= 3) {
                        for (var k = 0; k < colorStreak; k++) {
                            this.removeMap[startStreak + k][i]++;
                        }
                    }

                    startStreak = j;
                    colorStreak = 1;
                    currentColor = this.gemAt(j, i).orbColor;
                }
            }
        }
    },
    handleHorizontalMatches: function() {
        for (var i = 0; i < gameOptions.fieldSize; i++) {
            var colorStreak = 1;
            var currentColor = -1;
            var startStreak = 0;

            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(this.gemAt(i, j).orbColor == currentColor) {
                    colorStreak++;
                }

                if(this.gemAt(i, j).orbColor != currentColor || j == gameOptions.fieldSize - 1) {
                    if(colorStreak >= 3) {
                        for (var k = 0; k < colorStreak; k++) {
                            this.removeMap[i][startStreak + k]++;
                        }
                    }

                    startStreak = j;
                    colorStreak = 1;
                    currentColor = this.gemAt(i, j).orbColor;
                }
            }
        }
    },
    destroyOrbs: function() {
        var destroyed = 0;

        for (var i = 0; i < gameOptions.fieldSize; i++) {
            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(this.removeMap[i][j] > 0) {
                    var destroyTween = game.add.tween(this.gameArray[i][j].orbSprite).to({
                        alpha: 0
                    }, gameOptions.destroySpeed, Phaser.Easing.Linear.None, true);

                    destroyed++;

                    destroyTween.onComplete.add(function(orb) {
                        orb.destroy();

                        destroyed--;
                        if(destroyed == 0) {
                            this.makeOrbsFall();
                            if(gameOptions.fastFall) {
                                this.replenishField();
                            }
                        }
                    }, this);

                    this.gameArray[i][j] = null;
                }
            }
        }
    },
    makeOrbsFall: function() {
        var fallen = 0;
        var restart = false;

        for (var i = gameOptions.fieldSize - 2; i >= 0; i--) {
            for (var j = 0; j < gameOptions.fieldSize; j++) {
                if(this.gameArray[i][j] != null) {
                    var fallTiles = this.holesBelow(i, j);

                    if(fallTiles > 0) {
                        if(!gameOptions.fastFall && fallTiles > 1) {
                            fallTiles = 1;
                            restart = true;
                        }

                        var orb2Tween = game.add.tween(this.gameArray[i][j].orbSprite).to({
                            y: this.gameArray[i][j].orbSprite.y + fallTiles * gameOptions.orbSize
                        }, gameOptions.fallSpeed, Phaser.Easing.Linear.None, true);

                        fallen++;

                        orb2Tween.onComplete.add(function() {
                            fallen--;

                            if(fallen == 0) {
                                if(restart) {
                                    this.makeOrbsFall();
                                } else {
                                    if(!gameOptions.fastFall) {
                                        this.replenishField();
                                    }
                                }
                            }
                        }, this);

                        this.gameArray[i + fallTiles][j] = {
                            orbSprite: this.gameArray[i][j].orbSprite,
                            orbColor: this.gameArray[i][j].orbColor
                        };

                        this.gameArray[i][j] = null;
                    }
                }
            }
        }

        if(fallen == 0) {
            this.replenishField();
        }
    },
    replenishField: function() {
        var replenished = 0;
        var restart = false;

        for (var j = 0; j < gameOptions.fieldSize; j++) {
            var emptySpots = this.holesInCol(j);

            if(emptySpots > 0) {
                if(!gameOptions.fastFall && emptySpots > 1) {
                    emptySpots = 1;
                    restart = true;
                }

                for (var i = 0; i < emptySpots; i++) {
                    var orb = game.add.sprite(gameOptions.orbSize * j + gameOptions.orbSize / 2, - (gameOptions.orbSize *(emptySpots - 1 - i) + gameOptions.orbSize / 2), "orbs");
                    orb.anchor.set(0.5);
                    this.orbGroup.add(orb);

                    var randomColor = game.rnd.between(0, gameOptions.orbColors - 1);
                    orb.frame = randomColor;

                    this.gameArray[i][j] = {
                        orbColor: randomColor,
                        orbSprite: orb
                    };

                    var orb2Tween = game.add.tween(this.gameArray[i][j].orbSprite).to({
                        y: gameOptions.orbSize * i + gameOptions.orbSize / 2
                    }, gameOptions.fallSpeed, Phaser.Easing.Linear.None, true);

                    replenished++;

                    orb2Tween.onComplete.add(function() {
                        replenished--;

                        if(replenished == 0) {
                            if(restart) {
                                this.makeOrbsFall();
                            } else {
                                if(this.matchInBoard()) {
                                    game.time.events.add(250, this.handleMatches, this);
                                } else {
                                    this.canPick = true;
                                    this.selectedOrb = null;
                                }
                            }
                        }
                    }, this);
                }
            }
        }
    },
    holesBelow: function(row, col) {
        var result = 0;

        for (var i = row + 1; i < gameOptions.fieldSize; i++) {
            if(this.gameArray[i][col] == null) {
                result++;
            }
        }

        return result;
    },
    holesInCol: function(col) {
        var result = 0;

        for (var i = 0; i < gameOptions.fieldSize; i++) { 
            if(this.gameArray[i][col] == null) {
                result++;
            }
        }

        return result;
    }
};