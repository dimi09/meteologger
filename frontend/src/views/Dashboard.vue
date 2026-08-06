<template>
  <div>
    <div class="page-title">Επισκόπηση</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">Σύνολο εγγραφών</div>
        <div class="value">{{ fmt(summary.total_records) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Αρχεία στον server</div>
        <div class="value">{{ fmt(summary.files_count) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Πρώτη μέτρηση</div>
        <div class="value">{{ dt(summary.range_start) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">Τελευταία μέτρηση</div>
        <div class="value">{{ dt(summary.range_end) }}</div>
      </div>
    </div>
    <div class="stat-card" style="margin-top:16px" v-if="summary.last_file">
      <div class="label">Τελευταίο αρχείο</div>
      <div class="value" style="font-size:15px">{{ summary.last_file }}</div>
    </div>
  </div>
</template>

<script>
import http from "@/api/axios";

export default {
  name: "Dashboard",
  data() { return { summary: {} }; },
  async created() { await this.load(); },
  methods: {
    async load() {
      try { this.summary = (await http.get("/summary")).data; }
      catch (e) { this.$message.error("Αποτυχία φόρτωσης επισκόπησης."); }
    },
    fmt(n) { return n == null ? "—" : Number(n).toLocaleString("el-GR"); },
    dt(s) { return s ? new Date(s).toLocaleString("el-GR") : "—"; }
  }
};
</script>
