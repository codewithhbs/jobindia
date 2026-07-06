module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // reanimated/worklets plugin MUST be last
    plugins: ['react-native-worklets/plugin'],
  };
};
