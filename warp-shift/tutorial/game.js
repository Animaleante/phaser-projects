// the game itself
var game;

// this object contains all customizable game options
// changing them will affect gameplay
var gameOptions = {

    // game width, in pixels
	gameWidth: 400,

    // game height, in pixels
	gameHeight: 400,

     // tile size, in pixels
    tileSize: 100,

    // margin between two tiles, in pixels
    tileMargin: 10
}

// some constants (actually they are variables) where to store tile properties
var UP = 1;
var RIGHT = 2;
var DOWN = 3;
var LEFT = 4;
var EXIT = 5;
var PLAYER = 6;

// function to create a block object
function block(){

    // this is the default block object
    var defaultBlock = {

        // can't walk through top side
        up: false,

        // can't walk through right side
        right: false,

        // can't walk through bottom side
        down: false,

        // can't walk through left side
        left: false,

        // there's no level exit on this block
        exit: false,

        // the player is not on this block
        player: false
    }

    // looping through all function arguments, if any
    for(var i = 0; i < arguments.length; i++){

        // checking the i-th argument
        switch(arguments[i]){

            // if it's UP, then set defaultBlock's "up" key to true
            case UP:
                defaultBlock.up = true;
                break;

            // if it's RIGHT, then set defaultBlock's "right" key to true
            case RIGHT:
                defaultBlock.right = true;
                break;

            // if it's DOWN, then set defaultBlock's "down" key to true
            case DOWN:
                defaultBlock.down = true;
                break;

            // if it's LEFT, then set defaultBlock's "left" key to true
            case LEFT:
                defaultBlock.left = true;
                break;

            // if it's EXIT, then set defaultBlock's "exit" key to true
            case EXIT:
                defaultBlock.exit = true;
                break;

            // if it's PLAYER, then set defaultBlock's "player" key to true
            case PLAYER:
                defaultBlock.player = true;
                break;
        }
    }
    return defaultBlock;
}

var levels = [

    // level 1
    [
        [block(), block(LEFT, EXIT)],
        [block(RIGHT, PLAYER), block()]
    ],

    // level 2
    [
        [block(), block(RIGHT, EXIT)],
        [block(LEFT, PLAYER), block()]
    ],

    // level 3
    [
        [block(), block(UP, PLAYER)],
        [block(DOWN, EXIT), block()]
    ]
]

// function to be execute once the page loads
window.onload = function() {

    // creation of a new Phaser Game
	game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);

    // adding "TheGame" state
    game.state.add("TheGame", TheGame);

    // launching "TheGame" state
    game.state.start("TheGame");
}

/* ****************** TheGame state ****************** */

var TheGame = function(){};

TheGame.prototype = {

    // function to be executed when the game preloads
    preload: function(){

        // load the spritesheet with all tiles
        game.load.spritesheet("tile", "assets/sprites/tile.png", gameOptions.tileSize, gameOptions.tileSize);

        // scaling the game to cover the entire screen, while keeping its ratio
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        // horizontally centering the game
		game.scale.pageAlignHorizontally = true;

        // vertically centering the game
		game.scale.pageAlignVertically = true;

        // set background color
        game.stage.backgroundColor = 0x111111;
    },

    // function to be executed as soon as the game has completely loaded
  	create: function(){

        // we start from level 0
        this.level = 0;

        // this method generates a level
        this.generateLevel();
  	},

    // function to generate a level
    generateLevel: function(){

        // tileAndMargin is the sum of tile and margin size
        var tileAndMargin = gameOptions.tileSize + gameOptions.tileMargin;

        // creation of a group where to place level items
        this.levelGroup = game.add.group();

        // temporary array to store the level so we don't need to modify the original levels
        this.tempLevel = [];

        // looping through level rows
        for(var i = 0; i < levels[this.level].length; i++){

            // preparing the temporary array to store the i-th row
            this.tempLevel[i] = [];

            // looping through level columns
            for(var j = 0; j < levels[this.level][i].length; j++){

                // adding the tile on the stage
                var tile = game.add.image(j * tileAndMargin + gameOptions.tileSize / 2, i * tileAndMargin + gameOptions.tileSize / 2, "tile");

                // set tile registration point to its center
                tile.anchor.set(0.5);

                // adding tile to level group
                this.levelGroup.add(tile);

                // now it's time to assign the tile a frame. If there is no exit, it's frame zero
                if(!levels[this.level][i][j].up && !levels[this.level][i][j].right && !levels[this.level][i][j].down && !levels[this.level][i][j].left){
                    tile.frame = 0;
                }
                else{

                    // if there's an exit on the top, it's frame one
                    if(levels[this.level][i][j].up){
                        tile.frame = 1
                    }

                    // if there's an exit on the right, it's frame two
                    if(levels[this.level][i][j].right){
                        tile.frame = 2;
                    }

                    // if there's an exit on the bottom, it's frame three
                    if(levels[this.level][i][j].down){
                        tile.frame = 3;
                    }

                    // if there's an exit on the left, it's frame four
                    if(levels[this.level][i][j].left){
                        tile.frame = 4;
                    }

                    // if there's the level exit...
                    if(levels[this.level][i][j].exit){

                        // we add the exit tile
                        var exit = game.add.image(0, 0, "tile");

                        // set exit tile registration point to its center
                        exit.anchor.set(0.5);

                        // assign exit tile frame six
                        exit.frame = 6;

                        // set exit tile as a child of current tile
                        tile.addChild(exit);
                    }

                    // if there's the player...
                    if(levels[this.level][i][j].player){

                        // we add the player tile
                        var player = game.add.image(0, 0, "tile");

                        // set player tile registration point to its center
                        player.anchor.set(0.5);

                        // assign player tile frame five
                        player.frame = 5;

                        // set player tile as a child of current tile
                        tile.addChild(player)
                    }
                }

                // now copying original level item into temporary level item
                this.tempLevel[i][j] = {
                    up:  levels[this.level][i][j].up,
                    right: levels[this.level][i][j].right,
                    down: levels[this.level][i][j].down,
                    left: levels[this.level][i][j].left,
                    exit: levels[this.level][i][j].exit,
                    player: levels[this.level][i][j].player,

                    // here we store the tile
                    sprite: tile
                }
            }
        }

        // center the group on the stage
        this.levelGroup.x = (game.width - this.levelGroup.width) / 2;
        this.levelGroup.y = (game.height - this.levelGroup.width) /2;
    }
}
