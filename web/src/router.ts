import { createRouter, createWebHistory } from "vue-router";
import Home from "./pages/Home.vue";
import Upload from "./pages/Upload.vue";
import Detail from "./pages/Detail.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/upload", component: Upload },
    { path: "/r/:id", component: Detail },
  ],
});
