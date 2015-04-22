var glu = require('pex-glu')
  , Context = glu.Context
  , Program = glu.Program
  , FBO = glu.RenderTarget
  , Texture2D = glu.Texture2D
  , ScreenImage = glu.ScreenImage
  , Color = require('pex-color').Color
  , Material = require('../pex-hacks/Material.js')
  , merge = require('merge')
  , sys = require('pex-sys')
  , fs = require('fs')
  , PingPong = require('./PingPong.js')
  //Shaders
  , AdvectShader = require('./shaders/AdvectShader.js')
  , ClampLengthShader = require('./shaders/ClampLengthShader.js')
  , DiffuseShader = require('./shaders/DiffuseShader.js')
  , DivergenceShader = require('./shaders/DivergenceShader.js')
  , JacobiShader = require('./shaders/JacobiShader.js')
  , AddForceShader = require('./shaders/AddForceShader.js')
  , SubstractGradientShader = require('./shaders/SubstractGradientShader.js')
  , FrameRenderer = require('./FrameRenderer.js');

function Fluid() {

  // Fluid variables
  this.width = 512;
  this.height = 512;
  this.iterations = 20;
  this.speed = 10;
  this.cellSize = 0.5;
  this.viscosity = 0.15;
  this.dissipation = 0.008;
  this.clampForce = 0.08;
  this.maxDensity = 0.9;
  this.maxVelocity = 2.4;
  //-----------------------------
  var n = this.width;

  this.frameRenderer = new FrameRenderer(0, 0, n, n, n, n);
  this.screenImage = new ScreenImage(null, 0, 0, n, n, n, n);

  var gl = Context.currentContext;

  // Buffers
  this.densityPingPong  = new PingPong({
    width: this.width
  , height: this.height
  , fboOpts: { format: gl.RGBA, bpp: 32 }
  });
  this.densityPingPong.clear();

  this.velocityPingPong = new PingPong({
    width: this.width
  , height: this.height
  , fboOpts: { format: gl.RGBA, bpp: 32 }
  });
  this.velocityPingPong.clear();
  this.pressurePingPong = new PingPong({width: this.width,
                                        height: this.height});
  this.pressurePingPong.clear();

  this.divergenceBuffer = new FBO(this.width, this.height);
  this.divergenceBuffer.bindAndClear();
  this.divergenceBuffer.unbind();
  this.obstacleBuffer = new FBO(this.width, this.height);
  this.obstacleBuffer.bindAndClear();
  this.obstacleBuffer.unbind();
  this.pressureBuffer = new FBO(this.width, this.height);
  this.pressureBuffer.bindAndClear();
  this.pressureBuffer.unbind();
  this.comboObstacleBuffer = new FBO(this.width, this.height);
  this.comboObstacleBuffer.bindAndClear();
  this.comboObstacleBuffer.unbind();

  // Shaders
  this.clampLengthShader = new ClampLengthShader();
  this.advectShader = new AdvectShader();
  this.diffuseShader = new DiffuseShader();
  this.divergenceShader = new DivergenceShader();
  this.jacobiShader = new JacobiShader();
  this.addForceShader = new AddForceShader();
  this.substractGradientShader = new SubstractGradientShader();

}

Fluid.prototype.addDensity = function (options) {
  var texture = options.texture;
  var strength = options.strength;
  glu.enableBlending(false);
  this.addForceShader.update({
    destBuffer: this.densityPingPong.destBuffer
  , backBufferTex: this.densityPingPong.sourceBuffer.getColorAttachment(0)
  , addTex: texture
  , force: strength
  , frameRenderer: this.frameRenderer
  });
  this.densityPingPong.swap();
}

Fluid.prototype.addVelocity = function (options) {
  var texture = options.texture;
  var strength = options.strength;
  var xNeg = options.xNeg || false;
  var yNeg = options.yNeg || false;
  glu.enableBlending(false);
  this.addForceShader.update({
    destBuffer: this.velocityPingPong.destBuffer
  , backBufferTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
  , addTex: texture
  , force: strength
  , xNeg: xNeg
  , yNeh: yNeg
  , frameRenderer: this.frameRenderer
  });
  this.velocityPingPong.swap();
}

