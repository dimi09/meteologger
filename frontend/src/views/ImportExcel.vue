<template>
  <div>
    <div class="page-title">Εισαγωγή Excel</div>
    <div class="upload-card">
      <el-upload
        drag
        :action="action"
        :headers="headers"
        accept=".xlsx"
        :limit="1"
        :on-success="onSuccess"
        :on-error="onError"
        :before-upload="onBefore">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">Σύρε το αρχείο <em>.xlsx</em> εδώ ή κάνε κλικ</div>
      </el-upload>
      <div class="hint">
        Ο πίνακας εντοπίζεται αυτόματα
      </div>
      <el-alert v-if="result" style="margin-top:16px" type="success" :closable="false"
        :title="`${result.message} Εγγραφές που προστέθηκαν: ${result.rows_inserted}`" />
    </div>
  </div>
</template>

<script>
export default {
  name: "ImportExcel",
  data() { return { result: null }; },
  computed: {
    action() { return "/api/import/excel"; },
    headers() { return { Authorization: `Bearer ${this.$store.state.token}` }; }
  },
  methods: {
    onBefore(file) {
      const ok = file.name.toLowerCase().endsWith(".xlsx");
      if (!ok) this.$message.error("Επίτρεπτα μόνο .xlsx αρχεία.");
      return ok;
    },
    onSuccess(res) { this.result = res; this.$message.success("Επιτυχής εισαγωγή."); },
    onError(err) {
      let msg = "Αποτυχία εισαγωγής.";
      try { msg = JSON.parse(err.message).detail || msg; } catch (e) { /* noop */ }
      this.$message.error(msg);
    }
  }
};
</script>
