const {
  createRunOncePlugin,
  withAndroidManifest,
  withAppBuildGradle,
} = require('@expo/config-plugins');

const STORE_DIMENSION_STRATEGY = 'missingDimensionStrategy "store", "play"';
const DEFAULT_CONFIG_BLOCK = /(defaultConfig\s*\{)/;
const FIREBASE_NOTIFICATION_COLOR =
  'com.google.firebase.messaging.default_notification_color';

function withReactNativeIapStore(config) {
  config = withAppBuildGradle(config, (config) => {
    const { modResults } = config;

    if (modResults.language !== 'groovy') {
      throw new Error('withReactNativeIapStore only supports Groovy build.gradle files.');
    }

    if (modResults.contents.includes(STORE_DIMENSION_STRATEGY)) {
      return config;
    }

    if (!DEFAULT_CONFIG_BLOCK.test(modResults.contents)) {
      throw new Error('Could not find defaultConfig in android/app/build.gradle.');
    }

    modResults.contents = modResults.contents.replace(
      DEFAULT_CONFIG_BLOCK,
      `$1\n        ${STORE_DIMENSION_STRATEGY}`
    );

    return config;
  });

  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];

    manifest.$ = {
      ...manifest.$,
      'xmlns:tools': manifest.$?.['xmlns:tools'] ?? 'http://schemas.android.com/tools',
    };

    for (const metaData of application?.['meta-data'] ?? []) {
      if (metaData.$?.['android:name'] === FIREBASE_NOTIFICATION_COLOR) {
        metaData.$['tools:replace'] = 'android:resource';
      }
    }

    return config;
  });
}

module.exports = createRunOncePlugin(
  withReactNativeIapStore,
  'with-react-native-iap-store',
  '1.0.0'
);
