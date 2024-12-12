<template>
  <div class="flex align-middle w-full h-full justify-center items-center">
    <div
      :class="
        cn(
          'flex align-middle bg-slate-900 rounded-lg justify-center items-center select-none',
          ...sizes.container
        )
      "
    >
      <div
        :class="
          cn('flex flex-col items-center overflow-y-hidden', ...sizes.nums)
        "
      >
        <div
          class="animate-flip-clock w-fit"
          v-for="(timeStr, index) in timeArr[0]"
          :key="`${index}-${timeStr}`"
        >
          {{ timeStr }}
        </div>
      </div>
      <div class="text-muted-foreground font-thin">:</div>
      <div
        :class="
          cn('flex flex-col items-center overflow-y-hidden', ...sizes.nums)
        "
      >
        <div
          class="animate-flip-clock w-fit"
          v-for="(timeStr, index) in timeArr[1]"
          :key="`${index}-${timeStr}`"
        >
          {{ timeStr }}
        </div>
      </div>
      <div class="text-muted-foreground font-thin">:</div>
      <div
        :class="
          cn('flex flex-col items-center overflow-y-hidden', ...sizes.nums)
        "
      >
        <div
          class="animate-flip-clock w-fit"
          v-for="(timeStr, index) in timeArr[2]"
          :key="`${index}-${timeStr}`"
        >
          {{ timeStr }}
        </div>
      </div>
      <div :class="cn('text-muted-foreground font-thin', ...sizes.label)">
        UTC
      </div>
    </div>
  </div>
</template>

<script setup>
import { cn } from "@/lib/utils";
import { ref } from "vue";

const sizes = {
  container: [
    "text-[4rem] gap-1 px-8",
    "sm:text-[5rem] sm:gap-1.5",
    "md:text-[6rem] md:gap-2",
    "lg:text-[7rem] lg:gap-3",
    "xl:text-[8rem] xl:gap-4",
    "2xl:text[10rem] 2xl:gap-5",
  ],
  nums: [
    "h-[4rem] leading-[4rem]",
    "sm:h-[5rem] sm:leading-[5rem]",
    "md:h-[6rem] md:leading-[6rem]",
    "lg:h-[7rem] lg:leading-[7rem]",
    "xl:h-[8rem] xl:leading-[8rem]",
    "2xl:h-[9rem] 2xl:leading-[9rem]",
  ],
  label: ["ml-6", "sm:ml-8", "md:ml-9", "lg:ml-10", "xl:ml-12", "2xl:ml-14"],
};

// Define your clock data and functionality here
const timeArr = ref([
  ["00", "00"],
  ["00", "00"],
  ["00", "00"],
]);

// Define your clock methods here
function updateClock() {
  const currentTime = new Date();
  const timeStrs = [
    currentTime.getUTCHours().toString().padStart(2, "0"),
    currentTime.getUTCMinutes().toString().padStart(2, "0"),
    currentTime.getUTCSeconds().toString().padStart(2, "0"),
  ];

  function updateTime(index) {
    if (timeArr.value[index][0] !== timeStrs[index]) {
      timeArr.value[index].unshift(timeStrs[index]);
      timeArr.value[index].pop();
    }
  }

  updateTime(0);
  updateTime(1);
  updateTime(2);
}

// Call the updateClock method at regular intervals
setInterval(updateClock, 1000);
updateClock();
</script>
