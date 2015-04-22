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

uniform sampler2D Backbuffer;
uniform sampler2D AddTexture;
uniform float force;
uniform bool xNeg;
uniform bool yNeg;
varying vec2 tc;

void main(){

  vec4 color = texture2D(Backbuffer, tc) + texture2D(AddTexture, tc) * force;
//  vec4 color = texture2D(Backbuffer, tc);
//  vec4 at = texture2D(AddTexture, tc);
//
//  if (xNeg == true) {
//    color.r -= at.r * force * 2;
//  } else {
//    color.r += at.r * force;
//  }
//
//  if (yNeg == true) {
//    color.g -= at.g * force * 2;
//  } else {
//    color.g += at.g * force;
//  }
//
//  color.b += at.b * force;

  gl_FragColor = color;
}

#endif



