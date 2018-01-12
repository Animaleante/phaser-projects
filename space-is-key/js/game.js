var game;

var gameOptions = {
    gameWidth: 640,
    gameHeight: 480,
    floorWidth: 640,
    floorHeight: 20,
    levelHeight: 120,
    // floorY: [92,184,276,368,460],
    floorY: [100, 220, 340, 460],
    floorX: 0,
    squareSize: 16,
    squareSpeed: 170,
    squareGravity: 450,
    jumpForce: -210,
    // jumpTime: 500,
    jumpTime: 920, // approximate time it takes for a jump to touch down again
    levelColors: [0xe81d62, 0x9b26af, 0x2095f2, 0x4bae4f, 0xfeea3a, 0x795548, 0x5f7c8a]
};

var gameLevels = [
    [
        {
            width: 60,
            height: 30,
            x: 200
        },
        {
            width: 60,
            height: 30,
            x: 400
        }
    ],
    [
        {
            width: 40,
            height: 30,
            x: 250
        },
        {
            width: 70,
            height: 25,
            x: 450
        },
        {
            width: 30,
            height: 20,
            x: 100
        }
    ],
    [
        {
            width: 10,
            height: 35,
            x: 150
        },
        {
            width: 10,
            height: 35,
            x: 300
        },
        {
            width: 10,
            height: 35,
            x: 550
        }
    ],
    [
        {
            width: 80,
            height: 10,
            x: 280
        }
    ]
];

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");

    // TODO - Add title screen
    // TODO - Add score
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        game.load.image("tile", "assets/sprites/tile.png");
    },
    create: function() {
        this.bgGroup = game.add.group();
        this.groundGroup = game.add.group();
        this.spikeGroup = game.add.group();
        this.levelFloor = 0;
        this.theSquare = game.add.sprite(gameOptions.floorX + gameOptions.squareSize / 2, gameOptions.floorY[0] - gameOptions.squareSize / 2, "tile");
        this.theSquare.anchor.set(0.5);
        this.theSquare.width = gameOptions.squareSize;
        this.theSquare.height = gameOptions.squareSize;
        this.theSquare.canJump = true;
        game.physics.enable(this.theSquare, Phaser.Physics.ARCADE);
        this.theSquare.body.velocity.x = gameOptions.squareSpeed;
        this.theSquare.body.gravity.y = gameOptions.squareGravity;
        this.theSquare.squareColor = [];

        for (var i = 0; i < gameOptions.floorY.length; i++) {
            var colorsArray = gameOptions.levelColors.slice();
            var bg = game.add.tileSprite(gameOptions.floorX, gameOptions.floorY[i] - gameOptions.levelHeight, gameOptions.floorWidth, gameOptions.levelHeight, "tile");
            this.theSquare.squareColor[i] = Phaser.ArrayUtils.removeRandomItem(colorsArray);
            bg.tint = Phaser.ArrayUtils.removeRandomItem(colorsArray);
            bg.alpha = 0.5;
            this.bgGroup.add(bg);

            var floor = game.add.tileSprite(gameOptions.floorX, gameOptions.floorY[i], gameOptions.floorWidth, gameOptions.floorHeight, "tile");
            floor.tint = Phaser.ArrayUtils.removeRandomItem(colorsArray);
            game.physics.enable(floor, Phaser.Physics.ARCADE);
            floor.body.immovable = true;
            this.groundGroup.add(floor);

            for (var j = 0; j < gameLevels[i].length; j++) {
                var spike = game.add.tileSprite(gameOptions.floorX + gameLevels[i][j].x, gameOptions.floorY[i], gameLevels[i][j].width, gameLevels[i][j].height, "tile");
                spike.tint = floor.tint;
                spike.anchor.set(0.5, 1);
                game.physics.enable(spike, Phaser.Physics.ARCADE);
                spike.body.immovable = true;
                this.spikeGroup.add(spike);
            }
        }

        this.emitter = game.add.emitter(0,0,30);
        this.emitter.makeParticles("tile");
        this.emitter.gravity.y = 200;
        this.emitter.maxParticleScale = 0.1;
        this.emitter.minParticleScale = 0.05;

        this.placeSquare();

        game.input.onDown.add(this.squareJump, this);
    },
    update: function() {
        game.physics.arcade.collide(this.theSquare, this.groundGroup);

        game.physics.arcade.overlap(this.theSquare, this.spikeGroup, function(){

            this.emitter.x = this.theSquare.x;
            this.emitter.y = this.theSquare.y;

            this.emitter.start(true, 1000, null, 10);

            this.emitter.forEach(function(particle) {
                particle.tint = this.theSquare.tint;
            }, this);

            this.levelFloor = 0;

            this.placeSquare();
        }, null, this);

        if((this.theSquare.x > gameOptions.floorX + gameOptions.floorWidth && this.levelFloor % 2 == 0) ||
            (this.theSquare.x < gameOptions.floorX && this.levelFloor % 2 == 1)) {
            this.levelFloor = (this.levelFloor + 1) % gameOptions.floorY.length;

            this.placeSquare();
        }

        if(this.theSquare.body.touching.down && !this.theSquare.canJump) {
            this.theSquare.canJump = true;
            // console.timeEnd('jump');
        }
    },
    placeSquare: function() {
        this.theSquare.tint = this.theSquare.squareColor[this.levelFloor];

        this.theSquare.body.velocity.x = (this.levelFloor % 2 == 0) ? gameOptions.squareSpeed : -gameOptions.squareSpeed;
        this.theSquare.body.velocity.y = 0;
        this.theSquare.canJump = true;
        this.theSquare.y = gameOptions.floorY[this.levelFloor] - gameOptions.squareSize / 2;
        this.theSquare.x = (this.levelFloor % 2 == 0) ? gameOptions.floorX : gameOptions.floorX + gameOptions.floorWidth;

        if(this.jumpTween && this.jumpTween.isRunning) {
            this.jumpTween.stop();
            this.theSquare.angle = 0;
        }
    },
    squareJump: function() {
        if(this.theSquare.canJump) {
            this.theSquare.canJump = false;
            this.theSquare.body.velocity.y = gameOptions.jumpForce;
            // var jumpAngle = this.levelFloor % 2 == 0 ? 90 : -90;
            var jumpAngle = this.levelFloor % 2 == 0 ? 180 : -180;
            this.jumpTween = game.add.tween(this.theSquare).to({
                angle: this.theSquare.angle + jumpAngle
            }, gameOptions.jumpTime, Phaser.Easing.Linear.None, true);
            // console.time('jump');
        }
    }
}