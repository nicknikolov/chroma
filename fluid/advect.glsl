#ifdef VERT

attribute vec2 position;
attribute vec2 texCoord;
uniform vec2 screenSize;
uniform vec2 pixelPosition;
uniform vec2 pixelSize;
varying vec2 tc;

void main() {
  float tx = position.x * 0.5 + 0.5; //-1 -> 0, 1 -> 1
  float ty = -position.y * 0.5 + 0.5; //-1 -> 1, 1 -> 0
  //(x + 0)/sw * 2 - 1, (x + w)/sw * 2 - 1
  float x = (pixelPosition.x + pixelSize.x * tx)/screenSize.x * 2.0 - 1.0;  //0 -> -1, 1 -> 1
  //1.0 - (y + h)/sh * 2, 1.0 - (y + h)/sh * 2
  float y = 1.0 - (pixelPosition.y + pixelSize.y * ty)/screenSize.y * 2.0;  //0 -> 1, 1 -> -1
  gl_Position = vec4(x, y, 0.0, 1.0);
  tc = texCoord;
}

#endif

#ifdef FRAG

uniform sampler2D image;
varying vec2 tc;

const float h = 1./512., dt = .001, tau = .5*dt/h;
void main(void) {
    vec2 D = -tau*vec2(
            texture2D(image, tc).r + texture2D(image, vec2(tc.r - h, tc.g)).r,
            texture2D(image, tc).g + texture2D(image, vec2(tc.r, tc.g - h)).g );
    vec2 Df = floor(D),   Dd = D - Df;
    vec2 tc1 = tc + Df*h;
    vec3 new =  
        (texture2D(image, tc1).rgb*(1. - Dd.g) +
         texture2D(image, vec2(tc1.r, tc1.g + h)).rgb*Dd.g)*(1. - Dd.r) +
        (texture2D(image, vec2(tc1.r + h, tc1.g)).rgb*(1. - Dd.g) +
         texture2D(image, vec2(tc1.r + h, tc1.g + h)).rgb*Dd.g)*Dd.r;
    gl_FragColor = vec4( new, texture2D(image, tc).a );
}

#endif
