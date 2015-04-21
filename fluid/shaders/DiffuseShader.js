var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , fs = require('fs')
  , shader  = fs.readFileSync(__dirname + '/diffuse.glsl', 'utf8');

function DiffuseShader () {
  this._program = new Program(shader); 
}

DiffuseShader.prototype.update = function (options) {
  var destBuffer = options.destBuffer
    , backBufferTex = options.backBufferTex
    , obstacleTex = options.obstacleTex
    , viscosity = options.viscosity
    , frameRenderer = options.frameRenderer;

  if (!destBuffer) throw new Error("no destBuffer");
  if (!backBufferTex) throw new Error("no backBufferTex");
  if (!obstacleTex) throw new Error("no obstacleTex");
  //if (!viscosity) throw new Error("no viscosity");
  if (!frameRenderer) throw new Error("no frameRenderer");

  destBuffer.bind();
  this._program.use();
  backBufferTex.bind(0);
  this._program.uniforms.Velocity(0);
  obstacleTex.bind(1);
  this._program.uniforms.Obstacle(1);
  this._program.uniforms.Viscosity(viscosity);
  this._program.uniforms.C(1 + 4 * viscosity);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = DiffuseShader;


