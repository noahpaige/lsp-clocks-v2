<script setup lang="ts">
import Clock from "@/components/Clock/Clock.vue";
import AnimatedBackground4 from "@/components/AnimatedBackground4.vue";
import AnimatedBackground6 from "@/components/AnimatedBackground6.vue";
import { reactive } from "vue";
import { useRedisObserver } from "@/composables/useRedisObserver";
import { ClockDataType, parseClockData } from "@/types/ClockData";

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
  Object.assign(clockData, parsed);
});
</script>

<template>
  <div class="w-screen h-screen">
    <AnimatedBackground4 />
    <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 2500 1200">
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div class="h-full w-full flex p-5 justify-center items-center">
          <div class="flex flex-col w-full gap-8 justify-center items-center">
            <div class="grid grid-cols-2 gap-8 justify-center items-center">
              <Clock labelRight="UTC" :time="clockData.utc" size="2xl" class="" />
              <Clock :labelRight="clockData.timezoneStr" :time="clockData.local" size="2xl" class="" />
            </div>
            <div class="grid grid-cols-2 gap-8 justify-center items-center">
              <Clock labelLeft="T" :time="clockData.t" timeType="timespan" size="xl" />
              <Clock labelLeft="L" :time="clockData.l" timeType="timespan" size="xl" />
            </div>
            <div class="flex flex-row gap-8 justify-center items-center">
              <Clock
                :time="clockData.tZero"
                labelTop="T-Zero"
                labelRight="UTC"
                timeType="date"
                format="DDHHMMSS"
                size="xl"
              />
            </div>
            <div class="grid grid-cols-4 gap-8 justify-center items-center">
              <Clock :time="clockData.holdRemaining" labelTop="Hold Remaining" timeType="timespan" size="lg" />
              <Clock :time="clockData.untilRestart" labelTop="Time Until Restart" timeType="timespan" size="lg" />
              <Clock :time="clockData.windowRemaining" labelTop="Window Remaining" timeType="timespan" size="lg" />
              <Clock :time="clockData.windowUsed" labelTop="Window Used" timeType="timespan" size="lg" />
            </div>
            <div class="grid grid-cols-2 gap-8 justify-center items-center">
              <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" size="md" />
              <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" format="SS" size="md" />
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>
