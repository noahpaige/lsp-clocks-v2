<script setup lang="ts">
type hslColor = {
  h: number;
  s: number;
  l: number;
};

// Interpolate a single value
const interpolate = (a: number, b: number, factor: number) => a + factor * (b - a);

function interpolateHSL(color1: hslColor, color2: hslColor, hFactor: number, sFactor: number, lFactor: number) {
  // Ensure hue stays within 0-360 range
  const normalizeHue = (hue: number) => (hue + 360) % 360;

  // Interpolate hue, handling the circular nature
  let h = interpolate(color1.h, color2.h, hFactor);
  h = normalizeHue(h);

  // Interpolate saturation and lightness
  const s = interpolate(color1.s, color2.s, sFactor);
  const l = interpolate(color1.l, color2.l, lFactor);

  // Return the interpolated color as an object
  return {
    h: Math.round(h),
    s: Math.round(s),
    l: Math.round(l),
  };
}

// Helper function to convert the object to an HSL string
function hslToString(hsl: hslColor) {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
const paths = [
  "M25.7,-30.2C32.4,-25.1,36.2,-16.1,38.3,-6.4C40.3,3.2,40.6,13.4,36.8,22.3C32.9,31.3,25,39,15.5,42.2C6.1,45.4,-4.8,44.2,-13.5,39.8C-22.3,35.5,-29,28,-33.3,19.7C-37.6,11.3,-39.6,2,-38.7,-7.5C-37.8,-17,-34.1,-26.6,-27.2,-31.7C-20.3,-36.7,-10.1,-37.3,-0.3,-36.9C9.5,-36.6,19.1,-35.3,25.7,-30.2Z",
  "M22.4,-27.2C29.7,-20.7,36.6,-14.2,37.9,-6.7C39.1,0.7,34.7,9.1,29.7,16.4C24.6,23.8,18.9,30,11.9,32.5C4.9,35,-3.5,33.7,-11.7,31.1C-19.9,28.5,-28,24.7,-33.6,17.9C-39.2,11.2,-42.3,1.6,-40.4,-6.8C-38.5,-15.2,-31.6,-22.3,-24.1,-28.8C-16.5,-35.3,-8.2,-41.1,-0.3,-40.7C7.6,-40.3,15.2,-33.8,22.4,-27.2Z",
  "M23.1,-27.4C28.5,-23,30.4,-14.4,31,-6.1C31.6,2.1,31.1,9.8,27.6,16C24.1,22.1,17.7,26.5,10,30.9C2.3,35.2,-6.8,39.3,-14.7,37.6C-22.7,36,-29.5,28.5,-33.2,20.1C-36.9,11.8,-37.5,2.5,-36.1,-6.6C-34.8,-15.8,-31.7,-24.9,-25.3,-29.1C-19,-33.3,-9.5,-32.6,-0.3,-32.3C8.9,-31.9,17.7,-31.8,23.1,-27.4Z",
  "M26.6,-30.6C33.8,-25.6,38.7,-16.6,39.7,-7.5C40.8,1.7,38,11,33.4,19.6C28.8,28.2,22.4,36.1,13.9,39.9C5.4,43.7,-5.2,43.5,-14.3,39.9C-23.4,36.3,-31,29.3,-33.6,21.2C-36.2,13,-33.8,3.8,-31,-4.4C-28.3,-12.5,-25.3,-19.5,-20,-24.8C-14.8,-30.2,-7.4,-33.9,1.1,-35.2C9.7,-36.6,19.3,-35.6,26.6,-30.6Z",
];

const c1 = { h: 221, s: 105, l: 22 }; //{ h: 351, s: 53, l: 38 };
const c2 = { h: 242.2, s: 84, l: 4.9 }; //{ h: 248, s: 65, l: 54 };

const l: any[] = [];
const n = 8;
const gap = 0.75;
const shapeMin = 0.5;
const shapeMax = 3;
for (let i = 0; i < n; i++) {
  const hFactor = (i / n) * (1 - gap);
  const sFactor = i / n;
  const lFactor = 1 - (i / n) * (1 - gap);
  const rotation = Math.floor(Math.random() * 360);
  const scale = interpolate(shapeMax, shapeMin, sFactor);
  const duration = 20 + Math.random() * 20;
  l.push({
    path: paths[Math.floor(Math.random() * paths.length)],
    colors: [
      hslToString(interpolateHSL(c1, c2, hFactor, sFactor, lFactor)),
      hslToString(interpolateHSL(c1, c2, hFactor + gap, sFactor, lFactor - gap)),
    ],
    groupStyle: `transform: rotate(${rotation}deg) scale(${scale}); translateZ: 0;`,
    animDuration: duration + "s",
  });
}
</script>

<template>
  <svg preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100" class="w-full h-full -z-20 blur-xl">
    <defs>
      <linearGradient
        v-for="(item, index) in l"
        :key="'gradient' + index"
        :id="'gradient' + index"
        x1="0"
        x2="1"
        y1="1"
        y2="0"
      >
        <stop id="stop1" :stop-color="item.colors[0]" offset="0%"></stop>
        <stop id="stop2" :stop-color="item.colors[1]" offset="100%"></stop>
      </linearGradient>
    </defs>
    <g v-for="(item, index) in l" :key="'path' + index" :style="item.groupStyle" class="transform-gpu">
      <path
        :fill="`url(#${'gradient' + index})`"
        class="animate-spin transform-gpu"
        :style="`animation-duration: ${item.animDuration}`"
        :d="item.path"
        width="100%"
        height="100%"
        :stroke="`url(#gradient${index})`"
      ></path>
    </g>
  </svg>
</template>

<style scoped>
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: rotate linear infinite;
}

body {
  filter: blur(200px);
}

svg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
}
</style>
