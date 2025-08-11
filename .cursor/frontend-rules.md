# 프론트엔드 개발 룰 (Frontend Development Rules)

## 🎯 프론트엔드 아키텍처

### Vue 3 구조

- **Composition API**: `<script setup>` 문법 우선 사용
- **컴포넌트 분리**: 단일 책임 원칙에 따른 컴포넌트 구조
- **상태 관리**: 로컬 상태는 `ref`/`reactive`, 전역 상태는 Pinia 고려
- **라우팅**: Vue Router를 사용한 SPA 구조

### Vite + TypeScript

- **빌드 도구**: Vite를 사용한 빠른 개발 환경
- **타입 안전성**: 모든 컴포넌트와 함수에 타입 정의
- **모듈 해상도**: 절대 경로와 별칭 사용

## 📝 코딩 패턴

### Vue 컴포넌트 구조

```vue
<!-- ✅ 권장: 명확한 컴포넌트 구조 -->
<template>
  <div class="release-card">
    <h3>{{ release.appName }}</h3>
    <p>{{ release.versionName }}</p>
    <button @click="handleDownload">다운로드</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Release } from "@/types/release";

// Props 정의
interface Props {
  release: Release;
}

const props = defineProps<Props>();

// Emits 정의
const emit = defineEmits<{
  download: [releaseId: string];
}>();

// 반응형 데이터
const isLoading = ref(false);

// Computed 속성
const formattedSize = computed(() => {
  return (props.release.fileSize / 1024 / 1024).toFixed(1) + " MB";
});

// 메서드
const handleDownload = async () => {
  isLoading.value = true;
  try {
    emit("download", props.release._id);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.release-card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
}
</style>
```

### TypeScript 타입 정의

```typescript
// ✅ 권장: 명확한 타입 정의
// types/release.ts
export interface Release {
  _id: string;
  appId: string;
  appName: string;
  versionName: string;
  versionCode: number;
  artifactType: "apk" | "aab";
  fileName: string;
  fileSize: number;
  sha256: string;
  releaseNotes: string;
  uploadedByIp: string;
  downloads: number;
  createdAt: string;
}

// ✅ 권장: API 응답 타입
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
```

### API 통신 패턴

```typescript
// ✅ 권장: 타입 안전한 API 클라이언트
// api/releases.ts
import api from "@/api";
import type { Release, ApiResponse, PaginatedResponse } from "@/types";

export const releasesApi = {
  // 릴리즈 목록 조회
  async getReleases(params: {
    page?: number;
    size?: number;
    q?: string;
    appId?: string;
  }): Promise<PaginatedResponse<Release>> {
    const { data } = await api.get("/releases", { params });
    return data;
  },

  // 릴리즈 업로드
  async uploadRelease(formData: FormData): Promise<ApiResponse<Release>> {
    const { data } = await api.post("/releases/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  // 릴리즈 상세 조회
  async getRelease(id: string): Promise<Release> {
    const { data } = await api.get(`/releases/${id}`);
    return data;
  },
};
```

## 🎨 UI/UX 패턴

### Bootstrap 5 활용

```vue
<!-- ✅ 권장: Bootstrap 클래스 활용 -->
<template>
  <div class="container py-4">
    <!-- 반응형 그리드 -->
    <div class="row g-3">
      <div
        class="col-12 col-md-6 col-lg-4"
        v-for="release in releases"
        :key="release._id"
      >
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ release.appName }}</h5>
            <p class="card-text text-muted">{{ release.appId }}</p>
            <div class="mt-auto">
              <button
                class="btn btn-primary btn-sm"
                @click="viewDetails(release._id)"
              >
                상세보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 페이지네이션 -->
    <nav v-if="total > pageSize" class="mt-4">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button class="page-link" @click="changePage(currentPage - 1)">
            이전
          </button>
        </li>
        <li class="page-item disabled">
          <span class="page-link">{{ currentPage }} / {{ totalPages }}</span>
        </li>
        <li class="page-item" :class="{ disabled: currentPage >= totalPages }">
          <button class="page-link" @click="changePage(currentPage + 1)">
            다음
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>
```

### 폼 처리 패턴

```vue
<!-- ✅ 권장: 폼 검증 및 에러 처리 -->
<template>
  <form @submit.prevent="handleSubmit" class="needs-validation" novalidate>
    <div class="mb-3">
      <label class="form-label">APK/AAB 파일</label>
      <input
        type="file"
        class="form-control"
        :class="{ 'is-invalid': errors.file }"
        accept=".apk,.aab"
        @change="handleFileChange"
        required
      />
      <div class="invalid-feedback" v-if="errors.file">
        {{ errors.file }}
      </div>
    </div>

    <div class="mb-3">
      <label class="form-label">릴리즈 노트</label>
      <textarea
        class="form-control"
        rows="5"
        v-model="form.releaseNotes"
        placeholder="변경 사항을 적어주세요"
      ></textarea>
    </div>

    <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
      <span
        v-if="isSubmitting"
        class="spinner-border spinner-border-sm me-2"
      ></span>
      {{ isSubmitting ? "업로드 중..." : "업로드" }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";

interface FormData {
  file: File | null;
  releaseNotes: string;
}

interface FormErrors {
  file?: string;
  general?: string;
}

const form = reactive<FormData>({
  file: null,
  releaseNotes: "",
});

const errors = reactive<FormErrors>({});
const isSubmitting = ref(false);

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;

  // 파일 검증
  if (file) {
    const ext = file.name.toLowerCase().split(".").pop();
    if (!["apk", "aab"].includes(ext || "")) {
      errors.file = "APK 또는 AAB 파일만 업로드 가능합니다.";
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      // 200MB
      errors.file = "파일 크기는 200MB를 초과할 수 없습니다.";
      return;
    }
    errors.file = undefined;
  }

  form.file = file;
};

const handleSubmit = async () => {
  // 폼 검증
  if (!form.file) {
    errors.file = "파일을 선택해주세요.";
    return;
  }

  isSubmitting.value = true;
  errors.general = undefined;

  try {
    const formData = new FormData();
    formData.append("file", form.file);
    if (form.releaseNotes) {
      formData.append("releaseNotes", form.releaseNotes);
    }

    await releasesApi.uploadRelease(formData);
    // 성공 처리
  } catch (error) {
    errors.general = "업로드에 실패했습니다. 다시 시도해주세요.";
  } finally {
    isSubmitting.value = false;
  }
};
</script>
```

