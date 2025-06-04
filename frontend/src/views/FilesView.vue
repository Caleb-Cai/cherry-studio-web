<template>
  <div class="files-view">
    <div class="files-header">
      <div class="header-content">
        <h1>📁 File Manager</h1>
        <p>Upload and manage your files for AI processing</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const files = ref([])
</script>

<style scoped>
.files-view {
  padding: 24px;
}
</style>