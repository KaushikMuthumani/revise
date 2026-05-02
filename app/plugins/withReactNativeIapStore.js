const { createRunOncePlugin, withAppBuildGradle } = require('@expo/config-plugins');

const STORE_DIMENSION_STRATEGY = 'missingDimensionStrategy "store", "play"';

function withReactNativeIapStore(config) {
  return withAppBuildGradle(config, (config) => {
    const { modResults } = config;

    if (modResults.language !== 'groovy') {
      throw new Error('withReactNativeIapStore only supports Groovy build.gradle files.');
    }

    if (modResults.contents.includes(STORE_DIMENSION_STRATEGY)) {
      return config;
    }

    modResults.contents = modResults.contents.replace(
      /(defaultConfig\s*\{[\s\S]*?versionName\s+["'][^"']+["'])/,
      `$1\n        ${STORE_DIMENSION_STRATEGY}`
    );

    return config;
  });
}

module.exports = createRunOncePlugin(
  withReactNativeIapStore,
  'with-react-native-iap-store',
  '1.0.0'
);
