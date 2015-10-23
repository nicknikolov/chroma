var geom = require('pex-geom');
var Vec2 = geom.Vec2;
var Geometry = geom.Geometry;
var glu = require('pex-glu');
var Program = glu.Program;
var Material = glu.Material;
var Mesh = glu.Mesh;
var fs = require('fs');

var shader = fs.readFileSync(__dirname + '/frameRenderer.glsl', 'utf8');

function FrameRenderer(x, y, w, h, screenWidth, screenHeight) {
  x = x !== undefined ? x : 0;
  y = y !== undefined ? y : 0;
  w = w !== undefined ? w : 1;
  h = h !== undefined ? h : 1;
  screenWidth = screenWidth !== undefined ? screenWidth : 1;
  screenHeight = screenHeight !== undefined ? screenHeight : 1;
  var program = new Program(shader);
  var uniforms = {
    screenSize: Vec2.create(screenWidth, screenHeight),
    pixelPosition: Vec2.create(x, y),
    pixelSize: Vec2.create(w, h),
    alpha: 1
  };
  var material = new Material(program, uniforms);
  var vertices = [
    new Vec2(-1, 1),
    new Vec2(-1, -1),
    new Vec2(1, -1),
    new Vec2(1, 1)
  ];
//  var vertices = [
//    new Vec2(-0.9, 0.9),
//    new Vec2(-0.9, -0.9),
//    new Vec2(0.9, -0.9),
//    new Vec2(0.9, 0.9)
//  ];
  var texCoords = [
    new Vec2(0, 1),
    new Vec2(0, 0),
    new Vec2(1, 0),
    new Vec2(1, 1)
  ];
  var geometry = new Geometry({
    vertices: vertices,
    texCoords: texCoords,
    faces: true
  });
  // 0----3  0,1   1,1
  // | \  |      u
  // |  \ |      v
  // 1----2  0,0   0,1
  geometry.faces.push([0, 1, 2]);
  geometry.faces.push([0, 2, 3]);
  this.mesh = new Mesh(geometry, material);
}

FrameRenderer.prototype.setAlpha = function (alpha) {
  this.mesh.material.uniforms.alpha = alpha;
};

FrameRenderer.prototype.setPosition = function (position) {
  this.mesh.material.uniforms.pixelPosition = position;
};

FrameRenderer.prototype.setSize = function (size) {
  this.mesh.material.uniforms.pixelSize = size;
};

FrameRenderer.prototype.setScreenSize = function (size) {
  this.mesh.material.uniforms.screenSize = size;
};

FrameRenderer.prototype.setBounds = function (bounds) {
  this.mesh.material.uniforms.pixelPosition.x = bounds.x;
  this.mesh.material.uniforms.pixelPosition.y = bounds.y;
  this.mesh.material.uniforms.pixelSize.x = bounds.width;
  this.mesh.material.uniforms.pixelSize.y = bounds.height;
};

FrameRenderer.prototype.draw = function (program) {
  this.mesh.setProgram(program);
  this.mesh.draw();
};

module.exports = FrameRenderer;
