<script setup lang="ts">
import { onUnmounted, onMounted, ref } from "vue";

type hslColor = {
  h: number;
  s: number;
  l: number;
};

type BlobData = {
  path: Path2D;
  rotation: {
    angle: number;
    speed: number;
  };
  scale: number;
  colors: { a: string; b: string }[];
};

/**
 * Path2D pool for better memory management and performance
 * Reuses Path2D objects instead of creating new ones for each blob
 */
class Path2DPool {
  private pool = new Map<string, Path2D>();

  /**
   * Gets a Path2D object from the pool, creating it if it doesn't exist
   * @param rawPath - SVG path string
   * @returns Path2D object
   */
  getPath(rawPath: string): Path2D {
    if (!this.pool.has(rawPath)) {
      this.pool.set(rawPath, new Path2D(rawPath));
    }
    return this.pool.get(rawPath)!;
  }

  /**
   * Clears all cached Path2D objects to prevent memory leaks
   */
  clear(): void {
    this.pool.clear();
  }

  /**
   * Gets the size of the pool for debugging
   */
  size(): number {
    return this.pool.size;
  }
}

// Global pool instance
const path2DPool = new Path2DPool();

// Animation configuration
const ANIMATION_CONFIG = {
  blobCount: 4,
  canvasWidth: 1920, // Fixed canvas width
  canvasHeight: 1080, // Fixed canvas height
  frameRate: 60,
  blurAmount: 40,
  speedRange: {
    min: 0.3,
    max: 0.5,
  },
  scale: 32, // Uniform scale for all blobs
} as const;

