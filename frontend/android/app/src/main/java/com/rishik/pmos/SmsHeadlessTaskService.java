package com.rishik.pmos;

import android.content.Intent;
import android.os.Bundle;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import javax.annotation.Nullable;

public class SmsHeadlessTaskService extends HeadlessJsTaskService {
    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Bundle extras = intent.getExtras();
        WritableMap data = Arguments.createMap();
        
        if (extras != null) {
            data.putString("action", "SMS_RECEIVED");

            try {
                Object[] pdus = (Object[]) extras.get("pdus");
                if (pdus != null) {
                    String format = extras.getString("format");
                    StringBuilder body = new StringBuilder();
                    String sender = "";
                    for (Object pdu : pdus) {
                        android.telephony.SmsMessage sms;
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                            sms = android.telephony.SmsMessage.createFromPdu((byte[]) pdu, format);
                        } else {
                            sms = android.telephony.SmsMessage.createFromPdu((byte[]) pdu);
                        }
                        body.append(sms.getMessageBody());
                        sender = sms.getOriginatingAddress();
                    }
                    data.putString("message", body.toString());
                    data.putString("sender", sender);
                }
            } catch (Exception e) {
                // Ignore parse errors, just pass action
            }
        }

        return new HeadlessJsTaskConfig(
            "SmsHeadlessTask", // 👈 This ID matches index.js
            data,
            5000, // Timeout (5 seconds)
            true // Allowed in foreground? Yes.
        );
    }
}
