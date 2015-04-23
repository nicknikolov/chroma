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

uniform sampler2D Velocity;
uniform sampler2D Pressure;
uniform sampler2D Obstacle;
uniform float Width;
uniform float Height;
uniform float HalfInverseCellSize;
varying vec2 tc;

void fTexNeighbors(sampler2D tex, vec2 st,
    out float left, out float right, out float bottom, out float top, vec2 ts) {
  float texelSize = 1.0 / 512.0;
  left   = texture2D(tex, st - vec2(1, 0) / ts ).x;
  right  = texture2D(tex, st + vec2(1, 0) / ts ).x;
  bottom = texture2D(tex, st - vec2(0, 1) / ts ).x;
  top    = texture2D(tex, st + vec2(0, 1) / ts ).x;
}

void main(){

  vec2 texelSize = vec2(Width, Height);

  float pL; float pR; float pB; float pT;
  fTexNeighbors (Pressure, tc, pL, pR, pB, pT, texelSize);
  float pC = texture2D(Pressure, tc).x;

  float oL; float oR; float oB; float oT;
  fTexNeighbors (Obstacle, tc, oL, oR, oB, oT, texelSize);

  vec2 vMask = vec2(1.0,1.0);

  if (oL > 0.9) { pL = pC; vMask.x = 0.0; }
  if (oR > 0.9) { pR = pC; vMask.x = 0.0; }
  if (oB > 0.9) { pB = pC; vMask.y = 0.0; }
  if (oT > 0.9) { pT = pC; vMask.y = 0.0; }

  vec2 oldV = texture2D(Velocity, tc).xy;
  vec2 grad = vec2(pR - pL, pT - pB) * HalfInverseCellSize;
  vec2 newV = oldV - grad;

  gl_FragColor = vec4((vMask * newV), 0.0, 0.0);
}

#endif




