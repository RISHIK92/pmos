package com.rishik.pmos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "⏰ Critical Alarm Received!");

        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "PMOS:CriticalAlarmWakeLock"
        );
        wakeLock.acquire(5000);

        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }

            Ringtone ringtone = RingtoneManager.getRingtone(context, alarmUri);

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                ringtone.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
            }

            // Assign to shared variable so JS can stop it
            AlarmModule.currentRingtone = ringtone;
            
            ringtone.play();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to play alarm sound", e);
        }

        if (!Settings.canDrawOverlays(context)) {
            Log.e(TAG, "❌ Cannot launch Alarm! Permission missing.");
            return;
        }

        try {
            Intent activityIntent = new Intent(context, MainActivity.class);
            activityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                                    Intent.FLAG_ACTIVITY_NO_USER_ACTION |
                                    Intent.FLAG_ACTIVITY_SINGLE_TOP);
            activityIntent.putExtra("isCriticalAlarm", true);
            activityIntent.putExtra("title", intent.getStringExtra("title"));
            context.startActivity(activityIntent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch activity", e);
        }
    }
}