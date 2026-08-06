import axios from "axios";
import store from "@/store";
import router from "@/router";

const http = axios.create({ baseURL: "/api" });

http.interceptors.request.use((config) => {
  const token = store.state.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      store.dispatch("logout");
      if (router.currentRoute.path !== "/login") router.push("/login");
    }
    return Promise.reject(err);
  }
);

export default http;
