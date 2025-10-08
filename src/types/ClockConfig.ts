// must include all the props in Clock.vue. If you change one, then you must change the other.
export interface ClockConfig {
  labelLeft?: string;
  labelRight?: string;
  labelTop?: string;
  size: "sm" | "md" | "lg" | "xl" | "2xl";
  format: "DDHHMMSS" | "HHMMSS" | "MMSS" | "SS";
  timeType: "date" | "timespan";
}

export function parseClockConfig(raw: any): ClockConfig {
  return {
    labelLeft: raw.labelLeft,
    labelRight: raw.labelRight,
    labelTop: raw.labelTop,
    size: raw.size,
    format: raw.format,
    timeType: raw.timeType,
  };
}
