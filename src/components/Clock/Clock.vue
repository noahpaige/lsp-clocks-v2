<template>
  <div class="flex align-middle w-full h-full justify-center items-center transition-all">
    <div
      :data-size="props.size"
      :class="[
        'flex flex-col bg-slate-900 rounded-lg',
        'data-[size=xs]:text-[1rem]   data-[size=xs]:p-2',
        'data-[size=sm]:text-[2rem]   data-[size=sm]:p-3',
        'data-[size=md]:text-[3rem]   data-[size=md]:p-4',
        'data-[size=lg]:text-[5rem]   data-[size=lg]:p-6',
        'data-[size=xl]:text-[8rem]   data-[size=xl]:p-8',
        'data-[size=2xl]:text-[10rem] data-[size=2xl]:p-10',
      ]"
    >
      <div
        v-if="labelTop !== ''"
        :data-size="props.size"
        :class="[
          'text-muted-foreground font-medium',
          'data-[size=xs]:text-[0.5625rem] data-[size=xs]:mt-[-0.3125rem]',
          'data-[size=sm]:text-[1.125rem]  data-[size=sm]:mt-[-0.5625rem]',
          'data-[size=md]:text-[1.625rem]  data-[size=md]:mt-[-0.8125rem]',
          'data-[size=lg]:text-[2.125rem]  data-[size=lg]:mt-[-1.0625rem]',
          'data-[size=xl]:text-[3.125rem]  data-[size=xl]:mt-[-1.5rem]',
          'data-[size=2xl]:text-[4.625rem] data-[size=2xl]:mt-[-2.3125rem]',
        ]"
      >
        {{ labelTop }}
      </div>
      <div
        :data-size="props.size"
        :class="[
          'flex align-middle justify-center items-center select-none',
          'data-[size=xs]:gap-0.5',
          'data-[size=sm]:gap-1',
          'data-[size=md]:gap-2',
          'data-[size=lg]:gap-3',
          'data-[size=xl]:gap-4',
          'data-[size=2xl]:gap-5',
        ]"
      >
        <div
          v-if="labelLeft !== ''"
          :data-size="props.size"
          :class="[
            'text-muted-foreground font-thin leading-none',
            'data-[size=xs]:mr-1',
            'data-[size=sm]:mr-1',
            'data-[size=md]:mr-3',
            'data-[size=lg]:mr-5',
            'data-[size=xl]:mr-8',
            'data-[size=2xl]:mr-10',
          ]"
        >
          {{ labelLeft }}
        </div>
        <div
          v-if="timeArr[0][0] !== undefined"
          :data-size="props.size"
          :class="[
            'flex flex-col items-center overflow-y-hidden leading-none',
            'data-[size=xs]:h-[1rem] data-[size=xs]:leading-[1rem]     data-[size=xs]:mr-[0.75rem]',
            'data-[size=sm]:h-[2rem] data-[size=sm]:leading-[2rem]     data-[size=sm]:mr-[1rem]',
            'data-[size=md]:h-[3rem] data-[size=md]:leading-[3rem]     data-[size=md]:mr-[1.5rem]',
            'data-[size=lg]:h-[5rem] data-[size=lg]:leading-[5rem]     data-[size=lg]:mr-[2rem]',
            'data-[size=xl]:h-[8rem] data-[size=xl]:leading-[8rem]     data-[size=xl]:mr-[3rem]',
            'data-[size=2xl]:h-[10rem] data-[size=2xl]:leading-[10rem] data-[size=2xl]:mr-[4rem]',
          ]"
        >
          <div class="animate-flip-clock w-fit" v-for="(timeStr, index) in timeArr[0]" :key="`${index}-${timeStr}`">
            {{ timeStr }}
          </div>
        </div>
        <div
          v-if="timeArr[1][0] !== undefined"
          :data-size="props.size"
          :class="[
            'flex flex-col items-center overflow-y-hidden leading-none',
            'data-[size=xs]:h-[1rem] data-[size=xs]:leading-[1rem]',
            'data-[size=sm]:h-[2rem] data-[size=sm]:leading-[2rem]',
            'data-[size=md]:h-[3rem] data-[size=md]:leading-[3rem]',
            'data-[size=lg]:h-[5rem] data-[size=lg]:leading-[5rem]',
            'data-[size=xl]:h-[8rem] data-[size=xl]:leading-[8rem]',
            'data-[size=2xl]:h-[10rem] data-[size=2xl]:leading-[10rem]',
          ]"
        >
          <div class="animate-flip-clock w-fit" v-for="(timeStr, index) in timeArr[1]" :key="`${index}-${timeStr}`">
            {{ timeStr }}
          </div>
        </div>
        <div v-if="timeArr[1][0] !== undefined" class="text-muted-foreground font-thin leading-none">:</div>
        <div
          v-if="timeArr[2][0] !== undefined"
          :data-size="props.size"
          :class="[
            'flex flex-col items-center overflow-y-hidden leading-none',
            'data-[size=xs]:h-[1rem] data-[size=xs]:leading-[1rem]',
            'data-[size=sm]:h-[2rem] data-[size=sm]:leading-[2rem]',
            'data-[size=md]:h-[3rem] data-[size=md]:leading-[3rem]',
            'data-[size=lg]:h-[5rem] data-[size=lg]:leading-[5rem]',
            'data-[size=xl]:h-[8rem] data-[size=xl]:leading-[8rem]',
            'data-[size=2xl]:h-[10rem] data-[size=2xl]:leading-[10rem]',
          ]"
        >
          <div class="animate-flip-clock w-fit" v-for="(timeStr, index) in timeArr[2]" :key="`${index}-${timeStr}`">
            {{ timeStr }}
          </div>
        </div>
        <div v-if="timeArr[2][0] !== undefined" class="text-muted-foreground font-thin leading-none">:</div>
        <div
          :data-size="props.size"
          :class="[
            'flex flex-col items-center overflow-y-hidden leading-none',
            'data-[size=xs]:h-[1rem] data-[size=xs]:leading-[1rem]',
            'data-[size=sm]:h-[2rem] data-[size=sm]:leading-[2rem]',
            'data-[size=md]:h-[3rem] data-[size=md]:leading-[3rem]',
            'data-[size=lg]:h-[5rem] data-[size=lg]:leading-[5rem]',
            'data-[size=xl]:h-[8rem] data-[size=xl]:leading-[8rem]',
            'data-[size=2xl]:h-[10rem] data-[size=2xl]:leading-[10rem]',
          ]"
        >
          <div class="animate-flip-clock w-fit" v-for="(timeStr, index) in timeArr[3]" :key="`${index}-${timeStr}`">
            {{ timeStr }}
          </div>
        </div>
        <div
          v-if="labelRight !== ''"
          :data-size="props.size"
          :class="[
            'text-muted-foreground font-thin leading-none',
            'data-[size=xs]:ml-1',
            'data-[size=sm]:ml-1',
            'data-[size=md]:ml-3',
            'data-[size=lg]:ml-5',
            'data-[size=xl]:ml-8',
            'data-[size=2xl]:ml-10',
          ]"
        >
          {{ labelRight }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { cn } from "@/lib/utils";
import { ref, watch } from "vue";
import { timeToArr } from "./utils";

const props = defineProps({
  labelLeft: {
    type: String,
    default: "",
  },
  labelRight: {
    type: String,
    default: "",
  },
  labelTop: {
    type: String,
    default: "",
  },
  time: {
    type: Number,
    default: 0,
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg", "xl", "2xl"].includes(value),
  },
  format: {
    type: String,
    default: "HHMMSS",
    validator: (value) => ["DDHHMMSS", "HHMMSS", "MMSS", "SS"].includes(value),
  },
  timeType: {
    type: String,
    default: "date",
    validator: (value) => ["date", "timespan"].includes(value),
  },
});

// Define your clock data and functionality here
const timeArr = ref([
  ["000", "000"],
  ["00", "00"],
  ["00", "00"],
  ["00", "00"],
]);

watch(
  () => props.time,
  () => {
    updateClock();
  }
);

function updateClock() {
  let timeStrs = timeToArr(props.time, props.timeType, props.format);

  const didChange = timeStrs.reduce((didChange, timeStr, i) => {
    return didChange || (timeStr !== undefined && timeStr !== timeArr.value[0][i]);
  }, false);
  if (didChange) {
    for (let i = 0; i < timeStrs.length; i++) {
      timeArr.value[i].unshift(timeStrs[i]);
      timeArr.value[i].pop();
    }
  }
}

// Call the updateClock method at regular intervals
updateClock();
</script>
