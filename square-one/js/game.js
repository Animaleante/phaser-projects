var game;

var gameOptions = {
    gameWidth: 320,
    gameHeight: 480,
    squareSize: 40,
    startingSquare: 2,
    moveTime: 250,
    squareColors: [0x888888, 0xaaaaaa]
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.load.image("square", "assets/sprites/square.png");
    },
    create: function() {
        this.terrainGroup = game.add.group();
        this.enemyGroup = game.add.group();

        for (var i = 0; i < game.width / gameOptions.squareSize + 2; i++) {
            var square = game.add.sprite(i * gameOptions.squareSize, game.height / 3 * 2, "square");
            square.anchor.set(0.5);
            square.tint = gameOptions.squareColors[i % 2];
            this.terrainGroup.add(square);
        }

        this.hero = game.add.sprite(gameOptions.startingSquare * gameOptions.squareSize, game.height / 3 * 2 - gameOptions.squareSize, "square");
        this.hero.anchor.set(0.5);
        this.hero.canMove = true;

        game.physics.enable(this.hero, Phaser.Physics.ARCADE);

        this.hero.body.moves = false;

        game.input.onDown.add(this.moveSquare, this);

        this.addEnemy();
    },
    moveSquare: function() {
        if(this.hero.canMove) {
            this.hero.canMove = false;

            switch(this.hero.angle) {
                case 0:
                    this.hero.x += gameOptions.squareSize / 2;
                    this.hero.y += gameOptions.squareSize / 2;
                    this.hero.pivot.x = gameOptions.squareSize / 2;
                    this.hero.pivot.y = gameOptions.squareSize / 2;
                    break;
                case 90:
                    this.hero.x += gameOptions.squareSize;
                    this.hero.pivot.x = gameOptions.squareSize / 2;
                    this.hero.pivot.y = -gameOptions.squareSize / 2;
                    break;
                case -180:
                    this.hero.x += gameOptions.squareSize;
                    this.hero.pivot.x = -gameOptions.squareSize / 2;
                    this.hero.pivot.y = -gameOptions.squareSize / 2;
                    break;
                case -90:
                    this.hero.x += gameOptions.squareSize;
                    this.hero.pivot.x = -gameOptions.squareSize / 2;
                    this.hero.pivot.y = gameOptions.squareSize / 2;
                    break;
            }

            var scrollTween = game.add.tween(this.terrainGroup).to({
                x: this.terrainGroup.x - gameOptions.squareSize
            }, gameOptions.moveTime, Phaser.Easing.Linear.None, true);

            var enemyTween = game.add.tween(this.enemyGroup).to({
                x: this.terrainGroup.x - gameOptions.squareSize
            }, gameOptions.moveTime, Phaser.Easing.Linear.None, true);

            var moveTween = game.add.tween(this.hero).to({
                angle: this.hero.angle + 90,
                x: this.hero.x - gameOptions.squareSize
            }, gameOptions.moveTime, Phaser.Easing.Linear.None, true);

            moveTween.onComplete.add(function() {
                this.hero.canMove = true;

                if(this.hero.angle == 0) {
                    this.hero.pivot.x = 0;
                    this.hero.pivot.y = 0;
                    this.hero.x += gameOptions.squareSize / 2;
                    this.hero.y -= gameOptions.squareSize / 2;
                }

                this.terrainGroup.sort("x", Phaser.Group.SORT_ASCENDING);

                this.enemyGroup.sort("x", Phaser.Group.SORT_ASCENDING)

                if(this.enemyGroup.length > 0 && this.enemyGroup.getChildAt(0).x <= this.terrainGroup.getChildAt(0).x) {
                    this.enemyGroup.getChildAt(0).destroy();
                }

                this.terrainGroup.getChildAt(0).x += this.terrainGroup.length * gameOptions.squareSize;

                if(game.rnd.integerInRange(0, 9) > 6) {
                    this.addEnemy();
                }
            }, this);
        }
    },
    addEnemy: function() {
        this.terrainGroup.sort("x", Phaser.Group.SORT_DESCENDING);

        var enemy = game.add.sprite(this.terrainGroup.getChildAt(0).x, 20, "square");
        enemy.anchor.set(0.5);
        enemy.tint = 0xff0000;

        game.physics.enable(enemy, Phaser.Physics.ARCADE);

        enemy.body.moves = false;

        game.add.tween(enemy).to({
            y: game.height / 3 * 2 - gameOptions.squareSize
        }, 1000 + game.rnd.integerInRange(0, 250), Phaser.Easing.Linear.None, true, 0, -1, true);

        this.enemyGroup.add(enemy);
    },
    update: function() {
        game.physics.arcade.collide(this.hero, this.enemyGroup, function() {
            game.state.start("TheGame");
        });
    }
};