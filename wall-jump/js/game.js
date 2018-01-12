var game;

var gameOptions = {
    gameWidth: 640,
    gameHeight: 480,
    bgColor: 0x444444,
    playerGravity: 900,
    playerSpeed: 200,
    playerJump: 400
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("PreloadGame", PreloadGame);
    game.state.add("TheGame", TheGame);
    game.state.start("PreloadGame");
};

var PreloadGame = function(game){};

PreloadGame.prototype = {
    preload: function() {
        game.stage.backgroundColor = gameOptions.bgColor;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        game.load.tilemap("level", "data/level.json", null, Phaser.Tilemap.TILED_JSON);
        game.load.image("tile", "assets/sprites/tile.png");
        game.load.image("hero", "assets/sprites/hero.png");
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

        this.hero = game.add.sprite(game.width / 2, 440, "hero");
        this.hero.anchor.set(0.5);
        game.physics.enable(this.hero, Phaser.Physics.ARCADE);
        this.hero.body.gravity.y = gameOptions.playerGravity;
        this.hero.body.velocity.x = gameOptions.playerSpeed;

        this.canJump = true;
        this.onWall = false;

        game.input.onDown.add(this.handleJump, this);
    },
    handleJump: function() {
        if((this.canJump && this.hero.body.blocked.down) || this.onWall) {
            this.hero.body.velocity.y = -gameOptions.playerJump;

            if(this.onWall) {
                this.hero.scale.x *= -1;
                this.hero.body.velocity.x = gameOptions.playerSpeed * this.hero.scale.x;
            }

            this.canJump = false;
            this.onWall = false;
        }
    },
    update: function() {
        game.physics.arcade.collide(this.hero, this.layer, function(hero, layer) {
            var blocked = hero.body.blocked;
            if(blocked.down) {
                this.canJump = true;
                this.onWall = false;
            }

            /*if(blocked.right && blocked.down) {
                hero.scale.x = -1;
            }

            if(blocked.right && !blocked.down) {
                this.onWall = true;
            }*/

            if(blocked.right) {
                if(blocked.down) {
                    hero.scale.x = -1;
                } else {
                    this.onWall = true;
                }
            }

            /*if(blocked.left && blocked.down) {
                hero.scale.x = 1;
            }

            if(blocked.left && !blocked.down) {
                this.onWall = true;
            }*/

            else if(blocked.left) {
                if(blocked.down) {
                    hero.scale.x = 1;
                } else {
                    this.onWall = true;
                }
            }

            hero.body.velocity.x = gameOptions.playerSpeed * this.hero.scale.x;
        }, null, this);
    }
};