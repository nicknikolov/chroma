var glu = require('pex-glu');
var Context = glu.Context;
var Program = glu.Program;
var fs = require('fs');
var shader = fs.readFileSync(__dirname + '/clampLength.glsl', 'utf8');
var Vec2 = require('pex-geom').Vec2;

function ClampLengthShader (width, height) {
  this.width = width || 512;
  this.height = height || 512;
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
  //vert
  this._program.uniforms.screenSize(new Vec2(this.width, this.height));
  this._program.uniforms.pixelPosition(new Vec2(0, 0));
  this._program.uniforms.pixelSize(new Vec2(this.width, this.height));
  //frag
  backBufferTex.bind(0);
  this._program.uniforms.Backbuffer(0);
  this._program.uniforms.MaxLength(max);
  this._program.uniforms.ClampForce(clampForce);
  frameRenderer.draw(this._program);
  destBuffer.unbind();

}

module.exports = ClampLengthShader;