## 🔄 상태 관리 패턴

### 로컬 상태 관리

```typescript
// ✅ 권장: 컴포지션 함수로 상태 로직 분리
// composables/useReleases.ts
import { ref, computed } from "vue";
import type { Release } from "@/types";
import { releasesApi } from "@/api";

export function useReleases() {
  const releases = ref<Release[]>([]);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);
  const isLoading = ref(false);
  const searchQuery = ref("");

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

  const fetchReleases = async (page = 1) => {
    isLoading.value = true;
    try {
      const response = await releasesApi.getReleases({
        page,
        size: pageSize.value,
        q: searchQuery.value,
      });
      releases.value = response.items;
      total.value = response.total;
      currentPage.value = response.page;
    } finally {
      isLoading.value = false;
    }
  };

  const searchReleases = async (query: string) => {
    searchQuery.value = query;
    await fetchReleases(1);
  };

  return {
    releases,
    total,
    currentPage,
    pageSize,
    isLoading,
    searchQuery,
    totalPages,
    fetchReleases,
    searchReleases,
  };
}
```

### 전역 상태 관리 (필요시)

```typescript
// ✅ 권장: Pinia를 사용한 전역 상태 관리
// stores/releases.ts
import { defineStore } from "pinia";
import type { Release } from "@/types";

export const useReleasesStore = defineStore("releases", {
  state: () => ({
    releases: [] as Release[],
    currentRelease: null as Release | null,
    isLoading: false,
  }),

  getters: {
    totalReleases: (state) => state.releases.length,
    releasesByApp: (state) => (appId: string) =>
      state.releases.filter((r) => r.appId === appId),
  },

  actions: {
    async fetchReleases() {
      this.isLoading = true;
      try {
        const response = await releasesApi.getReleases();
        this.releases = response.items;
      } finally {
        this.isLoading = false;
      }
    },

    setCurrentRelease(release: Release) {
      this.currentRelease = release;
    },
  },
});
```

## 🧪 테스트 패턴

### 컴포넌트 테스트

```typescript
// ✅ 권장: Vue Test Utils를 사용한 컴포넌트 테스트
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import ReleaseCard from "@/components/ReleaseCard.vue";
import type { Release } from "@/types";

describe("ReleaseCard", () => {
  const mockRelease: Release = {
    _id: "1",
    appId: "com.example.app",
    appName: "Test App",
    versionName: "1.0.0",
    versionCode: 1,
    artifactType: "apk",
    fileName: "test.apk",
    fileSize: 1024 * 1024,
    sha256: "abc123",
    releaseNotes: "Test release",
    uploadedByIp: "127.0.0.1",
    downloads: 0,
    createdAt: "2024-01-01T00:00:00Z",
  };

  it("renders release information correctly", () => {
    const wrapper = mount(ReleaseCard, {
      props: { release: mockRelease },
    });

    expect(wrapper.text()).toContain("Test App");
    expect(wrapper.text()).toContain("1.0.0");
    expect(wrapper.text()).toContain("1.0 MB");
  });

  it("emits download event when download button is clicked", async () => {
    const wrapper = mount(ReleaseCard, {
      props: { release: mockRelease },
    });

    await wrapper.find("button").trigger("click");

    expect(wrapper.emitted("download")).toBeTruthy();
    expect(wrapper.emitted("download")?.[0]).toEqual(["1"]);
  });
});
```

## 📱 반응형 디자인

### 모바일 최적화

```vue
<!-- ✅ 권장: 모바일 우선 반응형 디자인 -->
<template>
  <div class="container-fluid container-md py-3 py-md-4">
    <!-- 모바일에서는 전체 너비, 데스크톱에서는 중앙 정렬 -->
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <!-- 모바일에서 더 큰 터치 영역 -->
        <div class="d-grid gap-3 d-md-block">
          <button class="btn btn-primary btn-lg py-3 py-md-2">업로드</button>
          <button class="btn btn-outline-secondary btn-lg py-3 py-md-2">
            새로고침
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 모바일에서 터치 친화적인 스타일 */
@media (max-width: 768px) {
  .btn {
    min-height: 48px; /* 터치 최소 크기 */
    font-size: 16px; /* iOS에서 줌 방지 */
  }

  .card {
    margin-bottom: 1rem;
  }
}
</style>
```

## 🔧 개발 도구 설정

### Vite 설정 최적화

```typescript
// ✅ 권장: Vite 설정 최적화
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@api": path.resolve(__dirname, "./src/api"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router"],
          bootstrap: ["bootstrap"],
        },
      },
    },
  },
});
```

---

**적용 범위**: 프론트엔드 Vue.js 코드  
**업데이트**: 2024년  
**버전**: 1.0.0