// Helper function to convert HSL object to CSS string
function hslToString(hsl: hslColor) {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
const paths = [
  "M25.7,-30.2C32.4,-25.1,36.2,-16.1,38.3,-6.4C40.3,3.2,40.6,13.4,36.8,22.3C32.9,31.3,25,39,15.5,42.2C6.1,45.4,-4.8,44.2,-13.5,39.8C-22.3,35.5,-29,28,-33.3,19.7C-37.6,11.3,-39.6,2,-38.7,-7.5C-37.8,-17,-34.1,-26.6,-27.2,-31.7C-20.3,-36.7,-10.1,-37.3,-0.3,-36.9C9.5,-36.6,19.1,-35.3,25.7,-30.2Z",
  "M22.4,-27.2C29.7,-20.7,36.6,-14.2,37.9,-6.7C39.1,0.7,34.7,9.1,29.7,16.4C24.6,23.8,18.9,30,11.9,32.5C4.9,35,-3.5,33.7,-11.7,31.1C-19.9,28.5,-28,24.7,-33.6,17.9C-39.2,11.2,-42.3,1.6,-40.4,-6.8C-38.5,-15.2,-31.6,-22.3,-24.1,-28.8C-16.5,-35.3,-8.2,-41.1,-0.3,-40.7C7.6,-40.3,15.2,-33.8,22.4,-27.2Z",
  "M23.1,-27.4C28.5,-23,30.4,-14.4,31,-6.1C31.6,2.1,31.1,9.8,27.6,16C24.1,22.1,17.7,26.5,10,30.9C2.3,35.2,-6.8,39.3,-14.7,37.6C-22.7,36,-29.5,28.5,-33.2,20.1C-36.9,11.8,-37.5,2.5,-36.1,-6.6C-34.8,-15.8,-31.7,-24.9,-25.3,-29.1C-19,-33.3,-9.5,-32.6,-0.3,-32.3C8.9,-31.9,17.7,-31.8,23.1,-27.4Z",
  "M26.6,-30.6C33.8,-25.6,38.7,-16.6,39.7,-7.5C40.8,1.7,38,11,33.4,19.6C28.8,28.2,22.4,36.1,13.9,39.9C5.4,43.7,-5.2,43.5,-14.3,39.9C-23.4,36.3,-31,29.3,-33.6,21.2C-36.2,13,-33.8,3.8,-31,-4.4C-28.3,-12.5,-25.3,-19.5,-20,-24.8C-14.8,-30.2,-7.4,-33.9,1.1,-35.2C9.7,-36.6,19.3,-35.6,26.6,-30.6Z",
];

const c1 = { h: 221, s: 105, l: 22 };
const c2 = { h: 242.2, s: 84, l: 4.9 };

// Simple color interpolation for 4 blobs
const generateBlobColors = (blobIndex: number) => {
  const colors = [{ a: hslToString(c1), b: hslToString(c2) }];
  return colors[blobIndex % colors.length];
};

/**
 * Generate blob data optimized for Canvas rendering
 */
const generateBlobs = (): BlobData[] => {
  const blobs: BlobData[] = [];

  for (let i = 0; i < ANIMATION_CONFIG.blobCount; i++) {
    const rawPath = paths[Math.floor(Math.random() * paths.length)];
    const path2D = path2DPool.getPath(rawPath);

    const speed =
      ANIMATION_CONFIG.speedRange.min +
      (ANIMATION_CONFIG.speedRange.max - ANIMATION_CONFIG.speedRange.min) * Math.random();

    // Generate specific colors for this blob
    const blobColors = generateBlobColors(i);

    blobs.push({
      path: path2D,
      rotation: {
        angle: Math.random() * 360,
        speed: speed,
      },
      scale: ANIMATION_CONFIG.scale,
      colors: [blobColors], // Each blob has its own color pair
    });
  }

  return blobs;
};

// Canvas setup
const canvasRef = ref<HTMLCanvasElement | null>(null);
const blobs = ref<BlobData[]>([]);
const animationId = ref<number | null>(null);
const lastFrameTime = ref(performance.now());

const render = (currentTime: number) => {
  const canvas = canvasRef.value;
  if (!canvas) {
    console.warn("🎨 Canvas not available");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn("🎨 2D context not available");
    return;
  }

  // Frame rate limiting
  const targetFrameTime = 1000 / ANIMATION_CONFIG.frameRate;
  const timeSinceLastFrame = currentTime - lastFrameTime.value;

  if (timeSinceLastFrame < targetFrameTime) {
    animationId.value = requestAnimationFrame(render);
    return;
  }

  // Calculate delta time in seconds
  const deltaSeconds = timeSinceLastFrame / 1000;
  lastFrameTime.value = currentTime;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply blur filter
  ctx.filter = `blur(${ANIMATION_CONFIG.blurAmount}px)`;

  // Render each blob
  blobs.value.forEach((blob, index) => {
    // Update rotation
    blob.rotation.angle += blob.rotation.speed * deltaSeconds * 60; // 60 degrees per second base

    // Get colors for this blob - each blob has its own color pair
    const colors = blob.colors[0];

    if (!colors) return;

    // Create gradient directly
    const gradient = ctx.createLinearGradient(-50, 50, 50, -50);
    gradient.addColorStop(0, colors.a);
    gradient.addColorStop(1, colors.b);

    // Save context state
    ctx.save();

    // Transform to blob position
    const percentage = (ANIMATION_CONFIG.blobCount - index) / ANIMATION_CONFIG.blobCount;
    ctx.translate(-(canvas.width / 2) + canvas.width * percentage, canvas.height / 2);
    ctx.rotate((blob.rotation.angle * Math.PI) / 180);
    // Use direct scale values
    ctx.scale(blob.scale, blob.scale);

    // Set gradient and draw
    ctx.fillStyle = gradient;
    ctx.fill(blob.path);

    // Restore context state
    ctx.restore();
  });

  // Reset filter
  ctx.filter = "none";

  // Continue animation
  animationId.value = requestAnimationFrame(render);
};

// Initialize component
onMounted(() => {
  // Generate blobs
  blobs.value = generateBlobs();

  // Set up canvas with fixed size
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.width = ANIMATION_CONFIG.canvasWidth;
    canvas.height = ANIMATION_CONFIG.canvasHeight;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`🎨 Canvas initialized with ${blobs.value.length} blobs`);
    console.log("🎨 First blob data:", blobs.value[0]);
    console.log("🎨 Fixed canvas size:", ANIMATION_CONFIG.canvasWidth, "x", ANIMATION_CONFIG.canvasHeight);
  }

  // Start animation
  animationId.value = requestAnimationFrame(render);
});

// Cleanup on component unmount
onUnmounted(() => {
  // Stop animation
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }

  // Clear caches
  path2DPool.clear();

  if (process.env.NODE_ENV === "development") {
    console.log("🎨 Canvas cleaned up on component unmount");
  }
});
</script>

<template>
  <div class="w-full h-full -z-20 absolute overflow-hidden">
    <canvas
      ref="canvasRef"
      class="block"
      :style="{
        background: blobs.length > 0 && blobs[0].colors.length > 0 ? blobs[0].colors[0].b || '#000' : '#000',
        width: '100%',
        height: '100%',
      }"
    />
  </div>
</template>

<style scoped>
canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
}
</style>
