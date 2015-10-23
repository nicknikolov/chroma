var fx = require('pex-fx');
var FXStage = fx.FXStage;

FXStage.prototype.image = function (img) {
  return this.asFXStage(img, 'image');
};

module.exports = FXStage;