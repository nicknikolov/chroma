var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , fs = require('fs')
  , shader  = fs.readFileSync(__dirname + '/divergence.glsl', 'utf8');

function DivergenceShader () {
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
  velocityTex.bind(0);
  this._program.uniforms.Velocity(0);
  obstacleTex.bind(1);
  this._program.uniforms.Obstacle(1);
  this._program.uniforms.HalfInverseCellSize(0.5 / cellSize);
  frameRenderer.draw(this._program);
  destBuffer.unbind();
  
}

module.exports = DivergenceShader;
