var game;

var gameOptions = {
    gameWidth: 400,
    gameHeight: 400,
    tileSize: 100,
    tileMargin: 10
};

var UP = 1;
var RIGHT = 2;
var DOWN = 3;
var LEFT = 4;
var EXIT = 5;
var PLAYER = 6;

function block() {
    var defaultBlock = {
        up: false,
        right: false,
        down: false,
        left: false,
        exit: false,
        player: false,
    };

    for (var i = 0; i < arguments.length; i++) {
        switch(arguments[i]) {
            case UP:
                defaultBlock.up = true;
                break;
            case RIGHT:
                defaultBlock.right = true;
                break;
            case DOWN:
                defaultBlock.down = true;
                break;
            case LEFT:
                defaultBlock.left = true;
                break;
            case EXIT:
                defaultBlock.exit = true;
                break;
            case PLAYER:
                defaultBlock.player = true;
                break;
        }
    }

    return defaultBlock;
}

var levels = [
    [
        [block(), block(LEFT, EXIT)],
        [block(RIGHT, PLAYER), block()]
    ],
    [
        [block(), block(RIGHT, EXIT)],
        [block(LEFT, PLAYER), block()]
    ],
    [
        [block(), block(UP, PLAYER)],
        [block(DOWN, EXIT), block()]
    ]
];

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("TheGame", TheGame, true);
};

var TheGame = function() {};

TheGame.prototype = {
    preload: function() {
        game.load.spritesheet("tile", "assets/sprites/tile.png", gameOptions.tileSize, gameOptions.tileSize);

        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.backgroundColor = 0x111111;
    },
    create: function() {
        this.level = 0;
        this.generateLevel();
    },
    generateLevel: function() {
        var tileAndMargin = gameOptions.tile + gameOptions.tileMargin;

        this.levelGroup = game.add.group();

        this.tempLevel = [];

        for (var i = 0; i < levels[this.level].length; i++) {
            this.tempLevel[i] = [];

            for (var j = 0; j < levels[this.level][i].length; j++) {
                var tile = game.add.image(jk * tileAndMargin + gameOptions.tileSize / 2, i * tileAndMargin + gameOptions.tileSize / 2, "tile");
                tile.anchor.set(0.5);

                this.levelGroup.add(tile);

                if(!levels[this.level][i][j].up && !levels[this.level][i][j].right && !levels[this.level][i][j].down && !levels[this.level][i][j].left) {
                    tile.frame = 0;
                } else {
                    if(levels[this.level][i][j].up) {
                        tile.frame = 1;
                    }

                    if(levels[this.level][i][j].right) {
                        tile.frame = 2;
                    }

                    if(levels[this.level][i][j].down) {
                        tile.frame = 3;
                    }

                    if(levels[this.level][i][j].left) {
                        tile.frame = 4;
                    }

                    if(levels[this.level][i][j].exit) {
                        var exit = game.add.image(0,0,"tile");
                        exit.anchor.set(0.5);
                        exit.frame = 6;
                        tile.addChild(exit);
                    }

                    if(levels[this.level][i][j].player) {
                        var player = game.add.image(0,0,"tile");
                        player.anchor.set(0.5);
                        player.frame = 5;
                        tile.addChild(player);
                    }
                }

                this.tempLevel[i][j] = {
                    up: levels[this.level][i][j].up,
                    right: levels[this.level][i][j].right,
                    down: levels[this.level][i][j].down,
                    left: levels[this.level][i][j].left,
                    exit: levels[this.level][i][j].exit,
                    player: levels[this.level][i][j].player,
                    sprite: tile
                }
            }
        }

        this.levelGroup.x = (game.width - this.levelGroup.width) / 2;
        this.levelGroup.y = (game.height - this.levelGroup.height) / 2;
    }
}