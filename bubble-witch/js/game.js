var game;

var gameOptions = {
    gameWidth: 600,
    gameHeight: 800,
    bubbleWidth: 75,
    levelLines: 2,
    maxLines: 10,
    bubbleSpeed: 600,
    colors: [0xff0000, 0x00ff00, 0x0000ff]
};

window.onload = function() {
    game = new Phaser.Game(gameOptions.gameWidth, gameOptions.gameHeight);
    game.state.add("PreloadGame", PreloadGame);
    game.state.add("TheGame", TheGame);
    game.state.start("PreloadGame");
};

var PreloadGame = function(){};
PreloadGame.prototype = {
    preload: function() {
        game.stage.backgroundColor = 0xdcdcdc;

        // game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        // game.load.image("circle", "assets/sprites/circle.png");
        game.load.image("circle", "assets/sprites/circle2.png");
    },
    create: function() {
        game.state.start("TheGame");
    }
};

var TheGame = function(){};
TheGame.prototype = {
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.bubbleGroup = game.add.group();
        this.bubbleArray = [];

        this.graphics = game.add.graphics();

        this.shooting = false;

        this.throwPoint = new Phaser.Point(game.width / 2, game.height / 8 * 7);

        // var verticalOffset = gameOptions.bubbleWidth / 15 * 13;
        var verticalOffset = 65;
        var horizontalOffset = gameOptions.bubbleWidth;
        var startX;
        var startY;
        var startXInit = gameOptions.bubbleWidth / 2;
        var startYInit = gameOptions.bubbleWidth / 2;
        var bubble;

        for (var i = 0; i < gameOptions.maxLines; i++) {
            this.bubbleArray[i] = [];

            if(i < gameOptions.levelLines) {
                if(i % 2 !== 0)
                    startX = 2 * startXInit;
                else
                    startX = startXInit;

                startY = startYInit + (i*verticalOffset);

                for (var j = 0; j < Math.floor(gameOptions.gameWidth / gameOptions.bubbleWidth); j++) {

                    if((i % 2 !== 0) && (j + 1) == Math.floor(gameOptions.gameWidth / gameOptions.bubbleWidth))
                        break;

                    bubble = game.add.sprite(startX, startY, "circle");
                    bubble.anchor.set(0.5);
                    bubble.row = i;
                    bubble.col = j;
                    bubble.val = game.rnd.integerInRange(0, gameOptions.colors.length - 1);
                    bubble.tint = gameOptions.colors[bubble.val];
                    bubble.rooted = i === 0 ? true : false;

                    game.physics.enable(bubble, Phaser.Physics.ARCADE);
                    bubble.body.setCircle(gameOptions.bubbleWidth / 2);
                    bubble.body.immovable = true;

                    this.bubbleGroup.add(bubble);
                    this.bubbleArray[i][j] = bubble;

                    startX += horizontalOffset;
                }
            }
        }

        this.createThrowBubble();

        game.input.onDown.add(this.beginTouch, this);
    },
    createThrowBubble: function() {
        this.throwBubble = game.add.sprite(this.throwPoint.x, this.throwPoint.y, "circle");
        this.throwBubble.anchor.set(0.5);
        this.throwBubble.val = game.rnd.integerInRange(0, gameOptions.colors.length - 1);
        this.throwBubble.tint = gameOptions.colors[this.throwBubble.val];
    },
    beginTouch: function(e) {
        game.input.onDown.remove(this.beginTouch, this);

        game.input.onUp.add(this.endTouch, this);
        game.input.addMoveCallback(this.moveAim, this);

        this.drawAim(e.position);
    },
    endTouch: function(e) {
        this.graphics.clear();

        game.input.onUp.remove(this.endTouch, this);
        game.input.deleteMoveCallback(this.moveAim, this);

        this.launchBubble(e.position);
    },
    moveAim: function(e) {
        this.drawAim(e.position);
    },
    drawAim: function(touchPoint) {
        this.graphics.clear();

        var distance = Phaser.Point.subtract(touchPoint, this.throwPoint);
        var normal = Phaser.Point.normalize(distance);
        var toPoint = Phaser.Point.add(this.throwPoint, normal.multiply(100,100));

        if(toPoint.angle(this.throwPoint, true) > 0) {
            this.graphics.lineStyle(2, 0xffffff, 1);
            this.graphics.moveTo(this.throwPoint.x, this.throwPoint.y);
            this.graphics.lineTo(toPoint.x, toPoint.y);
            this.graphics.endFill();
        }
    },
    launchBubble: function(toPoint) {
        var distance = Phaser.Point.subtract(toPoint, this.throwPoint);
        var normal = Phaser.Point.normalize(distance);
        var dirPoint = Phaser.Point.add(this.throwPoint, normal);

        if(dirPoint.angle(this.throwPoint, true) > 0) {
            game.physics.enable(this.throwBubble, Phaser.Physics.ARCADE);
            this.throwBubble.body.setCircle(gameOptions.bubbleWidth / 2);
            this.throwBubble.body.collideWorldBounds = true;
            this.throwBubble.body.bounce.setTo(1);
            this.throwBubble.body.velocity.set(normal.x * gameOptions.bubbleSpeed,normal.y * gameOptions.bubbleSpeed);

            this.shooting = true;
        } else {
            game.input.onDown.add(this.beginTouch, this);
        }
    },
    update: function() {
        if(this.shooting) {
            game.physics.arcade.collide(this.throwBubble, this.bubbleGroup, function(thrown, collided) {
                if(!this.shooting) return;

                this.shooting = false;

                thrown.body.velocity.set(0);
                thrown.body.bounce.setTo(0);
                thrown.body.immovable = true;
                thrown.body.collideWorldBounds = false;

                var row = Math.min(gameOptions.maxLines, Math.round(thrown.y / gameOptions.bubbleWidth));
                var col = 0;
                if(row % 2 === 0)
                    col = Math.max(0,Math.min(7, Math.floor(thrown.x / gameOptions.bubbleWidth)));
                else
                    col = Math.max(0, Math.min(6, Math.round((thrown.x - gameOptions.bubbleWidth) / gameOptions.bubbleWidth)));

                thrown.y = gameOptions.bubbleWidth / 2 + (row * 65);
                thrown.x = (row % 2 === 0 ? gameOptions.bubbleWidth / 2  : gameOptions.bubbleWidth) + (col * gameOptions.bubbleWidth);

                thrown.body.reset(thrown.x, thrown.y);

                thrown.row = row;
                thrown.col = col;

                this.bubbleGroup.add(thrown);
                this.bubbleArray[row][col] = thrown;

                // this.checkForMatches(thrown);

                this.createThrowBubble();
                game.input.onDown.add(this.beginTouch, this);
            }, null, this);
        }
    },
    /*render: function() {
        if(this.shooting) {
            // game.debug.spriteBounds(this.throwBubble);
            game.debug.body(this.throwBubble);
            this.bubbleGroup.forEach(function(spr) {
                game.debug.body(spr);
            }, this);
        }
    },*/
    checkForMatches: function(bubble) {
        var matches = [bubble];

        var neighbors;
        var curIndex = 0;
        while(curIndex < matches.length)
        {
            neighbors = this.getNeighborsOfVal(matches[curIndex].col, matches[curIndex].row, matches[curIndex].val);

            neighbors.map(function(neighbor) {
                if(matches.indexOf(neighbor) === -1)
                    matches.push(neighbor);
            });
            curIndex++;
        }

        if(matches.length >= 3){
            this.removeMatches(matches);
            this.checkForHangingBubble();

            if(this.bubbleGroup.length === 0)
                game.state.start("TheGame");
        }

    },
    removeMatches: function(matches) {
        matches.forEach(function(bubble) {
            this.bubbleGroup.remove(bubble);
            delete this.bubbleArray[bubble.row][bubble.col];
        }, this);
    },
    checkForHangingBubble: function() {
        var matches = [];

        this.bubbleGroup.forEach(function(bubble) {
            // TODO - The bubble may have neighbors, but none of them lead to a "rooted" bubble
            if(this.getNeighbors(bubble.col, bubble.row).length === 0 && !bubble.rooted)
                matches.push(bubble);
        }, this);

        this.removeMatches(matches);
    },
    getNeighbors: function(col, row) {
        var neighbors = [];

        var isOdd = row % 2 !== 0;

        var neighbor = this.getBubble(col-(isOdd?0:1), row-1);
        if(neighbor !== null) neighbors.push(neighbor);

        neighbor = this.getBubble(col+(isOdd?1:0), row-1);
        if(neighbor !== null) neighbors.push(neighbor);

        neighbor = this.getBubble(col-1, row);
        if(neighbor !== null) neighbors.push(neighbor);

        neighbor = this.getBubble(col+1, row);
        if(neighbor !== null) neighbors.push(neighbor);

        neighbor = this.getBubble(col-(isOdd?0:1), row+1);
        if(neighbor !== null) neighbors.push(neighbor);

        neighbor = this.getBubble(col+(isOdd?1:0), row+1);
        if(neighbor !== null) neighbors.push(neighbor);

        return neighbors;
    },
    getNeighborsOfVal: function(col, row, val) {
        var neighbors = [];

        var isOdd = row % 2 !== 0;

        var neighbor = this.getBubble(col-(isOdd?0:1), row-1);
        if(neighbor !== null && neighbor.val === val)
            neighbors.push(neighbor);

        neighbor = this.getBubble(col+(isOdd?1:0), row-1);
        if(neighbor !== null && neighbor.val === val)
            neighbors.push(neighbor);

        neighbor = this.getBubble(col-1, row);
        if(neighbor !== null && neighbor.val === val)
            neighbors.push(neighbor);

        neighbor = this.getBubble(col+1, row);
        if(neighbor !== null && neighbor.val === val)
            neighbors.push(neighbor);

        neighbor = this.getBubble(col-(isOdd?0:1), row+1);
        if(neighbor !== null && neighbor.val === val)
            neighbors.push(neighbor);

        neighbor = this.getBubble(col+(isOdd?1:0), row+1);
        if(neighbor !== null && neighbor.val === val)
            neighbors.push(neighbor);

        return neighbors;
    },
    getBubble: function(col, row) {
        return this.bubbleArray[row] && this.bubbleArray[row][col] ? this.bubbleArray[row][col] : null;
    }
};