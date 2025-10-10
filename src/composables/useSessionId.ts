import { ref, readonly } from "vue";

const sessionId = ref<string>("");
const userName = ref<string>("Anonymous User");

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useSessionId() {
  function initializeSession() {
    let storedSessionId = sessionStorage.getItem("lsp-clocks-session-id");
    if (!storedSessionId) {
      storedSessionId = generateSessionId();
      sessionStorage.setItem("lsp-clocks-session-id", storedSessionId);
    }
    sessionId.value = storedSessionId;

    const storedUserName = localStorage.getItem("lsp-clocks-user-name");
    if (storedUserName) {
      userName.value = storedUserName;
    }
  }

  function setUserName(name: string) {
    userName.value = name || "Anonymous User";
    localStorage.setItem("lsp-clocks-user-name", userName.value);
  }

  return {
    sessionId: readonly(sessionId),
    userName: readonly(userName),
    initializeSession,
    setUserName,
  };
}
