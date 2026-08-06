<template>
  <div>
    <div class="page-title">Αντίγραφα ασφαλείας βάσης</div>
    <el-alert type="info" :closable="false" style="margin-bottom:14px"
      title="Δημιουργούνται αυτόματα καθημερινά και διατηρούνται τα τελευταία 7 αντίγραφα." />
    <el-table :data="backups"  empty-text="No data" v-loading="loading" style="width:100%; background:#fff; border-radius:12px">
      <el-table-column prop="name" label="Αρχείο" min-width="300" show-overflow-tooltip />
      <el-table-column label="Μέγεθος" width="140">
        <template slot-scope="s">{{ size(s.row.size_bytes) }}</template>
      </el-table-column>
      <el-table-column label="Ημερομηνία" width="200">
        <template slot-scope="s">{{ dt(s.row.modified) }}</template>
      </el-table-column>
      <el-table-column label="Ενέργειες" width="150">
        <template slot-scope="s">
          <el-button size="mini" type="primary" icon="el-icon-download"
                     :loading="s.row._dl" @click="download(s.row)">Λήψη</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && !backups.length" class="hint">Δεν υπάρχουν ακόμη αντίγραφα.</div>
  </div>
</template>

<script>
import http from "@/api/axios";
import { saveBlob } from "@/api/download";

export default {
  name: "Backups",
  data() { return { backups: [], loading: false }; },
  async created() { await this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try { this.backups = (await http.get("/backups")).data.backups; }
      catch (e) { this.$message.error("Αποτυχία φόρτωσης."); }
      finally { this.loading = false; }
    },
    async download(row) {
      this.$set(row, "_dl", true);
      try {
        const res = await http.get(`/backups/${encodeURIComponent(row.name)}/download`, { responseType: "blob" });
        saveBlob(res.data, row.name);
      } catch (e) { this.$message.error("Αποτυχία λήψης."); }
      finally { this.$set(row, "_dl", false); }
    },
    size(b) {
      if (b == null) return "—";
      const u = ["B", "KB", "MB", "GB"]; let i = 0; let n = b;
      while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
      return `${n.toFixed(1)} ${u[i]}`;
    },
    dt(s) { return s ? new Date(s).toLocaleString("el-GR") : "—"; }
  }
};
</script>
