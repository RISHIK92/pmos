module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // 1. Explicitly define the root for expo-router
      [
        "expo-router/babel",
        {
          root: "./app", // <-- This fixes the "process.env" error
        },
      ],
      // 2. Keep Reanimated if you use it (it must be listed last!)
      "react-native-reanimated/plugin",
    ],
  };
};
