var game;

var gameOptions = {
    gameWidth: 320,
    gameHeight: 480,
    columns: 3,
    // rows: 5,
    rows: 4,
    thumbWidth: 60,
    thumbHeight: 60,
    spacing: 20,
    // colors: ["0xac81bd","0xff5050","0xdab5ff","0xb5ffda","0xfffdd0","0xcc0000","0x54748b","0x4b0082","0x80ab2f","0xff784e","0xe500db","0x223c4a","0x223c4a","0xf1290e","0x648080","0xbbc1c4","0x6f98a2","0x71717e"]
    colors: ["0xffffff", "0xff0000", "0x00ff00", "0x0000ff", "0xffff00"]
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight, Phaser.AUTO, "");
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.load.image("levelthumb", "assets/sprites/levelthumb.png");
        game.load.image("levelpages", "assets/sprites/levelpages.png");
        game.load.image("transp", "assets/sprites/transp.png");
    },
    create: function() {
        // game.stage.backgroundColor = "#000044";
        game.stage.backgroundColor = "#222222";

        this.pageText = game.add.text(game.width / 2, 16, "Swipe to select level page (' / " + gameOptions.colors.length + ")", {font: "18px Arial", fill: "#ffffff"});
        this.pageText.anchor.set(0.5);

        this.scrollingMap = game.add.tileSprite(0, 0, gameOptions.colors.length * game.width, game.height, "transp");
        this.scrollingMap.inputEnabled = true;
        this.scrollingMap.input.enableDrag(false);
        this.scrollingMap.input.allowVerticalDrag = false;
        this.scrollingMap.input.boundsRect = new Phaser.Rectangle(game.width - this.scrollingMap.width, game.height - this.scrollingMap.height, this.scrollingMap.width * 2 - game.width, this.scrollingMap.height * 2 - game.height);

        this.currentPage = 0;

        this.pageSelectors = [];

        var rowLength = gameOptions.thumbWidth * gameOptions.columns + gameOptions.spacing * (gameOptions.columns - 1);
        var leftMargin = (game.width - rowLength) / 2;
        var colHeight = gameOptions.thumbHeight * gameOptions.rows + gameOptions.spacing * (gameOptions.rows - 1);
        var topMargin = (game.height - colHeight) / 2;

        for (var k = 0; k < gameOptions.colors.length; k++) {
            for (var i = 0; i < gameOptions.columns; i++) {
                for (var j = 0; j < gameOptions.rows; j++) {
                    var thumb = game.add.image(k * game.width + leftMargin + i * (gameOptions.thumbWidth + gameOptions.spacing), topMargin + j * (gameOptions.thumbHeight + gameOptions.spacing), "levelthumb");
                    thumb.tint = gameOptions.colors[k];

                    thumb.levelNumber = k * (gameOptions.rows * gameOptions.columns) + j * gameOptions.columns + i;
                    var levelText = game.add.text(0,0, thumb.levelNumber, {font: "24px Arial", fill: "#000000"});
                    thumb.addChild(levelText);

                    this.scrollingMap.addChild(thumb);
                }
            }

            this.pageSelectors[k] = game.add.button(game.width / 2 + (k - Math.floor(gameOptions.colors.length / 2) + 0.5 * (1 - gameOptions.colors.length % 2)) * 40, game.height - 40, "levelpages", function(e) {
                var difference = e.pageIndex - this.currentPage;
                this.changePage(difference);
            }, this);

            this.pageSelectors[k].anchor.set(0.5);
            this.pageSelectors[k].pageIndex = k;
            this.pageSelectors[k].tint = gameOptions.colors[k];

            if(k == this.currentPage) {
                this.pageSelectors[k].height = 30;

            } else {
                this.pageSelectors[k].height = 15;
            }
        }

        this.scrollingMap.events.onDragStart.add(function() {
            this.scrollingMap.startPosition = this.scrollingMap.x;
        }, this);

        this.scrollingMap.events.onDragStop.add(function(event, pointer) {
            if(this.scrollingMap.startPosition == this.scrollingMap.x) {
                for (var i = 0; i < this.scrollingMap.children.length; i++) {
                    var bounds = this.scrollingMap.children[i].getBounds();
                    if(bounds.contains(pointer.x, pointer.y)) {
                        alert("Play Level: " + this.scrollingMap.children[i].levelNumber);
                        break;
                    }
                }
            } else {
                if(this.scrollingMap.startPosition - this.scrollingMap.x > game.width / 8) {
                    this.changePage(1);
                } else {
                    if(this.scrollingMap.startPosition - this.scrollingMap.x < -game.width / 8) {
                        this.changePage(-1);
                    } else {
                        this.changePage(0);
                    }
                }
            }
        }, this);
    },
    changePage: function(page) {
        this.currentPage += page;

        for (var k = 0; k < gameOptions.colors.length; k++) {
            if(k == this.currentPage) {
                this.pageSelectors[k].height = 30;
            } else {
                this.pageSelectors[k].height = 15;
            }
        }

        this.pageText.text = "Swipe to select level page (" + (this.currentPage + 1).toString() + " / " + gameOptions.colors.length + ")";
        var tween = game.add.tween(this.scrollingMap).to({
            x: this.currentPage * -game.width
        }, 300, Phaser.Easing.Cubic.Out, true);
    }
};