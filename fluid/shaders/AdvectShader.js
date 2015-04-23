var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , fs = require('fs')
  , shader = fs.readFileSync(__dirname + '/advect.glsl', 'utf8')
  , Vec2 = require('pex-geom').Vec2;

function AdvectShader (width, height) {
  this.width = width || 512;
  this.height = height || 512;
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
    , frameRenderer = options.frameRenderer
    , type = options.type || 'nope';

  if (!destBuffer) throw new Error("no destBuffer");
  if (!backBufferTex) throw new Error("no backBufferTex");
  if (!velocityTex) throw new Error("no velocityTex");
  if (!obstacleTex) throw new Error("no obstacleTex");
  if (!timeStep) console.log("no timestep");
  if (!dissipation) throw new Error("no dissipation");
  if (!cellSize) throw new Error("no cellSize");
  if (!frameRenderer) throw new Error("no frameRenderer");

  destBuffer.bind();
  this._program.use();
  //vert
  this._program.uniforms.screenSize(new Vec2(this.width, this.height));
  this._program.uniforms.pixelPosition(new Vec2(0, 0));
  this._program.uniforms.pixelSize(new Vec2(this.width, this.height));
  //frag
  backBufferTex.bind(0);
  this._program.uniforms.Backbuffer(0);
  velocityTex.bind(1);
  this._program.uniforms.Velocity(1);
  obstacleTex.bind(2);
  this._program.uniforms.Obstacle(2);
  this._program.uniforms.Width(this.width);
  this._program.uniforms.Height(this.height);
  this._program.uniforms.TimeStep(timeStep);
  this._program.uniforms.Dissipation(dissipation);
  this._program.uniforms.InverseCellSize(1.0 / cellSize);
  var scale = new Vec2(velocityTex.width / destBuffer.width,
      velocityTex.height / destBuffer.height);
  this._program.uniforms.Scale(scale);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = AdvectShader;

