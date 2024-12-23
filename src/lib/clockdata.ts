const date = new Date();

export const data = {
  utc: date.getTime() + date.getTimezoneOffset() * 60 * 1000,
  local: Date.now(),
  timezoneStr: new Date().toLocaleString("en-US", { timeZoneName: "short" }).split(" ")[3],
  t: -1000 * 60 * 60 * 13,
  l: -1000 * 60 * 60 * 14,
  holdRemaining: 1000 * 60 * 60 * 1,
  untilRestart: 1000 * 60 * 60 * 2,
  windowUsed: 0,
  windowRemaining: 1000 * 60 * 60 * 4,
  tZero: date.getTime() + date.getTimezoneOffset() * 60 * 1000 - 1000 * 60 * 60 * 14,
  met: 95001,
};
