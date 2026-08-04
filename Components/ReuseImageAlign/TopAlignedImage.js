import React, { useEffect, useState } from "react";
import { View, Image, ActivityIndicator } from "react-native";

const DEFAULT_FALLBACK = null; // pass via prop or set a module-level default

export const TopAlignedImage = ({
  uri,
  width = 100,
  height = 150,       // ← this is now the FIXED height used always
  style,
  blurRadius = 0,
  fallbackUri = null, // pass DEFAULT_BRIDE / DEFAULT_GROOM from parent
}) => {
  const [imgUri, setImgUri] = useState(uri);
  const [hasError, setHasError] = useState(false);

  // Reset when uri prop changes
  useEffect(() => {
    setImgUri(uri);
    setHasError(false);
  }, [uri]);

  const effectiveUri = hasError || !imgUri ? fallbackUri : imgUri;

  return (
    <View
      style={{
        width,
        height,                          // fixed height — no dynamic scaling
        overflow: "hidden",
        borderRadius: style?.borderRadius ?? 14,
      }}
    >
      {effectiveUri ? (
        <Image
          source={{ uri: effectiveUri }}
          style={{ width, height }}
          resizeMode="cover"
          blurRadius={blurRadius}
          onError={() => {
            if (!hasError) setHasError(true); // show fallback, no warning
          }}
        />
      ) : (
        // No uri and no fallback — show neutral placeholder
        <View
          style={{
            width,
            height,
            backgroundColor: "#E8E0D5",
            justifyContent: "center",
            alignItems: "center",
          }}
        />
      )}
    </View>
  );
};