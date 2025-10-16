import { ClockDisplayConfig } from "@/types/ClockDisplayConfig";

export const defaultDisplayConfigs: ClockDisplayConfig[] = [
  {
    id: "all-clocks-default",
    name: "All Clocks (Default)",
    description: "Recreation of the original AllClocks.vue layout",
    type: "clock-layout",
    containerClasses: "flex flex-col w-full gap-8 justify-center items-center",
    rows: [
      {
        clocks: [
          { labelRight: "UTC", size: "2xl", format: "HHMMSS", timeType: "date" },
          { labelRight: "LOCAL", size: "2xl", format: "HHMMSS", timeType: "date" },
        ],
        gap: 8,
        justify: "justify-center",
        align: "items-center",
      },
      {
        clocks: [
          { labelLeft: "T", size: "xl", format: "HHMMSS", timeType: "timespan" },
          { labelLeft: "L", size: "xl", format: "HHMMSS", timeType: "timespan" },
        ],
        gap: 8,
        justify: "justify-center",
        align: "items-center",
      },
      {
        clocks: [{ labelTop: "T-Zero", labelRight: "UTC", size: "xl", format: "DDHHMMSS", timeType: "date" }],
        gap: 8,
        justify: "justify-center",
        align: "items-center",
      },
      {
        clocks: [
          { labelTop: "Hold Remaining", size: "lg", format: "HHMMSS", timeType: "timespan" },
          { labelTop: "Time Until Restart", size: "lg", format: "HHMMSS", timeType: "timespan" },
          { labelTop: "Window Remaining", size: "lg", format: "HHMMSS", timeType: "timespan" },
          { labelTop: "Window Used", size: "lg", format: "HHMMSS", timeType: "timespan" },
        ],
        gap: 8,
        justify: "justify-center",
        align: "items-center",
      },
      {
        clocks: [
          { labelLeft: "MET", size: "md", format: "HHMMSS", timeType: "timespan" },
          { labelLeft: "MET", size: "md", format: "SS", timeType: "timespan" },
        ],
        gap: 8,
        justify: "justify-center",
        align: "items-center",
      },
    ],
  },
  {
    id: "mission-countdown",
    name: "Mission Countdown",
    description: "Focus on countdown timers",
    type: "clock-layout",
    containerClasses: "flex flex-col w-full gap-12 justify-center items-center",
    rows: [
      {
        clocks: [
          { labelTop: "T", size: "2xl", format: "DDHHMMSS", timeType: "timespan" },
          { labelTop: "L", size: "2xl", format: "DDHHMMSS", timeType: "timespan" },
        ],
        gap: 16,
        justify: "justify-center",
        align: "items-center",
      },
      {
        clocks: [{ labelTop: "Hold Remaining", size: "xl", format: "HHMMSS", timeType: "timespan" }],
        gap: 8,
        justify: "justify-center",
        align: "items-center",
      },
    ],
  },
  {
    id: "simple-time",
    name: "Simple Time Display",
    description: "Basic UTC and local time",
    type: "clock-layout",
    containerClasses: "flex flex-col w-full gap-8 justify-center items-center",
    rows: [
      {
        clocks: [
          { labelTop: "UTC", size: "2xl", format: "HHMMSS", timeType: "date" },
          { labelTop: "LOCAL", size: "2xl", format: "HHMMSS", timeType: "date" },
        ],
        gap: 12,
        justify: "justify-center",
        align: "items-center",
      },
    ],
  },
];

