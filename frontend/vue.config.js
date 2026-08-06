const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.VUE_APP_API_TARGET || "http://localhost:8000",
        changeOrigin: true
      }
    }
  }
});
