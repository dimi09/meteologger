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
    // Plug-and-play: ίδιο host με αυτό που άνοιξε ο χρήστης (π.χ. <hostname>.local
    // ή IP), στη θύρα 3000. Το VUE_APP_GRAFANA_URL (αν οριστεί) έχει προτεραιότητα.
    grafanaUrl() {
      if (process.env.VUE_APP_GRAFANA_URL) return process.env.VUE_APP_GRAFANA_URL;
      const { protocol, hostname } = window.location;
      return `${protocol}//${hostname}:3000/`;
    }
  },
  methods: { open() { window.open(this.grafanaUrl, "_blank"); } }
};
</script>
