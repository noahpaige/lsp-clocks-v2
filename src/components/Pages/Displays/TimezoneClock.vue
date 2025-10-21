<script setup lang="ts">
import Clock from "@/components/Clock/Clock.vue";
import AnimatedBackground4 from "@/components/AnimatedBackground4.vue";
import { reactive, ref } from "vue";
import { useIntervalFn } from "@vueuse/core";
import { ClockDataType, parseClockData } from "@/types/ClockData";
import { useRedisObserver } from "@/composables/useRedisObserver";

const { addObserver } = useRedisObserver();

const clockData = reactive<ClockDataType>({
  utc: 0,
  local: 0,
  timezoneStr: "",
  t: 0,
  l: 0,
  holdRemaining: 0,
  untilRestart: 0,
  windowUsed: 0,
  windowRemaining: 0,
  tZero: 0,
  met: 0,
});
addObserver("clockdata", (response) => {
  const parsed = parseClockData(response.data);
  Object.assign(clockData, parsed); // updates reactive object
});
</script>

<template>
  <div class="w-screen h-screen">
    <AnimatedBackground4 />
    <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 1200 1200">
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div class="h-full w-full flex p-5 justify-center items-center">
          <div class="flex flex-col w-full gap-8 justify-center items-center">
            <Clock labelRight="UTC" :time="clockData.utc" size="2xl" class="" />
            <Clock :labelRight="clockData.timezoneStr" :time="clockData.local" size="2xl" class="" />
          </div>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>
