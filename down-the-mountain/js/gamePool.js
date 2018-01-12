var game;

var gameOptions = {
    gameWidth: 480,
    gameHeight: 480,
    hexagonWidth: 70,
    hexagonHeight: 80,
    gridSizeX: 5,
    gridSizeY: 14/*,
    minRow: 0*/
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        game.load.image("hexagon", "assets/sprites/hexagon.png");
        game.load.spritesheet("marker", "assets/sprites/marker2.png", 56, 64);
    },
    create: function() {
        game.stage.backgroundColor = "#ffffff";

        this.playerCol = 2;
        this.playerRow = 0;
        this.playerMove = true;

        this.hexagonPool = [];
        this.hexagonGroup = game.add.group();
        for (var i = 0; i < gameOptions.gridSizeY; i++) {
            this.addHexagonRow(i);
        }

        this.hexagonGroup.x = (game.width - gameOptions.hexagonWidth * gameOptions.gridSizeX) / 2;
        this.hexagonGroup.y = 20;

        this.marker = game.add.sprite(this.hexagonGroup.width / 2, 6, "marker");
        this.marker.anchor.set(0.5);
        this.hexagonGroup.add(this.marker);

        game.input.onDown.add(function(e) {
            if(this.playerMove) {
                if(e.x < (game.width / 2) && (this.playerCol > 0 || (this.playerRow % 2 == 1))) {
                    this.placeMarker(this.playerCol - (1 - this.playerRow % 2), this.playerRow + 1);
                    this.marker.frame = 0;
                } else if(e.x >= (game.width / 2) && this.playerCol < gameOptions.gridSizeX - 1) {
                    this.placeMarker(this.playerCol + (this.playerRow % 2), this.playerRow + 1);
                    this.marker.frame = 1;
                }
            }
        }, this);
    },
    update: function() {
        if(this.marker.world.y > 60) {
            var distance = 60 - this.marker.world.y;
            this.hexagonGroup.y += distance / 25;
        }

        this.hexagonGroup.forEach(function(item) {
            if(item.world.y < 0) {
                item.y += gameOptions.hexagonHeight * (gameOptions.gridSizeY * 3 / 4);
                item.row += gameOptions.gridSizeY;
                item.children[0].text = item.row + "," + item.col;
            }
        }, this);
    },
    addHexagonRow: function(i) {
        for (var j = 0; j < gameOptions.gridSizeX - i % 2; j++) {
            var hexagonX = gameOptions.hexagonWidth * j + (gameOptions.hexagonWidth / 2) * (i % 2);
            var hexagonY = gameOptions.hexagonHeight * i  / 4 * 3;
            var hexagon = game.add.sprite(hexagonX, hexagonY, "hexagon");
            hexagon.row = i;
            hexagon.col = j;

            var hexagonText = game.add.text(0 + gameOptions.hexagonWidth / 3 + 5, 15, i+","+j, {
                font: "bold 10px Arial"
            });
            hexagonText.align = "center";
            hexagon.addChild(hexagonText);

            this.hexagonGroup.add(hexagon);
        }
    },
    placeMarker: function(posX, posY) {
        this.playerRow = posY;
        this.playerCol = posX;

        var nextX = gameOptions.hexagonWidth * (2 * posX + 1 + posY % 2) / 2;
        var nextY = gameOptions.hexagonHeight * (3 * posY + 1) / 4 - 14;

        this.playerMove = false;

        var bezierX = gameOptions.hexagonWidth;
        if(this.marker.x > nextX) {
            bezierX *= -1;
        }

        var playerTween = game.add.tween(this.marker).to({
            x: [this.marker.x, this.marker.x + bezierX, nextX, nextX],
            y: [this.marker.y, this.marker.y,  nextY, nextY]
        }, 100, Phaser.Easing.Linear.None, true).interpolation(function(v, k) {
            return Phaser.Math.bezierInterpolation(v,k);
        });

        playerTween.onComplete.add(function() {
            this.playerMove = true;
        }, this);

        this.marker.bringToTop();
    }
};