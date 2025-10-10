<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDisplayConfigs } from "@/composables/useDisplayConfigs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Copy, Trash2, Eye } from "lucide-vue-next";

const router = useRouter();
const { displayConfigs, isLoading, loadDisplayConfigs, deleteDisplayConfig, duplicateDisplayConfig } =
  useDisplayConfigs();

const searchQuery = ref("");
const showPreview = ref(false);
const previewConfigId = ref<string | null>(null);

const filteredConfigs = computed(() => {
  if (!searchQuery.value) return displayConfigs.value;
  const q = searchQuery.value.toLowerCase();
  return displayConfigs.value.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.id || "").toLowerCase().includes(q)
  );
});

onMounted(() => {
  loadDisplayConfigs();
});

function createNew() {
  router.push("/config/display-configs/create");
}

function editConfig(id: string) {
  router.push(`/config/display-configs/${id}/edit`);
}

async function duplicateConfig(id: string) {
  await duplicateDisplayConfig(id);
}

async function deleteConfig(id: string, name: string) {
  if (confirm(`Are you sure you want to delete "${name}"?`)) {
    await deleteDisplayConfig(id);
  }
}

function previewConfig(id: string) {
  previewConfigId.value = id;
  showPreview.value = true;
}

function getTotalClocks(config: any) {
  return config.rows?.reduce((total: number, row: any) => total + (row.clocks?.length || 0), 0) ?? 0;
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold">Display Configurations</h2>
        <p class="text-muted-foreground">Manage clock display layouts</p>
      </div>
      <Button @click="createNew">
        <Plus class="mr-2 h-4 w-4" />
        Create Display
      </Button>
    </div>

    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input v-model="searchQuery" placeholder="Search displays..." class="pl-10" />
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Displays</CardTitle>
        <CardDescription>View, edit, duplicate, delete, or preview display configs</CardDescription>
      </CardHeader>
      <CardContent class="pt-6">
        <div v-if="isLoading" class="text-center py-8 text-muted-foreground">Loading configurations...</div>

        <div v-else-if="filteredConfigs.length === 0" class="text-center py-8 text-muted-foreground">
          <p>No display configurations found.</p>
          <Button @click="createNew" variant="link" class="mt-2">Create your first display</Button>
        </div>

        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Clocks</TableHead>
              <TableHead class="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="config in filteredConfigs" :key="config.id">
              <TableCell class="font-medium">
                {{ config.name }}
                <div class="text-xs text-muted-foreground">{{ config.id }}</div>
              </TableCell>
              <TableCell class="max-w-md truncate">{{ config.description || "—" }}</TableCell>
              <TableCell
                ><Badge variant="secondary">{{ config.rows?.length || 0 }}</Badge></TableCell
              >
              <TableCell
                ><Badge variant="secondary">{{ getTotalClocks(config) }}</Badge></TableCell
              >
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <Button @click="previewConfig(config.id)" variant="ghost" size="icon" title="Preview">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button @click="editConfig(config.id)" variant="ghost" size="icon" title="Edit">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button @click="duplicateConfig(config.id)" variant="ghost" size="icon" title="Duplicate">
                    <Copy class="h-4 w-4" />
                  </Button>
                  <Button @click="deleteConfig(config.id, config.name)" variant="ghost" size="icon" title="Delete">
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
