var game;

window.onload = function() {
    game = new Phaser.Game(640, 960, Phaser.CANVAS);
    game.state.add("TheGame", TheGame, true);
};

var TheGame = function() {};

TheGame.prototype = {
    preload: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        game.load.image("ground", "assets/sprites/ground.png");
        game.load.image("sky", "assets/sprites/sky.png");
        game.load.image("crate", "assets/sprites/crate.png");
    },
    create: function() {
        var sky = game.add.image(0,0,"sky");
        sky.width = game.width;

        this.crateGroup = game.add.group();

        game.physics.startSystem(Phaser.Physics.BOX2D);
        game.physics.box2d.gravity.y = 600;

        this.canDrop = true;

        this.movingCrate = game.add.sprite(50,50,"crate");
        this.movingCrate.anchor.set(0.5);

        var crateTween = game.add.tween(this.movingCrate).to({
            x: game.width - 50
        }, 800, Phaser.Easing.Linear.None, true, 0, -1, true);

        var ground = game.add.sprite(game.width / 2, game.height, "ground");
        ground.y = game.height - ground.height / 2;
        // ground.preUpdate();
        game.physics.box2d.enable(ground);
        ground.body.static = true;

        game.input.onDown.add(this.dropCreate, this);
    },
    dropCreate: function() {
        if(this.canDrop) {
            this.canDrop = false;

            this.movingCrate.alpha = 0;

            var fallingCrate = game.add.sprite(this.movingCrate.x, this.movingCrate.y, "crate");

            game.physics.box2d.enable(fallingCrate);

            this.crateGroup.add(fallingCrate);

            // fallingCrate.preUpdate();

            game.time.events.add(Phaser.Timer.SECOND / 2, function() {
                this.canDrop = true;
                this.movingCrate.alpha = 1;
                this.movingCrate.preUpdate();
            }, this);
        }
    },
    update: function() {
        this.crateGroup.forEach(function(i) {
            if(i.y > game.height + i.height)
                i.destroy();
        });
    }
};