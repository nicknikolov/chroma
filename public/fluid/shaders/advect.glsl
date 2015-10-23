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
  tc = texCoord ;
}

#endif

#ifdef FRAG

uniform sampler2D Backbuffer;
uniform sampler2D Obstacle;
uniform sampler2D Velocity;

uniform float Width;
uniform float Height;
uniform float TimeStep;
uniform float Dissipation;
uniform float InverseCellSize;
uniform vec2 Scale;
varying vec2 tc;

void main(){
  vec2 texelSize = vec2(Width, Height);
  vec2 tcs = tc * texelSize;
  vec2 tc2 = tc * Scale;

  float xc = texture2D(Obstacle, tc2).x;

  float inverseSolid = 1.0 - ceil(xc - 0.5);

  vec2 u = texture2D(Velocity, tc2).rg / Scale;
  vec2 coord =  tcs - TimeStep * InverseCellSize * u;
  coord /= texelSize;

  gl_FragColor = Dissipation * texture2D(Backbuffer, coord) * inverseSolid;

}

#endif
