var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , fs = require('fs')
  , shader = fs.readFileSync(__dirname + '/substractGradient.glsl', 'utf8');

function SubstractGradientShader () {
  this._program = new Program(shader);
}

SubstractGradientShader.prototype.update = function (options) {
  var destBuffer = options.destBuffer
    , backBufferTex = options.backBufferTex
    , pressureTex = options.pressureTex
    , obstacleTex = options.obstacleTex
    , cellSize = options.cellSize
    , frameRenderer = options.frameRenderer;

  if (!destBuffer) throw new Error("no destBuffer");
  if (!backBufferTex) throw new Error("no backBufferTex");
  if (!pressureTex) throw new Error("no pressureTex");
  if (!obstacleTex) throw new Error("no obstacleTex");
  if (!cellSize) throw new Error("no cellSize");
  if (!frameRenderer) throw new Error("no frameRenderer");

  destBuffer.bind();
  this._program.use();
  backBufferTex.bind(0);
  this._program.uniforms.Velocity(0);
  pressureTex.bind(1);
  this._program.uniforms.Pressure(1);
  obstacleTex.bind(2);
  this._program.uniforms.Obstacle(2);
  this._program.uniforms.HalfInverseCellSize(0.5 / cellSize);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = SubstractGradientShader;

