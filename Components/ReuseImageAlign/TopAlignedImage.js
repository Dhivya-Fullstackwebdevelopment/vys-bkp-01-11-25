import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";

export const TopAlignedImage = ({
  uri,
  width = 100,
  height = 150,
  style,
  blurRadius = 0,
  fallbackUri = null,
}) => {
  const [imgUri, setImgUri] = useState(uri);
  const [hasError, setHasError] = useState(false);
  const [imageSize, setImageSize] = useState(null);

  useEffect(() => {
    setImgUri(uri);
    setHasError(false);
    setImageSize(null);

    if (uri) {
      Image.getSize(
        uri,
        (imgWidth, imgHeight) => {
          setImageSize({
            width: imgWidth,
            height: imgHeight,
          });
        },
        () => {
          setImageSize(null);
        }
      );
    }
  }, [uri]);

  const effectiveUri = hasError || !imgUri ? fallbackUri : imgUri;

  if (!effectiveUri) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: "#E8E0D5",
          borderRadius: style?.borderRadius ?? 14,
        }}
      />
    );
  }

  let imageWidth = width;
  let imageHeight = height;
  let imageLeft = 0;

  if (imageSize) {
    const scale = Math.max(
      width / imageSize.width,
      height / imageSize.height
    );

    imageWidth = imageSize.width * scale;
    imageHeight = imageSize.height * scale;

    // Keep image horizontally centered
    imageLeft = (width - imageWidth) / 2;
  }

  return (
    <View
      style={{
        width,
        height,
        overflow: "hidden",
        borderRadius: style?.borderRadius ?? 14,
      }}
    >
      <Image
        source={{ uri: effectiveUri }}
        style={{
          position: "absolute",
          width: imageWidth,
          height: imageHeight,
          left: imageLeft,
          top: 0, // ⭐ always start image from TOP
        }}
        resizeMode="stretch"
        blurRadius={blurRadius}
        onError={() => {
          if (!hasError) {
            setHasError(true);
          }
        }}
      />
    </View>
  );
};