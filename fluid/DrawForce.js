var Program = require('pex-glu').Program
  , FBO = require('pex-glu').RenderTarget
  , FrameRenderer = require('./FrameRenderer')
  , Color = require('pex-color').Color
  , Vec2 = require('pex-geom').Vec2
  , Vec3 = require('pex-geom').Vec3
  , Vec4 = require('pex-geom').Vec4
  , fs = require('fs')
  , glu = require('pex-glu');

var shader = fs.readFileSync(__dirname + '/drawForce.glsl', 'utf8');

module.exports = DrawForce;

function DrawForce (options) {
  this.width = options.width;
  this.height = options.height;
  this.type = options.type || 'density';
  this.radius = 0.05;
  this.strength = 2.5;
  this.force = new Vec3(0.3, 0.7, 0.9);
  this.edge = 1;

  this.forceBuffer = new FBO(this.width, this.height, { bpp: 32 });
  this.density = new Color(1, 1, 1, 1);
  this.velocity = new Vec2(0,0);

  this.forceChanged = false;
  this.forceApplied = false;

  this._program = new Program(shader);
  this._frameRenderer = new FrameRenderer(0, 0, this.width, this.height,
                                                this.width, this.height);

}

DrawForce.prototype.applyForce = function (normalizedPos) {
  var absPos = normalizedPos.dup();
  absPos.x *= this.width;
  absPos.y *= this.height;
  var absRadius = this.radius * this.width;

  var typeForce = this.force.clone();
  if (this.type === 'velocity') {
    typeForce.x *= this.width;
    typeForce.y *= this.width;
  }

  var value = new Vec4(typeForce.x, typeForce.y, typeForce.z, 1.0);
  glu.enableAlphaBlending();
  this.forceBuffer.bind();
  this._program.use();
  // vert
  this._program.uniforms.screenSize(new Vec2(this.width, this.height));
  this._program.uniforms.pixelPosition(new Vec2(0, 0));
  this._program.uniforms.pixelSize(new Vec2(this.width, this.height));
  // frag
  this._program.uniforms.Point(absPos);
  this._program.uniforms.Width(this.width);
  this._program.uniforms.Height(this.height);
  this._program.uniforms.Radius(absRadius);
  this._program.uniforms.EdgeSmooth(this.edge);
  this._program.uniforms.Value(value);
  this._frameRenderer.draw(this._program);
  this.forceBuffer.unbind();
  glu.enableBlending(false);

  this.forceApplied = true;
}

DrawForce.prototype.clear = function () {
  this.forceBuffer.bind();
  glu.clearColor(Color.Black);
  this.forceBuffer.unbind();
}

DrawForce.prototype.update = function () {
  if (this.forceApplied) this.forceChanged = true;
  this.forceApplied = false;
}


