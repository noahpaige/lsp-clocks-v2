<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

type hslColor = { h: number; s: number; l: number };
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number;

function interpolate(a: number, b: number, factor: number) {
  return a + factor * (b - a);
}

function interpolateHSL(c1: hslColor, c2: hslColor, h: number, s: number, l: number): hslColor {
  const hue = (interpolate(c1.h, c2.h, h) + 360) % 360;
  const sat = interpolate(c1.s, c2.s, s);
  const light = interpolate(c1.l, c2.l, l);
  return { h: Math.round(hue), s: Math.round(sat), l: Math.round(light) };
}

function hslToString(hsl: hslColor): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function createPath(svgPath: string): Path2D {
  return new Path2D(svgPath);
}

const paths = [
  "M25.7,-30.2C32.4,-25.1,36.2,-16.1,38.3,-6.4C40.3,3.2,40.6,13.4,36.8,22.3C32.9,31.3,25,39,15.5,42.2C6.1,45.4,-4.8,44.2,-13.5,39.8C-22.3,35.5,-29,28,-33.3,19.7C-37.6,11.3,-39.6,2,-38.7,-7.5C-37.8,-17,-34.1,-26.6,-27.2,-31.7C-20.3,-36.7,-10.1,-37.3,-0.3,-36.9C9.5,-36.6,19.1,-35.3,25.7,-30.2Z",
  "M22.4,-27.2C29.7,-20.7,36.6,-14.2,37.9,-6.7C39.1,0.7,34.7,9.1,29.7,16.4C24.6,23.8,18.9,30,11.9,32.5C4.9,35,-3.5,33.7,-11.7,31.1C-19.9,28.5,-28,24.7,-33.6,17.9C-39.2,11.2,-42.3,1.6,-40.4,-6.8C-38.5,-15.2,-31.6,-22.3,-24.1,-28.8C-16.5,-35.3,-8.2,-41.1,-0.3,-40.7C7.6,-40.3,15.2,-33.8,22.4,-27.2Z",
  "M23.1,-27.4C28.5,-23,30.4,-14.4,31,-6.1C31.6,2.1,31.1,9.8,27.6,16C24.1,22.1,17.7,26.5,10,30.9C2.3,35.2,-6.8,39.3,-14.7,37.6C-22.7,36,-29.5,28.5,-33.2,20.1C-36.9,11.8,-37.5,2.5,-36.1,-6.6C-34.8,-15.8,-31.7,-24.9,-25.3,-29.1C-19,-33.3,-9.5,-32.6,-0.3,-32.3C8.9,-31.9,17.7,-31.8,23.1,-27.4Z",
  "M26.6,-30.6C33.8,-25.6,38.7,-16.6,39.7,-7.5C40.8,1.7,38,11,33.4,19.6C28.8,28.2,22.4,36.1,13.9,39.9C5.4,43.7,-5.2,43.5,-14.3,39.9C-23.4,36.3,-31,29.3,-33.6,21.2C-36.2,13,-33.8,3.8,-31,-4.4C-28.3,-12.5,-25.3,-19.5,-20,-24.8C-14.8,-30.2,-7.4,-33.9,1.1,-35.2C9.7,-36.6,19.3,-35.6,26.6,-30.6Z",
];

interface Shape {
  path: Path2D;
  rotation: number;
  scale: number;
  speed: number;
  colorStart: string;
  colorEnd: string;
}

const shapes: Shape[] = [];

const c1 = { h: 221, s: 105, l: 22 };
const c2 = { h: 242.2, s: 84, l: 4.9 };

const n = 8;
const gap = 0.75;
const shapeMin = 10;
const shapeMax = 40;

for (let i = 0; i < n; i++) {
  const hFactor = (i / n) * (1 - gap);
  const sFactor = i / n;
  const lFactor = 1 - (i / n) * (1 - gap);

  const rotation = Math.random() * Math.PI * 2;
  const scale = interpolate(shapeMax, shapeMin, sFactor);
  const speed = 0.001 + Math.random() * 0.002;

  const color1 = interpolateHSL(c1, c2, hFactor, sFactor, lFactor);
  const color2 = interpolateHSL(c1, c2, hFactor + gap, sFactor, lFactor - gap);

  shapes.push({
    path: createPath(paths[Math.floor(Math.random() * paths.length)]),
    rotation,
    scale,
    speed,
    colorStart: hslToString(color1),
    colorEnd: hslToString(color2),
  });
}

function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  //   ctx.translate(canvas.width / 2, canvas.height / 2);

  shapes.forEach((shape) => {
    shape.rotation += shape.speed;

    ctx.save();
    ctx.rotate(shape.rotation);
    ctx.scale(shape.scale, shape.scale);

    const gradient = ctx.createLinearGradient(-25, -25, 25, 25);
    gradient.addColorStop(0, shape.colorStart);
    gradient.addColorStop(1, shape.colorEnd);

    ctx.fillStyle = gradient;
    ctx.globalAlpha = 1;
    ctx.fill(shape.path);
    ctx.restore();
  });

  ctx.restore();
  animationFrameId = requestAnimationFrame(draw);
}

onMounted(() => {
  draw();
  window.addEventListener("resize", draw);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener("resize", draw);
});
</script>

<template>
  <canvas ref="canvasRef" class="fixed inset-0 -z-20 blur-xl"></canvas>
</template>
