// // Learn more https://docs.expo.io/guides/customizing-metro
// const { getDefaultConfig } = require('expo/metro-config');

// /** @type {import('expo/metro-config').MetroConfig} */
// const config = getDefaultConfig(__dirname);

// module.exports = config;


const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = new Proxy(
  {
    'react-async-hook': path.resolve(__dirname, 'patches/react-async-hook.js'),
  },
  {
    get: (target, name) => {
      if (target[name]) return target[name];
      return path.join(__dirname, 'node_modules', name);
    },
  }
);

module.exports = config;