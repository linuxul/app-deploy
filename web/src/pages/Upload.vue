<template>
  <div class="container py-4" style="max-width: 720px">
    <h2 class="mb-3">릴리즈 업로드</h2>

    <div class="alert alert-warning">
      인증 없이 누구나 업로드 가능합니다. 악성 파일 업로드에 유의하세요.
      <br><strong>최대 파일 크기: 200MB</strong>
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
          ref="fileInput"
        />
        <div v-if="file" class="form-text text-success mt-1">
          ✅ 선택된 파일: {{ file.name }} ({{
            (file.size / 1024 / 1024).toFixed(2)
          }}
          MB)
        </div>
        <div v-else class="form-text text-muted mt-1">
          .apk 또는 .aab 파일을 선택해주세요
        </div>
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
  const selectedFile = t.files?.[0];

  console.log("File selection event:", e);
  console.log("Selected file:", selectedFile);

  if (selectedFile) {
    console.log("File details:", {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified,
    });

        // 파일 확장자 검증
    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith(".apk") && !fileName.endsWith(".aab")) {
      alert("APK 또는 AAB 파일만 선택할 수 있습니다.");
      t.value = "";
      file.value = null;
      return;
    }
    
    // 파일 크기 검증 (200MB)
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    if (selectedFile.size > maxSize) {
      alert(`파일 크기가 너무 큽니다. 최대 200MB까지 허용됩니다. (현재: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`);
      t.value = "";
      file.value = null;
      return;
    }
    
    file.value = selectedFile;
    console.log("File set successfully:", file.value);
  } else {
    file.value = null;
    console.log("No file selected");
  }
}

async function submit() {
  console.log("Submit function called");
  console.log("Current file value:", file.value);

  if (!file.value) {
    alert("파일을 선택해주세요.");
    return;
  }

  console.log("Creating FormData...");
  const form = new FormData();
  form.append("file", file.value);
  if (releaseNotes.value) form.append("releaseNotes", releaseNotes.value);

  console.log("FormData created:", form);
  console.log("FormData entries:");
  for (let [key, value] of form.entries()) {
    console.log(`${key}:`, value);
  }

  loading.value = true;
  result.value = null;

  try {
    console.log("Sending API request...");
    const { data } = await api.post("/releases/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    result.value = data;
    console.log("Upload successful:", data);
    alert("업로드가 성공했습니다!");
  } catch (error: any) {
    console.error("Upload failed:", error);
    alert(
      `업로드 실패: ${
        error.response?.data?.message || error.message || "알 수 없는 오류"
      }`
    );
  } finally {
    loading.value = false;
  }
}
</script>
