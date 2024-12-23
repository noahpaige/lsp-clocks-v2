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
  const ts = TimeSpan.fromMilliseconds(Math.abs(spanMS));
  return [
    Math.floor(ts.days).toString(),
    Math.floor(ts.hours).toString().padStart(2, "0"),
    Math.floor(ts.minutes).toString().padStart(2, "0"),
    Math.floor(ts.seconds).toString().padStart(2, "0"),
  ];
}

function spanToHHMMSS(spanMS: number): (string | undefined)[] {
  const ts = TimeSpan.fromMilliseconds(Math.abs(spanMS));
  const hours = ts.hours + ts.days * 24;
  return [
    undefined,
    Math.floor(ts.hours).toString().padStart(2, "0"),
    Math.floor(ts.minutes).toString().padStart(2, "0"),
    Math.floor(ts.seconds).toString().padStart(2, "0"),
  ];
}

function spanToMMSS(spanMS: number): (string | undefined)[] {
  const ts = TimeSpan.fromMilliseconds(Math.abs(spanMS));
  const minutes = ts.minutes + ts.hours * 60 + ts.days * 24;
  return [undefined, undefined, Math.floor(minutes).toString().padStart(2, "0"), Math.floor(ts.seconds).toString().padStart(2, "0")];
}

function spanToSS(spanMS: number): (string | undefined)[] {
  const ts = TimeSpan.fromMilliseconds(Math.abs(spanMS));
  return [undefined, undefined, undefined, Math.floor(ts.totalSeconds).toString().padStart(2, "0")];
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
    Math.floor(getDayOfYear(date)).toString().padStart(3, "0"),
    Math.floor(date.getHours()).toString().padStart(2, "0"),
    Math.floor(date.getMinutes()).toString().padStart(2, "0"),
    Math.floor(date.getSeconds()).toString().padStart(2, "0"),
  ];
}

function dateToHHMMSS(dateMS: number): (string | undefined)[] {
  const date = new Date(dateMS);
  return [
    undefined,
    Math.floor(date.getHours()).toString().padStart(2, "0"),
    Math.floor(date.getMinutes()).toString().padStart(2, "0"),
    Math.floor(date.getSeconds()).toString().padStart(2, "0"),
  ];
}

function dateToMMSS(dateMS: number): (string | undefined)[] {
  const date = new Date(dateMS);
  return [
    undefined,
    undefined,
    Math.floor(date.getMinutes()).toString().padStart(2, "0"),
    Math.floor(date.getSeconds()).toString().padStart(2, "0"),
  ];
}

function dateToSS(dateMS: number): (string | undefined)[] {
  const date = new Date(dateMS);
  return [undefined, undefined, undefined, Math.floor(date.getSeconds()).toString().padStart(2, "0")];
}
