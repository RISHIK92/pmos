// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  memorychip: "memory",
  "checkmark.circle": "check-circle",
  "heart.fill": "favorite",
  banknote: "cash",
  magnifyingglass: "magnify",
  "play.fill": "play-arrow",
  "camera.fill": "camera-alt",
  "bubble.left.fill": "chat-bubble",
  link: "link",
  "music.note": "music-note",
  "book.fill": "menu-book",
  "moon.fill": "nights-stay",
  "envelope.fill": "email",
  "bell.fill": "notifications",
  "location.fill": "location-on",
  "doc.text.fill": "description",
  "lock.fill": "lock",
  "gearshape.fill": "settings",
  "line.3.horizontal": "menu",
  plus: "add",
  sparkles: "auto-awesome",
  "figure.walk": "directions-walk",
  "flame.fill": "local-fire-department",
  "mic.fill": "mic",
  "briefcase.fill": "work",
  "alarm.fill": "alarm",
  checkmark: "check",
  laptopcomputer: "computer",
  "car.fill": "directions-car",
  "play.tv.fill": "play-circle-filled",
  "arrow.down.left": "call-received",
  "arrow.up.right": "call-made",
  "drop.fill": "water-drop",
  minus: "remove",
  "arrow.right": "arrow-forward",
  "play.circle.fill": "play-circle-filled",
  xmark: "close",
  curlybraces: "data-object",
  "xmark.circle.fill": "cancel",
  "bookmark.fill": "bookmark",
  "trash.fill": "delete",
  "minus.circle.fill": "remove-circle",
  "checkmark.circle.fill": "check-circle",
  "paintbrush.fill": "brush",
  "lock.open.fill": "lock-open",
  "hand.raised.fill": "pan-tool",
  timer: "timer",
  "leaf.fill": "eco",
  "clock.arrow.circlepath": "history",
  "bolt.fill": "flash-on",
  hourglass: "hourglass-empty",
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] as any}
      style={style}
    />
  );
}
