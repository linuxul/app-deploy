<template>
  <div class="container py-4" style="max-width: 720px">
    <h2 class="mb-3">릴리즈 업로드</h2>

    <div class="alert alert-warning">
      인증 없이 누구나 업로드 가능합니다. 악성 파일 업로드에 유의하세요.
    </div>

    <form @submit.prevent="submit" class="vstack gap-3">
      <div>
        <label class="form-label">APK/AAB 파일</label>
        <input
          class="form-control"
          type="file"
          accept=".apk,.aab"
          @change="onFile"
          required
        />
      </div>
      <div>
        <label class="form-label">릴리즈 노트 (선택)</label>
        <textarea
          class="form-control"
          rows="5"
          v-model="releaseNotes"
          placeholder="변경 사항을 적어주세요"
        ></textarea>
      </div>
      <button class="btn btn-primary" :disabled="loading">
        {{ loading ? "업로드 중..." : "업로드" }}
      </button>
    </form>

    <div v-if="result" class="alert alert-success mt-3">
      업로드 완료!
      <router-link :to="`/r/${result.release._id}`">상세 보기</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import api from "../api";

const file = ref<File | null>(null);
const releaseNotes = ref("");
const loading = ref(false);
const result = ref<any | null>(null);

function onFile(e: Event) {
  const t = e.target as HTMLInputElement;
  file.value = t.files?.[0] || null;
}

async function submit() {
  if (!file.value) return;
  const form = new FormData();
  form.append("file", file.value);
  if (releaseNotes.value) form.append("releaseNotes", releaseNotes.value);
  loading.value = true;
  try {
    const { data } = await api.post("/releases/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    result.value = data;
  } finally {
    loading.value = false;
  }
}
</script>
