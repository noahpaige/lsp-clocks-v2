export interface EditLock {
  resourceKey: string;
  sessionId: string;
  userName: string;
  timestamp: number;
  expires: number;
}

export function parseEditLock(raw: any): EditLock {
  return {
    resourceKey: raw?.resourceKey ?? "",
    sessionId: raw?.sessionId ?? "",
    userName: raw?.userName ?? "Anonymous User",
    timestamp: raw?.timestamp ?? Date.now(),
    expires: raw?.expires ?? Date.now() + 300000,
  };
}
