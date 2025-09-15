module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};
