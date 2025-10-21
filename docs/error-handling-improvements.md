# Error Handling Improvements - Implementation Plan

## 🎯 Current State Analysis

### **Common Issues Found:**

1. **Generic Error Messages**

   ```typescript
   // ❌ Current: Not specific enough
   console.error(e);
   emitToast({ title: "Failed to load display configurations", type: "error" });
   ```

2. **Missing Context**

   ```typescript
   // ❌ Current: No info about what failed
   catch (e) {
     console.error(e);
     return false;
   }
   ```

3. **No Error Recovery**

   ```typescript
   // ❌ Current: Just fails and stops
   catch (e) {
     console.error(e);
     return [];
   }
   ```

4. **Inconsistent Patterns**
   - Some functions throw, some return false
   - Some log to console, some don't
   - Error messages vary in detail

---

## ✅ Proposed Improvements

### **1. Specific Error Messages with Context**

```typescript
// ✅ After: Clear, actionable error messages
try {
  await sendInstantCommand("GET", key);
} catch (error) {
  console.error(`[useDisplayConfigs] Failed to load config "${configId}":`, error);
  emitToast({
    title: "Failed to Load Configuration",
    description: `Could not load "${configId}". ${getErrorMessage(error)}`,
    type: "error",
  });
}
```

### **2. Error Context Helper**

```typescript
// src/utils/errorUtils.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

export function getErrorContext(error: unknown): Record<string, any> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  return { error: String(error) };
}
```

### **3. Error Recovery Strategies**

```typescript
// ✅ Retry with exponential backoff (already in useRedisCommand)
// ✅ Fallback to cached data
// ✅ Partial success handling
// ✅ User-friendly error recovery options
```

### **4. Structured Error Logging**

```typescript
// ✅ Consistent logging format
console.error(`[Component/Function] Action failed:`, {
  context: 'what was being done',
  key/id: 'affected resource',
  error: getErrorContext(error)
});
```

---

## 📋 Implementation Checklist

### **Phase 1: Error Utilities** (30 min)

- [ ] Create `src/utils/errorUtils.ts`
- [ ] Add error message extraction helpers
- [ ] Add error context helpers
- [ ] Add error logging helpers

### **Phase 2: Composables** (1 hour)

- [ ] Update `useDisplayConfigs.ts` - specific messages + context
- [ ] Update `useRedisFileSync.ts` - better error details
- [ ] Update `useEditLock.ts` - clearer lock errors
- [ ] Keep `useRedisCommand.ts` and `useRedisObserver.ts` (already good)

### **Phase 3: Server** (30 min)

- [ ] Update `RedisAPI.ts` - add error context to API responses
- [ ] Update error responses to include helpful details
- [ ] Keep file utils (already has specific errors)

### **Phase 4: Components** (30 min)

- [ ] Update toast messages to be more specific
- [ ] Add error recovery UI where appropriate

---

## 🎯 Goals

### **Success Metrics:**

- ✅ All errors include context (what failed, why)
- ✅ Consistent error logging format across codebase
- ✅ User-facing errors are actionable
- ✅ Developers can debug issues quickly

### **Non-Goals:**

- ❌ Don't over-engineer with complex error classes (keep it simple)
- ❌ Don't change existing API signatures
- ❌ Don't add unnecessary abstraction

---

## 🚀 Implementation Strategy

**Lightweight Approach:**

1. Add simple utility functions
2. Update error messages to be specific
3. Add context where missing
4. Keep existing patterns that work

**Backwards Compatible:**

- No breaking changes
- Existing code continues to work
- Incremental improvements
