var game;

var gameOptions = {
    gameWidth: 640,
    tileColors: [0x00ff00, 0x00aa00],
    verticalTiles: 9
};

window.onload = function() {
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;

    if(windowWidth > windowHeight) {
        windowHeight = windowWidth * 1.8;
    }

    var gameHeight = windowHeight * gameOptions.gameWidth / windowWidth;

    game = new Phaser.Game(gameOptions.gameWidth, gameHeight);
    game.state.add("PreloadGame", PreloadGame);
    game.state.add("TheGame", TheGame);
    game.state.start("PreloadGame");
};

var PreloadGame = function(){};
PreloadGame.prototype = {
    preload: function() {
        // game.stage.backgroundColor = "#ccc";
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        game.load.image("tile", "assets/sprites/tile.png");
        game.load.image("hero", "assets/sprites/hero.png");
        game.load.image("hole", "assets/sprites/hole.png");
    },
    create: function() {
        game.state.start("TheGame");
    }
};

var TheGame = function(){};
TheGame.prototype = {
    create: function() {
        this.moves = 0;
        this.tileSize = game.height / gameOptions.verticalTiles;

        var placedTiles = 0;
        var offsetX = (game.width  -this.tileSize * 3) / 2;

        this.holePool = [];
        this.tileArray = [];
        this.tileGroup = game.add.group();
        this.tileGroup.x = offsetX;

        this.tileTween = game.add.tween(this.tileGroup).to({
            y: this.tileSize
        }, 100, Phaser.Easing.Linear.None);

        this.tileTween.onComplete.add(function() {
            this.tileGroup.y = 0;

            this.tileGroup.forEach(function(child) {
                child.y += this.tileSize;
            }, this);

            var bottomIndex = this.moves % this.tileArray.length;

            for (var i = 0; i < 3; i++) {
                this.tileArray[bottomIndex][i].tileSprite.y -= (gameOptions.verticalTiles + 1) * this.tileSize;

                if(this.tileArray[bottomIndex][i].holeSprite != null) {
                    this.tileArray[bottomIndex][i].holeSprite.kill();
                    this.holePool.push(this.tileArray[bottomIndex][i].holeSprite);
                    this.tileArray[bottomIndex][i].holeSprite = null;
                }
            }

            this.placeHoles(bottomIndex, this.tileArray[bottomIndex][0].tileSprite.y);

            this.moves++;

            if(this.tileArray[(this.moves + 2) % this.tileArray.length][this.heroColumn].holeSprite != null) {
                game.state.start("TheGame");
            }
        }, this);

        for (var i = 0; i < gameOptions.verticalTiles + 1; i++) {
            this.tileArray[i] = [];

            for (var j = 0; j < 3; j++) {
                var tile = game.add.sprite(j * this.tileSize, game.height - i * this.tileSize, "tile");
                tile.anchor.set(0,1);
                tile.width = this.tileSize;
                tile.height = this.tileSize;
                tile.tint = gameOptions.tileColors[placedTiles % 2];

                this.tileGroup.add(tile);
                this.tileArray[i][j] = {
                    tileSprite: tile,
                    holeSprite: null
                };

                placedTiles++;
            }

            if(i > 4) {
                this.placeHoles(i, game.height - i * this.tileSize);
            }
        }

        this.heroColumn = 1;
        this.heroCanMove = true;

        this.hero = game.add.sprite(this.tileGroup.x + this.tileSize, game.height - 2 * this.tileSize, "hero");
        this.hero.width = this.tileSize;
        this.hero.height = this.tileSize;
        this.hero.anchor.set(0,1);

        this.heroTween = game.add.tween(this.hero);

        this.heroTween.onComplete.add(function(){
            this.heroCanMove = true;
            this.hero.x = this.tileGroup.x + this.tileSize * this.heroColumn;
            this.heroWrap.visible = false;
        }, this);

        this.heroWrap = game.add.sprite(this.tileGroup.x + this.tileSize, game.height - 2 * this.tileSize, "hero");
        this.heroWrap.width = this.tileSize;
        this.heroWrap.height = this.tileSize;
        this.heroWrap.anchor.set(0,1);
        this.heroWrap.visible = false;
        this.heroWrapTween = game.add.tween(this.heroWrap);

        var mask = game.add.graphics(this.tileGroup.x, this.tileGroup.y);
        mask.beginFill(0xffffff);
        mask.drawRect(0,0,this.tileSize * 3, game.height);
        this.hero.mask = mask;
        this.heroWrap.mask = mask;

        game.input.onDown.add(this.moveHero, this);
    },
    moveHero: function(e) {
        if(this.heroCanMove) {
            this.tileTween.start();

            this.heroCanMove = false;

            var direction = e.position.x < game.width / 2 ? -1 : 1;
            var nextColumn = Phaser.Math.wrap(this.heroColumn + direction, 0, 3);

            this.heroTween.timeline = [];

            this.heroTween.to({
                x: this.hero.x + this.tileSize * direction
            }, 100, Phaser.Easing.Cubic.InOut, true);

            if(Math.abs(nextColumn - this.heroColumn) != 1) {
                this.heroWrap.visible = true;
                this.heroWrap.x = nextColumn == 0 ? this.tileGroup.x - this.tileSize : this.tileGroup.x + 3 * this.tileSize;

                this.heroWrapTween.timeline = [];
                this.heroWrapTween.to({
                    x: this.heroWrap.x + this.tileSize * direction
                }, 100, Phaser.Easing.Cubic.InOut, true);
            }

            this.heroColumn = nextColumn;
        }
    },
    placeHoles: function(row, posY) {
        if(game.rnd.integerInRange(0,1) == 0) {
            var holeSpot = game.rnd.integerInRange(0,2);
            var hole;

            if(this.holePool.length > 0) {
                hole = this.holePool.pop();
                hole.x = holeSpot * this.tileSize;
                hole.y = posY;
                hole.revive();
            } else {
                hole = game.add.sprite(holeSpot * this.tileSize, posY, 'hole');
                hole.anchor.set(0,1);
                hole.width = this.tileSize;
                hole.height = this.tileSize;
                this.tileGroup.add(hole);
            }

            this.tileArray[row][holeSpot].holeSprite = hole;
        }
    }
};