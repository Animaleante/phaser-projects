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
    colors: ["0xffffff", "0xff0000", "0x00ff00", "0x0000ff", "0xffff00"],
    localStorageName: "levelselect"
};

var curLevel = 0;
var stars = [];

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight, Phaser.AUTO, "");
    game.state.add("TheGame", TheGame);
    game.state.add("TheLevel", TheLevel);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.load.spritesheet("levelthumb", "assets/sprites/levelthumb2.png", 60, 60);
        game.load.image("levelpages", "assets/sprites/levelpages.png");
        game.load.image("transp", "assets/sprites/transp.png");
    },
    create: function() {
        this.canChangePage = true;

        stars[0] = 0;

        for (var l = 1; l < gameOptions.rows * gameOptions.colors.length; l++) {
            stars[l] = -1;
        }

        this.savedData = localStorage.getItem(gameOptions.localStorageName) == null ? stars.toString() : localStorage.getItem(gameOptions.localStorageName);

        stars = this.savedData.split(",");
        
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
                    thumb.frame = parseInt(stars[thumb.levelNumber]) + 1;
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

        this.scrollingMap.events.onDragStart.add(function(event, pointer) {
            this.scrollingMap.startPointerPosition = new Phaser.Point(pointer.x, pointer.y);
            this.scrollingMap.startPosition = this.scrollingMap.x;
        }, this);

        this.scrollingMap.events.onDragStop.add(function(event, pointer) {
            if(this.scrollingMap.startPosition == this.scrollingMap.x && this.scrollingMap.startPointerPosition.x == pointer.x && this.scrollingMap.startPointerPosition.y == pointer.y) {
                for (var i = 0; i < this.scrollingMap.children.length; i++) {
                    var bounds = this.scrollingMap.children[i].getBounds();
                    if(bounds.contains(pointer.x, pointer.y)) {
                        if(this.scrollingMap.children[i].frame > 0) {
                            curLevel = this.scrollingMap.children[i].levelNumber;
                            game.state.start("TheLevel");
                        } else {
                            var buttonTween = game.add.tween(this.scrollingMap.children[i]);
                            buttonTween.to({
                                x: this.scrollingMap.children[i].x + gameOptions.thumbWidth / 15
                            }, 20, Phaser.Easing.Cubic.None);
                            buttonTween.to({
                                x: this.scrollingMap.children[i].x - gameOptions.thumbWidth / 15
                            }, 20, Phaser.Easing.Cubic.None);
                            buttonTween.to({
                                x: this.scrollingMap.children[i].x + gameOptions.thumbWidth / 15
                            }, 20, Phaser.Easing.Cubic.None);
                            buttonTween.to({
                                x: this.scrollingMap.children[i].x - gameOptions.thumbWidth / 15
                            }, 20, Phaser.Easing.Cubic.None);
                            buttonTween.to({
                                x: this.scrollingMap.children[i].x
                            }, 20, Phaser.Easing.Cubic.None);
                            buttonTween.start();
                        }
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
        if(this.canChangePage) {
            this.canChangePage = false;
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
            tween.onComplete.add(function() {
                this.canChangePage = true;
            }, this);
        }
    }
};

var TheLevel = function(){};

TheLevel.prototype = {
    create: function() {
        game.add.text(game.width / 2, 20, "Play level " + curLevel.toString(), {font: "32px Arial", fill: "#ffffff"})
            .anchor.set(0.5);

        var failLevel = game.add.text(20, 60, "Fail level", {font: "48px Arial", fill: "#ff0000"});
        failLevel.inputEnabled = true;
        failLevel.events.onInputDown.add(function() {
            game.state.start("TheGame");
        }, this);

        var oneStartLevel = game.add.text(20, 160, "Get 1 star", {font: "48px Arial", fill: "#ff8800"});
        oneStartLevel.inputEnabled = true;
        oneStartLevel.events.onInputDown.add(function() {
            stars[curLevel] = Math.max(stars[curLevel], 1);

            if(stars[curLevel + 1] != undefined && stars[curLevel + 1] == -1) {
                stars[curLevel + 1] = 0;
            }

            localStorage.setItem(gameOptions.localStorageName, stars.toString());
            game.state.start("TheGame");
        }, this);

        var twoStarLevel = game.add.text(20, 260, "Get 2 stars", {font: "48px Arial", fill: "#ffff00"});
        twoStarLevel.inputEnabled = true;
        twoStarLevel.events.onInputDown.add(function() {
            stars[curLevel] = Math.max(stars[curLevel], 2);

            if(stars[curLevel + 1] != undefined && stars[curLevel + 1] == -1) {
                stars[curLevel + 1] = 0;
            }

            localStorage.setItem(gameOptions.localStorageName, stars.toString());
            game.state.start("TheGame");
        }, this);

        var threeStarLevel = game.add.text(20, 360, "Get 3 stars", {font: "48px Arial", fill: "#00ff00"});
        threeStarLevel.inputEnabled = true;
        threeStarLevel.events.onInputDown.add(function() {
            stars[curLevel] = Math.max(stars[curLevel], 3);

            if(stars[curLevel + 1] != undefined && stars[curLevel + 1] == -1) {
                stars[curLevel + 1] = 0;
            }

            localStorage.setItem(gameOptions.localStorageName, stars.toString());
            game.state.start("TheGame");
        }, this);
    }
};