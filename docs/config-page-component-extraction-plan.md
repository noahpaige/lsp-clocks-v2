# Config Page Component Extraction Plan

**Date:** October 21, 2025  
**Status:** Planning  
**Related Files:**

- `src/components/Pages/ConfigPage/views/displays/clock-displays/ClockDisplaysPage.vue`
- `src/components/shared/`

---

## Table of Contents

1. [Overview](#overview)
2. [Goals](#goals)
3. [Current State Analysis](#current-state-analysis)
4. [Component Specifications](#component-specifications)
   - [Layout Components](#layout-components)
   - [Header Components](#header-components)
   - [Table Components](#table-components)
   - [Action Components](#action-components)
   - [Dialog Components](#dialog-components)
5. [Type Definitions](#type-definitions)
6. [Folder Structure](#folder-structure)
7. [Implementation Order](#implementation-order)
8. [Migration Strategy](#migration-strategy)
9. [Testing Considerations](#testing-considerations)
10. [Future Enhancements](#future-enhancements)

---

## Overview

This document outlines the plan to extract reusable components from `ClockDisplaysPage.vue` and create new layout components to standardize the configuration page experience across the application. The goal is to reduce code duplication, improve maintainability, and create a consistent UI/UX pattern for all configuration pages.

---

## Goals

1. **Reduce code duplication** - Extract common patterns into reusable components
2. **Improve maintainability** - Centralize common logic in shared components
3. **Standardize UX** - Create consistent patterns across all config pages
4. **Increase flexibility** - Build components with extensibility in mind
5. **Type safety** - Ensure all components are properly typed
6. **Better testing** - Smaller components are easier to test

---

## Current State Analysis

### ClockDisplaysPage.vue Breakdown (433 lines)

**Lines 1-216: Script Section**

- 45 imports (lines 2-31)
- 64 lines of state management (lines 47-63)
- 28 lines of computed properties (lines 65-91)
- 119 lines of business logic (lines 97-215)

**Lines 218-433: Template Section (215 lines)**

- **Lines 220-257:** Header bar (search, create, save/restore) - **38 lines** ✅ Extract
- **Lines 259-327:** Data table with Card wrapper - **69 lines** ✅ Extract
  - Lines 264-267: Empty state - **4 lines** ✅ Extract
  - Lines 284-293: Loading skeleton - **10 lines** ✅ Extract
  - Lines 307-321: Actions row - **15 lines** ✅ Extract
- **Lines 330-398:** Save/Restore dialog - **69 lines** ✅ Extract
- **Lines 400-430:** Delete confirmation dialog - **31 lines** ✅ Extract

**Total extractable:** ~220 lines of template code (>50% of file)

### Components Identified for Extraction

From `ClockDisplaysPage.vue`:

1. ConfigHeaderBar (lines 220-257)
2. ConfigDataTable (lines 259-327)
3. ConfigEmptyState (lines 264-267)
4. ActionsRow (lines 307-321)
5. SaveRestoreDialog (lines 330-398)
6. ConfigDeleteDialog (lines 400-430)

New layout components (not from ClockDisplaysPage): 7. ConfigFlexLayout 8. ConfigScrollLayout

---

## Component Specifications

### Layout Components

#### 1. ConfigFlexLayout.vue

**Location:** `src/components/shared/layouts/ConfigFlexLayout.vue`  
**Lines of Code:** ~25

**Purpose:**  
Provides a flexbox-based layout where the header has a natural height and the body fills the remaining vertical space. This prevents the page from scrolling - the body must handle its own scrolling if needed.

**Interface:**

```typescript
// No props needed - fully slot-based
```

**Slots:**

- `header` - Fixed height header content (flex-none)
- `body` - Flexible body that fills remaining space (flex-1, overflow-hidden)

**Template Structure:**

```vue
<template>
  <div class="flex flex-col h-full">
    <!-- Header: Natural height, no scrolling -->
    <div class="flex-none">
      <slot name="header" />
    </div>

    <!-- Body: Fills remaining space, handles own scrolling -->
    <div class="flex-1 overflow-hidden">
      <slot name="body" />
    </div>
  </div>
</template>
```

**Usage Example:**

```vue
<ConfigFlexLayout>
  <template #header>
    <ConfigHeaderBar ... />
  </template>
  <template #body>
    <div class="overflow-y-auto h-full">
      <!-- Scrollable content -->
    </div>
  </template>
</ConfigFlexLayout>
```

**Key Features:**

- No scrolling on outer container
- Body must manage its own scroll behavior
- Header always visible at top
- Body fills remaining viewport height
- Perfect for dashboards and fixed-layout pages

---

#### 2. ConfigScrollLayout.vue

**Location:** `src/components/shared/layouts/ConfigScrollLayout.vue`  
**Lines of Code:** ~35

**Purpose:**  
Provides a standard scrollable layout with a sticky header. The entire page scrolls naturally, but the header remains at the top of the viewport.

**Interface:**

```typescript
interface Props {
  headerClass?: string; // Additional classes for header wrapper
  bodyClass?: string; // Additional classes for body wrapper
  headerZIndex?: number; // z-index for sticky header (default: 10)
}
```

**Slots:**

- `header` - Sticky header content
- `body` - Scrollable body content

**Template Structure:**

```vue
<template>
  <div class="relative">
    <!-- Sticky header -->
    <div :class="['sticky top-0 bg-background', headerClass]" :style="{ zIndex: headerZIndex }">
      <slot name="header" />
    </div>

    <!-- Scrollable body -->
    <div :class="bodyClass">
      <slot name="body" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  headerClass?: string;
  bodyClass?: string;
  headerZIndex?: number;
}

withDefaults(defineProps<Props>(), {
  headerClass: "",
  bodyClass: "",
  headerZIndex: 10,
});
</script>
```

**Usage Example:**

```vue
<ConfigScrollLayout header-class="border-b shadow-sm">
  <template #header>
    <ConfigHeaderBar ... />
  </template>
  <template #body>
    <div class="space-y-6 p-6">
      <!-- Content naturally scrolls -->
    </div>
  </template>
</ConfigScrollLayout>
```

**Key Features:**

- Natural page scrolling
- Sticky header stays at top
- Header can have border/shadow for visual separation
- Simple and intuitive for list/table pages
- Currently used pattern in ClockDisplaysPage

---

### Header Components

#### 3. ConfigHeaderBar.vue

**Location:** `src/components/shared/config/ConfigHeaderBar.vue`  
**Lines of Code:** ~120  
**Based on:** ClockDisplaysPage.vue lines 220-257

**Purpose:**  
Standardized header bar for configuration pages with search, create button, and optional save/restore functionality.

**Interface:**

```typescript
interface Props {
  // Search functionality
  searchQuery?: string;
  searchPlaceholder?: string; // Default: "Search..."
  showSearch?: boolean; // Default: true
  searchMaxWidth?: string; // Default: "max-w-60"

  // Create button
  createButtonText?: string; // Default: "Create"
  createButtonIcon?: Component; // Default: Plus icon
  showCreateButton?: boolean; // Default: true
  createButtonVariant?: ButtonVariant; // Default: "default"

  // Save/Restore buttons
  showSaveRestore?: boolean; // Default: false
  isSaving?: boolean; // Default: false
  isRestoring?: boolean; // Default: false
  saveButtonText?: string; // Default: "Save"
  restoreButtonText?: string; // Default: "Restore"
  saveTooltip?: string; // Default: "Save to file"
  restoreTooltip?: string; // Default: "Restore from file"
  saveIcon?: Component; // Default: Save icon
  restoreIcon?: Component; // Default: Upload icon
}

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  create: [];
  save: [];
  restore: [];
}>();
```

**Slots:**

- `left` - Replace entire left side (search area)
- `right` - Replace entire right side (buttons area)
- `actions-start` - Insert before create button
- `actions-end` - Insert after save/restore buttons

**Template Structure:**

```vue
<template>
  <div class="flex items-center justify-between gap-2 py-4">
    <!-- Left side: Search -->
    <slot name="left">
      <div v-if="showSearch" class="relative" :class="searchMaxWidth">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          :model-value="searchQuery"
          @update:model-value="emit('update:searchQuery', $event)"
          :placeholder="searchPlaceholder"
          class="pl-10"
        />
      </div>
    </slot>

    <!-- Right side: Actions -->
    <slot name="right">
      <div class="flex gap-4">
        <slot name="actions-start" />

        <!-- Create button -->
        <Button v-if="showCreateButton" @click="emit('create')" :variant="createButtonVariant">
          <component :is="createButtonIcon" class="mr-2 h-4 w-4" />
          {{ createButtonText }}
        </Button>

        <!-- Save/Restore group -->
        <ButtonGroup v-if="showSaveRestore">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="emit('save')" variant="outline" :disabled="isSaving">
                <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
                <component v-else :is="saveIcon" class="mr-2 h-4 w-4" />
                {{ isSaving ? "Saving..." : saveButtonText }}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ saveTooltip }}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button @click="emit('restore')" variant="outline" :disabled="isRestoring">
                <Loader2 v-if="isRestoring" class="mr-2 h-4 w-4 animate-spin" />
                <component v-else :is="restoreIcon" class="mr-2 h-4 w-4" />
                {{ isRestoring ? "Restoring..." : restoreButtonText }}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ restoreTooltip }}</p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>

        <slot name="actions-end" />
      </div>
    </slot>
  </div>
</template>
```

**Usage Example:**

```vue
<ConfigHeaderBar
  v-model:search-query="searchQuery"
  search-placeholder="Search displays..."
  create-button-text="Create Display"
  :show-save-restore="true"
  :is-saving="isSaving"
  :is-restoring="isRestoring"
  save-tooltip="Save all displays to JSON file"
  restore-tooltip="Restore displays from JSON file"
  @create="createNew"
  @save="openSaveDialog"
  @restore="openRestoreDialog"
>
  <template #actions-end>
    <!-- Add custom action buttons -->
    <Button variant="outline">Export CSV</Button>
  </template>
</ConfigHeaderBar>
```

**Key Features:**

- Fully customizable via props and slots
- Consistent spacing and alignment
- Loading states for async actions
- Tooltip support for better UX
- Icon customization
- Supports additional custom actions via slots

---

### Table Components

#### 4. ConfigEmptyState.vue

**Location:** `src/components/shared/config/ConfigEmptyState.vue`  
**Lines of Code:** ~40  
**Based on:** ClockDisplaysPage.vue lines 264-267

**Purpose:**  
Standardized empty state component for when no data is available.

**Interface:**

```typescript
interface Props {
  message: string; // Required: Main message to display
  actionText?: string; // Optional: Call-to-action button text
  showAction?: boolean; // Default: true
  icon?: Component; // Optional: Icon to display above message
  iconClass?: string; // Classes for icon (e.g., size, color)
}

const emit = defineEmits<{
  action: [];
}>();
```

**Slots:**

- `default` - Replace entire content
- `icon` - Custom icon area
- `message` - Custom message area
- `action` - Custom action area

**Template Structure:**

```vue
<template>
  <div class="text-center py-12 px-4">
    <slot>
      <!-- Icon -->
      <slot name="icon">
        <component v-if="icon" :is="icon" :class="['mx-auto mb-4', iconClass]" />
      </slot>

      <!-- Message -->
      <slot name="message">
        <p class="text-muted-foreground">{{ message }}</p>
      </slot>

      <!-- Action -->
      <slot name="action">
        <Button v-if="showAction && actionText" @click="emit('action')" variant="link" class="mt-2">
          {{ actionText }}
        </Button>
      </slot>
    </slot>
  </div>
</template>
```

**Usage Example:**

```vue
<!-- Simple usage -->
<ConfigEmptyState
  message="No display configurations found."
  action-text="Create your first display"
  @action="createNew"
/>

<!-- With icon -->
<ConfigEmptyState
  message="No users found matching your search."
  action-text="Clear search"
  :icon="SearchX"
  icon-class="h-12 w-12 text-muted-foreground/50"
  @action="clearSearch"
/>

<!-- Custom content -->
<ConfigEmptyState>
  <template #message>
    <h3 class="font-semibold mb-2">Get Started</h3>
    <p class="text-sm text-muted-foreground">
      Create your first display configuration to begin.
    </p>
  </template>
</ConfigEmptyState>
```

**Key Features:**

- Simple and consistent empty states
- Optional icon support
- Customizable via slots
- Clear call-to-action

---

#### 5. ConfigDataTable.vue

**Location:** `src/components/shared/config/ConfigDataTable.vue`  
**Lines of Code:** ~80  
**Based on:** ClockDisplaysPage.vue lines 259-327

**Purpose:**  
Wrapper component for data tables that handles loading states, empty states, and consistent Card styling.

**Interface:**

```typescript
interface Props {
  isLoading?: boolean; // Default: false
  isEmpty?: boolean; // Default: false
  emptyMessage?: string; // Default: "No items found."
  emptyActionText?: string; // Optional
  showEmptyAction?: boolean; // Default: true
  skeletonRows?: number; // Default: 3
  cardPadding?: string; // Default: "p-0"
}

const emit = defineEmits<{
  "empty-action": [];
}>();
```

**Slots:**

- `default` - Table content (shown when not loading and not empty)
- `loading` - Custom loading state (optional)
- `empty` - Custom empty state (optional)
- `header` - Content above table (inside card)
- `footer` - Content below table (inside card)

**Template Structure:**

```vue
<template>
  <Card>
    <CardContent :class="cardPadding">
      <!-- Optional header -->
      <slot name="header" />

      <!-- Loading state -->
      <slot v-if="isLoading" name="loading">
        <Table>
          <TableBody>
            <TableRow v-for="i in skeletonRows" :key="i">
              <TableCell colspan="100%">
                <div class="flex gap-4">
                  <Skeleton class="h-5 w-32" />
                  <Skeleton class="h-5 w-48" />
                  <Skeleton class="h-5 w-20" />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </slot>

      <!-- Empty state -->
      <slot v-else-if="isEmpty" name="empty">
        <ConfigEmptyState
          :message="emptyMessage"
          :action-text="emptyActionText"
          :show-action="showEmptyAction"
          @action="emit('empty-action')"
        />
      </slot>

      <!-- Table content -->
      <slot v-else />

      <!-- Optional footer -->
      <slot name="footer" />
    </CardContent>
  </Card>
</template>
```

**Usage Example:**

```vue
<ConfigDataTable
  :is-loading="isLoading"
  :is-empty="filteredConfigs.length === 0"
  empty-message="No display configurations found."
  empty-action-text="Create your first display"
  @empty-action="createNew"
>
  <!-- Custom loading state -->
  <template #loading>
    <MyCustomSkeleton />
  </template>
  
  <!-- Table content -->
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="config in filteredConfigs" :key="config.id">
        <TableCell>{{ config.name }}</TableCell>
        <TableCell>{{ config.description }}</TableCell>
        <TableCell>
          <ActionsRow ... />
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</ConfigDataTable>
```

**Key Features:**

- Handles all common table states
- Consistent Card wrapper
- Customizable skeleton loading
- Integrates with ConfigEmptyState
- Flexible slot system

---

### Action Components

#### 6. ActionsRow.vue

**Location:** `src/components/shared/config/ActionsRow.vue`  
**Lines of Code:** ~100  
**Based on:** ClockDisplaysPage.vue lines 307-321

**Purpose:**  
Reusable row of action buttons with support for custom components (like LockWidget).

**Interface:**

```typescript
interface Action {
  id: string; // Unique identifier for this action
  icon?: Component; // Icon component (lucide-vue-next)
  tooltip?: string; // Tooltip text
  variant?: ButtonVariant; // Default: 'ghost'
  size?: ButtonSize; // Default: 'icon'
  class?: string; // Additional classes (e.g., 'text-destructive')
  visible?: boolean; // Default: true
  disabled?: boolean; // Default: false

  // For custom components (e.g., LockWidget)
  component?: Component; // Custom component to render
  componentProps?: Record<string, any>; // Props to pass to custom component
}

interface Props {
  actions: Action[]; // Array of actions to display
  itemId?: string; // ID of the item (for action handlers)
  itemName?: string; // Name of the item (for action handlers)
  justify?: "start" | "end" | "center"; // Default: 'end'
  gap?: string; // Default: 'gap-2'
}

const emit = defineEmits<{
  action: [actionId: string, itemId?: string, itemName?: string];
}>();
```

**Template Structure:**

```vue
<template>
  <div
    class="flex items-center"
    :class="[
      gap,
      {
        'justify-start': justify === 'start',
        'justify-end': justify === 'end',
        'justify-center': justify === 'center',
      },
    ]"
  >
    <template v-for="action in visibleActions" :key="action.id">
      <!-- Custom component (e.g., LockWidget) -->
      <component v-if="action.component" :is="action.component" v-bind="action.componentProps" />

      <!-- Standard button -->
      <Tooltip v-else>
        <TooltipTrigger as-child>
          <Button
            @click="emit('action', action.id, itemId, itemName)"
            :variant="action.variant || 'ghost'"
            :size="action.size || 'icon'"
            :class="action.class"
            :disabled="action.disabled"
            :title="action.tooltip"
          >
            <component v-if="action.icon" :is="action.icon" class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent v-if="action.tooltip">
          <p>{{ action.tooltip }}</p>
        </TooltipContent>
      </Tooltip>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<Props>(), {
  justify: "end",
  gap: "gap-2",
});

const visibleActions = computed(() => props.actions.filter((a) => a.visible !== false));
</script>
```

**Usage Example:**

```vue
<script setup lang="ts">
import { Eye, Edit, Copy, Trash2 } from "lucide-vue-next";
import LockWidget from "@/components/shared/LockWidget.vue";

const actions = [
  {
    id: "lock",
    component: LockWidget,
    componentProps: {
      configId: config.id,
      configName: config.name,
    },
  },
  {
    id: "preview",
    icon: Eye,
    tooltip: "Preview",
  },
  {
    id: "edit",
    icon: Edit,
    tooltip: "Edit",
  },
  {
    id: "duplicate",
    icon: Copy,
    tooltip: "Duplicate",
  },
  {
    id: "delete",
    icon: Trash2,
    tooltip: "Delete",
    class: "text-destructive",
  },
];

function handleAction(actionId: string, itemId?: string) {
  switch (actionId) {
    case "preview":
      previewConfig(itemId!);
      break;
    case "edit":
      editConfig(itemId!);
      break;
    case "duplicate":
      duplicateConfig(itemId!);
      break;
    case "delete":
      openDeleteDialog(itemId!, itemName);
      break;
  }
}
</script>

<template>
  <ActionsRow :actions="actions" :item-id="config.id" :item-name="config.name" @action="handleAction" />
</template>
```

**Key Features:**

- Declarative action configuration
- Supports custom components (LockWidget, etc.)
- Conditional visibility per action
- Flexible alignment and spacing
- Type-safe action handling
- Tooltip support
- Consistent button styling

---

### Dialog Components

#### 7. ConfigDeleteDialog.vue

**Location:** `src/components/shared/config/ConfigDeleteDialog.vue`  
**Lines of Code:** ~120  
**Based on:** ClockDisplaysPage.vue lines 401-430

**Purpose:**  
Reusable delete confirmation dialog with customizable content.

**Interface:**

```typescript
interface Props {
  open: boolean;
  title?: string; // Default: "Delete Item"
  description?: string; // Default: "Are you sure..."
  itemName: string; // Name to display
  itemId?: string; // ID to display (optional)
  confirmText?: string; // Default: "Delete"
  cancelText?: string; // Default: "Cancel"
  confirmVariant?: ButtonVariant; // Default: "destructive"
  isDeleting?: boolean; // Default: false
  showItemCard?: boolean; // Default: true
}

const emit = defineEmits<{
  "update:open": [value: boolean];
  confirm: [];
  cancel: [];
}>();
```

**Slots:**

- `body` - Custom content for dialog body (replaces default card)
- `item-details` - Content inside the item card
- `description` - Custom description text
- `footer` - Replace footer buttons

**Template Structure:**

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-1/2 max-w-2xl min-w-[400px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          <slot name="description">
            {{ description }}
          </slot>
        </DialogDescription>
      </DialogHeader>

      <!-- Custom body slot or default item card -->
      <slot name="body">
        <Card v-if="showItemCard" class="p-0 my-12">
          <CardContent class="py-1 px-4">
            <slot name="item-details">
              <div class="flex items-center justify-between gap-3">
                <div class="flex flex-col items-center gap-2 h-20 mt-3 shrink-0">
                  <span class="font-semibold text-lg">{{ itemName }}</span>
                  <span v-if="itemId" class="text-sm text-muted-foreground">
                    {{ itemId }}
                  </span>
                </div>
              </div>
            </slot>
          </CardContent>
        </Card>
      </slot>

      <!-- Footer -->
      <slot name="footer">
        <DialogFooter class="gap-2">
          <Button
            variant="outline"
            @click="
              emit('cancel');
              emit('update:open', false);
            "
            :disabled="isDeleting"
          >
            {{ cancelText }}
          </Button>
          <Button :variant="confirmVariant" @click="emit('confirm')" :disabled="isDeleting">
            <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isDeleting ? "Deleting..." : confirmText }}
          </Button>
        </DialogFooter>
      </slot>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
withDefaults(defineProps<Props>(), {
  title: "Delete Item",
  description: "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText: "Delete",
  cancelText: "Cancel",
  confirmVariant: "destructive",
  isDeleting: false,
  showItemCard: true,
});
</script>
```

**Usage Example:**

```vue
<!-- Simple usage -->
<ConfigDeleteDialog
  v-model:open="showDeleteDialog"
  title="Delete Display Configuration"
  :item-name="deleteConfigName"
  :item-id="deleteConfigId"
  :is-deleting="isDeleting"
  @confirm="confirmDelete"
/>

<!-- With custom body -->
<ConfigDeleteDialog v-model:open="showDeleteDialog" title="Delete User" :item-name="userName" @confirm="deleteUser">
  <template #item-details>
    <div class="space-y-2">
      <p><strong>Name:</strong> {{ userName }}</p>
      <p><strong>Email:</strong> {{ userEmail }}</p>
      <p><strong>Role:</strong> {{ userRole }}</p>
      <Badge variant="destructive" v-if="userHasActiveData">
        Has active data
      </Badge>
    </div>
  </template>
</ConfigDeleteDialog>

<!-- Fully custom -->
<ConfigDeleteDialog v-model:open="showDeleteDialog" :show-item-card="false" @confirm="confirmDelete">
  <template #body>
    <div class="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>
          This will permanently delete all associated data.
        </AlertDescription>
      </Alert>
      <!-- Custom content -->
    </div>
  </template>
</ConfigDeleteDialog>
```

**Key Features:**

- Flexible content via slots
- Default item card with name/ID
- Loading state during deletion
- Customizable button text and variants
- Type-safe event handling
- Consistent styling

---

#### 8. SaveRestoreDialog.vue

**Location:** `src/components/shared/config/SaveRestoreDialog.vue`  
**Lines of Code:** ~200  
**Based on:** ClockDisplaysPage.vue lines 331-398

**Purpose:**  
Generic dialog for saving and restoring Redis data with variant management.

**Interface:**

```typescript
interface Props {
  open: boolean;
  mode: "save" | "restore";

  // Text customization
  title?: string; // Auto-generated based on mode if not provided
  description?: string; // Auto-generated based on mode if not provided
  saveDescription?: string; // Custom description for save mode
  restoreDescription?: string; // Custom description for restore mode
  noVariantsMessage?: string; // Message when no variants exist

  // Button text
  confirmText?: string; // Auto-generated based on mode
  cancelText?: string; // Default: "Cancel"

  // State
  isProcessing?: boolean; // Default: false

  // For getting available variants
  filePattern: string; // Redis key pattern (e.g., "clock-display-config.*.*.json")
}

const emit = defineEmits<{
  "update:open": [value: boolean];
  save: [variant: string];
  restore: [variant: string];
  cancel: [];
}>();
```

**Internal State:**

```typescript
const variantName = ref("default");
const availableVariants = ref<string[]>([]);
const showCustomInput = ref(false);
const customVariantName = ref("");
const variantInputRef = ref<InstanceType<typeof VariantNameInput> | null>(null);
```

**Template Structure:**

```vue
<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ title || (mode === "save" ? "Save to File" : "Restore from File") }}
        </DialogTitle>
        <DialogDescription>
          {{ computedDescription }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 pt-4 pb-6 max-w-60">
        <!-- Variant Selection -->
        <div class="space-y-2">
          <!-- Dropdown (shown if variants exist or in save mode) -->
          <Select
            v-if="hasAnyVariants || mode === 'save'"
            :model-value="showCustomInput ? '__custom__' : variantName"
            @update:model-value="handleVariantChange"
            class="max-w-48"
          >
            <SelectTrigger>
              <SelectValue :placeholder="hasDefaultVariant ? 'Default Variant' : 'Select variant...'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="variant in availableVariants" :key="variant" :value="variant">
                {{ variant }}
              </SelectItem>
              <SelectItem v-if="mode === 'save'" value="__custom__"> + New variant... </SelectItem>
            </SelectContent>
          </Select>

          <!-- No variants message (restore mode only) -->
          <div v-else-if="mode === 'restore'" class="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
            {{ noVariantsMessage }}
          </div>
        </div>

        <!-- Custom variant input -->
        <div v-if="showCustomInput" class="space-y-2">
          <Label>New Variant Name</Label>
          <VariantNameInput
            v-model="customVariantName"
            ref="variantInputRef"
            :existing-variants="availableVariants"
            mode="create"
            @keydown.enter="handleConfirm"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel" :disabled="isProcessing">
          {{ cancelText }}
        </Button>
        <Button
          v-if="mode === 'save' || hasAnyVariants"
          @click="handleConfirm"
          :disabled="!isValidVariant || isProcessing"
        >
          <Loader2 v-if="isProcessing" class="mr-2 h-4 w-4 animate-spin" />
          {{ isProcessing ? "Processing..." : confirmText || mode }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRedisFileSync } from '@/composables/useRedisFileSync';
import { useToaster } from '@/composables/useToaster';
import VariantNameInput from '@/components/shared/VariantNameInput.vue';

const props = withDefaults(defineProps<Props>(), {
  cancelText: 'Cancel',
  isProcessing: false,
  noVariantsMessage: 'No saved variants found. Save a configuration first to enable restore functionality.',
});

const emit = defineEmits<...>();

const { listAllVariants } = useRedisFileSync();
const { emitToast } = useToaster();

// ... internal state refs ...

// Computed properties
const finalVariantName = computed(() =>
  showCustomInput.value ? customVariantName.value : variantName.value
);

const hasDefaultVariant = computed(() =>
  availableVariants.value.includes('default')
);

const hasAnyVariants = computed(() =>
  availableVariants.value.length > 0
);

const isValidVariant = computed(() => {
  const variant = finalVariantName.value;
  if (!variant) return false;
  if (showCustomInput.value && !variantInputRef.value?.isValid) return false;
  return true;
});

const computedDescription = computed(() => {
  if (props.mode === 'save') {
    return props.saveDescription || props.description || 'Enter a variant name to save the configurations.';
  } else {
    if (!hasAnyVariants.value) return props.noVariantsMessage;
    return props.restoreDescription || props.description || 'Enter the variant name to restore configurations from.';
  }
});

// Load variants when dialog opens
watch(() => props.open, async (isOpen) => {
  if (!isOpen) return;

  availableVariants.value = await listAllVariants(props.filePattern);

  if (props.mode === 'restore' && availableVariants.value.length === 0) {
    emitToast({
      title: props.noVariantsMessage,
      type: 'warning',
      deliverTo: 'all',
    });
    emit('update:open', false);
    return;
  }

  // Initialize variant selection
  if (availableVariants.value.length === 0) {
    // No variants - start with custom input
    showCustomInput.value = true;
    customVariantName.value = '';
    variantName.value = '';
  } else {
    // Has variants - select default or first
    variantName.value = hasDefaultVariant.value ? 'default' : availableVariants.value[0];
    showCustomInput.value = false;
    customVariantName.value = '';
  }
});

function handleVariantChange(value: string) {
  if (value === '__custom__') {
    showCustomInput.value = true;
    customVariantName.value = '';
  } else {
    showCustomInput.value = false;
    variantName.value = value;
  }
}

function handleConfirm() {
  if (!isValidVariant.value) return;

  const variant = finalVariantName.value;
  if (props.mode === 'save') {
    emit('save', variant);
  } else {
    emit('restore', variant);
  }
}

function handleCancel() {
  emit('cancel');
  emit('update:open', false);
}
</script>
```

**Usage Example:**

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useRedisFileSync } from "@/composables/useRedisFileSync";
import { REDIS_CONFIG } from "@/config/constants";
import { getDisplayConfigKey } from "@/utils/redisKeyUtils";

const showSaveDialog = ref(false);
const showRestoreDialog = ref(false);
const { saveKeysToFiles, restoreKeysFromFiles, listKeysForVariant } = useRedisFileSync();

async function handleSave(variant: string) {
  const allKeys = displayConfigs.value.map((c) => getDisplayConfigKey(c.id));
  await saveKeysToFiles(allKeys, variant, true);
  showSaveDialog.value = false;
}

async function handleRestore(variant: string) {
  const allKeys = await listKeysForVariant(variant);
  const success = await restoreKeysFromFiles(allKeys, variant, true);
  if (success) {
    await loadDisplayConfigs();
  }
  showRestoreDialog.value = false;
}
</script>

<template>
  <!-- Save Dialog -->
  <SaveRestoreDialog
    v-model:open="showSaveDialog"
    mode="save"
    :file-pattern="REDIS_CONFIG.KEYS.DISPLAY_CONFIG.FILE_PATTERN"
    :is-processing="isSaving"
    save-description="Enter a variant name to save all display configurations."
    @save="handleSave"
  />

  <!-- Restore Dialog -->
  <SaveRestoreDialog
    v-model:open="showRestoreDialog"
    mode="restore"
    :file-pattern="REDIS_CONFIG.KEYS.DISPLAY_CONFIG.FILE_PATTERN"
    :is-processing="isRestoring"
    restore-description="Select a variant to restore display configurations from."
    @restore="handleRestore"
  />
</template>
```

**Key Features:**

- Handles both save and restore modes
- Automatic variant loading based on file pattern
- Custom variant creation (save mode only)
- Validation via VariantNameInput
- Auto-generated titles and descriptions
- Loading state handling
- Toast notifications for errors
- Type-safe event handling
- Prevents restore when no variants exist

---

## Type Definitions

Create `src/types/ConfigComponents.ts`:

```typescript
import type { Component } from "vue";

/**
 * Action button configuration for ActionsRow
 */
export interface Action {
  /** Unique identifier for this action */
  id: string;

  /** Icon component (from lucide-vue-next) */
  icon?: Component;

  /** Tooltip text shown on hover */
  tooltip?: string;

  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";

  /** Additional CSS classes */
  class?: string;

  /** Whether the action is visible */
  visible?: boolean;

  /** Whether the action is disabled */
  disabled?: boolean;

  /** Custom component to render instead of button */
  component?: Component;

  /** Props to pass to custom component */
  componentProps?: Record<string, any>;
}

/**
 * Table column configuration for ConfigDataTable
 */
export interface TableColumn {
  /** Column key/identifier */
  key: string;

  /** Column header label */
  label: string;

  /** Column width class (e.g., "w-48") */
  width?: string;

  /** Whether column is sortable */
  sortable?: boolean;

  /** Alignment */
  align?: "left" | "center" | "right";

  /** Custom header class */
  headerClass?: string;

  /** Custom cell class */
  cellClass?: string;
}

/**
 * Skeleton configuration for loading states
 */
export interface SkeletonColumn {
  /** Width class (e.g., "w-32") */
  width?: string;

  /** Height class (e.g., "h-5") */
  height?: string;

  /** Additional CSS classes */
  class?: string;

  /** Show a second skeleton line (for subtext) */
  hasSubtext?: boolean;

  /** Subtext skeleton width */
  subtextWidth?: string;
}

/**
 * Configuration for save/restore operations
 */
export interface SaveRestoreConfig {
  /** File pattern for filtering Redis keys */
  filePattern: string;

  /** Function to get keys for save operation */
  getKeysForSave: () => string[];

  /** Function to get keys for restore operation */
  getKeysForRestore: (variant: string) => Promise<string[]>;

  /** Callback after successful restore */
  onRestoreComplete?: () => Promise<void>;
}
```

---

## Folder Structure

```
src/
├── components/
│   ├── shared/
│   │   ├── layouts/
│   │   │   ├── ConfigFlexLayout.vue      ✅ NEW
│   │   │   └── ConfigScrollLayout.vue    ✅ NEW
│   │   ├── config/                       ✅ NEW FOLDER
│   │   │   ├── ConfigHeaderBar.vue       ✅ NEW
│   │   │   ├── ConfigEmptyState.vue      ✅ NEW
│   │   │   ├── ConfigDataTable.vue       ✅ NEW
│   │   │   ├── ActionsRow.vue            ✅ NEW
│   │   │   ├── ConfigDeleteDialog.vue    ✅ NEW
│   │   │   └── SaveRestoreDialog.vue     ✅ NEW
│   │   ├── LockWidget.vue
│   │   ├── VariantNameInput.vue
│   │   └── ...
│   ├── Pages/
│   │   └── ConfigPage/
│   │       └── views/
│   │           └── displays/
│   │               └── clock-displays/
│   │                   └── ClockDisplaysPage.vue  ✅ REFACTOR
│   └── ui/
│       └── ...
├── types/
│   ├── ConfigComponents.ts               ✅ NEW
│   └── ...
└── ...
```

---

## Implementation Order

### Phase 1: Foundation (Layouts & Types)

**Estimated Time:** 2-3 hours

1. **Create type definitions** (`ConfigComponents.ts`)

   - Define Action interface
   - Define TableColumn interface
   - Define SkeletonColumn interface
   - Define SaveRestoreConfig interface

2. **Create ConfigFlexLayout.vue**

   - Simple slot-based layout
   - Test with dummy content

3. **Create ConfigScrollLayout.vue**
   - Sticky header implementation
   - Test scroll behavior

**Deliverable:** Foundational components ready for use

---

### Phase 2: Simple Shared Components

**Estimated Time:** 3-4 hours

4. **Create ConfigEmptyState.vue**

   - Implement basic empty state
   - Add slot support
   - Test with various configurations

5. **Create ActionsRow.vue**
   - Implement action button rendering
   - Add custom component support
   - Test with LockWidget integration
   - Handle visibility and disabled states

**Deliverable:** Reusable components with no external dependencies

---

### Phase 3: Complex Shared Components

**Estimated Time:** 4-5 hours

6. **Create ConfigHeaderBar.vue**

   - Implement search input
   - Implement create button
   - Implement save/restore buttons with loading states
   - Add tooltip support
   - Add slot support for custom actions
   - Test with various prop combinations

7. **Create ConfigDataTable.vue**
   - Implement Card wrapper
   - Handle loading state
   - Handle empty state
   - Add slot support
   - Test with mock data

**Deliverable:** Feature-rich header and table components

---

### Phase 4: Dialog Components

**Estimated Time:** 5-6 hours

8. **Create ConfigDeleteDialog.vue**

   - Implement base dialog structure
   - Add item card display
   - Add slot support for custom body
   - Handle delete confirmation
   - Test with various item types

9. **Create SaveRestoreDialog.vue** ⚠️ **MOST COMPLEX**
   - Implement variant selection logic
   - Integrate with useRedisFileSync
   - Handle custom variant input
   - Add validation support
   - Handle both save and restore modes
   - Test with different file patterns
   - Edge case testing (no variants, etc.)

**Deliverable:** Fully functional dialog components

---

### Phase 5: Refactor ClockDisplaysPage

**Estimated Time:** 3-4 hours

10. **Refactor ClockDisplaysPage.vue**
    - Replace header with ConfigHeaderBar
    - Replace table wrapper with ConfigDataTable
    - Replace actions with ActionsRow
    - Replace dialogs with new components
    - Update event handlers
    - Remove extracted code
    - Test all functionality
    - Verify no regressions

**Deliverable:** Refactored page using all new components

---

### Phase 6: Documentation & Testing

**Estimated Time:** 2-3 hours

11. **Create component documentation**

    - Usage examples
    - Props documentation
    - Emit documentation
    - Slot documentation

12. **Integration testing**
    - Test all components together
    - Test edge cases
    - Test responsive behavior
    - Test accessibility

**Deliverable:** Fully tested and documented components

---

**Total Estimated Time:** 19-25 hours

---

## Migration Strategy

### Step 1: Create New Components

Create all new shared components without modifying existing code. This allows:

- Parallel development
- Independent testing
- No disruption to current functionality

### Step 2: Test Components in Isolation

Test each component independently:

- Create test pages/stories
- Verify all props work correctly
- Test all slots
- Test all events
- Test edge cases

### Step 3: Refactor One Page at a Time

Start with ClockDisplaysPage.vue:

1. Create a new branch
2. Replace one section at a time
3. Test after each replacement
4. Commit when working
5. Move to next section

### Step 4: Identify Other Pages for Migration

After ClockDisplaysPage is complete, identify other pages that can benefit:

- Look for similar patterns
- Prioritize pages with most duplication
- Create migration plan for each

### Step 5: Create Migration Guide

Document the process for other developers:

- How to use each component
- Common patterns
- Migration examples
- Best practices

---

## Testing Considerations

### Unit Testing (Vitest)

**ConfigEmptyState.vue:**

```typescript
describe('ConfigEmptyState', () => {
  it('renders message correctly', () => { ... });
  it('emits action event when button clicked', () => { ... });
  it('hides action button when showAction is false', () => { ... });
  it('renders custom icon when provided', () => { ... });
});
```

**ActionsRow.vue:**

```typescript
describe('ActionsRow', () => {
  it('renders all visible actions', () => { ... });
  it('emits action event with correct parameters', () => { ... });
  it('renders custom component when provided', () => { ... });
  it('applies correct classes and variants', () => { ... });
  it('hides actions when visible is false', () => { ... });
});
```

**ConfigHeaderBar.vue:**

```typescript
describe('ConfigHeaderBar', () => {
  it('emits search query updates', () => { ... });
  it('emits create event when button clicked', () => { ... });
  it('shows loading state during save', () => { ... });
  it('disables buttons when processing', () => { ... });
  it('renders custom actions in slots', () => { ... });
});
```

**SaveRestoreDialog.vue:**

```typescript
describe('SaveRestoreDialog', () => {
  it('loads variants when opened', () => { ... });
  it('allows creating custom variant in save mode', () => { ... });
  it('prevents creating custom variant in restore mode', () => { ... });
  it('validates variant names', () => { ... });
  it('emits save event with correct variant', () => { ... });
  it('shows error when no variants exist for restore', () => { ... });
});
```

### Integration Testing

**ClockDisplaysPage with new components:**

```typescript
describe('ClockDisplaysPage Integration', () => {
  it('searches and filters configs correctly', () => { ... });
  it('creates new config', () => { ... });
  it('edits existing config', () => { ... });
  it('duplicates config', () => { ... });
  it('deletes config with confirmation', () => { ... });
  it('saves configs to file', () => { ... });
  it('restores configs from file', () => { ... });
  it('handles empty state', () => { ... });
  it('handles loading state', () => { ... });
});
```

### Manual Testing Checklist

- [ ] Search functionality works
- [ ] Create button navigates correctly
- [ ] Save dialog opens and closes
- [ ] Restore dialog opens and closes
- [ ] Variant selection works
- [ ] Custom variant creation works
- [ ] Variant validation works
- [ ] Delete dialog shows correct info
- [ ] Delete confirmation works
- [ ] Actions row buttons work
- [ ] Lock widget integrates properly
- [ ] Loading states display correctly
- [ ] Empty state displays correctly
- [ ] Tooltips appear on hover
- [ ] Responsive layout works
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility

---

## Future Enhancements

### Phase 7: Additional Features (Post-MVP)

1. **ConfigPagination.vue**

   - Pagination component for large datasets
   - Page size selector
   - Jump to page input

2. **ConfigBulkActions.vue**

   - Checkbox selection
   - Bulk action bar
   - Select all/none functionality

3. **ConfigFilterBar.vue**

   - Advanced filtering options
   - Filter chips
   - Clear filters button

4. **ConfigSortHeader.vue**

   - Sortable table headers
   - Sort direction indicators
   - Multi-column sorting

5. **ConfigExportDialog.vue**

   - Export to various formats (CSV, JSON, Excel)
   - Column selection
   - Filter exported data

6. **ConfigImportDialog.vue**
   - Import from various formats
   - Validation and preview
   - Conflict resolution

### Additional Improvements

1. **Add keyboard shortcuts**

   - `Ctrl+F` for search
   - `Ctrl+N` for new item
   - `Escape` to close dialogs

2. **Add loading progress indicators**

   - Progress bars for file operations
   - Estimated time remaining
   - Cancel operation option

3. **Add undo/redo functionality**

   - History stack for actions
   - Undo delete operations
   - Restore previous states

4. **Add drag-and-drop reordering**

   - Drag rows to reorder
   - Visual feedback during drag
   - Save order to backend

5. **Add column customization**

   - Show/hide columns
   - Reorder columns
   - Resize columns
   - Save preferences

6. **Add advanced search**

   - Search by specific fields
   - Regular expression support
   - Search history

7. **Add data caching**
   - Cache frequently accessed data
   - Invalidate on changes
   - Reduce API calls

---

## Conclusion

This plan provides a comprehensive approach to extracting reusable components from ClockDisplaysPage.vue and creating a robust set of shared components for configuration pages. By following this structured approach, we will:

- **Reduce code duplication** by 50-70% across config pages
- **Improve maintainability** with centralized components
- **Standardize UX** across the application
- **Accelerate development** of future config pages
- **Improve testability** with smaller, focused components

The estimated total implementation time is **19-25 hours**, broken down into manageable phases that can be completed independently.

---

## Next Steps

1. **Review and approve** this plan
2. **Create feature branch** `feature/config-component-extraction`
3. **Begin Phase 1** (Foundation)
4. **Regular check-ins** after each phase
5. **Update this document** with any changes or learnings
6. **Create pull request** when complete

---

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**Author:** AI Assistant + Noah P.
