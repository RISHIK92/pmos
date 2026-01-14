const {
  withAndroidManifest,
  withDangerousMod,
  withAndroidStyles,
  withMainActivity,
  AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const { getMainApplicationOrThrow } = AndroidConfig.Manifest;

// 1. XML Config (Unchanged)
const withAssistantXml = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml"
      );
      if (!fs.existsSync(resPath)) fs.mkdirSync(resPath, { recursive: true });

      fs.writeFileSync(
        path.join(resPath, "assistant_config.xml"),
        `<?xml version="1.0" encoding="utf-8"?><assistant xmlns:android="http://schemas.android.com/apk/res/android" />`
      );
      return config;
    },
  ]);
};

// 2. Java Service (Unchanged)
const withJavaService = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName = config.android.package;
      const packagePath = packageName.replace(/\./g, "/");
      const javaPath = path.join(
        config.modRequest.platformProjectRoot,
        `app/src/main/java/${packagePath}`
      );
      if (!fs.existsSync(javaPath)) fs.mkdirSync(javaPath, { recursive: true });

      const javaContent = `package ${packageName};
import android.service.voice.VoiceInteractionService;
public class PMOSAssistantService extends VoiceInteractionService {
    @Override public void onReady() { super.onReady(); }
}`;
      fs.writeFileSync(
        path.join(javaPath, "PMOSAssistantService.java"),
        javaContent
      );
      return config;
    },
  ]);
};

// 3. THEME FIX (The Magic Part)
const withTransparentTheme = (config) => {
  return withAndroidStyles(config, async (config) => {
    // We create ONE theme that handles everything.
    const assistantTheme = {
      $: {
        name: "Theme.App.Assistant",
        parent: "Theme.AppCompat.Light.NoActionBar",
      },
      item: [
        // A. MANDATORY TRANSPARENCY FLAGS
        { $: { name: "android:windowIsTranslucent" }, _: "true" },
        {
          $: { name: "android:windowBackground" },
          _: "@android:color/transparent",
        },
        { $: { name: "android:windowContentOverlay" }, _: "@null" },
        { $: { name: "android:backgroundDimEnabled" }, _: "true" },
        { $: { name: "android:backgroundDimAmount" }, _: "0.5" },

        // B. SYSTEM UI TRANSPARENCY
        {
          $: { name: "android:statusBarColor" },
          _: "@android:color/transparent",
        },
        {
          $: { name: "android:navigationBarColor" },
          _: "@android:color/transparent",
        },

        // C. SPLASH SCREEN COMPATIBILITY (Prevents InflateException)
        // We set these to transparent so the splash logic runs but draws nothing visible
        {
          $: { name: "windowSplashScreenBackground" },
          _: "@android:color/transparent",
        },
        {
          $: { name: "windowSplashScreenAnimatedIcon" },
          _: "@android:color/transparent",
        },

        // D. CRITICAL: PREVENT THEME SWITCHING
        // Expo usually switches to a solid theme after loading.
        // We force it to stay on THIS transparent theme.
        {
          $: { name: "postSplashScreenTheme" },
          _: "@style/Theme.App.Assistant",
        },
      ],
    };

    const styles = config.modResults;
    styles.resources.style = styles.resources.style || [];

    // Remove old versions if they exist to prevent duplicates
    styles.resources.style = styles.resources.style.filter(
      (s) => s["$"].name !== "Theme.App.Assistant"
    );

    styles.resources.style.push(assistantTheme);
    return config;
  });
};

// 4. Update Manifest (Force the new theme)
const withAssistantManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = getMainApplicationOrThrow(config.modResults);

    // Register Service
    mainApplication.service = mainApplication.service || [];
    mainApplication.service = mainApplication.service.filter(
      (s) => s["$"]["android:name"] !== ".PMOSAssistantService"
    );
    mainApplication.service.push({
      $: {
        "android:name": ".PMOSAssistantService",
        "android:label": "PMOS Voice",
        "android:permission": "android.permission.BIND_VOICE_INTERACTION",
        "android:exported": "true",
      },
      "meta-data": [
        {
          $: {
            "android:name": "android.voice_interaction",
            "android:resource": "@xml/assistant_config",
          },
        },
      ],
      "intent-filter": [
        {
          action: [
            {
              $: {
                "android:name": "android.service.voice.VoiceInteractionService",
              },
            },
          ],
        },
      ],
    });

    // Configure Main Activity
    const mainActivity = mainApplication.activity.find(
      (a) => a["$"]["android:name"] === ".MainActivity"
    );

    if (mainActivity) {
      // 🟢 FORCE THE MANIFEST TO USE OUR TRANSPARENT THEME
      // This is the single most important line.
      mainActivity["$"]["android:theme"] = "@style/Theme.App.Assistant";

      // Add Assist Intent
      mainActivity["intent-filter"] = mainActivity["intent-filter"] || [];
      const hasAssist = mainActivity["intent-filter"].some(
        (f) =>
          f.action &&
          f.action.some(
            (a) => a["$"]["android:name"] === "android.intent.action.ASSIST"
          )
      );

      if (!hasAssist) {
        mainActivity["intent-filter"].push({
          action: [{ $: { "android:name": "android.intent.action.ASSIST" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
          ],
        });
      }
    }
    return config;
  });
};

module.exports = function withAndroidAssistant(config) {
  config = withAssistantXml(config);
  config = withJavaService(config);
  config = withTransparentTheme(config);
  config = withAssistantManifest(config);
  return config;
};
