import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PixelRatio,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";

declare const process: {
  env: {
    EXPO_PUBLIC_RENDERER?: string;
  };
};

const ROW_HEIGHT = 20;
const COLUMN_WIDTH = 20;
const CHARACTER_POOL = Array.from(
  "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+-<=>?@",
);
const COLORS = [
  "#D8FFE5",
  "#B6FFD0",
  "#8BFFB6",
  "#55F59A",
  "#28D982",
  "#36E8CF",
  "#49C9FF",
  "#C5FF72",
];
const FONT_FAMILIES =
  Platform.select({
    ios: ["Menlo", "Courier", "Avenir Next", "Georgia"],
    android: ["monospace", "sans-serif", "sans-serif-condensed", "serif"],
    default: ["monospace", "Courier New", "serif", "sans-serif"],
  }) ?? ["monospace"];

const GLYPH_ROWS: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "%": ["11001", "11010", "00100", "01000", "10110", "00110", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "=": ["00000", "11111", "00000", "11111", "00000", "00000", "00000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "@": ["01110", "10001", "10111", "10101", "10111", "10000", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
};
const GPU_GLYPHS = Object.keys(GLYPH_ROWS);
const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;
const FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform float uColumns;
uniform sampler2D uGlyphAtlas;

float hash(float n) {
  n = mod(n, 127.0);
  float squared = mod(n * n, 127.0);
  return mod(squared * 17.0 + n * 31.0 + 7.0, 127.0) / 127.0;
}

void main() {
  vec2 pixel = vec2(vUv.x * uResolution.x, (1.0 - vUv.y) * uResolution.y);
  float cellWidth = uResolution.x / uColumns;
  float cellHeight = cellWidth;
  float column = floor(pixel.x / cellWidth);
  float row = floor(pixel.y / cellHeight);
  float localX = fract(pixel.x / cellWidth);
  float localY = fract(pixel.y / cellHeight);
  float rowCount = ceil(uResolution.y / cellHeight);
  float seed = hash(column + 17.13);
  float trailLength = 7.0 + hash(column * 3.71 + 2.0) * max(8.0, rowCount * 0.68);
  float speed = 7.0 + hash(column * 9.17 + 4.0) * 17.0;
  float head = mod(uTime * speed + seed * (rowCount + trailLength), rowCount + trailLength);
  float age = head - row;
  float inTrail = step(0.0, age) * (1.0 - step(trailLength, age));

  float glyphX = floor((localX - 0.16) * 7.36);
  float glyphY = floor((localY - 0.12) * 9.22);
  float insideGlyph = step(0.0, glyphX) * step(glyphX, 4.0)
                    * step(0.0, glyphY) * step(glyphY, 6.0);
  float tick = floor(uTime * 5.0);
  float glyphId = floor(hash(column * 31.0 + row * 97.0 + tick * 53.0) * ${GPU_GLYPHS.length}.0);
  vec2 atlasUv = vec2(
    (glyphId * 5.0 + glyphX + 0.5) / ${GPU_GLYPHS.length * 5}.0,
    (6.0 - glyphY + 0.5) / 7.0
  );
  float ink = texture2D(uGlyphAtlas, atlasUv).r * insideGlyph;
  float tailFade = 1.0 - age / max(trailLength, 1.0);
  float headGlow = 1.0 - step(0.9, age);
  float brightness = mix(0.18 + tailFade * 0.72, 1.0, headGlow);
  float palette = floor(hash(column * 43.0 + row * 29.0 + tick * 71.0) * 6.0);
  vec3 color = vec3(0.12, 0.88, 0.36);
  if (palette < 1.0) color = vec3(0.12, 0.88, 0.36);
  else if (palette < 2.0) color = vec3(0.05, 0.85, 0.72);
  else if (palette < 3.0) color = vec3(0.12, 0.62, 1.0);
  else if (palette < 4.0) color = vec3(0.72, 0.42, 1.0);
  else if (palette < 5.0) color = vec3(1.0, 0.36, 0.65);
  else color = vec3(0.85, 1.0, 0.18);
  color = mix(color, vec3(0.82, 1.0, 0.88), headGlow * 0.88);
  vec3 background = vec3(0.012, 0.035, 0.026);
  float coverage = ink * inTrail * clamp(brightness, 0.0, 1.0);
  gl_FragColor = vec4(mix(background, color, coverage), 1.0);
}
`;

type Glyph = {
  character: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  opacity: number;
};

type StreamConfig = {
  index: number;
  rowCount: number;
  startY: number;
  duration: number;
};

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createGlyph(): Glyph {
  return {
    character: CHARACTER_POOL[randomBetween(0, CHARACTER_POOL.length - 1)],
    color: COLORS[randomBetween(0, COLORS.length - 1)],
    fontFamily: FONT_FAMILIES[randomBetween(0, FONT_FAMILIES.length - 1)],
    fontSize: randomBetween(12, 17),
    opacity: randomBetween(35, 100) / 100,
  };
}

function createGlyphs(rowCount: number): Glyph[] {
  return Array.from({ length: rowCount }, createGlyph);
}

function useFrameRate(renderer: "cpu" | "gpu") {
  useEffect(() => {
    let frameCount = 0;
    let intervalStart = performance.now();
    let frameId = 0;

    const measure = (now: number) => {
      frameCount += 1;
      const elapsed = now - intervalStart;

      if (elapsed >= 5000) {
        console.info(
          `[matrix-rain] renderer=${renderer} loop-fps=${(frameCount * 1000 / elapsed).toFixed(1)}`,
        );
        frameCount = 0;
        intervalStart = now;
      }

      frameId = requestAnimationFrame(measure);
    };

    frameId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frameId);
  }, [renderer]);
}

function RainStream({
  config,
  columnWidth,
  screenHeight,
}: {
  config: StreamConfig;
  columnWidth: number;
  screenHeight: number;
}) {
  const [glyphs, setGlyphs] = useState(() => createGlyphs(config.rowCount));
  const progress = useRef(new Animated.Value(0)).current;
  const refreshInterval = useMemo(() => randomBetween(180, 460), []);
  const streamHeight = config.rowCount * ROW_HEIGHT;

  useEffect(() => {
    const timer = setInterval(() => {
      setGlyphs((current) =>
        current.map((glyph, index) =>
          index === 0 || Math.random() < 0.28 ? createGlyph() : glyph,
        ),
      );
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: config.duration,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [config.duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [config.startY, screenHeight + streamHeight],
  });

  return (
    <Animated.Text
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.stream,
        {
          left: config.index * columnWidth,
          width: columnWidth,
          transform: [{ translateY }],
        },
      ]}
    >
      {glyphs.map((glyph, index) => (
        <Text
          key={index}
          style={{
            color: glyph.color,
            fontFamily: glyph.fontFamily,
            fontSize: glyph.fontSize,
            fontWeight: index === 0 ? "700" : "400",
            lineHeight: ROW_HEIGHT,
            opacity: index === 0 ? Math.max(glyph.opacity, 0.9) : glyph.opacity,
            textShadowColor: glyph.color,
            textShadowRadius: index === 0 ? 9 : 4,
          }}
        >
          {glyph.character}
          {"\n"}
        </Text>
      ))}
    </Animated.Text>
  );
}

function createGlyphAtlas(gl: ExpoWebGLRenderingContext) {
  const atlasWidth = GPU_GLYPHS.length * 5;
  const atlasHeight = 7;
  const pixels = new Uint8Array(atlasWidth * atlasHeight * 4);

  GPU_GLYPHS.forEach((character, glyphIndex) => {
    GLYPH_ROWS[character].forEach((row, rowIndex) => {
      for (let column = 0; column < row.length; column += 1) {
        const pixelIndex =
          ((atlasHeight - rowIndex - 1) * atlasWidth + glyphIndex * 5 + column) * 4;
        const value = row[column] === "1" ? 255 : 0;
        pixels[pixelIndex] = value;
        pixels[pixelIndex + 1] = value;
        pixels[pixelIndex + 2] = value;
        pixels[pixelIndex + 3] = 255;
      }
    });
  });

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Não foi possível criar a textura da fonte GPU.");
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    atlasWidth,
    atlasHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels,
  );
  return texture;
}

function compileShader(
  gl: ExpoWebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Não foi possível criar um shader WebGL.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Erro desconhecido.";
    gl.deleteShader(shader);
    throw new Error(`Falha ao compilar shader Matrix Rain: ${message}`);
  }
  return shader;
}

function drawGpuRain(gl: ExpoWebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Não foi possível criar o programa WebGL Matrix Rain.");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "Erro desconhecido.";
    gl.deleteProgram(program);
    throw new Error(`Falha ao vincular shaders Matrix Rain: ${message}`);
  }

  const position = gl.getAttribLocation(program, "aPosition");
  const resolution = gl.getUniformLocation(program, "uResolution");
  const time = gl.getUniformLocation(program, "uTime");
  const columns = gl.getUniformLocation(program, "uColumns");
  const glyphAtlas = gl.getUniformLocation(program, "uGlyphAtlas");
  if (position < 0 || !resolution || !time || !columns || !glyphAtlas) {
    gl.deleteProgram(program);
    throw new Error("Não foi possível localizar os parâmetros do shader Matrix Rain.");
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    throw new Error("Não foi possível criar o buffer de vértices WebGL.");
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = createGlyphAtlas(gl);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(glyphAtlas, 0);

  const startTime = performance.now();
  let frameCount = 0;
  let intervalStart = startTime;
  let lastWidth = 0;
  let lastHeight = 0;

  const render = (now: number) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    if (width !== lastWidth || height !== lastHeight) {
      gl.viewport(0, 0, width, height);
      lastWidth = width;
      lastHeight = height;
    }

    gl.uniform2f(resolution, width, height);
    gl.uniform1f(
      columns,
      Math.min(48, Math.max(1, Math.ceil(width / PixelRatio.get() / COLUMN_WIDTH))),
    );
    gl.uniform1f(time, (now - startTime) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.endFrameEXP();

    frameCount += 1;
    const elapsed = now - intervalStart;
    if (elapsed >= 5000) {
      console.info(
        `[matrix-rain] renderer=gpu loop-fps=${(frameCount * 1000 / elapsed).toFixed(1)}`,
      );
      frameCount = 0;
      intervalStart = now;
    }
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}

function CpuRain({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  useFrameRate("cpu");
  const columnCount = Math.min(48, Math.max(1, Math.ceil(width / COLUMN_WIDTH)));
  const columnWidth = width / columnCount;
  const streams = useMemo<StreamConfig[]>(
    () =>
      Array.from({ length: columnCount }, (_, index) => {
        const rowCount = Math.ceil(height / ROW_HEIGHT) + randomBetween(8, 18);
        const streamHeight = rowCount * ROW_HEIGHT;
        const startY = randomBetween(-streamHeight, height);
        const distance = height + streamHeight - startY;
        const pixelsPerSecond = randomBetween(55, 155);

        return {
          index,
          rowCount,
          startY,
          duration: Math.round((distance / pixelsPerSecond) * 1000),
        };
      }),
    [columnCount, height],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {streams.map((stream) => (
        <RainStream
          key={`${height}-${stream.index}`}
          config={stream}
          columnWidth={columnWidth}
          screenHeight={height}
        />
      ))}
    </View>
  );
}

function GpuRain() {
  const onContextCreate = useRef((gl: ExpoWebGLRenderingContext) => {
    drawGpuRain(gl);
  }).current;

  return (
    <GLView
      style={StyleSheet.absoluteFill}
      onContextCreate={onContextCreate}
      msaaSamples={0}
    />
  );
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const renderer = process.env.EXPO_PUBLIC_RENDERER ?? "cpu";

  if (renderer !== "cpu" && renderer !== "gpu") {
    throw new Error(
      `EXPO_PUBLIC_RENDERER deve ser "cpu" ou "gpu"; valor recebido: "${renderer}".`,
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      {renderer === "gpu" ? <GpuRain /> : <CpuRain width={width} height={height} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#030907",
  },
  stream: {
    position: "absolute",
    top: 0,
    textAlign: "center",
    lineHeight: ROW_HEIGHT,
    fontSize: 15,
    includeFontPadding: false,
  },
});
