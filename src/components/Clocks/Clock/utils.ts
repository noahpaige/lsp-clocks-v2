import { TimeSpan } from "timespan-ts";

type TimeFormat = "DDHHMMSS" | "HHMMSS" | "MMSS" | "SS";
type TimeType = "date" | "timespan";

export function timeToArr(time: number, timeType: TimeType, timeFormat: TimeFormat): (string | undefined)[] {
  if (timeType === "date" && timeFormat === "DDHHMMSS") return dateToDDHHMMSS(time);
  if (timeType === "date" && timeFormat === "HHMMSS") return dateToHHMMSS(time);
  if (timeType === "date" && timeFormat === "MMSS") return dateToMMSS(time);
  if (timeType === "date" && timeFormat === "SS") return dateToSS(time);

  if (timeType === "timespan" && timeFormat === "DDHHMMSS") return spanToDDHHMMSS(time);
  if (timeType === "timespan" && timeFormat === "HHMMSS") return spanToHHMMSS(time);
  if (timeType === "timespan" && timeFormat === "MMSS") return spanToMMSS(time);
  if (timeType === "timespan" && timeFormat === "SS") return spanToSS(time);
  return [];
}

function spanToDDHHMMSS(spanMS: number): (string | undefined)[] {
  const ts = TimeSpan.fromMilliseconds(spanMS);
  return [
    ts.days.toString(),
    ts.hours.toString().padStart(2, "0"),
    ts.minutes.toString().padStart(2, "0"),
    ts.seconds.toString().padStart(2, "0"),
  ];
}

function spanToHHMMSS(spanMS: number): (string | undefined)[] {
  const ts = TimeSpan.fromMilliseconds(spanMS);
  const hours = ts.hours + ts.days * 24;
  return [
    undefined,
    hours.toString().padStart(2, "0"),
    ts.minutes.toString().padStart(2, "0"),
    ts.seconds.toString().padStart(2, "0"),
  ];
}

function spanToMMSS(spanMS: number): (string | undefined)[] {
  const ts = TimeSpan.fromMilliseconds(spanMS);
  const minutes = ts.minutes + ts.hours * 60 + ts.days * 24;
  return [undefined, undefined, minutes.toString().padStart(2, "0"), ts.seconds.toString().padStart(2, "0")];
}

function spanToSS(spanMS: number): (string | undefined)[] {
  const ts = TimeSpan.fromMilliseconds(spanMS);
  return [undefined, undefined, undefined, ts.totalSeconds.toString().padStart(2, "0")];
}

function dateToDDHHMMSS(dateMS: number): (string | undefined)[] {
  const getDayOfYear = (date: Date) => {
    return (
      (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) /
      24 /
      60 /
      60 /
      1000
    );
  };
  const date = new Date(dateMS);
  return [
    getDayOfYear(date).toString().padStart(3, "0"),
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
    date.getSeconds().toString().padStart(2, "0"),
  ];
}

function dateToHHMMSS(dateMS: number): (string | undefined)[] {
  const date = new Date(dateMS);
  return [
    undefined,
    date.getHours().toString().padStart(2, "0"),
    date.getMinutes().toString().padStart(2, "0"),
    date.getSeconds().toString().padStart(2, "0"),
  ];
}

function dateToMMSS(dateMS: number): (string | undefined)[] {
  const date = new Date(dateMS);
  return [
    undefined,
    undefined,
    date.getMinutes().toString().padStart(2, "0"),
    date.getSeconds().toString().padStart(2, "0"),
  ];
}

function dateToSS(dateMS: number): (string | undefined)[] {
  const date = new Date(dateMS);
  return [undefined, undefined, undefined, date.getSeconds().toString().padStart(2, "0")];
}
