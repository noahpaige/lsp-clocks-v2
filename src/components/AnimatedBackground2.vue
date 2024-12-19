<script setup lang="ts">
// Source: https://codepen.io/andyfitz/pen/RJwqbZ
</script>

<template>
  <div class="w-screen h-screen absolute -z-20">
    <svg class="bokeh" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50%" cy="50%" r="10%" />
      <circle cx="45%" cy="50%" r="30%" />
      <circle cx="85%" cy="35%" r="60%" />
      <circle cx="60%" cy="85%" r="30%" />
      <circle cx="45%" cy="50%" r="50%" />
      <circle cx="35%" cy="25%" r="70%" />
      <circle cx="90%" cy="-25%" r="40%" />
      <circle cx="-15%" cy="30%" r="20%" />
      <circle cx="65%" cy="85%" r="20%" />
      <circle cx="45%" cy="50%" r="40%" />
    </svg>
  </div>
</template>

<style scoped>
body {
  overflow: hidden;
  background-color: #013;
}

.bokeh {
  height: 100vh;
  width: 100vw;
  background-color: hsl(var(--background));
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  filter: blur(200px);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.bokeh circle {
  animation: rotate 6s linear infinite;
  fill: hsl(224, 84%, 0%);
  opacity: 0.3;
  filter: drop-shadow(0 0 100px hsl(224, 84%, 0%));
}
.bokeh circle:nth-child(2n - 1) {
  animation-duration: 10s;
  filter: hue-rotate(120deg);
  opacity: 0.2;
}
.bokeh circle:nth-child(2n) {
  filter: hue-rotate(-0deg);
  animation-duration: 15s;
}
.bokeh circle:nth-child(1) {
  fill: hsl(224, 84%, 5%);
  transform-origin: 20% 110%;
}
.bokeh circle:nth-child(2) {
  fill: hsl(224, 84%, 5%);
  transform-origin: 20% 110%;
}
.bokeh circle:nth-child(3) {
  fill: hsl(224, 84%, 10%);
  transform-origin: 70% 30%;
}
.bokeh circle:nth-child(4) {
  fill: hsl(224, 84%, 15%);
  transform-origin: 110% 70%;
}
.bokeh circle:nth-child(5) {
  fill: hsl(224, 84%, 20%);
  transform-origin: 30% 40%;
}
.bokeh circle:nth-child(6) {
  fill: hsl(224, 84%, 25%);
  transform-origin: -10% 80%;
}
.bokeh circle:nth-child(7) {
  fill: hsl(224, 84%, 30%);
  transform-origin: 70% -10%;
}
.bokeh circle:nth-child(8) {
  fill: hsl(224, 84%, 35%);
  transform-origin: -30% 50%;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
