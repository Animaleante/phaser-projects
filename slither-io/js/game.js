var Game = function(game){};
Game.prototype = {
    preload: function() {
        this.game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        this.game.scale.pageAlignHorizontally = true;
        this.game.scale.pageAlignVertically = true;

        this.game.load.image("circle", "assets/sprites/circle.png");
        this.game.load.image("background", "assets/sprites/tile.png");
    },
    create: function() {
        var width = this.game.width;
        var height = this.game.height;

        this.game.world.setBounds(-width, -height, width * 2, height * 2);
        this.game.stage.backgroundColor = "#444";

        var background = this.game.add.tileSprite(-width, -height, this.game.world.width, this.game.world.height, "background");

        this.game.physics.startSystem(Phaser.Physics.P2JS);

        this.game.snakes = [];

        var snake = new PlayerSnake(this.game, "circle", 0, 0);
        this.game.camera.follow(snake.head);

        new BotSnake(this.game, "circle", -200, 0);
        new BotSnake(this.game, "circle", 200, 0);
    },
    update: function() {
        for (var i = this.game.snakes.length - 1; i >= 0; i--) {
            this.game.snakes[i].update();
        }
    }
};