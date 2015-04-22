var glu = require('pex-glu')
  , FBO = glu.RenderTarget

function PingPong (options) {
  var options = options || {};
  this.width = options.width || 512;
  this.height = options.height || 512;
  this.fboOpts = options.fboOpts || {};

  this.sourceBuffer = new FBO(this.width, this.height, this.fboOpts);
  this.destBuffer = new FBO(this.width, this.height, this.fboOpts);
}

PingPong.prototype.swap = function () {
  var temp = this.sourceBuffer;
  this.sourceBuffer = this.destBuffer;
  this.destBuffer = temp;
}

PingPong.prototype.clear = function () {
  this.sourceBuffer.bindAndClear();
  this.sourceBuffer.unbind();
  this.destBuffer.bindAndClear();
  this.destBuffer.unbind();
}

module.exports = PingPong;

