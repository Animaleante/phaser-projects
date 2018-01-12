var game;


var gameOptions = {
    gameWidth: 320,
    gameHeight: 480
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame);
    game.state.start("TheGame");
};

var TheGame = function(){};

TheGame.prototype = {
    preload: function() {
        game.load.image("player", "assets/sprites/player.png");
        game.load.image("enemy", "assets/sprites/enemy.png");
    },
    create: function() {
        this.score = 0;
        this.topScore = localStorage.getItem("topboomdots") == null ? 0 : localStorage.getItem("topboomdots");
        this.scoreText = game.add.text(10,10, "-", {
            font: "bold 16px Arial",
            fill: "#acacac"
        });

        this.updateScore();

        this.player = game.add.sprite(game.width / 2, game.height / 5*4, "player");
        this.player.anchor.set(0.5);
        this.enemy = game.add.sprite(game.width, 0, "enemy");
        this.enemy.anchor.set(0.5);

        this.placePlayer();
        this.placeEnemy();
    },
    update: function() {
        if(Phaser.Math.distance(this.player.x, this.player.y, this.enemy.x, this.enemy.y) < this.player.width / 2 + this.enemy.width / 2) {
            this.enemyTween.stop();
            this.playerTween.stop();
            this.score++;
            if(Math.abs(this.player.x - this.enemy.x) < 10) {
                this.score += 2;
            }

            this.placeEnemy();
            this.placePlayer();
            this.updateScore();
        }
    },
    die: function() {
        localStorage.setItem("topboomdots", Math.max(this.score, this.topScore));
        game.state.start("TheGame");
    },
    updateScore: function() {
        this.scoreText.text = "Score: " + this.score + " - Best: " + this.topScore;
    },
    placePlayer: function() {
        this.player.x = game.width / 2;
        this.player.y = game.height / 5 * 4;

        this.playerTween = game.add.tween(this.player).to({
            y:game.height
        }, 10000 - this.score * 10, Phaser.Easing.Linear.None, true);

        this.playerTween.onComplete.add(this.die, this);

        game.input.onDown.add(this.fire, this);
    },
    placeEnemy: function() {
        this.enemy.x = game.width - this.enemy.width / 2;
        this.enemy.y = -this.enemy.width / 2;

        var enemyEnterTween = game.add.tween(this.enemy).to({
            y: game.rnd.between(this.enemy.width * 2, game.height / 4 * 3 - this.player.width / 2)
        }, 200, Phaser.Easing.Linear.None, true);

        enemyEnterTween.onComplete.add(this.moveEnemy, this);
    },
    moveEnemy: function() {
        this.enemyTween = game.add.tween(this.enemy).to({
            x: this.enemy.width / 2
        }, 500 + game.rnd.between(0,2500), Phaser.Easing.Cubic.InOut, true);

        this.enemyTween.yoyo(true, 0);
        this.enemyTween.repeat(50,0);
    },
    fire: function() {
        game.input.onDown.remove(this.fire, this);

        this.playerTween.stop();
        this.playerTween = game.add.tween(this.player).to({
            y: -this.player.width
        }, 500, Phaser.Easing.Linear.None, true);

        this.playerTween.onComplete.add(this.die, this);
    }
};