var game;

var gameOptions = {
    gameWidth: 640,
    gameHeight: 192,
    bgColor: 0x444444,
    playerGravity: 1900,
    plyaerSpeed: 200,
    playerJump: 400,
    enemySpeed: 150
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
        game.stage.backgroundColor = gameOptions.bgColor;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVerically = true;
        game.stage.disableVisibilityChange = true;

        game.load.tilemap("level", "data/level.json", null, Phaser.Tilemap.TILED_JSON);

        game.load.image("tile", "assets/sprites/tile.png");
        game.load.image("hero", "assets/sprites/hero.png");
        game.load.image("enemy", "assets/sprites/enemy.png");
    },
    create: function() {
        game.state.start("TheGame");
    }
};

var TheGame = function(){};
TheGame.prototype = {
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.map = game.add.tilemap("level");
        this.map.addTilesetImage("tileset01", "tile");
        this.map.setCollision(1);

        this.layer = this.map.createLayer("layer01");

        this.hero = game.add.sprite(game.width / 2, 152, "hero");
        this.hero.anchor.set(0.5);
        game.physics.enable(this.hero, Phaser.Physics.ARCADE);
        this.hero.body.gravity.y = gameOptions.playerGravity;
        this.hero.body.velocity.x = gameOptions.plyaerSpeed;

        this.enemy = game.add.sprite(game.width / 4, 152, "enemy");
        this.enemy.anchor.set(0.5);
        game.physics.enable(this.enemy, Phaser.Physics.ARCADE);
        this.enemy.body.velocity.x = gameOptions.enemySpeed;

        this.canJump = true;

        game.input.onDown.add(this.handleJump, this);
    },
    handleJump: function() {
        if((this.canJump && this.hero.body.blocked.down)) {
            this.hero.body.velocity.y = -gameOptions.playerJump;
            this.canJump = false;
        }
    },
    update: function() {
        game.physics.arcade.collide(this.hero, this.layer, function(hero, layer) {
            if(hero.body.blocked.down) {
                this.canJump = true;
            }

            if(this.hero.body.blocked.right && this.hero.body.blocked.down) {
                this.hero.scale.x = -1;
            }

            if(this.hero.body.blocked.left && this.hero.body.blocked.down) {
                this.hero.scale.x = 1;
            }

            this.hero.body.velocity.x = gameOptions.plyaerSpeed * this.hero.scale.x;
        }, null, this);

        game.physics.arcade.collide(this.enemy, this.layer, function(hero, layer) {
            if(this.enemy.body.blocked.right) {
                this.enemy.scale.x = -1;
            }
            if(this.enemy.body.blocked.left) {
                this.enemy.scale.x = 1;
            }

            this.enemy.body.velocity.x = gameOptions.enemySpeed * this.enemy.scale.x;
        }, null, this);

        game.physics.arcade.collide(this.hero, this.enemy, function(hero, enemy) {
            if(enemy.body.touching.up && hero.body.touching.down) {
                this.hero.body.velocity.y = -gameOptions.playerJump;
            } else {
                game.state.start("TheGame");
            }
        }, null, this);
    }
};