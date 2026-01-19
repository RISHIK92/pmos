package com.rishik.pmos;

import android.content.Intent;
import android.net.Uri;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.net.URLEncoder;

public class WhatsAppModule extends ReactContextBaseJavaModule {
    ReactApplicationContext reactContext;

    WhatsAppModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "WhatsAppModule";
    }

    @ReactMethod
    public void sendWhatsApp(String phoneNumber, String message) {
        try {
            // Set the flag in the service so it knows to click "Send"
            AutomationService.isAutoSendPending = true;

            String url = "https://api.whatsapp.com/send?phone=" + phoneNumber + "&text=" + URLEncoder.encode(message, "UTF-8");
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse(url));
            intent.setPackage("com.whatsapp"); // Target WhatsApp explicitly
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (reactContext.getCurrentActivity() != null) {
                reactContext.getCurrentActivity().startActivity(intent);
            } else {
                reactContext.startActivity(intent);
            }

        } catch (Exception e) {
            e.printStackTrace();
            AutomationService.isAutoSendPending = false; // Reset on failure
        }
    }
}
