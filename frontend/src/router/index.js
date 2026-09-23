import Vue from "vue";
import VueRouter from "vue-router";
import store from "@/store";

import Login from "@/views/Login.vue";
import AppLayout from "@/views/AppLayout.vue";
import Dashboard from "@/views/Dashboard.vue";
import ImportExcel from "@/views/ImportExcel.vue";
import ImportCsv from "@/views/ImportCsv.vue";
import Files from "@/views/Files.vue";
import Backups from "@/views/Backups.vue";
import Charts from "@/views/Charts.vue";
import Grafana from "@/views/Grafana.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/login", component: Login },
  {
    path: "/",
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "dashboard" },
      { path: "dashboard", component: Dashboard },
      { path: "import-excel", component: ImportExcel },
      { path: "import-csv", component: ImportCsv },
      { path: "files", component: Files },
      { path: "backups", component: Backups },
      { path: "charts", component: Charts },
      { path: "grafana", component: Grafana }
    ]
  }
];

const router = new VueRouter({ mode: "history", routes });

router.beforeEach((to, from, next) => {
  if (to.matched.some((r) => r.meta.requiresAuth) && !store.getters.isAuthenticated) {
    next("/login");
  } else if (to.path === "/login" && store.getters.isAuthenticated) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
