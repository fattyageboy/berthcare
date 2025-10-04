module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@navigation': './src/navigation',
          '@utils': './src/utils',
          '@types': './src/types',
          '@hooks': './src/hooks',
          '@assets': './src/assets',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
