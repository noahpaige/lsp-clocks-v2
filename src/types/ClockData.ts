export interface ClockDataType {
  utc: number;
  local: number;
  timezoneStr: string;
  t: number;
  l: number;
  holdRemaining: number;
  untilRestart: number;
  windowUsed: number;
  windowRemaining: number;
  tZero: number;
  met: number;
}

export function parseClockData(raw: any): ClockDataType {
  return {
    utc: Number(raw.utc),
    local: Number(raw.local),
    timezoneStr: raw.timezoneStr,
    t: Number(raw.t),
    l: Number(raw.l),
    holdRemaining: Number(raw.holdRemaining),
    untilRestart: Number(raw.untilRestart),
    windowUsed: Number(raw.windowUsed),
    windowRemaining: Number(raw.windowRemaining),
    tZero: Number(raw.tZero),
    met: Number(raw.met),
  };
}
