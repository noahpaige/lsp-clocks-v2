export interface EditLock {
  configId: string;
  sessionId: string;
  userName: string;
  timestamp: number;
  expires: number;
}

export function parseEditLock(raw: any): EditLock {
  return {
    configId: raw?.configId ?? "",
    sessionId: raw?.sessionId ?? "",
    userName: raw?.userName ?? "Anonymous User",
    timestamp: raw?.timestamp ?? Date.now(),
    expires: raw?.expires ?? Date.now() + 300000,
  };
}
