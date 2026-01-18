package com.rishik.pmos;

import android.app.Activity;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class PMOSBlockerModule extends ReactContextBaseJavaModule {
    PMOSBlockerModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "PMOSBlocker";
    }

    @ReactMethod
    public void lockApp() {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            try {
                currentActivity.startLockTask();
            } catch (Exception e) {
                // ignore
            }
        }
    }

    @ReactMethod
    public void unlockApp() {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            try {
                currentActivity.stopLockTask();
            } catch (Exception e) {
                // ignore
            }
        }
    }
}
