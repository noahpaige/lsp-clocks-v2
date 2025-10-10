<script setup lang="ts">
import { reactive, computed, PropType } from "vue";
import Clock from "@/components/Clock/Clock.vue";
import AnimatedBackground4 from "@/components/AnimatedBackground4.vue";
import { useRedisObserver } from "@/composables/useRedisObserver";
import { ClockDataType, parseClockData } from "@/types/ClockData";
import { ClockDisplayConfig } from "@/types/ClockDisplayConfig";
import { generateRowClasses } from "@/types/ClockRowConfig";

const props = defineProps({
  config: {
    type: Object as PropType<ClockDisplayConfig>,
    required: true,
  },
});

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

const containerClasses = computed(() => {
  return props.config.containerClasses || "flex flex-col w-full gap-8 justify-center items-center";
});

function getClockTime(clock: any): number {
  const labelMap: Record<string, keyof ClockDataType> = {
    UTC: "utc",
    LOCAL: "local",
    T: "t",
    L: "l",
    "Hold Remaining": "holdRemaining",
    "Time Until Restart": "untilRestart",
    "Window Used": "windowUsed",
    "Window Remaining": "windowRemaining",
    "T-Zero": "tZero",
    MET: "met",
  };
  const key = labelMap[clock.labelLeft || ""] || labelMap[clock.labelRight || ""] || labelMap[clock.labelTop || ""];
  return key ? (clockData[key] as number) : 0;
}
</script>

<template>
  <div class="w-screen h-screen">
    <AnimatedBackground4 />
    <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 2500 1200">
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div class="h-full w-full flex p-5 justify-center items-center">
          <div :class="containerClasses">
            <div v-for="(row, rowIndex) in config.rows" :key="rowIndex" :class="generateRowClasses(row)">
              <Clock
                v-for="(clock, clockIndex) in row.clocks"
                :key="clockIndex"
                :label-left="clock.labelLeft"
                :label-right="clock.labelRight"
                :label-top="clock.labelTop"
                :size="clock.size"
                :format="clock.format"
                :time-type="clock.timeType"
                :time="getClockTime(clock)"
              />
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>
