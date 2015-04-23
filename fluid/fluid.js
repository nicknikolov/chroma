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

function Fluid(simWidth, simHeight, drawWidth, drawHeight) {

  // Fluid variables
  this.width = simWidth;
  this.height = simHeight;
  this.iterations = 20;
  this.speed = 10;
  this.cellSize = 0.5;
  this.viscosity = 0.15;
  this.dissipation = 0.008;
  this.clampForce = 0.08;
  this.maxDensity = 0.9;
  this.maxVelocity = 2.4;
  //-----------------------------

  this.frameRenderer = new FrameRenderer(0, 0, this.width, this.height,
                                                this.width, this.height);

  this.densityFrameRenderer = new FrameRenderer(0, 0, drawWidth, drawHeight,
                                                      drawWidth, drawHeight);
  var gl = Context.currentContext;

  // Buffers
  this.densityPingPong  = new PingPong({
    width: drawWidth
  , height: drawHeight
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

  this.divergenceBuffer = new FBO(this.width, this.height, { bpp: 32 });
  this.divergenceBuffer.bindAndClear();
  this.divergenceBuffer.unbind();
  this.obstacleBuffer = new FBO(this.width, this.height, { bpp: 32 });
  this.obstacleBuffer.bindAndClear();
  this.obstacleBuffer.unbind();
  this.pressureBuffer = new FBO(this.width, this.height, { bpp: 32 });
  this.pressureBuffer.bindAndClear();
  this.pressureBuffer.unbind();
  this.comboObstacleBuffer = new FBO(this.width, this.height, { bpp: 32 });
  this.comboObstacleBuffer.bindAndClear();
  this.comboObstacleBuffer.unbind();

  // Shaders
  this.clampLengthShader = new ClampLengthShader(this.width, this.height);
  this.advectShader = new AdvectShader(this.width, this.height);
  this.diffuseShader = new DiffuseShader(this.width, this.height);
  this.divergenceShader = new DivergenceShader(this.width, this.height);
  this.jacobiShader = new JacobiShader(this.width, this.height);
  this.addForceShader = new AddForceShader(this.width, this.height);
  this.substractGradientShader = new SubstractGradientShader(this.width, this.height);

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
  , frameRenderer: this.densityFrameRenderer
  });
  this.densityPingPong.swap();
}

Fluid.prototype.addVelocity = function (options) {
  var texture = options.texture;
  var strength = options.strength;
  glu.enableBlending(false);
  this.addForceShader.update({
    destBuffer: this.velocityPingPong.destBuffer
  , backBufferTex: this.velocityPingPong.sourceBuffer.getColorAttachment(0)
  , addTex: texture
  , force: strength
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
    , frameRenderer: this.densityFrameRenderer
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
  , frameRenderer: this.densityFrameRenderer
  , type: 'density'
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

module.exports = Fluid;


