package com.rishik.pmos;

import android.content.Context;
import android.media.AudioManager;
import android.view.KeyEvent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class MediaControlModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    MediaControlModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "MediaControl";
    }

    @ReactMethod
    public void sendMediaEvent(String eventType) {
        AudioManager audioManager = (AudioManager) reactContext.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return;

        int keyEvent = 0;
        switch (eventType) {
            case "PAUSE":
                keyEvent = KeyEvent.KEYCODE_MEDIA_PAUSE;
                break;
            case "PLAY":
            case "PLAY_PAUSE":
                // Often safer to just toggle if we don't know state, or specifically use PLAY
                keyEvent = KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE; 
                break;
            case "NEXT":
                keyEvent = KeyEvent.KEYCODE_MEDIA_NEXT;
                break;
            case "PREVIOUS":
                keyEvent = KeyEvent.KEYCODE_MEDIA_PREVIOUS;
                break;
            default:
                return;
        }

        // Dispatch Down and Up events to simulate a press
        audioManager.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, keyEvent));
        audioManager.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, keyEvent));
    }
}