Fluid.prototype.iterate = function () {
  this.deltaTime = sys.Time.delta;
  this.timeStep = this.deltaTime * this.speed;

  glu.enableBlending(false);
//  glu.enableAlphaBlending();

  // Clamp Length
  if (this.maxDensity > 0) {
    this.clampLengthShader.update({
      destBuffer: this.densityPingPong.destBuffer
    , backBufferTex: this.densityPingPong.sourceBuffer.getColorAttachment(0)
    , max: this.maxDensity
    , clampForce: this.clampForce
    , frameRenderer: this.frameRenderer
    });
    this.densityPingPong.swap();
  }
  if (this.maxVelocity > 0) {
    this.clampLengthShader.update({
      destBuffer: this.velocityPingPong.destBuffer
    , backBufferTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
    , max: this.maxVelocity
    , clampForce: this.clampForce
    , frameRenderer: this.frameRenderer
    });
    this.velocityPingPong.swap();
  }

// Advect
  this.advectShader.update({
    destBuffer: this.velocityPingPong.destBuffer
  , backBufferTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
  , velocityTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
  , obstacleTex: this.comboObstacleBuffer.getColorAttachment(0)
  , timeStep: this.timeStep
  , dissipation: 1.0 - this.dissipation
  , cellSize: this.cellSize
  , frameRenderer: this.frameRenderer
  });
  this.velocityPingPong.swap();

  this.advectShader.update({
    destBuffer: this.densityPingPong.destBuffer
  , backBufferTex: this.densityPingPong.sourceBuffer.getColorAttachment(0)
  , velocityTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
  , obstacleTex: this.comboObstacleBuffer.getColorAttachment(0)
  , timeStep: this.timeStep
  , dissipation: 1.0 - this.dissipation
  , cellSize: this.cellSize
  , frameRenderer: this.frameRenderer
  });
  this.densityPingPong.swap();

// Diffuse
  if (this.viscosity > 0) {
    for (var i=0; i<this.iterations; i++) {
      this.diffuseShader.update({
        destBuffer: this.velocityPingPong.destBuffer
      , backBufferTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
      , obstacleTex: this.comboObstacleBuffer.getColorAttachment(0)
      , viscosity: this.viscosity * this.deltaTime
      , frameRenderer: this.frameRenderer
      });
      this.velocityPingPong.swap();
    }
  }

  // Divergence and Jacobi
  this.divergenceBuffer.bindAndClear();
  this.divergenceBuffer.unbind();
  this.divergenceShader.update({
    destBuffer: this.divergenceBuffer
  , velocityTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
  , obstacleTex: this.comboObstacleBuffer.getColorAttachment(0)
  , cellSize: this.cellSize
  , frameRenderer: this.frameRenderer
  });

  this.pressurePingPong.clear();
  for (var i=0; i<this.iterations; i++){
    this.jacobiShader.update({
      destBuffer: this.pressurePingPong.destBuffer
    , backBufferTex: this.pressurePingPong.sourceBuffer.getColorAttachment(0)
    , obstacleTex: this.obstacleBuffer.getColorAttachment(0)
    , divergenceTex: this.divergenceBuffer.getColorAttachment(0)
    , cellSize: this.cellSize
    , frameRenderer: this.frameRenderer
    });
    this.pressurePingPong.swap();
  }

  if (this.addPressureBufferDidChange) {
    this.addPressureBufferDidChange = false;
    this.addForceShader.update({
      destBuffer: this.pressurePingPong.destBuffer
    , backBuffferTex: this.pressurePingPong.sourceBuffer.getColorAttachment(0)
    , addTex: this.pressureBuffer.getColorAttachment(0)
    , force: 1
    , frameRenderer: this.frameRenderer
    });
    this.pressurePingPong.swap();
  }

  this.substractGradientShader.update({
    destBuffer: this.velocityPingPong.destBuffer
   , backBufferTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
   , pressureTex: this.pressurePingPong.sourceBuffer.getColorAttachment(0)
   , obstacleTex: this.comboObstacleBuffer.getColorAttachment(0)
   , cellSize: this.cellSize
   , frameRenderer: this.frameRenderer
  });
  this.velocityPingPong.swap();

  return this.densityPingPong.destBuffer.getColorAttachment(0);

}

Fluid.prototype.draw = function() {
  //this.screenImage.draw(this.velocityPingPong.destBuffer.getColorAttachment(0), this.show);
  this.screenImage.draw(this.densityPingPong.destBuffer.getColorAttachment(0), this.show);
}

module.exports = Fluid;


