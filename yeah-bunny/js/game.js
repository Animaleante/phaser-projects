var game;

var gameOptions = {
    gameWidth: 640,
    gameHeight: 480,
    bgColor: 0x444444,
    playerGravity: 900,
    playerSpeed: 200,
    playerJump: 400,
    playerGrip: 100,
    playerDoubleJump: 300
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

        this.hero = game.add.sprite(300, 376, "hero");
        this.hero.anchor.set(0.5);
        game.physics.enable(this.hero, Phaser.Physics.ARCADE);
        this.hero.body.gravity.y = gameOptions.playerGravity;
        this.hero.body.velocity.x = gameOptions.playerSpeed;

        this.canJump = true;
        this.canDoubleJump = false;
        this.onWall = false;

        game.input.onDown.add(this.handleJump, this);

        game.world.setBounds(0,0, 1920, 1440);

        game.camera.follow(this.hero, Phaser.Camera.FOLLOW_PLATFORMER, 0.1, 0.1);
    },
    handleJump: function() {
        if((this.canJump && this.hero.body.blocked.down) || this.onWall) {
            this.hero.body.velocity.y = -gameOptions.playerJump;

            if(this.onWall) {
                this.setPlayerXVelocity(true);
            }

            this.canJump = false;
            this.onWall = false;
            this.canDoubleJump = true;
        } else {
            if(this.canDoubleJump) {
                this.canDoubleJump = false;
                this.hero.body.velocity.y = -gameOptions.playerDoubleJump;
            }
        }
    },
    update: function() {
        this.setDefaultValues();

        game.physics.arcade.collide(this.hero, this.layer, function(hero, layer) {
            var blocked = hero.body.blocked;
            var blockedDown = blocked.down;
            var blockedLeft = blocked.left;
            var blockedRight = blocked.right;

            this.canDoubleJump = false;

            if(blockedDown) {
                this.canJump = true;
            }

            if(blockedRight) {
                hero.scale.x = -1;
            } else if(blockedLeft) {
                hero.scale.x = 1;
            }

            if((blockedLeft || blockedRight) && !blockedDown) {
                this.onWall = true;
                hero.body.gravity.y = 0;
                hero.body.velocity.y = gameOptions.playerGrip;
            }

            this.setPlayerXVelocity(!this.onWall || blockedDown);
        }, null, this);
    },
    setDefaultValues: function() {
        this.hero.body.gravity.y = gameOptions.playerGravity;
        this.onWall = false;
        this.setPlayerXVelocity(true);
    },
    setPlayerXVelocity: function(defaultDirection) {
        this.hero.body.velocity.x = gameOptions.playerSpeed * this.hero.scale.x * (defaultDirection ? 1 : -1);
    }
};