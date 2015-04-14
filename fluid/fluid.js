var glu         = require('pex-glu');
var color       = require('pex-color');
var Context     = glu.Context;
var Material    = require('../pex-hacks/Material.js');
var Program     = glu.Program;
var Color       = color.Color;
var merge       = require('merge');
var fs          = require('fs');

var source  = fs.readFileSync(__dirname + '/source.glsl',   'utf8');
var advec   = fs.readFileSync(__dirname + '/advect.glsl',   'utf8');
var div     = fs.readFileSync(__dirname + '/div.glsl',      'utf8');
var force   = fs.readFileSync(__dirname + '/force.glsl',    'utf8');
var p       = fs.readFileSync(__dirname + '/p.glsl',        'utf8');
var show    = fs.readFileSync(__dirname + '/show.glsl',     'utf8');

function Fluid(uniforms) {
    this.gl = Context.currentContext;

    this.iterations = 10;
    this.bu         = 10;

    this.source     = new Program(source);
    this.force      = new Program(force);
    this.force.use();
    this.force.uniforms.c(.001 * .5 * this.bu);
    this.advec      = new Program(advec);
    this.p          = new Program(p);
    this.div        = new Program(div);
    this.show       = new Program(show);

}

Fluid.prototype.iterate = function(screenImage, fbo0, fbo1) {
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

    //screenImage.draw(fbo.getColorAttachment(0), this.show);
}

module.exports = Fluid;
