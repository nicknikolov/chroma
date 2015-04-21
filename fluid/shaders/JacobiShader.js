var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , fs = require('fs')
  , shader  = fs.readFileSync(__dirname + '/jacobi.glsl', 'utf8');

function JacobiShader () {
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
  backBufferTex.bind(0);
  this._program.uniforms.Pressure(0);
  divergenceTex.bind(1);
  this._program.uniforms.Divergence(1);
  obstacleTex.bind(2);
  this._program.uniforms.Obstacle(2);
  this._program.uniforms.Alpha(-cellSize * cellSize);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = JacobiShader;

