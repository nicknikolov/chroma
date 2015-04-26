var sys = require('pex-sys');
var glu = require('pex-glu');
var materials = require('pex-materials');
var color = require('pex-color');
var gen = require('pex-gen');
var gui = require('pex-gui');
var geom = require('pex-geom');
var rnd = require('pex-random');

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

var TileRender = require('./TileRender');
var DPI = 1;

sys.Window.create({
  settings: {
    width: 1280 * DPI,
    height: 800 * DPI,
    type: '3d',
    fullscreen: Platform.isBrowser ? true : false,
    highdpi: DPI
  },

  wireframe:            false,
  drawMetal:            true,
  drawFluid:            false,
  displacementHeight:   0.9,
  textures:             [],
  currentTexture:       0,
  showNormals:          false,
  needsRender:          false,
  preview:              true,
  drawWithMouse:        false,
  dripping:             true,
  dripChance:           300,
  backgroundColour:     Color.fromHSL(0.58, 0.97, 0.07),
  wireframeColour:      Color.fromHSL(0.58, 0.97, 0.47),


  init: function() {
    var planeSize = 2;
    var numSteps = 200;
    var plane = new Plane(planeSize, planeSize, numSteps, numSteps, 'x', 'y');
    var planeWF = new Plane(planeSize, planeSize, numSteps, numSteps, 'x', 'y');
    var simWidth = this.width/4;
    var simHeight = this.height/4;
    this.zTreshold = 0.01;
    this.fluidTexture = null;
    this.fluid = new Fluid(simWidth, simHeight, this.width, this.height);
    this.screenImage = new ScreenImage(null, 0, 0, this.width, this.height,
                                                   this.width, this.height);
    this.setupInteractions();

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
      tint:               this.wireframeColour,
      zTreshold:          this.zTreshold,
      displacementHeight: this.displacementHeight,
      textureSize:        new Vec2(2100, 2100),
      planeSize:          new Vec2(planeSize, planeSize),
      numSteps:           numSteps
    }), { lines: true });

    //this.meshWireframe.position.z = 0.005;


    this.camera = new PerspectiveCamera(70, this.width / this.height, 0.1, 10);
    this.camera.setPosition(new Vec3(0, 0.0, 1.0));
    this.arcball = new Arcball(this, this.camera);

    this.drawVelocityForceAuto = new DrawForce({
      width:  this.width
    , height: this.height
    , type: 'velocity'
    , isTemporary: true
    });

    this.drawVelocityForceAuto.strength = 3.9;
    this.drawVelocityForceAuto.radius = 0.045;

    this.drawDensityForceAuto = new DrawForce({
      width:  this.width
    , height: this.height
    , type: 'density'
    , isTemporary: true
    });

    this.drawDensityForceAuto.strength = 4.7;
    this.drawDensityForceAuto.radius = 0.06;

    this.setupGui();


  },
  draw: function() {
    try {
      glu.enableDepthReadAndWrite(true);
      if (this.needsRender) {
        glu.clearColorAndDepth(Color.Black);
        glu.enableDepthReadAndWrite(true);
        this.needsRender = false;
        this.tileRender = new TileRender({
          viewport: [0, 0, this.width, this.height],
          n: 20, //image will be 6x bigger
          camera: this.camera,
          path: 'tiles', //folder to save tiles to
          preview: this.preview
        });
        glu.clearColorAndDepth(Color.Black);
      }
      if (this.tileRender) {
        if (this.tileRender.nextTile()) {
          if (!this.preview) {
            glu.clearColorAndDepth(Color.Black);
          }
          var tileCamera = this.tileRender.getCamera();
          var tileViewport = this.tileRender.getViewport();
          this.gl.viewport(tileViewport[0], tileViewport[1], tileViewport[2], tileViewport[3]);
          this.drawScene(tileCamera);
          if (!this.preview) {
            this.tileRender.capture();
          }
        }
        else {
          this.tileRender = null;
        }
        this.gl.viewport(0, 0, this.width, this.height);
      }

      else {
        if (this.drawWithMouse) {
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
        }

        if (this.dripping && rnd.int(1, 500 - Math.ceil(this.dripChance)) == 1) {
          this.drip();
        }

        this.fluidTexture = this.fluid.iterate();
        this.drawScene(this.camera);
      }

    } catch (e) {
      console.log(e.stack);
      this.draw = function(){};
    }

    this.gui.draw();
  },

  drip: function() {
    var velY = rnd.float(-0.01, -0.06);
    var posX = rnd.float(0.05, 0.95);
    this.drawVelocityForceAuto.force = new Vec2(0, velY);
    this.drawVelocityForceAuto.applyForce(new Vec2(posX, 0.9));
    this.drawDensityForceAuto.applyForce(new Vec2(posX, 0.9));

    this.drawDensityForceAuto.update();
    if (this.drawDensityForceAuto.forceChanged) {
      this.drawDensityForceAuto.forceChanged = false;
      var densityStrength = this.drawDensityForceAuto.strength;
      if (!this.drawDensityForceAuto.isTemporary)
        densityStrength *= sys.Time.delta;
      this.fluid.addDensity({
        texture: this.drawDensityForceAuto.forceBuffer.getColorAttachment(0)
          , strength: densityStrength
      });
    }

    this.drawVelocityForceAuto.update();
    if (this.drawVelocityForceAuto.forceChanged) {
      this.drawVelocityForceAuto.forceChanged = false;
      var velocityStrength = this.drawVelocityForceAuto.strength;
      if (!this.drawVelocityForceAuto.isTemporary)
        velocityStrength *= sys.Time.delta;
      this.fluid.addVelocity({
        texture: this.drawVelocityForceAuto.forceBuffer.getColorAttachment(0)
          , strength: velocityStrength
      });
    }
  },

  drawScene: function(camera) {

    glu.clearColorAndDepth(this.backgroundColour);
    glu.viewport(0, 0, this.width, this.height);
    this.screenImage.setImage(this.fluidTexture);
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
      displacementMap     = this.fluidTexture;

    this.meshWireframe.material.uniforms.
      showNormals         = this.showNormals;
    this.meshWireframe.material.uniforms.
      tint                = this.wireframeColour;
    this.meshWireframe.material.uniforms.
      displacementHeight  = this.displacementHeight;
    this.meshWireframe.material.
      texture             = this.textures[this.currentTexture];
    this.meshWireframe.material.uniforms.
      time                = sys.Time.seconds;
    this.meshWireframe.material.uniforms.
      zTreshold           = this.zTreshold;
    this.meshWireframe.material.uniforms.
      displacementMap     = this.fluidTexture;


    glu.enableDepthReadAndWrite(true, true);
    glu.enableAdditiveBlending(true);
    glu.enableAlphaBlending();
    if (this.drawMetal) this.mesh.draw(camera);

    //glu.clearDepth();

    if (this.wireframe) this.meshWireframe.draw(camera);
  },

  setupGui: function () {
    this.gui = new GUI(this);

    this.gui.addLabel('Drawing options');
    this.gui.addParam('Wireframe \'w\'', this, 'wireframe');
    this.gui.addParam('Mouse Input \'x\'', this, 'drawWithMouse');
    this.gui.addParam('Arc ball \'a\'', this.arcball, 'enabled');
    this.gui.addParam('Draw Fluid \'f\'', this, 'drawFluid');
    this.gui.addParam('Draw Metal \'m\'', this, 'drawMetal');
    this.gui.addParam('Show normals \'n\'', this, 'showNormals');
    this.gui.addParam('Background \'n\'', this, 'backgroundColour');
    this.gui.addParam('Wireframe colour \'n\'', this, 'wireframeColour');
    this.gui.addParam('Displacement Height', this, 'displacementHeight');
    this.gui.addParam('Wireframe z', this.meshWireframe.position,
        'z', {min: -0.01, max: 0.01});

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

    this.gui.addParam('Tile preview', this, 'preview')

    this.gui.addTextureList('Material', this, 'currentTexture',
        this.textures.map(function(tex, i) {
          return {
            texture: tex,
            name: 'Tex' + i,
            value: i
          }
        }));

    this.gui.addLabel('Mouse options')
      .setPosition(180, 10);
    this.gui.addParam('Density Strength',
        this.drawDensityForce, 'strength',{min: 0, max:5});
    this.gui.addParam('Density Radius',
        this.drawDensityForce, 'radius',{min: 0, max:0.1});
    this.gui.addParam('Density Edge',
        this.drawDensityForce, 'edge',{min: 0, max:1});
    this.gui.addParam('Velocity Strength',
        this.drawVelocityForce, 'strength',{min: 0, max:5});
    this.gui.addParam('Velocity Radius',
        this.drawVelocityForce, 'radius',{min: 0, max:0.1});
    this.gui.addParam('Velocity Edge',
        this.drawVelocityForce, 'edge',{min: 0, max:1});


    this.gui.addLabel('Dripping')
      .setPosition(1100, 10)
    this.gui.addParam('Dripping', this, 'dripping')
    this.gui.addParam('Drip chance', this, 'dripChance', {min: 1, max: 500})
    this.gui.addParam('Density Strength',
        this.drawDensityForceAuto, 'strength',{min: 0, max: 5})
    this.gui.addParam('Density Radius',
        this.drawDensityForceAuto, 'radius',{min: 0, max: 0.1})
    this.gui.addParam('Density Edge',
        this.drawDensityForceAuto, 'edge',{min: 0, max: 1})
    this.gui.addParam('Velocity Strength',
        this.drawVelocityForceAuto, 'strength',{min: 0, max: 5})
    this.gui.addParam('Velocity Radius',
        this.drawVelocityForceAuto, 'radius',{min: 0, max: 0.1})
    this.gui.addParam('Velocity Edge',
        this.drawVelocityForceAuto, 'edge',{min: 0, max: 1})

    this.on('keyDown', function(e) {
      if (e.str == 'w') {
        this.wireframe = !this.wireframe;
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
      if (e.str == ' ') {
        this.frame = 0;
        this.needsRender = true;
      }
      if (e.str == 'a') {
        this.arcball.enabled = !this.arcball.enabled;
        this.gui.items[0].dirty = true;
      }
    }.bind(this));
  },

  setupInteractions: function() {
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
      if (!this.drawWithMouse) return;
      var mouse = new Vec2();
      mouse.x = e.x / this.width;
      mouse.y = (this.height - e.y) / this.height;
      this.lastMouse.x = mouse.x;
      this.lastMouse.y = mouse.y;
    }.bind(this));

    this.on('mouseDragged', function(e) {
      if (!this.drawWithMouse) return;
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

    this.on('keyDown', function (e) {
      if (e.str == 'x') {
        this.drawWithMouse = !this.drawWithMouse;
        this.gui.items[0].dirty = true;
      }
    });
  },

});
