<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <router-link class="navbar-brand" to="/">앱 배포 센터</router-link>
        <div class="navbar-nav ms-auto">
          <router-link class="nav-link" to="/">홈</router-link>
          <router-link class="nav-link" to="/upload">업로드</router-link>
        </div>
      </div>
    </nav>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// 메인 앱 컴포넌트
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
