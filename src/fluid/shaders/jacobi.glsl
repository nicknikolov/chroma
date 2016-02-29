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

uniform sampler2D Pressure;
uniform sampler2D Divergence;
uniform sampler2D Obstacle;
uniform float Alpha;
uniform float Width;
uniform float Height;
varying vec2 tc;
//	   uniform float InverseBeta = 0.25;

void fTexNeighbors(sampler2D tex, vec2 st,
    out float left, out float right, out float bottom, out float top, vec2 ts) {
  //float texelSize = 1.0 / 512.0;
  left   = texture2D(tex, st - vec2(1, 0) / ts ).x;
  right  = texture2D(tex, st + vec2(1, 0) / ts ).x;
  bottom = texture2D(tex, st - vec2(0, 1) / ts ).x;
  top    = texture2D(tex, st + vec2(0, 1) / ts ).x;
}

void fRoundTexNeighbors(sampler2D tex, vec2 st,
    out float left, out float right, out float bottom, out float top, vec2 ts) {
  //float texelSize = 1.0 / 512.0;
  left   = ceil(texture2D(tex, st - vec2(1, 0) / ts ).x - 0.5);
  right  = ceil(texture2D(tex, st + vec2(1, 0) / ts ).x - 0.5);
  bottom = ceil(texture2D(tex, st - vec2(0, 1) / ts ).x - 0.5);
  top    = ceil(texture2D(tex, st + vec2(0, 1) / ts ).x - 0.5);
}

void main() {

  vec2 texelSize = vec2(Width, Height);

  float pL; float pR; float pB; float pT;
  fTexNeighbors (Pressure, tc, pL, pR, pB, pT, texelSize);
  float pC = texture2D(Pressure, tc).x;

  float oL; float oR; float oB; float oT;
  fRoundTexNeighbors (Obstacle, tc, oL, oR, oB, oT, texelSize);

  float bC = texture2D(Divergence, tc ).x;

  pL = pL * (1.0 - oL) + pC * oL;
  pR = pR * (1.0 - oR) + pC * oR;
  pB = pB * (1.0 - oB) + pC * oB;
  pT = pT * (1.0 - oT) + pC * oT;


  gl_FragColor = vec4((pL + pR + pB + pT + Alpha * bC) * 0.25, 0.0,0.0,0.0);
}

#endif



