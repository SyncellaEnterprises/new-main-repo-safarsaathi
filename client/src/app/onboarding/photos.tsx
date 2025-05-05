import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import IMAGES from "@/src/constants/images";

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48 - 12) / 2; // Width minus horizontal padding minus gap
const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PhotosScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updatePhotos, isLoading } = useOnboarding();
  const [photos, setPhotos] = useState<{ id: string; uri: string; type: string }[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  const validateImageFormat = (uri: string): boolean => {
    const lowercasedUri = uri.toLowerCase();
    return lowercasedUri.endsWith('.jpg') || 
           lowercasedUri.endsWith('.jpeg') || 
           lowercasedUri.endsWith('.png');
  };

  const pickImage = async () => {
    try {
      setIsPickerLoading(true);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        toast.show("Please allow access to your photos", "error");
        setIsPickerLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0].uri) {
        if (photos.length >= MAX_PHOTOS) {
          toast.show(`Maximum ${MAX_PHOTOS} photos allowed`, "error");
          setIsPickerLoading(false);
          return;
        }

        const uri = result.assets[0].uri;
        
        // Validate image format
        if (!validateImageFormat(uri)) {
          toast.show("Only JPG, JPEG, and PNG formats are supported", "error");
          setIsPickerLoading(false);
          return;
        }

        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          toast.show("Could not access the selected photo", "error");
          setIsPickerLoading(false);
          return;
        }

        // Check if file size is too large
        if (fileInfo.size > MAX_FILE_SIZE) {
          toast.show("Photo size is too large (max 5MB)", "error");
          setIsPickerLoading(false);
          return;
        }

        // Determine image type
        const filename = uri.split('/').pop() || '';
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const type = ext === 'png' ? 'image/png' : 'image/jpeg';

        setPhotos(prev => [...prev, {
          id: Date.now().toString(),
          uri: uri,
          type: type
        }]);
      }
    } catch (error) {
      console.error('Photo selection error:', error);
      toast.show("Error selecting photo", "error");
    } finally {
      setIsPickerLoading(false);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleNext = async () => {
    if (photos.length < 1) {
      toast.show("Please add at least one photo", "error");
      return;
    }

    try {
      const success = await updatePhotos(photos.map(p => p.uri));
      if (success) {
        router.push('/onboarding/gender');
      } else {
        toast.show("Failed to save photos. Please try again.", "error");
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.show("Error uploading photos. Please try again.", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.activeDot]} />
        </View>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={IMAGES.safarsaathi}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Main Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Photos</Text>
          
          <Text style={styles.subtitle}>
            Add your best photos to make your profile stand out.
          </Text>
          
          {/* Photos Grid */}
          <View style={styles.photoGrid}>
            {[...photos, ...Array(Math.max(0, MAX_PHOTOS - photos.length)).fill(null)].map((photo, index) => (
              <View key={photo?.id || `empty-${index}`} style={styles.photoCell}>
                {photo ? (
                  // Photo Cell with Image
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photo}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePhoto(photo.id)}
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    {index === 0 && (
                      <View style={styles.primaryPhotoLabel}>
                        <Text style={styles.primaryPhotoText}>Primary</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  // Empty Cell
                  <TouchableOpacity
                    style={styles.addPhotoContainer}
                    onPress={pickImage}
                    disabled={isPickerLoading}
                  >
                    {isPickerLoading && index === photos.length ? (
                      <ActivityIndicator color="#00CEC9" size="small" />
                    ) : (
                      <Ionicons name="add" size={24} color="#00CEC9" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
          
          {/* Info Box */}
          <View style={styles.tipContainer}>
            <Ionicons name="information-circle" size={22} color="#00CEC9" />
            <Text style={styles.tipText}>
              Your first photo will be shown as your primary photo. Only JPG, JPEG, and PNG formats (max 5MB) are supported.
            </Text>
          </View>
          
          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.nextButton, 
              photos.length === 0 && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={photos.length === 0 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#00CEC9',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: '#00CEC9',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#6B7280',
    marginBottom: 24,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  photoCell: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginBottom: 12,
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPhotoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#00CEC9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  primaryPhotoText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'montserratBold',
  },
  addPhotoContainer: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  tipContainer: {
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#374151',
  },
  nextButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'montserratBold',
  },
  homeIndicator: {
    width: 36,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 2.5,
    opacity: 0.2,
    alignSelf: 'center',
    marginTop: 24,
  },
});
