var game;

var gameOptions = {
    playerSpeed: 120,
    playerJumpSpeed: {
        x: 30,
        y: -100
    },
    tileSize: 32,
    changeDirectionRange: 32,
    playerGravity: 400
};

window.onload = function() {
    game = new Phaser.Game(800, 600, Phaser.CANVAS);
    game.state.add("TheGame", TheGame, true);
};

var TheGame = function() {};

TheGame.prototype = {
    preload: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        game.load.tilemap("map", "assets/maps/map.json", null, Phaser.Tilemap.TILED_JSON);
        game.load.image("rock", "assets/sprites/rock.png");
        game.load.image("block", "assets/sprites/block.png");
        game.load.image("player", "assets/sprites/player.png");
    },
    create: function() {
        this.tilePoint = null;

        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.map = game.add.tilemap("map");
        this.map.addTilesetImage("rock");
        this.map.addTilesetImage("block");

        this.map.setCollisionBetween(1,2);

        this.levelLayer = this.map.createLayer("myLevel");

        this.player = game.add.sprite(48, 226, "player");
        this.player.anchor.set(0.5);
        this.player.isJumping = false;
        this.player.direction = 1;

        game.physics.enable(this.player, Phaser.Physics.ARCADE);

        this.player.body.gravity.y = gameOptions.playerGravity;

        game.input.onDown.add(this.addBlock, this);
    },
    update: function() {
        this.player.body.velocity.x = 0;
        game.physics.arcade.collide(this.player, this.levelLayer, this.movePlayer, null, this);
    },
    movePlayer: function() {
        if(this.player.body.blocked.down) {
            this.player.body.velocity.x = gameOptions.playerSpeed * this.player.direction;
            this.player.isJumping = false;
        }

        if(this.player.body.blocked.right && this.player.direction == 1) {
            if((!this.map.getTileWorldXY(this.player.x + gameOptions.tileSize, this.player.y - gameOptions.tileSize, gameOptions.tileSize, gameOptions.tileSize, this.levelLayer) && !this.map.getTileWorldXY(this.player.x, this.player.y - gameOptions.tileSize, gameOptions.tileSize, gameOptions.tileSize, this.levelLayer)) || this.player.isJumping) {
                this.jump();
            } else {
                this.player.direction *= -1;
            }
        }

        if(this.player.body.blocked.left && this.player.direction == -1) {
            if((!this.map.getTileWorldXY(this.player.x - gameOptions.tileSize, this.player.y - gameOptions.tileSize, gameOptions.tileSize, gameOptions.tileSize, this.levelLayer) && !this.map.getTileWorldXY(this.player.x, this.player.y - gameOptions.tileSize, gameOptions.tileSize, gameOptions.tileSize, this.levelLayer)) || this.player.isJumping){
                this.jump();
            } else {
                this.player.direction *= -1;
            }
        }
    },
    addBlock: function(e) {
        var distanceX = e.x - this.player.x;
        var distanceY = e.y - this.player.y;

        if((distanceX * distanceX + distanceY * distanceY) < gameOptions.changeDirectionRange * gameOptions.changeDirectionRange) {
            this.player.direction *= -1;
        } else {
            if(!this.map.getTileWorldXY(e.x, e.y, gameOptions.tileSize, gameOptions.tileSize, this.levelLayer)) {
                if(this.tilePoint) {
                    this.map.removeTileWorldXY(this.tilePoint.x, this.tilePoint.y, gameOptions.tileSize, gameOptions.tileSize, this.levelLayer);
                }

                this.map.putTileWorldXY(2, e.x, e.y, gameOptions.tileSize, gameOptions.tileSize, this.levelLayer);
                this.tilePoint = new Phaser.Point(e.x, e.y);
            }
        }
    },
    jump: function() {
        this.player.body.velocity.y = gameOptions.playerJumpSpeed.y;
        this.player.body.velocity.x = gameOptions.playerJumpSpeed.x * this.player.direction;
        this.player.isJumping = true;
    }
};