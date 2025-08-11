<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="m-0">릴리즈 목록</h2>
      <router-link to="/upload" class="btn btn-primary">업로드</router-link>
    </div>

    <form class="row g-2 mb-3" @submit.prevent="fetchList(1)">
      <div class="col-sm-6">
        <input
          v-model="q"
          type="search"
          class="form-control"
          placeholder="앱명/AppId/버전 검색"
        />
      </div>
      <div class="col-auto">
        <button class="btn btn-outline-secondary" type="submit">검색</button>
      </div>
    </form>

    <div class="row g-3">
      <div v-for="r in items" :key="r._id" class="col-md-6 col-lg-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">
              {{ r.appName }} <small class="text-muted">({{ r.appId }})</small>
            </h5>
            <p class="card-text mb-1">
              v{{ r.versionName }} ({{ r.versionCode }})
            </p>
            <p class="card-text text-muted">
              {{ (r.fileSize / 1024 / 1024).toFixed(1) }} MB •
              {{ r.artifactType.toUpperCase() }}
            </p>
            <router-link
              :to="`/r/${r._id}`"
              class="btn btn-sm btn-outline-primary"
              >상세보기</router-link
            >
          </div>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-center my-3" v-if="total > size">
      <nav>
        <ul class="pagination mb-0">
          <li class="page-item" :class="{ disabled: page === 1 }">
            <button class="page-link" @click="fetchList(page - 1)">이전</button>
          </li>
          <li class="page-item disabled">
            <span class="page-link"
              >{{ page }} / {{ Math.ceil(total / size) }}</span
            >
          </li>
          <li
            class="page-item"
            :class="{ disabled: page >= Math.ceil(total / size) }"
          >
            <button class="page-link" @click="fetchList(page + 1)">다음</button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../api";

const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const size = 20;
const q = ref("");

async function fetchList(p = 1) {
  page.value = p;
  try {
    console.log("Fetching releases...");
    const { data } = await api.get("/releases", {
      params: { page: p, size, q: q.value || undefined },
    });
    console.log("API response:", data);
    items.value = data.items;
    total.value = data.total;
    console.log("Items set:", items.value);
  } catch (error) {
    console.error("Failed to fetch releases:", error);
  }
}

onMounted(() => fetchList());
</script>
