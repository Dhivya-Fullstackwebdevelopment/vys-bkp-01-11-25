import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { downloadPdfPoruthamNew } from "../CommonApiCall/CommonApiCall";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MatchingScore({ scorePercentage, viewedProfileId, onScorePress, onUpgradeRequired }) {
  const [loading, setLoading] = useState(false);
  console.log("scorePercentage check ==>", scorePercentage);
  const screenWidth = Dimensions.get("window").width;
  const radius = Math.min(screenWidth * 0.25, 60);
  const strokeWidth = 20;
  const center = radius + strokeWidth;
  const progress = Math.min((scorePercentage / 100) * Math.PI, Math.PI);
  const encryptedId = AsyncStorage.getItem('encryptedId');
  const myId = AsyncStorage.getItem('myId');

  const getEmoji = () => {
    if (scorePercentage >= 75) return "😊"
    if (scorePercentage >= 50 && scorePercentage <= 74) return "🙂"
    if (scorePercentage >= 25 && scorePercentage <= 49) return "😐"
    return "😞"
  }

  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      // This function MUST return either the file path on success, 
      // OR the JSON failure object {status: "failure", message: "..."}
      const result = await downloadPdfPoruthamNew(encryptedId, myId);

      // 1. Check for failure object returned by the utility
      if (result && result.status === "failure") {
        if (onUpgradeRequired) {
          // Call the parent handler with the error message
          onUpgradeRequired(result.message || "No access to see the compatibility report");
        }
        return; // Stop execution
      }

      // 2. Success case: Download/open handled by the utility.

    } catch (error) {
      console.error("Error downloading PDF:", error);
      Alert.alert("Error", "Failed to download the file.");
    } finally {
      setLoading(false);
    }
  };

  const createArc = (start, end) => {
    const x1 = center + radius * Math.cos(start - Math.PI);
    const y1 = center + radius * Math.sin(start - Math.PI);
    const x2 = center + radius * Math.cos(end - Math.PI);
    const y2 = center + radius * Math.sin(end - Math.PI);

    const largeArcFlag = end - start <= Math.PI ? "0" : "1";

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleDownloadPdf} disabled={loading}>
      {loading ? (
        <ActivityIndicator size="large" color="#4A9E80" />
      ) : (
        <View style={styles.gaugeContainer}>
          <Svg
            width={(radius + strokeWidth) * 2}
            height={(radius + strokeWidth + 10) * 2}
          >
            {/* Background segments */}
            {[0, 0.25, 0.5, 0.75].map((segment, index) => (
              <Path
                key={`segment-${index}`}
                d={createArc(segment * Math.PI, (segment + 0.25) * Math.PI)}
                stroke={`rgb(${74 + index * 1}, ${222 - index * 20}, ${128 - index * 20
                  })`}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                fill="none"
              />
            ))}

            {/* Segment divider lines */}
            {[0.25, 0.5, 0.75].map((segment, index) => {
              const angle = segment * Math.PI - Math.PI;
              const x1 = center + (radius - strokeWidth / 2) * Math.cos(angle);
              const y1 = center + (radius - strokeWidth / 2) * Math.sin(angle);
              const x2 = center + (radius + strokeWidth / 2) * Math.cos(angle);
              const y2 = center + (radius + strokeWidth / 2) * Math.sin(angle);
              return (
                <Path
                  key={`divider-${index}`}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            })}

            {/* Indicator arrow */}
            {(() => {
              const angle = progress - Math.PI;
              const x1 = center + (radius - strokeWidth - 5) * Math.cos(angle);
              const y1 = center + (radius - strokeWidth - 5) * Math.sin(angle);
              const x2 = center + (radius + 5) * Math.cos(angle);
              const y2 = center + (radius + 5) * Math.sin(angle);
              return (
                <Path
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke="#333"
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })()}

            {/* Center circle */}
            <Circle cx={center} cy={center} r={radius - 20} fill="#ffffff" stroke="#333333" strokeWidth={2} />
          </Svg>

          {/* Center content */}
          <View style={styles.centerContent}>
            <Text style={styles.emoji}>{getEmoji()}</Text>
            <Text style={styles.percentage}>{scorePercentage}%</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  gaugeContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  percentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  label: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
});
