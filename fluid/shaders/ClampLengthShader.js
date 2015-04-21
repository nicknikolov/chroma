var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , fs = require('fs')
  , shader = fs.readFileSync(__dirname + '/clampLength.glsl', 'utf8');

function ClampLengthShader () {
  this._program = new Program(shader);
}

ClampLengthShader.prototype.update = function (options) {
  var destBuffer = options.destBuffer
    , backBufferTex = options.backBufferTex
    , max = options.max
    , clampForce = options.clampForce
    , frameRenderer = options.frameRenderer;

  if (!destBuffer) throw new Error("no destBuffer");
  if (!backBufferTex) throw new Error("no backBufferTex");
  if (!max) throw new Error("no max");
  if (!clampForce) throw new Error("no clampForce");
  if (!frameRenderer) throw new Error("no frameRenderer");

  destBuffer.bind();
  this._program.use();
  backBufferTex.bind(0);
  this._program.uniforms.Backbuffer(0);
  this._program.uniforms.MaxLength(max);
  this._program.uniforms.ClampForce(clampForce);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = ClampLengthShader;
