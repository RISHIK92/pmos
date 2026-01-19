package com.rishik.pmos;

import android.telephony.SmsManager;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.ArrayList;

public class SmsModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "SmsModule";

    public SmsModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void sendDirectSMS(String phoneNumber, String message, Promise promise) {
        try {
            SmsManager smsManager = SmsManager.getDefault();
            
            // Check if message is longer than 160 characters
            if (message.length() > 160) {
                // Divide long message into multiple parts
                ArrayList<String> messageParts = smsManager.divideMessage(message);
                smsManager.sendMultipartTextMessage(
                    phoneNumber,
                    null,
                    messageParts,
                    null,
                    null
                );
            } else {
                // Send single SMS
                smsManager.sendTextMessage(
                    phoneNumber,
                    null,
                    message,
                    null,
                    null
                );
            }
            
            promise.resolve("SMS sent successfully to " + phoneNumber);
        } catch (Exception e) {
            promise.reject("SMS_ERROR", "Failed to send SMS: " + e.getMessage(), e);
        }
    }
}
