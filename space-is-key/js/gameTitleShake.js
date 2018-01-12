var game;

var gameOptions = {
    gameWidth: 840,
    floorHeight: 20,
    floorY: [],
    floorsAmount: 4,
    spikesAmount: 4,
    spikesHeight: 40,
    squareSize: 16,
    squareSpeed: 170,
    squareGravity: 450,
    jumpForce: -210,
    jumpTime: 300,
    // jumpTime: 920, // approximate time it takes for a jump to touch down again
    levelColors: [0xe81d62, 0x9b26af, 0x2095f2, 0x4bae4f, 0xfeea3a, 0x795548, 0x5f7c8a],
    localStorageName: "justjumpgame",
    version: "1.1m"
};

window.onload = function() {
    var windowRatio = window.innerWidth / window.innerHeight;
    var gameHeight = gameOptions.gameWidth / windowRatio;

    for (var i = 1; i <= gameOptions.floorsAmount; i++) {
        gameOptions.floorY.push(gameHeight / gameOptions.floorsAmount * i - gameOptions.floorHeight);
    }

    game = new Phaser.Game(gameOptions.gameWidth, gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        // game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        // the game will keep running even when it loses the focus
        game.stage.disableVisibilityChange = true;

        game.load.image("tile", "assets/sprites/tile.png");

        game.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");

        game.load.audio("jump", "assets/sounds/jump.mp3");
        game.load.audio("explosion", "assets/sounds/explosion.mp3");
    },
    create: function() {
        game.plugins.cameraShake = game.plugins.add(Phaser.Plugin.CameraShake);
        game.plugins.cameraShake.setup({
            shakeRange: 10,
            shakeCount: 10,
            shakeInterval: 20,
            ramdomShake: false,
            randomizeInterval: true,
            shakeAxis: 'xy'
        });

        this.savedData = localStorage.getItem(gameOptions.localStorageName) == null ? {score: 0} : JSON.parse(localStorage.getItem(gameOptions.localStorageName));

        this.jumpSound = game.add.audio("jump");
        this.explosionSound = game.add.audio("explosion");

        this.demo = true;
        this.gameOver = false;

        this.floorColors = [];
        this.floorSpikes = [];
        this.floorScores = [];

        var colorsArray = gameOptions.levelColors.slice();

        this.bgGroup = game.add.group();
        this.groundGroup = game.add.group();
        this.spikeGroup = game.add.group();
        this.scoreGroup = game.add.group();

        this.levelFloor = 0;

        this.theSquare = game.add.sprite(0, 0, "tile");
        this.theSquare.anchor.set(0.5);
        this.theSquare.width = gameOptions.squareSize;
        this.theSquare.height = gameOptions.squareSize;
        this.theSquare.canJump = true;
        game.physics.enable(this.theSquare, Phaser.Physics.ARCADE);
        this.theSquare.body.velocity.x = gameOptions.squareSpeed;
        this.theSquare.body.gravity.y = gameOptions.squareGravity;
        this.theSquare.squareColor = [];

        var levelHeight = game.height / gameOptions.floorsAmount;

        for (var i = 0; i < gameOptions.floorY.length; i++) {
            this.floorSpikes[i] = [];
            this.floorScores[i] = [];

            var bg = game.add.sprite(0, gameOptions.floorY[i] - levelHeight + gameOptions.floorHeight, "tile");
            bg.width = game.width;
            bg.height = levelHeight;
            var tintColor = Phaser.ArrayUtils.removeRandomItem(colorsArray);
            this.floorColors.push(tintColor);
            bg.tint = tintColor;
            bg.alpha = 0.5;
            this.bgGroup.add(bg);

            var floor = game.add.sprite(0, gameOptions.floorY[i], "tile");
            floor.width = game.width;
            floor.height = gameOptions.floorHeight;
            floor.tint = tintColor;
            floor.alpha = 0.5;
            game.physics.enable(floor, Phaser.Physics.ARCADE);
            floor.body.immovable = true;
            this.groundGroup.add(floor);

            this.placeSpikes(i);
        }

        this.emitter = game.add.emitter(0,0,30);
        this.emitter.makeParticles("tile");
        this.emitter.gravity.y = 200;
        this.emitter.maxParticleScale = 0.1;
        this.emitter.minParticleScale = 0.05;

        this.placeSquare();

        this.demoGroup = game.add.group();

        var blackOverlay = game.add.sprite(0,0,"tile");
        blackOverlay.width = game.width;
        blackOverlay.height = game.height;
        blackOverlay.tint = 0x000000;
        blackOverlay.alpha = 0.7;
        this.demoGroup.add(blackOverlay);

        var titleText = game.add.bitmapText(game.width / 2, game.height / 5, "font", "Just Jump", 48);
        titleText.anchor.set(0.5);
        this.demoGroup.add(titleText);

        var infoText = game.add.bitmapText(game.width / 2, game.height / 5 * 2, "font", "Tap / Click to jump", 24);
        infoText.anchor.set(0.5, 0.5);
        this.demoGroup.add(infoText);

        if(!this.score) {
            this.score = 0;
        }

        var scoresText = game.add.bitmapText(game.width / 2, game.height / 5 * 4, "font", "Latest score\n" + this.score.toString() + "\n\nBest score\n"+this.savedData.score.toString(), 24);
        scoresText.anchor.set(0.5,0.5);
        scoresText.align = "center";
        this.demoGroup.add(scoresText);

        var versionText = game.add.bitmapText(game.width, game.height, "font", "v"+gameOptions.version, 24);
        versionText.anchor.set(1,1);
        this.demoGroup.add(versionText);

        game.input.onDown.add(this.squareJump, this);
    },
    update: function() {
        if(!this.gameOver) {
            game.physics.arcade.collide(this.theSquare, this.groundGroup);

            game.physics.arcade.overlap(this.theSquare, this.spikeGroup, function(){
                this.emitter.x = this.theSquare.x;
                this.emitter.y = this.theSquare.y;

                this.emitter.start(true, 1000, null, 10);

                this.emitter.forEach(function(particle) {
                    particle.tint = this.theSquare.tint;
                }, this);

                game.plugins.cameraShake.shake();

                game.input.onDown.remove(this.squareJump, this);

                this.explosionSound.play();

                this.gameOver = true;

                localStorage.setItem(gameOptions.localStorageName, JSON.stringify({
                    score: Math.max(this.score, this.savedData.score)
                }));

                game.time.events.add(Phaser.Timer.SECOND * 2, function() {
                    game.state.start("TheGame");
                }, this);
            }, null, this);

            if((this.theSquare.x > game.width && this.levelFloor % 2 == 0) ||
                (this.theSquare.x < 0 && this.levelFloor % 2 == 1)) {
                this.moveSpikes(this.levelFloor);
                this.levelFloor = (this.levelFloor + 1) % gameOptions.floorY.length;
                this.placeSquare();
            }

            if(!this.theSquare.canJump && this.theSquare.body.touching.down) {
                this.theSquare.canJump = true;

                if(this.jumps > 0 && this.jumps <= gameOptions.spikesAmount && !this.demo) {
                    this.jumpLen = this.jumpLen + (this.theSquare.x - this.jumpLen) / 2;
                    var precision = Math.round(Math.abs(this.jumpLen - this.floorSpikes[this.levelFloor][this.jumps - 1].x));
                    this.floorScores[this.levelFloor][this.jumps - 1].visible = true;

                    if(precision < 10) {
                        this.score += (10 - precision) * 10;
                        this.floorScores[this.levelFloor][this.jumps - 1].text = (10 - precision) * 10;
                    } else {
                        this.floorScores[this.levelFloor][this.jumps - 1].text = "BAD";
                    }
                }
            }

            if(this.demo) {
                if((this.jumps < gameOptions.spikesAmount) && (Math.abs(this.floorSpikes[this.levelFloor][this.jumps].x - this.theSquare.x) < 88)) {
                    this.squareJump();
                }
            }
        }
    },
    placeSquare: function() {
        this.jumps = 0;

        this.theSquare.tint = this.floorColors[this.levelFloor];

        this.theSquare.body.velocity.x = (this.levelFloor % 2 == 0) ? gameOptions.squareSpeed : -gameOptions.squareSpeed;
        this.theSquare.body.velocity.y = 0;
        this.theSquare.canJump = true;

        this.theSquare.y = gameOptions.floorY[this.levelFloor] - gameOptions.squareSize / 2;
        this.theSquare.x = (this.levelFloor % 2 == 0) ? 0 : game.width;

        if(this.jumpTween && this.jumpTween.isRunning) {
            this.jumpTween.stop();
            this.theSquare.angle = 0;
        }
    },
    placeSpikes: function(floor) {
        for (var i = 1; i <= gameOptions.spikesAmount; i++) {
            var spike = game.add.sprite((floor % 2 == 0) ? game.width : 0, gameOptions.floorY[floor], "tile");
            spike.height = gameOptions.spikesHeight;
            spike.tint = this.floorColors[floor];
            spike.alpha = 0.5;
            spike.anchor.set(0.5,1);
            game.physics.enable(spike, Phaser.Physics.ARCADE);
            spike.body.immovable = true;
            this.spikeGroup.add(spike);
            this.floorSpikes[floor].push(spike);

            var scoreText = game.add.bitmapText(0, gameOptions.floorY[floor] - 60, "font", "100", 24);
            scoreText.anchor.set(0.5);
            scoreText.align = "center";
            scoreText.visible = false;
            this.scoreGroup.add(scoreText);
            this.floorScores[floor].push(scoreText);

            this.moveSpikes(floor);
        }
    },
    moveSpikes: function(floor) {
        var obstacleX = (floor % 2 == 0) ? 180 : game.width - 180;

        for (var i = 0; i < this.floorSpikes[floor].length; i++) {
            var newWidth = game.rnd.integerInRange(1,16) * 2;

            this.floorSpikes[floor][i].body.setSize(newWidth, this.floorSpikes[floor][i].height);

            this.floorScores[floor][i].x = obstacleX;
            this.floorScores[floor][i].visible = false;

            var obstacleGap = game.rnd.integerInRange(150, 200);

            var obstacleTween = game.add.tween(this.floorSpikes[floor][i]).to({
                x: obstacleX,
                width: newWidth
            }, 250, Phaser.Easing.Linear.None, true);

            obstacleX += (floor % 2 == 0) ? obstacleGap : - obstacleGap;
        }
    },
    squareJump: function(e) {
        if(e != undefined && this.demo) {
            this.demo = false;
            this.demoGroup.destroy();
            this.levelFloor = 0;
            this.score = 0;
            this.placeSquare();
            return;
        }

        if(this.theSquare.canJump) {
            this.jumpLen = this.theSquare.x;
            this.jumps++;
            this.theSquare.canJump = false;
            this.theSquare.body.velocity.y = gameOptions.jumpForce;

            var jumpAngle = this.levelFloor % 2 == 0 ? 180 : -180;

            this.jumpTween = game.add.tween(this.theSquare).to({
                angle: this.theSquare.angle + jumpAngle
            }, gameOptions.jumpTime, Phaser.Easing.Linear.None, true);

            if(!this.demo) {
                this.jumpSound.play();
            }
        }
    }
}