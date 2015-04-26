#ifdef VERT

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 normalMatrix;
uniform float time;
uniform float pointSize;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

varying vec3 e;
varying vec3 n;
varying vec3 p;

uniform sampler2D displacementMap;
uniform float displacementHeight;
uniform vec2 textureSize;
uniform vec2 planeSize;
uniform float numSteps;


void main() {
    vec3 pos = position;
    float height = displacementHeight * texture2D(displacementMap, texCoord).r;

    float heightRight =
                  displacementHeight *
                  texture2D(displacementMap, texCoord + vec2(2.0/textureSize.x, 0.0)).r;

    float heightFront =
                  displacementHeight *
                  texture2D(displacementMap, texCoord + vec2(0.0, 2.0/textureSize.y)).r;

    height = displacementHeight * texture2D(displacementMap, texCoord).r;
    heightRight =
              displacementHeight *
              texture2D(displacementMap, texCoord + vec2(2.0/textureSize.x, 0.0)).r;

    heightFront =
              displacementHeight *
              texture2D(displacementMap, texCoord + vec2(0.0, 2.0/textureSize.y)).r;

    vec3 right =
              normalize(vec3(2.0*planeSize.x/numSteps, heightRight, 0.0) -
              vec3(0.0, height, 0.0));

    vec3 front =
              normalize(vec3(0.0, heightFront, 2.0*planeSize.y/numSteps) -
              vec3(0.0, height, 0.0));

    vec3 up = normalize(cross(right, -front));

    vec3 N = up;

    pos.z += height * 5.0;
    //pos.z = clamp(pos.z, 0.0, 0.5);
    pos.z = log2(pos.z * 50.0) / 20.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    e = normalize(vec3(modelViewMatrix * vec4(position, 1.0)));
    n = normalize(vec3(normalMatrix * vec4(N, 1.0)));
    p = pos;
}

#endif

#ifdef FRAG

uniform vec4 tint;
uniform float zTreshold;
uniform sampler2D texture;
uniform bool showNormals;

varying vec3 e;
varying vec3 n;
varying vec3 p;


void main() {
    vec3 r = (reflect(e, n));
    float m = 2.0 * sqrt(r.x * r.x + r.y * r.y + (r.z + 1.0) * (r.z + 1.0));
    vec2 N = r.xy / m + 0.5;
    vec3 base = texture2D( texture, N ).rgb;

    if (length(tint.xyz) > 0.0) {
        gl_FragColor = tint;
    }
    else {
        gl_FragColor = vec4( base, 1.0 );
    }

    if (showNormals) {
        gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
    }

    gl_FragColor.w = p.z * p.z * 20.0;

    if (p.z < zTreshold) discard;
}
#endif
