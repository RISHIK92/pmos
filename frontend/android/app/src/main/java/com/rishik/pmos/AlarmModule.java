package com.rishik.pmos;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.Ringtone;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

// Import AlarmClock for intents
import android.provider.AlarmClock;

public class AlarmModule extends ReactContextBaseJavaModule {
    private static final String TAG = "AlarmModule";
    private final ReactApplicationContext reactContext;
    
    // Shared variable to hold the playing ringtone
    public static Ringtone currentRingtone;

    public AlarmModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "AlarmModule";
    }

    @ReactMethod
    public void scheduleCriticalAlarm(String title, double timestampMs) {
        try {
            long timeInMillis = (long) timestampMs;
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!alarmManager.canScheduleExactAlarms()) {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    return;
                }
            }

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("title", title);
            
            // Unique ID based on timestamp to allow multiple alarms, or constant ID to replace
            // For now using constant ID 1001 for the critical alarm
            int requestCode = 1001; 
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, 
                requestCode, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent);
            }
            
            Log.d(TAG, "⏰ Scheduled critical alarm for: " + timeInMillis + " (RequestCode: " + requestCode + ")");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error scheduling alarm", e);
        }
    }
    
    @ReactMethod
    public void getLaunchDetails(com.facebook.react.bridge.Promise promise) {
        try {
            if (getCurrentActivity() != null) {
                Intent intent = getCurrentActivity().getIntent();
                if (intent != null && intent.getBooleanExtra("isCriticalAlarm", false)) {
                    String title = intent.getStringExtra("title");
                    Log.d(TAG, "🚀 App launched via Critical Alarm! Title: " + title);
                    com.facebook.react.bridge.WritableMap map = com.facebook.react.bridge.Arguments.createMap();
                    map.putBoolean("isCriticalAlarm", true);
                    map.putString("title", title);
                    promise.resolve(map);
                    return;
                }
            }
            promise.resolve(null);
        } catch (Exception e) {
            promise.reject("ERR_INTENT", e);
        }
    }

    @ReactMethod
    public void stopAlarm() {
        if (currentRingtone != null) {
            try {
                if (currentRingtone.isPlaying()) {
                    currentRingtone.stop();
                    Log.d(TAG, "🔕 Alarm stopped from JS");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error stopping alarm", e);
            } finally {
                currentRingtone = null;
            }
        } else {
            Log.d(TAG, "No active alarm to stop");
        }

        // Also clear the intent so it doesn't re-trigger on app reload/foreground
        try {
            if (getCurrentActivity() != null) {
                Intent intent = getCurrentActivity().getIntent();
                if (intent != null) {
                    intent.removeExtra("isCriticalAlarm");
                    intent.removeExtra("title");
                    Log.d(TAG, "🧹 Cleared critical alarm intent data");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error clearing intent extras", e);
        }
    }

    @ReactMethod
    public void setAlarm(int hour, int minute) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
            intent.putExtra(AlarmClock.EXTRA_HOUR, hour);
            intent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
            intent.putExtra(AlarmClock.EXTRA_MESSAGE, "Set by PMOS");
            intent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (intent.resolveActivity(getReactApplicationContext().getPackageManager()) != null) {
                getReactApplicationContext().startActivity(intent);
                Log.d(TAG, "⏰ Native setAlarm intent fired for " + hour + ":" + minute);
            } else {
                Log.e(TAG, "❌ No Activity found to handle SET_ALARM Intent");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error setting native alarm", e);
        }
    }

    @ReactMethod
    public void setTimer(int seconds) {
        try {
            Intent intent = new Intent(AlarmClock.ACTION_SET_TIMER);
            intent.putExtra(AlarmClock.EXTRA_LENGTH, seconds);
            intent.putExtra(AlarmClock.EXTRA_MESSAGE, "Set by PMOS");
            intent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (intent.resolveActivity(getReactApplicationContext().getPackageManager()) != null) {
                getReactApplicationContext().startActivity(intent);
                Log.d(TAG, "⏳ Native setTimer intent fired for " + seconds + " seconds");
            } else {
                Log.e(TAG, "❌ No Activity found to handle SET_TIMER Intent");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error setting native timer", e);
        }
    }
}
