<template>
  <div>
    <div class="app-header">
      <img class="header-logo" :src="logo" alt="logo" />
      <!-- <div class="brand">Meteo<span>Logger</span></div> -->
      <div class="spacer"></div>
      <span class="user"><i class="el-icon-user-solid"></i> {{ username }}</span>
      <!-- <el-button type="text" class="logout" style="color:#fff" @click="logout">Αποσύνδεσ</el-button> -->
      <el-button type="primary" round @click="logout">Αποσύνδεση</el-button>
      <img class="uniwa" :src="uniwa" alt="ΠΑΔΑ" />
    </div>
    <div class="app-body">
      <div class="app-side">
        <el-menu :default-active="active" router>
          <el-menu-item index="/dashboard"><i class="el-icon-data-line"></i> Επισκόπηση</el-menu-item>
          <el-menu-item index="/import-excel"><i class="el-icon-document"></i> Εισαγωγή Excel</el-menu-item>
          <el-menu-item index="/import-csv"><i class="el-icon-tickets"></i> Εισαγωγή CSV</el-menu-item>
          <el-menu-item index="/files"><i class="el-icon-folder-opened"></i> Αρχεία</el-menu-item>
          <el-menu-item index="/backups"><i class="el-icon-download"></i> Backups</el-menu-item>
          <el-menu-item index="/grafana"><i class="el-icon-monitor"></i> Γραφήματα</el-menu-item>
        </el-menu>
      </div>
      <div class="app-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import logo from "@/assets/meteologger-logo.png";
import uniwa from "@/assets/uniwa-logo.png";

export default {
  name: "AppLayout",
  data() { return { logo, uniwa }; },
  computed: {
    username() { return this.$store.state.username; },
    active() { return this.$route.path; }
  },
  methods: {
    logout() {
      this.$store.dispatch("logout");
      this.$router.push("/login");
    }
  }
};
</script>
