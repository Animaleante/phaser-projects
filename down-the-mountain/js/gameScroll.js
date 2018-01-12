var game;

var gameOptions = {
    gameWidth: 480,
    gameHeight: 480,
    hexagonWidth: 70,
    hexagonHeight: 80,
    gridSizeX: 5,
    gridSizeY: 9,
    playerCol: 2,
    playerRow: 0,
    minRow: 0
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.load.image("hexagon", "assets/sprites/hexagon.png");
        game.load.image("marker", "assets/sprites/marker.png");
    },
    create: function() {
        game.stage.backgroundColor = "#ffffff";

        this.sectorWidth = gameOptions.hexagonWidth;
        this.sectorHeight = gameOptions.hexagonHeight / 4 * 3;
        this.columns = [Math.ceil(gameOptions.gridSizeX / 2), Math.floor(gameOptions.gridSizeX / 2)];
        this.gradient = (gameOptions.hexagonHeight / 4) / (gameOptions.hexagonWidth / 2);
        this.cursors = game.input.keyboard.createCursorKeys();
        this.playerMove = true;

        this.hexagonGroup = game.add.group();
        this.hexagonArray = [];
        for (var i = 0; i < gameOptions.gridSizeY; i++) {
            this.addHexagonRow(i);
        }

        this.hexagonGroup.x = (game.width - gameOptions.hexagonWidth * gameOptions.gridSizeX) / 2;
        this.hexagonGroup.y = 20;

        this.marker = game.add.sprite(this.hexagonGroup.width / 2, 20, "marker");
        this.marker.anchor.set(0.5);
        this.hexagonGroup.add(this.marker);
    },
    addHexagonRow: function(i) {
        this.hexagonArray[i] = [];

        for (var j = 0; j < gameOptions.gridSizeX - i % 2; j++) {
            var hexagonX = gameOptions.hexagonWidth * j + (gameOptions.hexagonWidth / 2) * (i % 2);
            var hexagonY = gameOptions.hexagonHeight * i  / 4 * 3;
            var hexagon = game.add.sprite(hexagonX, hexagonY, "hexagon");

            var hexagonText = game.add.text(0 + gameOptions.hexagonWidth / 3 + 5, 15, i+","+j, {
                font: "bold 10px Arial"
            });
            hexagonText.align = "center";
            hexagon.addChild(hexagonText);

            this.hexagonGroup.add(hexagon);
            this.hexagonArray[i][j] = hexagon;
        }
    },
    update: function() {
        if(this.playerMove) {
            if(this.cursors.left.isDown && this.cursors.right.isUp && (gameOptions.playerCol > 0 || (gameOptions.playerRow % 2 == 1))) {
                this.placeMarker(gameOptions.playerCol - (1 - gameOptions.playerRow % 2), gameOptions.playerRow + 1);
            } else if(this.cursors.right.isDown && this.cursors.left.isUp && gameOptions.playerCol < gameOptions.gridSizeX - 1) {
                this.placeMarker(gameOptions.playerCol + (gameOptions.playerRow % 2), gameOptions.playerRow + 1);
            }

            if(gameOptions.gridSizeY - gameOptions.playerRow < 8) {
                this.addHexagonRow(gameOptions.gridSizeY);
                gameOptions.gridSizeY++;
            }
        }

        if(this.marker.world.y > 60) {
            this.hexagonGroup.y -= 1;
        }
        if(this.marker.world.y > 240) {
            this.hexagonGroup.y -= (this.marker.world.y - 240);
        }

        var destroyedRow = false;
        for (var i = gameOptions.minRow; i < gameOptions.gridSizeY; i++) {
            for (var j = 0; j < gameOptions.gridSizeX; j++) {
                if((i % 2 == 0 || j < gameOptions.gridSizeX - 1) && this.hexagonArray[i][j].world.y < 0) {
                    // this.hexagonArray[i][j].destroy();
                    var destroyTween = game.add.tween(this.hexagonArray[i][j]).to({
                        alpha: 0,
                        y: this.hexagonArray[i][j].y + gameOptions.hexagonHeight / 2
                    }, 200, Phaser.Easing.Quadratic.Out, true);
                    destroyTween.onComplete.add(function(e) {
                        e.destroy();
                    });
                    destroyedRow = true;
                }
            }
        }

        if(destroyedRow) {
            gameOptions.minRow++;
        }
    },
    placeMarker: function(posX, posY) {
        gameOptions.playerRow = posY;
        gameOptions.playerCol = posX;

        var nextX = gameOptions.hexagonWidth * (2 * posX + 1 + posY % 2) / 2;
        var nextY = gameOptions.hexagonHeight * (3 * posY + 1) / 4;

        this.playerMove = false;

        var bezierX = gameOptions.hexagonWidth;
        if(this.marker.x > nextX) {
            bezierX *= -1;
        }
        var playerTween = game.add.tween(this.marker).to({
            // x: nextX,
            // y: nextY
            x: [this.marker.x, this.marker.x + bezierX, nextX, nextX],
            y: [this.marker.y, this.marker.y,  nextY, nextY]
        // }, 500, Phaser.Easing.Quadratic.InOut, true);
        }, 500, Phaser.Easing.Quadratic.InOut, true).interpolation(function(v, k) {
            return Phaser.Math.bezierInterpolation(v,k);
        });

        playerTween.onComplete.add(function() {
            this.playerMove = true;
        }, this);

        this.marker.bringToTop();
    }
};