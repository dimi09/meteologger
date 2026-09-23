<template>
  <!-- Το Grafana γεμίζει όλο τον χώρο περιεχομένου (header & μενού μένουν ως έχουν) -->
  <div class="grafana-page">
    <iframe class="grafana-frame" :src="grafanaSrc" title="Grafana"></iframe>
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
    },
    // Το Grafana ακολουθεί το θέμα της εφαρμογής (?theme=dark|light)
    grafanaSrc() {
      const url = new URL(this.grafanaUrl, window.location.href);
      url.searchParams.set("theme", this.$theme.dark ? "dark" : "light");
      return url.toString();
    }
  }
};
</script>
