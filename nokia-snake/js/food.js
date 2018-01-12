var Food = function(game, x, y) {
    this.game = game;

    this.spr = this.game.add.sprite(x * 16, y * 16, 'food');
    this.spr.anchor.set(0);

    this.total = 0;
};

Food.prototype.eat = function()
{
    this.total++;

    /*var x = Phaser.Math.between(0,39);
    var y = Phaser.Math.between(0,29);

    this.spr.position.set(x * 16, y * 16);*/
};