var glu = require('pex-glu');
var Context = glu.Context;
var Program = glu.Program;
var fs = require('fs');
var shader  = fs.readFileSync(__dirname + '/divergence.glsl', 'utf8');
var Vec2 = require('pex-geom').Vec2;

function DivergenceShader (width, height) {
  this.width = width || 512;
  this.height = height || 512;
  this._program = new Program(shader);
}

DivergenceShader.prototype.update = function (options) {
  var destBuffer = options.destBuffer
    , velocityTex = options.velocityTex
    , obstacleTex = options.obstacleTex
    , cellSize = options.cellSize
    , frameRenderer = options.frameRenderer;

  if (!destBuffer) throw new Error("no destBuffer");
  if (!velocityTex) throw new Error("no velocityTex");
  if (!obstacleTex) throw new Error("no obstacleTex");
  if (!cellSize) throw new Error("no cellSize");
  if (!frameRenderer) throw new Error("no frameRenderer");

  destBuffer.bind();
  this._program.use();
  //vert
  this._program.uniforms.screenSize(new Vec2(this.width, this.height));
  this._program.uniforms.pixelPosition(new Vec2(0, 0));
  this._program.uniforms.pixelSize(new Vec2(this.width, this.height));
  //frag
  velocityTex.bind(0);
  this._program.uniforms.Velocity(0);
  obstacleTex.bind(1);
  this._program.uniforms.Obstacle(1);
  this._program.uniforms.Width(this.width);
  this._program.uniforms.Height(this.height);
  this._program.uniforms.HalfInverseCellSize(0.5 / cellSize);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = DivergenceShader;
