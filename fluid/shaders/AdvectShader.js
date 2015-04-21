var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , fs = require('fs')
  , shader = fs.readFileSync(__dirname + '/advect.glsl', 'utf8');

function AdvectShader () {
  this._program = new Program(shader);
}

AdvectShader.prototype.update = function (options) {
  var destBuffer = options.destBuffer
    , backBufferTex = options.backBufferTex
    , velocityTex = options.velocityTex
    , obstacleTex = options.obstacleTex
    , timeStep = options.timeStep
    , dissipation = options.dissipation
    , cellSize = options.cellSize
    , frameRenderer = options.frameRenderer;

  if (!destBuffer) throw new Error("no destBuffer");
  if (!backBufferTex) throw new Error("no backBufferTex");
  if (!velocityTex) throw new Error("no velocityTex");
  if (!obstacleTex) throw new Error("no obstacleTex");
  //if (!timeStep) throw new Error("no timeStep");
  if (!dissipation) throw new Error("no dissipation");
  if (!cellSize) throw new Error("no cellSize");
  if (!frameRenderer) throw new Error("no frameRenderer");

  destBuffer.bind();
  this._program.use();
  backBufferTex.bind(0);
  this._program.uniforms.Backbuffer(0);
  velocityTex.bind(1);
  this._program.uniforms.Velocity(1);
  obstacleTex.bind(2);
  this._program.uniforms.Obstacle(2);
  this._program.uniforms.TimeStep(timeStep);
  this._program.uniforms.Dissipation(dissipation);
  this._program.uniforms.InverseCellSize(1.0 / cellSize);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = AdvectShader;

