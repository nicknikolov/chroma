var glu = require('pex-glu');
var Context = glu.Context;
var Program = glu.Program;
var fs = require('fs');
var shader  = fs.readFileSync(__dirname + '/jacobi.glsl', 'utf8');
var Vec2 = require('pex-geom').Vec2;

function JacobiShader (width, height) {
  this.width = width || 512;
  this.height = height || 512;
  this._program = new Program(shader);
}

JacobiShader.prototype.update = function (options) {
  var destBuffer = options.destBuffer
    , backBufferTex = options.backBufferTex
    , obstacleTex = options.obstacleTex
    , divergenceTex = options.divergenceTex
    , cellSize = options.cellSize
    , frameRenderer = options.frameRenderer;

  if (!destBuffer) throw new Error("no destBuffer");
  if (!backBufferTex) throw new Error("no backBufferTex");
  if (!obstacleTex) throw new Error("no obstacleTex");
  if (!divergenceTex) throw new Error("no divergenceTex");
  if (!frameRenderer) throw new Error("no frameRenderer");

  destBuffer.bind();
  this._program.use();
  //vert
  this._program.uniforms.screenSize(new Vec2(this.width, this.height));
  this._program.uniforms.pixelPosition(new Vec2(0, 0));
  this._program.uniforms.pixelSize(new Vec2(this.width, this.height));
  //frag
  backBufferTex.bind(0);
  this._program.uniforms.Pressure(0);
  divergenceTex.bind(1);
  this._program.uniforms.Divergence(1);
  obstacleTex.bind(2);
  this._program.uniforms.Obstacle(2);
  this._program.uniforms.Width(this.width);
  this._program.uniforms.Height(this.height);
  this._program.uniforms.Alpha(-cellSize * cellSize);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = JacobiShader;

