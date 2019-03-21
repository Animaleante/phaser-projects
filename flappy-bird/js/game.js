var game;

var gameOptions = {
    birdGravity: 800,
    birdSpeed: 125,
    birdFlapPower: 300,
    minPipeHeight: 50,
    pipeDistance: [220,280],
    pipeHole: [100,130],
    localStorageName: "bestFlappyScore"
};

window.onload = function() {
    game = new Phaser.Game(320,480,Phaser.CANVAS);
    game.state.add("TheGame", TheGame, true);
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function () {
        game.load.image("bird", "assets/sprites/bird.png");
        game.load.image("pipe", "assets/sprites/pipe.png");
    },
    create: function () {
        game.stage.backgroundColor = "#87CEEB";

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVerically = true;

        game.stage.disableVisibilityChange = true;

        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.pipeGroup = game.add.group();

        this.score = 0;

        this.topScore = localStorage.getItem(gameOptions.localStorageName) == null ? 0 : localStorage.getItem(gameOptions.localStorageName);

        this.scoreText = game.add.text(10,10, "-", {
            font: "bold 16px Arial"
        });

        this.updateScore(0);

        this.bird = game.add.sprite(80,240,"bird");
        this.bird.anchor.set(0.5);

        game.physics.arcade.enable(this.bird);

        this.bird.body.gravity.y = gameOptions.birdGravity;

        game.input.onDown.add(this.flap, this);

        var pipePosition = game.width;
        do {
            this.addPipe(pipePosition);
            pipePosition += game.rnd.between(gameOptions.pipeDistance[0], gameOptions.pipeDistance[1]);
        } while(pipePosition < game.width * 4);
    },
    update: function () {
        game.physics.arcade.collide(this.bird, this.pipeGroup, this.die, null, this);

        if(this.bird.y > game.height || this.bird.y < 0) {
            this.die();
        }
    },
    updateScore: function (inc) {
        this.score += inc;
        this.scoreText.text = "Score: " + this.score + "\nBest: " + this.topScore;
    },
    flap: function () {
        this.bird.body.velocity.y = -gameOptions.birdFlapPower;
    },
    die: function () {
        localStorage.setItem(gameOptions.localStorageName, Math.max(this.score, this.topScore));
        game.state.start("TheGame");
    },
    addPipe: function (posX) {
        var pipeHoleHeight = game.rnd.between(gameOptions.pipeHole[0], gameOptions.pipeHole[1]);
        var pipeHolePosition = game.rnd.between(gameOptions.minPipeHeight + pipeHoleHeight / 2, game.height - gameOptions.minPipeHeight - pipeHoleHeight / 2);
        var upperPipe = new Pipe(game, posX, pipeHolePosition - pipeHoleHeight / 2, -gameOptions.birdSpeed);

        game.add.existing(upperPipe);

        upperPipe.anchor.set(0.5,1);

        this.pipeGroup.add(upperPipe);

        var lowerPipe = new Pipe(game, posX, pipeHolePosition + pipeHoleHeight / 2, -gameOptions.birdSpeed);

        game.add.existing(lowerPipe);

        lowerPipe.anchor.set(0.5,0);

        this.pipeGroup.add(lowerPipe);
    }
};

var Pipe = function (game, x, y, speed) {
    Phaser.Sprite.call(this, game, x, y, "pipe");
    game.physics.enable(this, Phaser.Physics.ARCADE);

    this.body.velocity.x = speed;
    this.giveScore = true;
};

Pipe.prototype = Object.create(Phaser.Sprite.prototype);
Pipe.prototype.constructor = Pipe;

Pipe.prototype.update = function () {
    if(this.x + this.width < game.state.states[game.state.current].bird.x && this.giveScore) {
        game.state.states[game.state.current].updateScore(0.5);
        this.giveScore = false;
    }

    if(this.x < -this.width) {
        this.giveScore = true;
        game.state.states[game.state.current].pipeGroup.sort("x", Phaser.Group.SORT_DESCENDING);

        if(game.state.states[game.state.current].pipeGroup.getChildAt(0).x == game.state.states[game.state.current].pipeGroup.getChildAt(1).x) {
            this.x = game.state.states[game.state.current].pipeGroup.getChildAt(0).x + game.rnd.between(gameOptions.pipeDistance[0],gameOptions.pipeDistance[1]);
        } else {
            this.x = game.state.states[game.state.current].pipeGroup.getChildAt(0).x;
        }
    }
};