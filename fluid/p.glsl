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

const float h = 1./512.;
void main(void) {
    vec4 t = texture2D(image, tc);
    t.a =
        (texture2D(image, vec2(tc.r - h, tc.g)).a +
         texture2D(image, vec2(tc.r + h, tc.g)).a +
         texture2D(image, vec2(tc.r, tc.g - h)).a +
         texture2D(image, vec2(tc.r, tc.g + h)).a -
         (t.r - texture2D(image, vec2(tc.r - h, tc.g)).r +
          t.g - texture2D(image, vec2(tc.r, tc.g - h)).g) *h) *.25;
    gl_FragColor = t;
}

#endif