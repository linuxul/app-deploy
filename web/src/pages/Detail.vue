<template>
  <div class="container py-4" style="max-width: 820px">
    <div v-if="item" class="card">
      <div class="card-body">
        <h4 class="card-title">
          {{ item.appName }}
          <small class="text-muted">({{ item.appId }})</small>
        </h4>
        <p class="mb-1">
          버전: v{{ item.versionName }} ({{ item.versionCode }})
        </p>
        <p class="mb-1">
          파일: {{ item.fileName }} —
          {{ (item.fileSize / 1024 / 1024).toFixed(1) }} MB
        </p>
        <p class="text-muted">
          SHA-256: <code>{{ item.sha256 }}</code>
        </p>
        <p class="mt-3" style="white-space: pre-line">
          {{ item.releaseNotes || "—" }}
        </p>
        <div class="d-flex gap-2 mt-3">
          <a
            class="btn btn-success"
            :href="downloadUrl"
            @click.prevent="goDownload"
            >다운로드</a
          >
          <router-link to="/" class="btn btn-outline-secondary"
            >뒤로</router-link
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../api";

const route = useRoute();
const item = ref<any | null>(null);
const downloadUrl = ref<string>("");

async function load() {
  const { data } = await api.get(`/releases/${route.params.id}`);
  item.value = data;
}

async function goDownload() {
  const { data } = await api.get(`/releases/${route.params.id}/download`);
  downloadUrl.value = data.url;
  window.location.href = data.url;
}

onMounted(load);
</script>
