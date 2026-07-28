// PdfViewerModal.js (or wherever openCachedPdf is defined)

import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system/legacy";  
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";

export const openCachedPdf = async (localUri) => {
  try {
    if (Platform.OS === "android") {
      // Get a content:// URI that other apps can read
      const contentUri = await FileSystem.getContentUriAsync(localUri);

      // Try to open with Chrome first
      try {
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: "application/pdf",
          packageName: "com.android.chrome", // force Chrome
        });
      } catch (chromeError) {
        // Chrome not installed – fallback to default PDF viewer
        console.warn("Chrome not available, using default viewer", chromeError);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: "application/pdf",
        });
      }
    } else {
      // iOS – open with the system’s default handler
      await Linking.openURL(localUri);
    }
  } catch (error) {
    console.error("Error opening PDF:", error);
    Alert.alert("Error", "No PDF viewer app found, or the file couldn't be opened.");
  }
};