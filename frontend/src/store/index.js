import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    token: localStorage.getItem("ml_token") || "",
    username: localStorage.getItem("ml_user") || ""
  },
  mutations: {
    setAuth(state, { token, username }) {
      state.token = token;
      state.username = username;
    },
    clearAuth(state) {
      state.token = "";
      state.username = "";
    }
  },
  actions: {
    async login({ commit }, { username, password }) {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);
      const { data } = await axios.post("/api/auth/login", form);
      localStorage.setItem("ml_token", data.access_token);
      localStorage.setItem("ml_user", data.username);
      commit("setAuth", { token: data.access_token, username: data.username });
    },
    logout({ commit }) {
      localStorage.removeItem("ml_token");
      localStorage.removeItem("ml_user");
      commit("clearAuth");
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.token
  }
});

export default store;
