<template>
  <div class="login-wrap">
    <div class="login-card">
      <img class="logo" :src="logo" alt="MeteoLogger" />
      <div class="subtitle">Διαχειριστικό Πλατφόρμας Μετρήσεων</div>
      <el-form :model="form" @submit.native.prevent="submit">
        <el-form-item>
          <el-input v-model="form.username" placeholder="Όνομα χρήστη" prefix-icon="el-icon-user" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="Κωδικός"
                    prefix-icon="el-icon-lock" show-password />
        </el-form-item>
        <el-button type="primary" style="width:100%" :loading="loading" @click="submit">
          Σύνδεση
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script>
import logoLight from "@/assets/meteologger-logo.png";
import logoDark from "@/assets/meteologger-logo-dark.png";

export default {
  name: "Login",
  data() {
    return { form: { username: "", password: "" }, loading: false };
  },
  computed: {
    logo() { return this.$theme.dark ? logoDark : logoLight; }
  },
  methods: {
    async submit() {
      if (!this.form.username || !this.form.password) {
        this.$message.warning("Συμπλήρωσε όνομα χρήστη και κωδικό.");
        return;
      }
      this.loading = true;
      try {
        await this.$store.dispatch("login", this.form);
        this.$router.push("/dashboard");
      } catch (e) {
        this.$message.error("Λάθος στοιχεία σύνδεσης.");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
