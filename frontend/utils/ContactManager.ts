import * as Contacts from "expo-contacts";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
//@ts-ignore
import RNImmediatePhoneCall from "react-native-immediate-phone-call";

interface ContactInfo {
  id: string;
  name: string;
  phoneNumbers?: Contacts.PhoneNumber[];
}

class ContactManager {
  private static instance: ContactManager;
  private contacts: ContactInfo[] = [];

  private constructor() {}

  public static getInstance(): ContactManager {
    if (!ContactManager.instance) {
      ContactManager.instance = new ContactManager();
    }
    return ContactManager.instance;
  }

  /**
   * Loads contacts into memory.
   * Call this on app startup.
   */
  public async preloadContacts() {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return;

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        });

        // Filter valid contacts with at least one phone number
        this.contacts = data.filter(
          (c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0
        );
        console.log(
          `[ContactManager] Preloaded ${this.contacts.length} contacts.`
        );
      } else {
        console.log("[ContactManager] Permission denied");
      }
    } catch (e) {
      console.error("[ContactManager] Failed to preload contacts", e);
    }
  }

  /**
   * Attempts to find and call a contact matching the query.
   * @param query The name of the person to call (e.g., "mom", "john doe")
   * @returns object with success status and message/name
   */
  public async findAndCall(
    query: string
  ): Promise<{ success: boolean; message: string; name?: string }> {
    if (this.contacts.length === 0) {
      await this.preloadContacts();
    }

    if (this.contacts.length === 0) {
      return { success: false, message: "No contacts available." };
    }

    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return { success: false, message: "Invalid name." };

    // 1. Exact match (case-insensitive)
    let match = this.contacts.find((c) => c.name.toLowerCase() === cleanQuery);

    // 2. Starts with match
    if (!match) {
      match = this.contacts.find((c) =>
        c.name.toLowerCase().startsWith(cleanQuery)
      );
    }

    // 3. Contains match
    if (!match && cleanQuery.length > 2) {
      match = this.contacts.find((c) =>
        c.name.toLowerCase().includes(cleanQuery)
      );
    }

    if (match && match.phoneNumbers && match.phoneNumbers.length > 0) {
      const number = match.phoneNumbers[0].number;
      // Sanitize number for tel: link
      const safeNumber = number?.replace(/[\s\-\(\)]/g, "") || "";

      console.log(`[ContactManager] Calling ${match.name} at ${safeNumber}`);

      if (safeNumber) {
        // Linking.openURL(`tel:${safeNumber}`);
        RNImmediatePhoneCall.immediatePhoneCall(safeNumber);
        return {
          success: true,
          message: `Calling ${match.name}...`,
          name: match.name,
        };
      }
    }

    console.log(`[ContactManager] Contact not found for: ${query}`);
    return { success: false, message: `Contact "${query}" not found.` };
  }
}

export default ContactManager.getInstance();
