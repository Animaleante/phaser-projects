var game;

var gameOptions = {
    scorePanelHeight: 0.08,
    launchPanelHeight: 0.18,
    ballSize: 0.04,
    ballSpeed: 1000
};

window.onload = function() {
    game = new Phaser.Game(640 ,960, Phaser.CANVAS);
    game.state.add("TheGame", TheGame, true);
};

var TheGame = function() {};

TheGame.prototype = {
    preload: function() {
        game.load.image("ball", "assets/sprites/ball.png");
        game.load.image("panel", "assets/sprites/panel.png");
        game.load.image("trajectory", "assets/sprites/trajectory.png");
    },
    create: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.backgroundColor = 0x202020;

        game.physics.startSystem(Phaser.Physics.ARCADE);

        var scorePanel = game.add.image(0,0, "panel");
        scorePanel.width = game.width;
        scorePanel.height = Math.round(game.height * gameOptions.scorePanelHeight);

        this.launchPanel = game.add.sprite(0, game.height, "panel");
        this.launchPanel.width = game.width;
        this.launchPanel.height = Math.round(game.height * gameOptions.launchPanelHeight);
        this.launchPanel.anchor.set(0,1);

        game.physics.enable(this.launchPanel, Phaser.Physics.ARCADE);

        this.launchPanel.body.immovable = true;

        var ballSize = game.width * gameOptions.ballSize;
        this.ball = game.add.sprite(game.width / 2, game.height - this.launchPanel.height - ballSize / 2, "ball");
        this.ball.width = ballSize;
        this.ball.height = ballSize;
        this.ball.anchor.set(0.5);

        game.physics.enable(this.ball, Phaser.Physics.ARCADE);

        this.ball.body.collideWorldBounds = true;
        this.ball.body.bounce.set(1);

        this.trajectory = game.add.sprite(this.ball.x, this.ball.y, "trajectory");
        this.trajectory.anchor.set(0.5,1);
        this.trajectory.visible = false;

        game.input.onDown.add(this.aimBall, this);
        game.input.onUp.add(this.shootBall, this);
        game.input.addMoveCallback(this.adjustBall, this);

        this.aiming = false;

        this.shooting = false;
    },
    aimBall: function() {
        if(!this.shooting) {
            this.aiming = true;
        }
    },
    adjustBall: function(e) {
        if(this.aiming) {
            var distX = e.position.x - e.positionDown.x;
            var distY = e.position.y - e.positionDown.y;

            if(distY > 10) {
                this.trajectory.position.set(this.ball.x, this.ball.y);

                this.trajectory.visible = true;

                this.direction = Phaser.Math.angleBetween(e.position.x, e.position.y, e.positionDown.x, e.positionDown.y);

                this.trajectory.angle = Phaser.Math.radToDeg(this.direction) + 90;
            } else {
                this.trajectory.visible = false;
            }
        }
    },
    shootBall: function() {
        if(this.trajectory.visible) {
            var angleOfFire = Phaser.Math.degToRad(this.trajectory.angle - 90);

            this.ball.body.velocity.set(gameOptions.ballSpeed * Math.cos(angleOfFire), gameOptions.ballSpeed * Math.sin(angleOfFire));

            this.shooting = true;
        }

        this.aiming = false;

        this.trajectory.visible = false;
    },
    update: function() {
        if(this.shooting) {
            game.physics.arcade.collide(this.ball, this.launchPanel, function() {
                this.ball.body.velocity.set(0);
                this.shooting = false;
            }, null, this);
        }
    }
}