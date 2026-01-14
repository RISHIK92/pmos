const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

// 1. Create the 'assistant_config.xml' file
const withAssistantXml = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );

      // Ensure directory exists
      if (!fs.existsSync(resPath)) {
        fs.mkdirSync(resPath, { recursive: true });
      }

      // Write the file content
      const filePath = path.join(resPath, "assistant_config.xml");
      const fileContent = `<?xml version="1.0" encoding="utf-8"?>
<assistant xmlns:android="http://schemas.android.com/apk/res/android" />`;

      fs.writeFileSync(filePath, fileContent);
      return config;
    },
  ]);
};

// 2. Modify AndroidManifest.xml
const withAssistantManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);

    // Find the MainActivity
    const mainActivity = mainApplication.activity.find(
      (activity) => activity["$"]["android:name"] === ".MainActivity"
    );

    if (mainActivity) {
      // Add Intent Filter for ASSIST
      mainActivity["intent-filter"] = mainActivity["intent-filter"] || [];
      mainActivity["intent-filter"].push({
        action: [{ $: { "android:name": "android.intent.action.ASSIST" } }],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
        ],
      });

      // Add Metadata for assistant config
      mainActivity["meta-data"] = mainActivity["meta-data"] || [];
      mainActivity["meta-data"].push({
        $: {
          "android:name": "com.android.systemui.action_assist_icon",
          "android:resource": "@mipmap/ic_launcher",
        },
      });

      // Link the XML file we created above
      // Note: This goes on the <application> tag usually, or specific activity depending on OS version,
      // but for Default Assist, it often needs the meta-data pointing to the xml config.
      // Actually, standard Assistant implementation requires a specific meta-data tag
      // pointing to the XML config created in step 1.
      mainActivity["meta-data"].push({
        $: {
          "android:name": "android.app.assist",
          "android:resource": "@xml/assistant_config",
        },
      });
    }

    return config;
  });
};

// 3. Combine them
module.exports = function withAndroidAssistant(config) {
  config = withAssistantXml(config);
  config = withAssistantManifest(config);
  return config;
};
