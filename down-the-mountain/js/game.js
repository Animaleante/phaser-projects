var game;

var gameOptions = {
    gameWidth: 480,
    gameHeight: 480,
    hexagonWidth: 70,
    hexagonHeight: 80,
    gridSizeX: 9,
    gridSizeY: 7
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

        this.hexagonGroup = game.add.group();

        this.hexagonArray = [];
        for (var i = 0; i < gameOptions.gridSizeY/2; i++) {
            this.hexagonArray[i] = [];
            for (var j = 0; j < gameOptions.gridSizeX; j++) {
                if(gameOptions.gridSizeY % 2 == 0 || i+1 < gameOptions.gridSizeY / 2 || j % 2 == 0) {
                    var hexagonX = gameOptions.hexagonWidth * j / 2;
                    var hexagonY = gameOptions.hexagonHeight * i * 1.5 + (gameOptions.hexagonHeight / 4 * 3) * (j % 2);
                    var hexagon = game.add.sprite(hexagonX, hexagonY, "hexagon");

                    this.hexagonGroup.add(hexagon);
                    this.hexagonArray[i][j] = hexagon;

                    var hexagonText = game.add.text(hexagonX + gameOptions.hexagonWidth / 3 + 5, hexagonY + 15, i+","+j, {
                        font: "bold 12px Arial" // It seems bold is the default when setting font config by line
                    });
                    // hexagonText.font = "arial";
                    // hexagonText.fontSize = 12;
                    this.hexagonGroup.add(hexagonText);
                }
            }
        }

        this.hexagonGroup.x = (game.width - gameOptions.hexagonWidth * Math.ceil(gameOptions.gridSizeX / 2)) / 2;
        if(gameOptions.gridSizeX % 2 == 0) {
            this.hexagonGroup.x -= gameOptions.hexagonWidth / 4;
        }
        this.hexagonGroup.y = (game.height - Math.ceil(gameOptions.gridSizeY / 2) * gameOptions.hexagonHeight - Math.floor(gameOptions.gridSizeY / 2) * gameOptions.hexagonHeight / 2) / 2;
        if(gameOptions.gridSizeY % 2 == 0) {
            this.hexagonGroup.y -= gameOptions.hexagonHeight / 8;
        }

        this.marker = game.add.sprite(0,0,"marker");
        this.marker.anchor.set(0.5);
        this.marker.visible = false;
        this.hexagonGroup.add(this.marker);

        this.moveIndex = game.input.addMoveCallback(this.checkHex, this);
    },
    checkHex: function() {
        var candidateX = Math.floor((game.input.worldX - this.hexagonGroup.x) / this.sectorWidth);
        var candidateY = Math.floor((game.input.worldY - this.hexagonGroup.y) / this.sectorHeight);

        var deltaX = (game.input.worldX - this.hexagonGroup.x) % this.sectorWidth;
        var deltaY = (game.input.worldY - this.hexagonGroup.y) % this.sectorHeight;

        if(candidateY % 2 == 0) {
            if(deltaY < ((gameOptions.hexagonHeight / 4) - deltaX * this.gradient)) {
                candidateX--;
                candidateY--;
            }
            if(deltaY < ((-gameOptions.hexagonHeight / 4) + deltaX * this.gradient)) {
                candidateY--;
            }
        } else {
            if(deltaX >= gameOptions.hexagonWidth / 2) {
                if(deltaY < (gameOptions.hexagonHeight / 2 - deltaX * this.gradient)) {
                    candidateY--;
                }
            } else {
                if(deltaY < deltaX * this.gradient) {
                    candidateY--;
                } else {
                    candidateX--;
                }
            }
        }

        this.placeMarker(candidateX, candidateY);
    },
    placeMarker: function(posX, posY) {
        for (var i = 0; i < gameOptions.gridSizeY / 2; i++) {
            for (var j = 0; j < gameOptions.gridSizeX; j++) {
                if(gameOptions.gridSizeY % 2 == 0 || i + 1 < gameOptions.gridSizeY / 2 || j % 2 == 0) {
                    this.hexagonArray[i][j].tint = 0xffffff;
                }
            }
        }

        if(posX < 0 || posY < 0 || posY >= gameOptions.gridSizeY || posX > this.columns[posY%2] - 1) {
            this.marker.visible = false;
        } else {
            this.marker.visible = true;

            this.marker.x = gameOptions.hexagonWidth * posX;
            this.marker.y = gameOptions.hexagonHeight / 4 * 3 * posY + gameOptions.hexagonHeight / 2;

            if(posY % 2 == 0) {
                this.marker.x += gameOptions.hexagonWidth / 2;
            } else {
                this.marker.x += gameOptions.hexagonWidth;
            }

            var markerX = posX * 2 + posY % 2;
            var markerY = Math.floor(posY / 2);

            this.hexagonArray[markerY][markerX].tint = 0x00ff00;

            if(markerY + markerX % 2 < gameOptions.gridSizeY / 2 && (gameOptions.gridSizeY % 2 == 0 || markerY < Math.floor(gameOptions.gridSizeY / 2))) {
                if(markerX - 1 >= 0) {
                    this.hexagonArray[markerY + markerX % 2][markerX - 1].tint = 0xff0000;
                }
                if(markerX + 1 < gameOptions.gridSizeX) {
                    this.hexagonArray[markerY + markerX % 2][markerX + 1].tint = 0xff0000;
                }
            }
        }
    }
};