var game;

var gameOptions = {
    gameWidth: 576,
    gameHeight: 768,
    blockSize: 64,
    ballSpeed: 150
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("PreloadGame", PreloadGame);
    game.state.add("TheGame", TheGame);
    game.state.start("PreloadGame");
};

var PreloadGame = function() {};
PreloadGame.prototype = {
    preload: function() {
        game.stage.backgroundColor = 0x222222;
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        game.load.image('ball', 'assets/sprites/ball.png');
        game.load.image('block', 'assets/sprites/block2.png');
    },
    create: function() {
        game.state.start("TheGame");
    }
};

var TheGame = function() {};
TheGame.prototype = {
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.blockGroup = game.add.group();
        this.ballGroup =game.add.group();

        this.ballCount = 1;
        this.level = 1;

        this.ballsToFall = 0;

        this.launched = false;

        this.createBlocks();

        this.launchPoint = new Phaser.Point(game.width / 2, game.height - 10);
        this.newLaunchPoint = null;

        this.ballLauncher = game.add.sprite(this.launchPoint.x, this.launchPoint.y, 'ball');
        this.ballLauncher.anchor.set(0.5);

        game.input.onDown.add(this.handleTapDown, this);
    },
    createBlocks: function() {
        var block = game.add.sprite(game.rnd.integerInRange(0,(game.width / gameOptions.blockSize - 1)) * gameOptions.blockSize, 0, 'block');
        game.physics.enable(block, Phaser.Physics.ARCADE);
        block.body.immovable = true;
        block.count = Math.pow(2, (this.level - 1));

        var blockText = game.add.text(gameOptions.blockSize / 2, gameOptions.blockSize / 2, block.count, {
            font: "bold 16px Arial"
        });
        blockText.align = "center";
        block.addChild(blockText);
        block.blockText = blockText;

        this.blockGroup.add(block);
    },
    handleTapDown: function(e) {
        game.input.onDown.remove(this.handleTapDown, this);

        // TODO - save tapDown point

        game.input.onUp.add(this.handleTapUp, this);
    },
    handleTapUp: function(e) {
        var distance = Phaser.Point.subtract(e.position, this.launchPoint);
        var normal = Phaser.Point.normalize(distance);
        var toPoint = Phaser.Point.add(this.launchPoint, normal);
        // var angle = toPoint.angle(this.launchPoint, true);
        var angle = normal;

        if(normal.y > -0.2)
            return;

        game.input.onUp.remove(this.handleTapUp, this);

        this.launched = true;

        this.ballsToFall = this.ballCount;

        var self = this;
        for (var i = 0; i < this.ballCount; i++) {
            setTimeout(function() {
                self.launch.apply(self, [angle]);

                if(self.ballCount === self.ballGroup.length) {
                    self.ballLauncher.alpha = 0;
                }
            }, i * 100);
        }
    },
    launch: function(dir) {
        console.log('launch', dir);
        var ball = game.add.sprite(this.launchPoint.x, this.launchPoint.y, 'ball');
        // ball.anchor.set(0.5);
        game.physics.enable(ball, Phaser.Physics.ARCADE);
        ball.body.setCircle(10);
        // ball.body.offset = new Phaser.Point(-10,-10);
        ball.body.collideWorldBounds = true;
        ball.body.bounce.setTo(1);
        ball.firstContact = false;

        this.ballGroup.add(ball);

        ball.body.velocity.x = dir.x * gameOptions.ballSpeed;
        ball.body.velocity.y = dir.y * gameOptions.ballSpeed;

        ball.body.onWorldBounds = new Phaser.Signal();
        ball.body.onWorldBounds.add(function(ball, up, down, left, right) {
            if(down === true) {
                console.log('down contact');
                if(!ball.firstContact) {
                    ball.firstContact = true;
                    return;
                }

            /*ball.body.velocity.set(0);
            ball.body.moves = false;
            ball.y = this.launchPoint.y;

            if(this.newLaunchPoint === null)
            this.newLaunchPoint = new Phaser.Point(ball.x, game.height - 10);

            this.ballsToFall--;

            if(this.ballsToFall <= 0) {
                this.ballsToFall = 0;
                this.launchPoint = this.newLaunchPoint;
                this.newLaunchPoint = null;
                this.tweenBalls();
            }*/
            }
        }, this);
    },
    tweenBalls: function() {
        var toTween = this.ballGroup.length;
        this.ballGroup.forEach(function(ball) {
            var tween = game.add.tween(ball).to({
                x: this.launchPoint.x
            }, 150, Phaser.Easing.Linear.None, true);

            tween.onComplete.add(function() {
                toTween--;
                ball.destroy();
                if(toTween === 0) {
                    this.ballLauncher.x = this.launchPoint.x;
                    this.ballLauncher.alpha = 1;

                    this.level++;
                    this.tweenGame();
                    this.createBlocks();
                    game.input.onDown.add(this.handleTapDown, this);
                }
            }, this);
        }, this);
    },
    tweenGame: function() {
        var tween = game.add.tween(this.blockGroup).to({
            y: 64
        }, 150, Phaser.Easing.Linear.None, true);
    },
    update: function() {
        game.physics.arcade.collide(this.blockGroup, this.ballGroup, function(block, ball) {
            console.log('collided');
            block.count--;
            block.blockText.text = block.count;

            if(block.count <= 0) {
                block.kill();
            }
        });
    }/*,
    render: function() {
        this.ballGroup.forEach(function(spr) {
            game.debug.body(spr);
        }, this);
    }*/
};