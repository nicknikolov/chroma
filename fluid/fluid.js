var glu         = require('pex-glu');
var color       = require('pex-color');
var Context     = glu.Context;
var Material    = require('../pex-hacks/Material.js');
var Program     = glu.Program;
var Color       = color.Color;
var merge       = require('merge');
var fs          = require('fs');
var RenderTarget = glu.RenderTarget;
var Texture2D = glu.Texture2D;
var ScreenImage = glu.ScreenImage;

var source  = fs.readFileSync(__dirname + '/source.glsl',   'utf8');
var advec   = fs.readFileSync(__dirname + '/advect.glsl',   'utf8');
var div     = fs.readFileSync(__dirname + '/div.glsl',      'utf8');
var force   = fs.readFileSync(__dirname + '/force.glsl',    'utf8');
var p       = fs.readFileSync(__dirname + '/p.glsl',        'utf8');
var show    = fs.readFileSync(__dirname + '/show.glsl',     'utf8');

function Fluid() {

    // Fluid variables
    this.width = 512;
    this.height = 512;
    this.iterations = 10;
    this.bu         = 10;
    //-----------------------------

    var gl = Context.currentContext;
    var n = 512;
    var T = 0;
    var pixels = [];

    for(var i = 0; i<n; i++) {
        for(var j = 0; j<n; j++){
            T = 0; // background color
            if (i>200 && i<300){
                if (j>100 && j<240) T=1; // red
                else if (j>260 && j<400) T= -1; // blue
            }
            pixels.push( 0, 0, T, 0 );
        }
    }

    var b = new ArrayBuffer(n * n * 32);
    var pixelsData = new Float32Array(b);

    for(var i=0; i<pixels.length; i++)
        pixelsData[i] = pixels[i];

    var texture0 = Texture2D.create(n, n, { bpp: 32, nearest: true });
    texture0.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, n, 0, gl.RGBA, gl.FLOAT, pixelsData);

    var texture1 = Texture2D.create(n, n, { bpp: 32, nearest: true });
    texture1.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, n, 0, gl.RGBA, gl.FLOAT, pixelsData);

    texture0.name = 'texture0';
    texture1.name = 'texture1';

    this.fbo0 = new RenderTarget(n, n, { color: texture0 });
    this.fbo1 = new RenderTarget(n, n, { color: texture1 });
    this.screenImage = new ScreenImage(null, 0, 0, n, n, n, n);


    this.source     = new Program(source);
    this.force      = new Program(force);
    this.force.use();
    this.force.uniforms.c(.001 * .5 * this.bu);
    this.advec      = new Program(advec);
    this.p          = new Program(p);
    this.div        = new Program(div);
    this.show       = new Program(show);

}

Fluid.prototype.iterate = function() {
    var fbo1 = this.fbo1;
    var fbo0 = this.fbo0;
    var screenImage = this.screenImage;

    fbo1.bind();
    screenImage.draw(fbo0.getColorAttachment(0), this.source);
    fbo1.unbind();

    fbo0.bind();
    this.force.use();
    this.force.uniforms.c(.001*.5*this.bu);
    screenImage.draw(fbo1.getColorAttachment(0), this.force);
    fbo0.unbind();

    fbo1.bind();
    screenImage.draw(fbo0.getColorAttachment(0), this.advec);
    fbo1.unbind();

    for (var i=0; i<this.iterations; i++) {
        fbo0.bind();
        screenImage.draw(fbo1.getColorAttachment(0), this.p);
        fbo0.unbind();
        fbo1.bind();
        screenImage.draw(fbo0.getColorAttachment(0), this.p);
        fbo1.unbind();
    }

    fbo0.bind();
    screenImage.draw(fbo1.getColorAttachment(0), this.div);
    fbo0.unbind();

    return fbo0.getColorAttachment(0);
}

Fluid.prototype.draw = function() {
    this.screenImage.draw(this.fbo0.getColorAttachment(), this.show);
}

module.exports = Fluid;


