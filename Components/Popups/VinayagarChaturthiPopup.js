import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Replace with your actual banner image
const bannerImage = require("../../assets/img/vinayagarpopup-img.png");

interface VinayagarChaturthiPopupProps {
  visible: boolean;
  onContinue: () => void;
  onClose: () => void;
}

const VinayagarChaturthiPopup: React.FC<VinayagarChaturthiPopupProps> = ({
  visible,
  onContinue,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Close Button */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Banner — tap to go to event page */}
              <TouchableOpacity onPress={onContinue} activeOpacity={0.93}>
                <Image
                  source={bannerImage}
                  style={styles.banner}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              {/* CTA Button */}
              <TouchableOpacity style={styles.ctaBtn} onPress={onContinue} activeOpacity={0.85}>
                <Text style={styles.ctaText}>VIEW EVENT →</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: width - 32,
    maxWidth: 480,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#3b0d10",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    width: "100%",
    height: (width - 32) * 0.75,
  },
  ctaBtn: {
    backgroundColor: "#7a1418",
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(217,181,105,0.3)",
  },
  ctaText: {
    color: "#d9b569",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 2,
  },
});

export default VinayagarChaturthiPopup;