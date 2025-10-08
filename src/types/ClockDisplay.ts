export interface ClockDisplay {
  id: string;
  displayAssignment: "main" | "test" | "none";
  title: string;
  description: string;
  arrangementPreset: string;
}

export function parseClockDisplay(raw: any): ClockDisplay {
  return {
    id: raw.id,
    displayAssignment: raw.displayAssignment,
    title: raw.title,
    description: raw.description,
    arrangementPreset: raw.arrangementPreset,
  };
}
