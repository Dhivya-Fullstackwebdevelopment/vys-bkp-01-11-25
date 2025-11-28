import React, { useEffect, useState } from "react";
import { View, Image, ActivityIndicator } from "react-native";

export const TopAlignedImage = ({ uri, width = 100, height = 100, style }) => {
  const [scaledHeight, setScaledHeight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!uri) {
      setScaledHeight(height);
      setLoading(false);
      return;
    }

    // For remote images
    Image.getSize(
      uri,
      (origWidth, origHeight) => {
        if (!isMounted) return;
        const scale = width / origWidth;
        const newHeight = Math.round(origHeight * scale);
        setScaledHeight(newHeight);
        setLoading(false);
      },
      (error) => {
        // Fallback: keep wrapper height and stop loading
        if (!isMounted) return;
        console.warn("Image.getSize failed", error);
        setScaledHeight(height);
        setLoading(false);
      }
    );

    return () => { isMounted = false; };
  }, [uri, width, height]);

  // while measuring show a small loader or placeholder
  if (loading) {
    return (
      <View style={[{ width, height, justifyContent: "center", alignItems: "center" }, style]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ width, height, overflow: "hidden",borderRadius: style?.borderRadius || 10, }}>
      <Image
        source={{ uri }}
        style={{
          width,                    // fit wrapper width exactly
          height: scaledHeight,     // possibly taller than wrapper
          resizeMode: "cover",
          // no marginTop/transform — we want the top of the image visible => marginTop: 0
        }}
      />
    </View>
  );
};
