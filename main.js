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
var DisplacedMatCap = require('./materials/DisplacedMatCap');
var Fluid = require('./fluid/fluid');

sys.Window.create({
    settings: {
        width: 1280,
        height: 720,
        type: '3d',
        fullscreen: Platform.isBrowser ? true : false
    },
    debug:                  false,
    displacementHeight:     0.105,
    textures:               [],
    currentTexture:         0,
    showNormals:            false,

    init: function() {
        var planeSize = 2;
        var numSteps = 200;
        var plane = new Plane(planeSize, planeSize, numSteps, numSteps, 'x', 'z');
        this.fluid = new Fluid();
        this.textures = [
            Texture2D.load('assets/chroma.jpg'),
            Texture2D.load('assets/plastic_red.jpg'),
            Texture2D.load('assets/Blue Mirror.png'),
            Texture2D.load('assets/ok_ochre_oil.jpg'),
            Texture2D.load('assets/SebcesoirGold1.jpg'),
            Texture2D.load('assets/Steel-Brushed.png'),
            Texture2D.load('assets/IronCast.png'),
        ];

        this.mesh = new Mesh(plane, new DisplacedMatCap({
            texture:            this.textures[0],
            tint:               Color.Black,
            displacementHeight: this.displacementHeight,
            textureSize:        new Vec2(2100, 2100),
            planeSize:          new Vec2(planeSize, planeSize),
            numSteps:           numSteps
        }));

        this.meshWireframe = new Mesh(plane, new DisplacedMatCap({
            texture:            this.textures[0],
            tint:               Color.Yellow,
            displacementHeight: this.displacementHeight,
            textureSize:        new Vec2(512, 512),
            planeSize:          new Vec2(planeSize, planeSize),
            numSteps:           numSteps
        }), { lines: true });

        this.meshWireframe.position.z = 0.001;

        this.gui = new GUI(this);
        this.gui.addParam('Debug \'d\'', this, 'debug');
        this.gui.addParam('Show normals \'n\'', this, 'showNormals');
        this.gui.addParam('displacementHeight', this, 'displacementHeight');
        this.gui.addParam('iterations', this.fluid, 'iterations', {min: 0, max:50});
        this.gui.addParam('bu', this.fluid, 'bu', {min: 0, max:100});
        this.gui.addTextureList('Material', this, 'currentTexture',
                this.textures.map(function(tex, i) {
                    return {
                        texture: tex,
                        name: 'Tex' + i,
                        value: i
                    }
                }));

        this.camera = new PerspectiveCamera(60, this.width / this.height);
        this.arcball = new Arcball(this, this.camera);
        this.arcball.setPosition(new Vec3(0, 1.5, 1.5));

        this.on('keyDown', function(e) {
            if (e.str == 'd') {
                this.debug = !this.debug;
                this.gui.items[0].dirty = true;
            }
            if (e.str == 'n') {
                this.showNormals = !this.showNormals;
                this.gui.items[0].dirty = true;
            }
        }.bind(this));

    },
    draw: function() {
        try {
            //disable depth test
            glu.enableDepthReadAndWrite(false, false);
            glu.viewport(0, 0, this.fluid.width, this.fluid.height);

            var fluidTexture = this.fluid.iterate();
            glu.viewport(0, 0, this.width, this.height);
            glu.clearColorAndDepth(Color.Black);

            this.fluid.draw();
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
                        displacementMap     = fluidTexture;


            glu.enableDepthReadAndWrite(true, true);
            this.mesh.draw(this.camera);

            if (this.debug) this.meshWireframe.draw(this.camera);

            this.gui.draw();
        } catch (e) {
            console.log(e.stack);
            this.draw = function(){};
        }
    }
});
