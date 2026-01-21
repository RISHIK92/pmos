package com.rishik.pmos;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class HealthModule extends ReactContextBaseJavaModule implements SensorEventListener {
    private static final String TAG = "HealthModule";
    private final ReactApplicationContext reactContext;
    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private int currentStepCount = 0;

    public HealthModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.sensorManager = (SensorManager) reactContext.getSystemService(Context.SENSOR_SERVICE);
    }

    @Override
    public String getName() {
        return "HealthModule";
    }

    @ReactMethod
    public void startStepTracking(Promise promise) {
        try {
            if (sensorManager == null) {
                promise.reject("SENSOR_ERROR", "SensorManager is null");
                return;
            }

            stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
            if (stepCounterSensor == null) {
                promise.reject("SENSOR_UNAVAILABLE", "Step Counter Sensor not available on this device");
                return;
            }

            // Register listener
            boolean registered = sensorManager.registerListener(this, stepCounterSensor, SensorManager.SENSOR_DELAY_UI);
            if (registered) {
                Log.d(TAG, "Step Counter Sensor Registered");
                promise.resolve(true);
            } else {
                promise.reject("SENSOR_ERROR", "Failed to register Step Counter Sensor");
            }
        } catch (Exception e) {
            promise.reject("ERROR", e);
        }
    }

    @ReactMethod
    public void stopStepTracking() {
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
            Log.d(TAG, "Step Counter Sensor Unregistered");
        }
    }

    @ReactMethod
    public void getStepCount(Promise promise) {
        // Return the last known value
        // Note: TYPE_STEP_COUNTER returns steps since last reboot
        promise.resolve(currentStepCount);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            currentStepCount = (int) event.values[0];
            Log.d(TAG, "New Step Count: " + currentStepCount);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // No-op
    }
}
