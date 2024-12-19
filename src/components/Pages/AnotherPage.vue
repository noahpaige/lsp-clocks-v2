<script setup lang="ts">
import Clock from "@/components/Clock/Clock.vue";
import AnimatedBackground from "@/components/AnimatedBackground.vue";
import AnimatedBackground2 from "@/components/AnimatedBackground2.vue";
import AnimatedBackground3 from "@/components/AnimatedBackground3.vue";
import { data } from "../../lib/clockdata";
import { ref } from "vue";
import { useIntervalFn } from "@vueuse/core";

const clockData = ref(data);

useIntervalFn(() => {
  clockData.value.utc += 1000;
  clockData.value.local += 1000;
  clockData.value.t += 1000;
  clockData.value.l += 1000;
  clockData.value.met += 1000;
}, 1000);
</script>

<template>
  <div class="w-screen h-screen">
    <AnimatedBackground />
    <svg xmlns="http://www.w3.org/2000/svg" class="w-full h-full" viewBox="0 0 2300 1500">
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div class="h-full w-full flex p-5 justify-center items-center">
          <div class="flex flex-col gap-8 justify-center items-center">
            <div class="flex flex-row flex-wrap gap-8 justify-center items-center">
              <Clock labelRight="UTC" :time="clockData.utc" size="2xl" />
              <Clock :labelRight="clockData.timezoneStr" :time="clockData.local" size="2xl" />
            </div>
            <div class="flex flex-row flex-wrap gap-8 justify-center items-center">
              <Clock :labelLeft="clockData.t > 0 ? 'T+' : 'T-'" :time="clockData.t" timeType="timespan" size="xl" />
              <Clock :labelLeft="clockData.l > 0 ? 'L+' : 'L-'" :time="clockData.l" timeType="timespan" size="xl" />
            </div>
            <div class="flex flex-row flex-wrap gap-8 justify-center items-center">
              <Clock
                :time="clockData.tZero"
                labelTop="T-Zero"
                labelRight="UTC"
                timeType="date"
                format="DDHHMMSS"
                size="xl"
              />
            </div>
            <div class="flex flex-row flex-wrap gap-8 justify-center items-center">
              <Clock :time="clockData.holdRemaining" labelTop="Hold Remaining" timeType="timespan" size="lg" />
              <Clock :time="clockData.untilRestart" labelTop="Time Until Restart" timeType="timespan" size="lg" />
              <Clock :time="clockData.windowRemaining" labelTop="Window Remaining" timeType="timespan" size="lg" />
              <Clock :time="clockData.windowUsed" labelTop="Window Used" timeType="timespan" size="lg" />
            </div>
            <div class="flex flex-row flex-wrap gap-8 justify-center items-center">
              <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" size="md" />
              <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" format="MMSS" size="md" />
              <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" format="SS" size="md" />
            </div>
          </div>
        </div>
      </foreignObject>
    </svg>
  </div>
</template>
