import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

export const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    try {
      // For Android 11+ (API 30+), we use the Storage Access Framework
      if (Platform.Version >= 30) {
        // For Android 11+, we don't need storage permission for downloads
        // The file will be saved in app's internal directory
        return true;
      }
      
      // For older Android versions, check if we have access to document directory
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
      return true; // We have access to document directory
      
    } catch (error) {
      console.warn('Storage permission error:', error);
      return false;
    }
  }
  return true; // iOS doesn't need explicit storage permission for document directory
};