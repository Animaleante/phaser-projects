var game;

var gameOptions = {
    gameWidth: 640,
    gameHeight: 480,
    backgroundColor: '#bfcc00'
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight, Phaser.WEBGL);
    game.state.add("PreloadGame", PreloadGame);
    game.state.add("TheGame", TheGame);
    game.state.start("PreloadGame");
};

var PreloadGame = function(){};
PreloadGame.prototype = {
    preload: function() {
        game.stage.backgroundColor = gameOptions.backgroundColor;
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        game.load.image('food', 'assets/sprites/food.png');
        game.load.image('body', 'assets/sprites/body.png');
    },
    create: function() {
        game.state.start("TheGame");
    }
};

var TheGame = function() {};
TheGame.prototype = {
    create: function() {
        this.food = new Food(game, 3, 4);
        this.snake = new Snake(game, 8, 8);
        
        this.cursors = game.input.keyboard.createCursorKeys();
    },
    update: function() {
        if(!this.snake.alive) {
            return;
        }

        if(this.cursors.left.isDown) {
            this.snake.faceLeft();
        } else if(this.cursors.right.isDown) {
            this.snake.faceRight();
        } else if(this.cursors.up.isDown) {
            this.snake.faceUp();
        } else if(this.cursors.down.isDown) {
            this.snake.faceDown();
        }

        if(this.snake.update(game.time.now)) {
            if(this.snake.collideWithFood(this.food)) {
                this.repositionFood();
            }
        }
    },
    repositionFood: function() {
        var testGrid = [];

        for (var y = 0; y < 30; y++) {
            testGrid[y] = [];

            for (var x = 0; x < 40; x++) {
                testGrid[y][x] = true;
            }
        }

        this.snake.updateGrid(testGrid);

        var validLocations = [];

        for (var y = 0; y < 30; y++) {
            for (var x = 0; x < 40; x++) {
                if(testGrid[y][x] === true) {
                    validLocations.push({x:x, y:y});
                }
            }
        }

        if(validLocations.length > 0) {
            var pos = game.rnd.pick(validLocations);

            this.food.spr.position.set(pos.x * 16, pos.y * 16);

            return true;
        }

        return false;
    }
};