<template>
  <div>
    <div class="app-header">
      <img class="header-logo" :src="logo" alt="logo" />
      <!-- <div class="brand">Meteo<span>Logger</span></div> -->
      <div class="spacer"></div>
      <!-- Λήψη desktop εφαρμογής (μόνο στον browser, αν έχει γίνει build) -->
      <a v-if="desktop" class="desktop-dl" :href="desktop.url" download
         :title="'Εγκατάσταση MeteoLogger για Windows (v' + desktop.version + ')'">
        <el-button size="small" round icon="el-icon-download">Desktop εφαρμογή</el-button>
      </a>
      <!-- Θέμα εμφάνισης -->
      <el-dropdown trigger="click" @command="$setTheme" placement="bottom-end">
        <el-button class="theme-btn" circle :icon="themeIcon" title="Θέμα εμφάνισης"></el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item v-for="t in themes" :key="t.mode" :command="t.mode" :icon="t.icon">
            {{ t.label }}<i v-if="$theme.mode === t.mode" class="el-icon-check theme-check"></i>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
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
          <el-menu-item index="/charts"><i class="el-icon-data-analysis"></i> Γραφήματα</el-menu-item>
          <el-menu-item index="/grafana"><i class="el-icon-monitor"></i> Grafana</el-menu-item>
        </el-menu>
      </div>
      <div class="app-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import logoLight from "@/assets/meteologger-logo.png";
import logoDark from "@/assets/meteologger-logo-dark.png";
import uniwa from "@/assets/uniwa-logo.png";

export default {
  name: "AppLayout",
  data() {
    return {
      uniwa,
      desktop: null,
      themes: [
        { mode: "light", label: "Φωτεινό", icon: "el-icon-sunny" },
        { mode: "dark", label: "Σκοτεινό", icon: "el-icon-moon" },
        { mode: "system", label: "Αυτόματο (σύστημα)", icon: "el-icon-monitor" }
      ]
    };
  },
  mounted() { this.checkDesktopApp(); },
  computed: {
    logo() { return this.$theme.dark ? logoDark : logoLight; },
    themeIcon() { return this.$theme.dark ? "el-icon-moon" : "el-icon-sunny"; },
    username() { return this.$store.state.username; },
    active() { return this.$route.path; }
  },
  methods: {
    // Διαβάζει το /desktop/latest.yml (build της Electron εφαρμογής).
    // Μέσα στην ίδια την desktop εφαρμογή το κουμπί δεν εμφανίζεται.
    async checkDesktopApp() {
      if (window.meteologgerDesktop) return;
      try {
        const res = await fetch("/desktop/latest.yml", { cache: "no-store" });
        if (!res.ok) return;
        const yml = await res.text();
        const version = (yml.match(/^version:\s*(.+)$/m) || [])[1];
        const file = (yml.match(/^path:\s*(.+)$/m) || [])[1];
        if (version && file) {
          this.desktop = {
            version: version.trim().replace(/^['"]|['"]$/g, ""),
            url: "/desktop/" + encodeURIComponent(file.trim().replace(/^['"]|['"]$/g, ""))
          };
        }
      } catch (e) { /* δεν υπάρχει build ακόμα */ }
    },
    logout() {
      this.$store.dispatch("logout");
      this.$router.push("/login");
    }
  }
};
</script>
