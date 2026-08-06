<template>
  <div>
    <div class="page-title">Αποθηκευμένα αρχεία</div>
    <el-table :data="files" empty-text="No data" v-loading="loading" style="width:100%; background:#fff; border-radius:12px">
      <el-table-column prop="name" label="Όνομα αρχείου" min-width="320" show-overflow-tooltip />
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
  </div>
</template>

<script>
import http from "@/api/axios";
import { saveBlob } from "@/api/download";

export default {
  name: "Files",
  data() { return { files: [], loading: false }; },
  async created() { await this.load(); },
  methods: {
    async load() {
      this.loading = true;
      try { this.files = (await http.get("/files")).data.files; }
      catch (e) { this.$message.error("Αποτυχία φόρτωσης αρχείων."); }
      finally { this.loading = false; }
    },
    async download(row) {
      this.$set(row, "_dl", true);
      try {
        const res = await http.get(`/files/${encodeURIComponent(row.name)}/download`, { responseType: "blob" });
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
