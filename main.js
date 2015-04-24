var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var gui = require('pex-gui');
var geom = require('pex-geom');

var Cube = gen.Cube;
var Mesh = glu.Mesh;
var SolidColor = materials.SolidColor;
var MatCap = materials.MatCap;
var PerspectiveCamera = glu.PerspectiveCamera;
var Arcball = glu.Arcball;
var Color = color.Color;
var Platform = sys.Platform;
var Plane = gen.Plane;
var GUI = gui.GUI;
var Texture2D = glu.Texture2D;
var Vec2 = geom.Vec2;
var Vec3 = geom.Vec3;
var Vec4 = geom.Vec4;
var DisplacedMatCap = require('./materials/DisplacedMatCap');
var Fluid = require('./fluid/fluid');
var DrawForce = require('./fluid/DrawForce');
var ScreenImage = glu.ScreenImage;

sys.Window.create({
  settings: {
    width: 1280,
    height: 800 ,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    //highdpi: 2
  },

  debug:                false,
  drawMetal:            true,
  drawFluid:            false,
  displacementHeight:   0.4,
  textures:             [],
  currentTexture:       0,
  showNormals:          false,

  init: function() {
    var planeSize = 2;
    var numSteps = 200;
    var plane = new Plane(planeSize, planeSize, numSteps, numSteps, 'x', 'y');
    var planeWF = new Plane(planeSize, planeSize, numSteps/4, numSteps/4, 'x', 'y');
    var simWidth = this.width/4;
    var simHeight = this.height/4;
    this.zTreshold = 0.01;
    this.fluid = new Fluid(simWidth, simHeight, this.width, this.height);
    this.screenImage = new ScreenImage(null, 0, 0, this.width, this.height,
                                                   this.width, this.height);

    this.drawVelocityForce = new DrawForce({
      width:  this.width
    , height: this.height
    , type: 'velocity'
    , isTemporary: true
    });

    this.drawVelocityForce.strength = 0.9;
    this.drawVelocityForce.radius = 0.01;

    this.drawDensityForce = new DrawForce({
      width:  this.width
    , height: this.height
    , type: 'density'
    , isTemporary: true
    });

    this.drawDensityForce.strength = 2.7;
    this.drawDensityForce.radius = 0.03;

    this.lastMouse = new Vec2(0, 0);

    this.on('mouseMoved', function (e) {
      var mouse = new Vec2();
      mouse.x = e.x / this.width;
      mouse.y = (this.height - e.y) / this.height;
      this.lastMouse.x = mouse.x;
      this.lastMouse.y = mouse.y;
    }.bind(this));

    this.on('mouseDragged', function(e) {
      var mouse = new Vec2();

      mouse.x = e.x / this.width;
      mouse.y = (this.height - e.y) / this.height;

      var velocity = mouse.dup().sub(this.lastMouse);
      var vec = new Vec3(velocity.x, velocity.y, 0);

      this.drawVelocityForce.force = vec.clone();
      this.drawVelocityForce.applyForce(mouse);
      this.drawDensityForce.applyForce(mouse);

      this.lastMouse.x = mouse.x;
      this.lastMouse.y = mouse.y;

    }.bind(this));
    this.textures = [
      Texture2D.load('assets/chroma.jpg')
    , Texture2D.load('assets/chroma2.jpg')
    , Texture2D.load('assets/chroma3.jpg')
    ];

    this.mesh = new Mesh(plane, new DisplacedMatCap({
      texture:            this.textures[0],
      tint:               Color.Black,
      zTreshold:          this.zTreshold,
      displacementHeight: this.displacementHeight,
      textureSize:        new Vec2(2100, 2100),
      planeSize:          new Vec2(planeSize, planeSize),
      numSteps:           numSteps,
    }));


    this.meshWireframe = new Mesh(planeWF, new DisplacedMatCap({
      texture:            this.textures[0],
      tint:               Color.Yellow,
      zTreshold:          this.zTreshold,
      displacementHeight: this.displacementHeight,
      textureSize:        new Vec2(2100, 2100),
      planeSize:          new Vec2(planeSize, planeSize),
      numSteps:           numSteps
    }), { lines: true });

    this.meshWireframe.position.z = 0.001;

    this.gui = new GUI(this);

    this.gui.addLabel('Drawing options');
    this.gui.addParam('Debug \'d\'', this, 'debug');
    this.gui.addParam('Draw Fluid \'f\'', this, 'drawFluid');
    this.gui.addParam('Draw Metal \'m\'', this, 'drawMetal');
    this.gui.addParam('Show normals \'n\'', this, 'showNormals');
    this.gui.addParam('Displacement Height', this, 'displacementHeight');
    this.gui.addParam('z Treshold', this, 'zTreshold', {min: 0.0001, max: 0.5});

    this.gui.addLabel('Fluid options');
    this.gui.addParam('Iterations',  this.fluid, 'iterations', {min: 1, max:100});
    this.gui.addParam('Speed',       this.fluid, 'speed',      {min: 0, max:100});
    this.gui.addParam('Cell Size',   this.fluid, 'cellSize',   {min: 0, max:2});
    this.gui.addParam('Viscosity',   this.fluid, 'viscosity',  {min: 0, max:1});
    this.gui.addParam('Dissipation', this.fluid, 'dissipation',{min: 0, max:0.02});
    this.gui.addParam('Clamp Force', this.fluid, 'clampForce', {min: 0, max:0.1});
    this.gui.addParam('Max Density', this.fluid, 'maxDensity', {min: 0, max:5});
    this.gui.addParam('Max Velocity',this.fluid, 'maxVelocity',{min: 0, max:10});

    this.gui.addLabel('Mouse options');
    this.gui.addParam('Density Strength',
                      this.drawDensityForce, 'strength',{min: 0, max:5});
    this.gui.addParam('Density Radius',
                      this.drawDensityForce, 'radius',{min: 0, max:0.1});
    this.gui.addParam('Density Radius',
                      this.drawDensityForce, 'edge',{min: 0, max:1});
    this.gui.addParam('Density Strength',
                      this.drawVelocityForce, 'strength',{min: 0, max:5});
    this.gui.addParam('Density Radius',
                      this.drawVelocityForce, 'radius',{min: 0, max:0.1});
    this.gui.addParam('Density Radius',
                      this.drawVelocityForce, 'edge',{min: 0, max:1});

    this.gui.addTextureList('Material', this, 'currentTexture',
        this.textures.map(function(tex, i) {
          return {
            texture: tex,
            name: 'Tex' + i,
            value: i
          }
        }));

    this.camera = new PerspectiveCamera(80, this.width / this.height);
    this.camera.setPosition(new Vec3(0, 0.0, 1.0));
   // this.arcball = new Arcball(this, this.camera);
   // this.arcball.setPosition(new Vec3(0, 1.5, 1.5));

    this.on('keyDown', function(e) {
      if (e.str == 'd') {
        this.debug = !this.debug;
        this.gui.items[0].dirty = true;
      }
      if (e.str == 'm') {
        this.drawMetal = !this.drawMetal;
        this.gui.items[0].dirty = true;
      }
      if (e.str == 'f') {
        this.drawFluid = !this.drawFluid;
        this.gui.items[0].dirty = true;
      }
      if (e.str == 'n') {
        this.showNormals = !this.showNormals;
        this.gui.items[0].dirty = true;
      }
    }.bind(this));


//    this.gui.addTexture2D('Velocity', this.drawVelocityForce.forceBuffer.getColorAttachment(0))
//    this.gui.addTexture2D('Density', this.drawDensityForce.forceBuffer.getColorAttachment(0))
  },
  draw: function() {
    try {
      //disable depth test
      glu.enableDepthReadAndWrite(false, false);

      this.drawDensityForce.update();
      if (this.drawDensityForce.forceChanged) {
        this.drawDensityForce.forceChanged = false;
        var densityStrength = this.drawDensityForce.strength;
        if (!this.drawDensityForce.isTemporary)
          densityStrength *= sys.Time.delta;
        this.fluid.addDensity({
          texture: this.drawDensityForce.forceBuffer.getColorAttachment(0)
        , strength: densityStrength
        });
      }

      this.drawVelocityForce.update();
      if (this.drawVelocityForce.forceChanged) {
        this.drawVelocityForce.forceChanged = false;
        var velocityStrength = this.drawVelocityForce.strength;
        if (!this.drawVelocityForce.isTemporary)
          velocityStrength *= sys.Time.delta;
        this.fluid.addVelocity({
          texture: this.drawVelocityForce.forceBuffer.getColorAttachment(0)
        , strength: velocityStrength
        });
      }

      var fluidTexture = this.fluid.iterate();
      glu.clearColorAndDepth(Color.fromRGB(0/255, 0/255, 0/255, 1));
      glu.viewport(0, 0, this.width, this.height);
      this.screenImage.setImage(fluidTexture);
      if (this.drawFluid) this.screenImage.draw();

      glu.clearDepth();
      glu.enableDepthReadAndWrite(true);

      this.mesh.material.uniforms.
        showNormals         = this.showNormals;
      this.mesh.material.uniforms.
        displacementHeight  = this.displacementHeight;
      this.mesh.material.uniforms.
        texture             = this.textures[this.currentTexture];
      this.mesh.material.uniforms.
        time                = sys.Time.seconds;
      this.mesh.material.uniforms.
        zTreshold           = this.zTreshold;
      this.mesh.material.uniforms.
        displacementMap     = fluidTexture;

      this.meshWireframe.material.uniforms.
        showNormals         = this.showNormals;
      this.meshWireframe.material.uniforms.
        displacementHeight  = this.displacementHeight;
      this.meshWireframe.material.
        texture             = this.textures[this.currentTexture];
      this.meshWireframe.material.uniforms.
        time                = sys.Time.seconds;
      this.meshWireframe.material.uniforms.
        zTreshold           = this.zTreshold;
      this.meshWireframe.material.uniforms.
        displacementMap     = fluidTexture;


      glu.enableDepthReadAndWrite(false, false);
      glu.enableAdditiveBlending(true);
      if (this.drawMetal) this.mesh.draw(this.camera);

      glu.clearDepth();
      this.gui.draw();

      if (this.debug) this.meshWireframe.draw(this.camera);

    } catch (e) {
      console.log(e.stack);
      this.draw = function(){};
    }
  }
});
