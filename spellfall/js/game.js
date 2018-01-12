var game;

var gameOptions = {
    gameWidth: 300,
    gameHeight: 300,
    tileSize: 50,
    fieldSize: 6,
    tileTypes: 6,
    pickedZoom: 1.1
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("PreloadGame", PreloadGame);
    game.state.add("TheGame", TheGame);
    game.state.start("PreloadGame");
};

var PreloadGame = function(){};
PreloadGame.prototype = {
    preload: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        game.load.spritesheet("tiles", "assets/sprites/tiles.png", gameOptions.tileSize, gameOptions.tileSize);
    },
    create: function() {
        game.state.start("TheGame");
    }
};

var TheGame = function(){};
TheGame.prototype = {
    create: function() {
        this.tileTween = game.add.tween();

        this.tileTween.onComplete.add(function() {
            this.tileGroup.add(this.tileArray[this.landingRow][this.landingCol]);
            game.input.onDown.add(this.pickTile, this);
            var temp = this.tileArray[this.landingRow][this.landingCol];
            this.tileArray[this.landingRow][this.landingCol] = this.tileArray[this.movingRow][this.movingCol];
            this.tileArray[this.movingRow][this.movingCol] = temp;
        }, this);

        this.dragging = false;

        this.tileArray = [];

        this.tileGroup = game.add.group();
        this.movingTileGroup = game.add.group();

        for (var i = 0; i < gameOptions.fieldSize; i++) {
            this.tileArray[i] = [];
            for (var j = 0; j < gameOptions.fieldSize; j++) {
                var randomTile = game.rnd.integerInRange(0, gameOptions.tileTypes - 1);
                var theTile = game.add.sprite(j * gameOptions.tileSize + gameOptions.tileSize / 2, i * gameOptions.tileSize + gameOptions.tileSize / 2, "tiles", randomTile);
                theTile.anchor.setTo(0.5);
                this.tileArray[i][j] = theTile;
                this.tileGroup.add(theTile);
            }
        }

        game.input.onDown.add(this.pickTile, this);
    },
    pickTile: function(e) {
        this.startX = e.position.x;
        this.startY = e.position.y;

        this.movingRow = Math.floor(this.startY / gameOptions.tileSize);
        this.movingCol = Math.floor(this.startX / gameOptions.tileSize);

        this.movingTileGroup.add(this.tileArray[this.movingRow][this.movingCol]);

        this.tileArray[this.movingRow][this.movingCol].width = gameOptions.tileSize * gameOptions.pickedZoom;
        this.tileArray[this.movingRow][this.movingCol].height = gameOptions.tileSize * gameOptions.pickedZoom;

        this.dragging = true;

        game.input.onDown.remove(this.pickTile, this);
        game.input.onUp.add(this.releaseTile, this);
    },
    releaseTile: function(e) {
        game.input.onUp.remove(this.releaseTile, this);

        this.tileGroup.add(this.tileArray[this.movingRow][this.movingCol]);

        this.landingRow = Math.floor(this.tileArray[this.movingRow][this.movingCol].y / gameOptions.tileSize);
        this.landingCol = Math.floor(this.tileArray[this.movingRow][this.movingCol].x / gameOptions.tileSize);

        this.tileArray[this.movingRow][this.movingCol].width = gameOptions.tileSize;
        this.tileArray[this.movingRow][this.movingCol].height = gameOptions.tileSize;

        this.tileArray[this.movingRow][this.movingCol].x = this.landingCol * gameOptions.tileSize + gameOptions.tileSize / 2;
        this.tileArray[this.movingRow][this.movingCol].y = this.landingRow * gameOptions.tileSize + gameOptions.tileSize / 2;

        if(this.movingRow != this.landingRow || this.movingCol != this.landingCol) {
            this.movingTileGroup.add(this.tileArray[this.landingRow][this.landingCol]);

            this.tileTween.target = this.tileArray[this.landingRow][this.landingCol];
            this.tileTween.timeline = [];

            this.tileTween.to({
                x: this.movingCol * gameOptions.tileSize + gameOptions.tileSize / 2,
                y: this.movingRow * gameOptions.tileSize + gameOptions.tileSize / 2
            }, 800, Phaser.Easing.Cubic.Out);

            this.tileTween.start();
        } else {
            game.input.onDown.add(this.pickTile, this);
        }

        this.dragging = false;
    },
    update: function() {
        if(this.dragging) {
            var distX = game.input.worldX - this.startX;
            var distY = game.input.worldY - this.startY;

            this.tileArray[this.movingRow][this.movingCol].x = this.movingCol * gameOptions.tileSize + gameOptions.tileSize / 2 + distX;
            this.tileArray[this.movingRow][this.movingCol].y = this.movingRow * gameOptions.tileSize + gameOptions.tileSize / 2 + distY;
        }
    }
};