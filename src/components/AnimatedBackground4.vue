<script setup lang="ts">
import { onUnmounted, onMounted, ref } from "vue";

type hslColor = {
  h: number;
  s: number;
  l: number;
};

type BlobData = {
  path: Path2D;
  offsetY: number;
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
  blobCount: 8,
  canvasWidth: 1920, // Fixed canvas width
  canvasHeight: 1080, // Fixed canvas height
  renderSize: 32, // Small offscreen canvas size for performance
  frameRate: 60,
  blurAmount: 2,
  maxOffsetY: 0.125,
  speedRange: {
    min: 0.05,
    max: 0.2,
  },
  scale: 1 / 100, // svg paths are 100px radius so we scale by 1/100 to normalize them to canvas space
} as const;

// Helper function to convert HSL object to CSS string
function hslToString(hsl: hslColor) {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
// SVG paths scaled to 100px radius for clean 5.12x scaling (512/100)
// Original paths were ~40px radius, scaled by factor of 2.5 (100/40)
const paths = [
  "M64.25,-75.5C81,-62.75,90.5,-40.25,95.75,-16C100.75,8,101.5,33.5,92,55.75C82.25,78.25,62.5,97.5,38.75,105.5C15.25,113.5,-12,110.5,-33.75,99.5C-55.75,88.75,-72.5,70,-83.25,49.25C-94,28.25,-99,5,-96.75,-18.75C-94.5,-42.5,-85.25,-66.5,-68,-79.25C-50.75,-91.75,-25.25,-93.25,-0.75,-92.25C23.75,-91.5,47.75,-88.25,64.25,-75.5Z",
  "M56,-68C74.25,-51.75,91.5,-35.5,94.75,-16.75C97.75,1.75,86.75,22.75,74.25,41C61.5,59.5,47.25,75,29.75,81.25C12.25,87.5,-8.75,84.25,-29.25,77.75C-49.75,71.25,-70,79,-84,44.75C-98,28,-105.75,4,-101,-17C-96.25,-38,-78,-55.75,-60.25,-72C-41.25,-88.25,-20.5,-102.75,-0.75,-101.75C19,-100.75,38,-83.25,56,-68Z",
  "M57.75,-68.5C71.25,-57.5,76,-36,77.5,-15.25C79,5.25,77.75,24.5,69,40C60.25,55.25,44.25,66.25,25,77.25C5.75,88,-17,98.25,-36.75,94C-56.75,90,-72.5,71.25,-83,50.25C-92.25,29.5,-93.75,6.25,-90.25,-16.5C-87,-39.5,-79.25,-62.25,-63.25,-72.75C-47.5,-83.25,-23.75,-81.5,-0.75,-80.75C22.25,-79.75,44.25,-79.5,57.75,-68.5Z",
  "M66.5,-76.5C84.5,-64,96.75,-41.5,99.25,-18.75C102,4.25,95,27.5,83.5,49C72,70.5,56,90.25,34.75,99.75C13.5,109.25,-13,108.75,-35.75,99.75C-58.5,90.75,-77.5,73.25,-84,53C-90.5,32.5,-84.5,9.5,-77.5,-11C-70.75,-31.25,-63.25,-48.75,-50,-62C-37,-75.5,-18.5,-84.75,2.75,-88C24,-90.5,48.25,-89,66.5,-76.5Z",
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
      offsetY: (Math.random() * 2 - 1) * ANIMATION_CONFIG.renderSize * ANIMATION_CONFIG.maxOffsetY,
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

// Offscreen canvas for performance optimization
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

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

  // Ensure offscreen canvas is available
  if (!offscreenCanvas || !offscreenCtx) {
    console.warn("🎨 Offscreen canvas not available");
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

  // Clear offscreen canvas
  offscreenCtx.clearRect(0, 0, ANIMATION_CONFIG.renderSize, ANIMATION_CONFIG.renderSize);

  // Apply blur filter to offscreen canvas
  offscreenCtx.filter = `blur(${ANIMATION_CONFIG.blurAmount}px)`;

  // Render each blob on offscreen canvas
  blobs.value.forEach((blob, index) => {
    // Update rotation
    blob.rotation.angle += blob.rotation.speed * deltaSeconds * 60; // 60 degrees per second base

    // Get colors for this blob - each blob has its own color pair
    const colors = blob.colors[0];

    if (!colors) return;

    // Create gradient for offscreen canvas
    const gradient = offscreenCtx.createLinearGradient(
      -(ANIMATION_CONFIG.renderSize / 2),
      ANIMATION_CONFIG.renderSize / 2,
      ANIMATION_CONFIG.renderSize / 2,
      -(ANIMATION_CONFIG.renderSize / 2)
    );
    gradient.addColorStop(0, colors.a);
    gradient.addColorStop(1, colors.b);

    // Save offscreen context state
    offscreenCtx.save();

    // Transform to blob position on offscreen canvas
    const percentage = (ANIMATION_CONFIG.blobCount - index + 1) / ANIMATION_CONFIG.blobCount;

    // Blob radius equals renderSize (512px)
    const blobRadius = ANIMATION_CONFIG.renderSize;

    // SVG paths are 100px radius, so scale factor is renderSize/100
    const scaleFactor = blobRadius * ANIMATION_CONFIG.scale;
    const start = -blobRadius;

    // Use radius to compute offscreenX offset
    const offscreenX = start + percentage * blobRadius;
    const offscreenY = ANIMATION_CONFIG.renderSize / 2 + blob.offsetY;

    offscreenCtx.translate(offscreenX, offscreenY);
    offscreenCtx.rotate((blob.rotation.angle * Math.PI) / 180);

    // Scale by factor to make 100px radius paths fit 512px radius
    offscreenCtx.scale(scaleFactor, scaleFactor);

    // Set gradient and draw on offscreen canvas
    offscreenCtx.fillStyle = gradient;
    offscreenCtx.fill(blob.path);

    // Restore offscreen context state
    offscreenCtx.restore();
  });

  // Reset filter on offscreen canvas
  offscreenCtx.filter = "none";

  // Clear main canvas and draw scaled offscreen canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);

  // Continue animation
  animationId.value = requestAnimationFrame(render);
};

// Initialize component
onMounted(() => {
  // Generate blobs
  blobs.value = generateBlobs();

  // Set up main canvas with fixed size
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.width = ANIMATION_CONFIG.canvasWidth;
    canvas.height = ANIMATION_CONFIG.canvasHeight;
  }

  // Create offscreen canvas for performance optimization
  offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = ANIMATION_CONFIG.renderSize;
  offscreenCanvas.height = ANIMATION_CONFIG.renderSize;
  offscreenCtx = offscreenCanvas.getContext("2d");

  if (!offscreenCtx) {
    console.error("🎨 Failed to get offscreen 2D context");
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`🎨 Canvas initialized with ${blobs.value.length} blobs`);
    console.log("🎨 First blob data:", blobs.value[0]);
    console.log("🎨 Main canvas size:", ANIMATION_CONFIG.canvasWidth, "x", ANIMATION_CONFIG.canvasHeight);
    console.log("🎨 Offscreen canvas size:", ANIMATION_CONFIG.renderSize, "x", ANIMATION_CONFIG.renderSize);
    console.log(
      "🎨 Performance improvement: Rendering",
      ANIMATION_CONFIG.renderSize * ANIMATION_CONFIG.renderSize,
      "pixels instead of",
      ANIMATION_CONFIG.canvasWidth * ANIMATION_CONFIG.canvasHeight,
      "pixels"
    );
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

  // Clean up offscreen canvas
  offscreenCanvas = null;
  offscreenCtx = null;

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
