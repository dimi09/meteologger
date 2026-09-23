import Vue from "vue";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";

import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./assets/scss/main.scss";
import "./assets/scss/dark.scss";
import { theme, setThemeMode } from "./theme";

Vue.use(ElementUI);
Vue.config.productionTip = false;

// Πρόσβαση στο θέμα από κάθε component: this.$theme.dark, this.$setTheme("dark")
Vue.prototype.$theme = theme;
Vue.prototype.$setTheme = setThemeMode;

new Vue({
  router,
  store,
  render: (h) => h(App)
}).$mount("#app");
