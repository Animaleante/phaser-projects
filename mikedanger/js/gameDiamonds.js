var game;

var gameOptions = {
    gameWidth: 800,
    gameHeight: 1300,
    floorStart: 1 / 8 * 5,
    floorGap: 250,
    playerGravity: 10000,
    playerSpeed: 450,
    climbSpeed: 450,
    playerJump: 1800,
    diamondRatio: 2
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
        game.stage.backgroundColor = 0xaaeaff;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.stage.disableVisibilityChange = true;

        game.load.image("ground", "assets/sprites/ground.png");
        game.load.image("hero", "assets/sprites/hero.png");
        game.load.image("ladder", "assets/sprites/ladder.png");
        game.load.image("diamond", "assets/sprites/diamond.png");
    },
    create: function() {
        game.state.start("TheGame");
    }
};

var TheGame = function(){};
TheGame.prototype = {
    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        this.canJump = true;
        this.isClimbing = false;

        this.defineGroups();
        this.drawLevel();
        this.defineTweens();

        game.input.onTap.add(this.handleTap, this);
    },
    drawLevel: function() {
        this.currentFloor = 0;
        this.currentLadder = 0;
        this.highestFloorY = game.height * gameOptions.floorStart;

        this.floorArray = [];
        this.ladderArray = [];

        this.diamondArray = [null];
        this.diamondPool = [];

        while(this.highestFloorY > - 3 * gameOptions.floorGap) {
            this.addFloor();

            if(this.currentFloor > 0) {
                this.addLadder();
                this.addDiamond();
            }

            this.highestFloorY -= gameOptions.floorGap;
            this.currentFloor++;
        }

        this.currentFloor = 0;
        this.addHero();
    },
    addDiamond: function() {
        if(game.rnd.integerInRange(0, gameOptions.diamondRatio) !== 0) {
            var diamond = game.add.sprite(game.rnd.integerInRange(150, game.width - 150), this.highestFloorY - gameOptions.floorGap / 2, "diamond");
            diamond.anchor.set(0.5, 0);
            game.physics.enable(diamond, Phaser.Physics.ARCADE);
            diamond.body.immovable = true;
            this.diamondGroup.add(diamond);
            this.diamondArray[this.currentFloor] = diamond;
        } else {
            this.diamondArray[this.currentFloor] = null;
        }
    },
    reviveDiamond: function() {
        if(game.rnd.integerInRange(0, gameOptions.diamondRatio) !== 0) {
            if(this.diamondPool.length > 0) {
                var diamond = this.diamondPool.pop();
                diamond.y = this.highestFloorY - gameOptions.floorGap / 2;
                diamond.revive();
                this.diamondArray[this.currentFloor] = diamond;
            } else {
                var diamond = game.add.sprite(game.rnd.integerInRange(150, game.width - 150), this.highestFloorY - gameOptions.floorGap / 2, "diamond");
                diamond.anchor.set(0.5, 0);
                game.physics.enable(diamond, Phaser.Physics.ARCADE);
                diamond.body.immovable = true;
                this.diamondGroup.add(diamond);
                this.diamondArray[this.currentFloor] = diamond;
            }
        }
    },
    addFloor: function() {
        var floor = game.add.sprite(0, this.highestFloorY, "ground");
        this.floorGroup.add(floor);
        game.physics.enable(floor, Phaser.Physics.ARCADE);
        floor.body.immovable = true;
        floor.body.checkCollision.down = false;
        this.floorArray.push(floor);
    },
    addLadder: function() {
        var ladder = game.add.sprite(100 + (game.width - 200) * (this.currentFloor % 2), this.highestFloorY, "ladder");
        this.ladderGroup.add(ladder);
        ladder.anchor.set(0.5,0);
        game.physics.enable(ladder, Phaser.Physics.ARCADE);
        ladder.body.immovable = true;
        this.ladderArray.push(ladder);
    },
    addHero: function() {
        this.hero = game.add.sprite(game.width / 2, game.height * gameOptions.floorStart - 40, "hero");
        this.gameGroup.add(this.hero);
        this.hero.anchor.set(0.5, 0);
        game.physics.enable(this.hero, Phaser.Physics.ARCADE);
        this.hero.body.collideWorldBounds = true;
        this.hero.body.gravity.y = gameOptions.playerGravity;
        this.hero.body.velocity.x = gameOptions.playerSpeed;
        this.hero.body.onWorldBounds = new Phaser.Signal();
        this.hero.body.onWorldBounds.add(function(sprite, up, down, left, right) {
            if(left) {
                this.hero.body.velocity.x = gameOptions.playerSpeed;
            } else if(right) {
                this.hero.body.velocity.x = -gameOptions.playerSpeed;
            }
        }, this);
    },
    defineTweens: function() {
        this.scrollTween = game.add.tween(this.gameGroup).to({
            y: gameOptions.floorGap
        }, 800, Phaser.Easing.Cubic.Out);

        this.scrollTween.onComplete.add(function() {
            this.gameGroup.y = 0;
            this.floorGroup.forEach(function(item) {
                item.y += gameOptions.floorGap;
            }, this);
            this.ladderGroup.forEach(function(item) {
                item.y += gameOptions.floorGap;
            }, this);
            this.diamondGroup.forEach(function(item) {
                item.y += gameOptions.floorGap;
            }, this);
            this.hero.y += gameOptions.floorGap;
        }, this);

        this.fadeTween =game.add.tween(this.floorArray[0]).to({
            alpha: 0
        }, 200, Phaser.Easing.Cubic.Out);

        this.fadeTween.onComplete.add(function(floor) {
            floor.y = this.highestFloorY;
            floor.alpha = 1;
        }, this);
    },
    defineGroups: function() {
        this.gameGroup = game.add.group();
        this.floorGroup = game.add.group();
        this.ladderGroup = game.add.group();
        this.diamondGroup = game.add.group();
        this.gameGroup.add(this.floorGroup);
        this.gameGroup.add(this.ladderGroup);
        this.gameGroup.add(this.diamondGroup);
    },
    handleTap: function(pointer, doubleTap) {
        if(this.canJump && !this.isClimbing) {
            this.hero.body.velocity.y = -gameOptions.playerJump;
            this.canJump = false;
        }
    },
    update: function() {
        this.checkFloorCollision();
        this.checkLadderCollision();
        this.checkDiamondCollision();
        this.heroOnLadder();
    },
    checkFloorCollision: function() {
        game.physics.arcade.collide(this.hero, this.floorArray, function() {
            this.canJump = true;
        }, null, this);
    },
    checkLadderCollision: function() {
        game.physics.arcade.overlap(this.hero, this.ladderArray, function(player, ladder) {
            if(!this.isClimbing && Math.abs(player.x - ladder.x) < 10) {
                this.hero.body.velocity.x = 0;
                this.hero.body.velocity.y = - gameOptions.climbSpeed;
                this.hero.body.gravity.y = 0;
                this.isClimbing = true;
                this.fadeTween.target = this.floorArray[this.currentFloor];
                this.fadeTween.start();
                if(this.diamondArray[this.currentFloor] !== null) {
                    this.killDiamond();
                }
                this.reviveDiamond();
                this.currentFloor = (this.currentFloor + 1) % this.floorArray.length;
                this.scrollTween.start();
            }
        }, null, this);
    },
    checkDiamondCollision: function() {
        game.physics.arcade.overlap(this.hero, this.diamondArray, function(player, diamond) {
            this.killDiamond();
        }, null, this);
    },
    killDiamond: function() {
        this.diamondArray[this.currentFloor].kill();
        this.diamondPool.push(this.diamondArray[this.currentFloor]);
        this.diamondArray[this.currentFloor] = null;
    },
    heroOnLadder: function() {
        if(this.isClimbing && this.hero.y <= this.floorArray[this.currentFloor].y - 40) {
            this.hero.body.gravity.y = gameOptions.playerGravity;
            this.hero.body.velocity.x = gameOptions.playerSpeed * this.hero.scale.x;
            this.hero.body.velocity.y = 0;
            this.isClimbing = false;
            this.fadeTween.target = this.ladderArray[this.currentLadder];
            this.fadeTween.start();
            this.currentLadder = (this.currentLadder + 1) % this.ladderArray.length;
        }
    }
};