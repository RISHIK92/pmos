package com.rishik.pmos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import com.facebook.react.HeadlessJsTaskService;

public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Listen for the System "SMS Received" signal
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            
            // 2. Wake up the Headless Service to handle it
            Intent serviceIntent = new Intent(context, SmsHeadlessTaskService.class);
            serviceIntent.putExtras(intent.getExtras());
            context.startService(serviceIntent);
            
            // 3. Keep CPU awake for a few seconds to process it
            HeadlessJsTaskService.acquireWakeLockNow(context);
        }
    }
}
