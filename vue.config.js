// vue.config.js
const path = require("path");
const webpack = require("webpack");

module.exports = {
  chainWebpack: (config) => {
    config.plugin("define").tap((args) => {
      args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = JSON.stringify(false);
      return args;
    });
  },

  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        __static: JSON.stringify(path.join(__dirname, "public")),
      }),
    ],
  },

  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.Agustin.iachallengegame",
        productName: "IA Challenge Game",
        copyright: "Copyright © 2025 Agustin Massoni",
        win: {
          target: "nsis",
          icon: "public/images/icono.ico",
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
