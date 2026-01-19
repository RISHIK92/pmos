package com.rishik.pmos;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.List;

public class AutomationService extends AccessibilityService {
    // Static flag ensuring we only auto-click if *we* triggered the action.
    public static boolean isAutoSendPending = false;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isAutoSendPending) return;

        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
            event.getEventType() == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            
            if (event.getPackageName() != null && event.getPackageName().toString().equals("com.whatsapp")) {
                AccessibilityNodeInfo rootNode = getRootInActiveWindow();
                if (rootNode == null) return;

                // WhatsApp's Send button usually has ContentDescription "Send"
                List<AccessibilityNodeInfo> sendNodes = rootNode.findAccessibilityNodeInfosByText("Send");
                
                for (AccessibilityNodeInfo node : sendNodes) {
                    if (node != null && "Send".equals(node.getContentDescription())) {
                        if (node.isClickable()) {
                            node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                            isAutoSendPending = false; // Reset flag immediately
                            // Optional: Global action back? 
                            // performGlobalAction(GLOBAL_ACTION_BACK);
                        }
                    }
                }
            }
        }
    }

    @Override
    public void onInterrupt() {
        // Required method
    }
}
