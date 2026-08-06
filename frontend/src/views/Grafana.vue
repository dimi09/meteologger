<template>
  <div>
    <div class="page-title">Γραφήματα & Monitoring</div>
    <el-alert type="info" :closable="false" style="margin-bottom:14px"
      title="Τα dashboards φιλοξενούνται στο Grafana. Αν δεν φορτώνει ενσωματωμένο, χρησιμοποίησε το κουμπί." >
    </el-alert>
    <el-button type="primary" icon="el-icon-top-right" @click="open" style="margin-bottom:14px">
      Άνοιγμα Grafana σε νέα καρτέλα
    </el-button>
    <iframe class="grafana-frame" :src="grafanaUrl"></iframe>
  </div>
</template>

<script>
export default {
  name: "Grafana",
  computed: {
    // Ρυθμίζεται κατά το build· default το ονοματισμένο host.
    grafanaUrl() { return process.env.VUE_APP_GRAFANA_URL || "http://grafana.meteologger.local/"; }
  },
  methods: { open() { window.open(this.grafanaUrl, "_blank"); } }
};
</script>
