# Sidebar Architecture Improvement

## Problem

The original sidebar implementation had significant duplication and tight coupling:

- Route paths, titles, and metadata were defined in both `routes.ts` and `ConfigSidebar.vue`
- When moving files or reorganizing routes, both files needed manual updates
- No single source of truth for configuration pages

## Solution

Refactored to use routes as the single source of truth:

### 1. Enhanced Route Metadata (`routes.ts`)

Added sidebar-related metadata directly to route definitions:

- `icon`: Lucide icon component for sidebar display
- `keywords`: Array of search terms for filtering
- `showInSidebar`: Boolean flag to control sidebar visibility
- `category`: Grouping category (general, displays, appearance, notifications)

### 2. Auto-Generated Sidebar (`ConfigSidebar.vue`)

The sidebar now dynamically builds itself from the router configuration:

- Reads all `/config` child routes
- Filters routes marked with `showInSidebar: true`
- Groups by `category` field
- Maintains all existing functionality (search, filtering, active states)

### 3. Category Labels

Exported `CATEGORY_LABELS` constant from routes for consistent naming across the app.

## Benefits

### 1. Single Source of Truth

All route information lives in one place - the routes file. No more sync issues.

### 2. Easy Maintenance

When reorganizing files:

```typescript
// Before: Edit both routes.ts AND ConfigSidebar.vue
// After: Edit ONLY routes.ts
{
  path: "new-path",
  name: "config-new-page",
  component: () => import("@/components/Pages/ConfigPage/views/category/NewPage.vue"),
  meta: {
    title: "New Page",
    category: "general",
    icon: IconComponent,
    keywords: ["search", "terms"],
    showInSidebar: true,
  },
}
```

### 3. Flexible Control

Use `showInSidebar: false` for routes that shouldn't appear in the menu (like edit/create pages).

### 4. Type Safety

Added `RouteMeta` interface for better TypeScript support and autocomplete.

## Usage

### Adding a New Config Page

1. Add route to `routes.ts` with complete metadata
2. Sidebar automatically updates - no additional changes needed

### Moving/Renaming Pages

1. Update the component path in `routes.ts`
2. Everything else stays in sync automatically

### Changing Category Structure

1. Add new category to `CATEGORY_LABELS`
2. Use in route metadata
3. Sidebar reflects changes immediately
