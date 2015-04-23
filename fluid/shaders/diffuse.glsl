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
uniform sampler2D Obstacle;
uniform float Viscosity;
uniform float C;
uniform int test;
uniform float Width;
uniform float Height;
varying vec2 tc;

void v2TexNeighbors(sampler2D tex, vec2 st,
    out vec2 left, out vec2 right, out vec2 bottom, out vec2 top, vec2 ts) {
  left   = texture2D(tex, st - vec2(1, 0) / ts ).xy;
  right  = texture2D(tex, st + vec2(1, 0) / ts ).xy;
  bottom = texture2D(tex, st - vec2(0, 1) / ts ).xy;
  top    = texture2D(tex, st + vec2(0, 1) / ts ).xy;

}

void fRoundTexNeighbors(sampler2D tex, vec2 st,
    out float left, out float right, out float bottom, out float top, vec2 ts) {
  left   = ceil(texture2D(tex, st - vec2(1, 0) / ts ).x - 0.5);
  right  = ceil(texture2D(tex, st + vec2(1, 0) / ts ).x - 0.5);
  bottom = ceil(texture2D(tex, st - vec2(0, 1) / ts ).x - 0.5);
  top    = ceil(texture2D(tex, st + vec2(0, 1) / ts ).x - 0.5);

}

void main(){

  vec2 texelSize = vec2(Width, Height);

  vec2 vL; vec2 vR; vec2 vB; vec2 vT;
  v2TexNeighbors (Velocity, tc, vL, vR, vB, vT, texelSize);
  vec2 vC = texture2D(Velocity, tc).xy;

  float oL; float oR; float oB; float oT;
  fRoundTexNeighbors (Obstacle, tc, oL, oR, oB, oT, texelSize);
  float inverseSolid = 1.0 - ceil(texture2D(Obstacle, tc).x - 0.5);

  vL *= 1.0 - oL;
  vR *= 1.0 - oR;
  vB *= 1.0 - oB;
  vT *= 1.0 - oT;
  // ADD NEIGHBOR OBSTACLES;

  vec2 newVel = ((vC + Viscosity * (vL + vR + vB + vT)) / C) * inverseSolid;

  gl_FragColor = vec4(newVel, 0.0, 0.0);
}

#endif

