// vue.config.js
module.exports = {
  // --- TU CÓDIGO EXISTENTE ---
  chainWebpack: (config) => {
    config.plugin("define").tap((args) => {
      args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = JSON.stringify(false);
      return args;
    });
  }, // <-- Asegúrate de que haya una coma aquí

  // --- LA NUEVA CONFIGURACIÓN QUE DEBES AGREGAR ---
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.Agustin.iachallengegame",
        productName: "IA Challenge Game",
        copyright: "Copyright © 2025 Agustin Massoni",
        win: {
          target: "nsis",
          icon: "public/images/icono.ico", // Asegúrate que este archivo exista
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          allowToChangeInstallationDirectory: true,
        },
        directories: {
          output: "dist_electron",
        },
      },
    },
  },
};
