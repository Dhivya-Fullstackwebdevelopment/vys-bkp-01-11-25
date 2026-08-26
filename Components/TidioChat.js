import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TidioChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            box-sizing: border-box;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            overflow: hidden;
          }
          /* Removes Tidio's internal edge offsets to keep the full circle visible */
          #tidio-chat, #tidio-chat-iframe {
            position: absolute !important;
            inset: auto 0px 0px auto !important;
            bottom: 0 !important;
            right: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        </style>
      </head>
      <body>
        <script>
          (function() {
            var tidioScript = document.createElement('script');
            tidioScript.src = 'https://code.tidio.co/0ddzgwb7jku0kpejkcqvuplsouyvgqhw.js';
            tidioScript.async = true;
            document.body.appendChild(tidioScript);

            document.addEventListener("tidioChat-open", function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: "open" }));
            });

            document.addEventListener("tidioChat-close", function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: "close" }));
            });
          })();
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === "open") {
        setIsOpen(true);
      } else if (data.event === "close") {
        setIsOpen(false);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Renders only ONE WebView to prevent reload bugs.
  // Dynamically switches between collapsed (bottom-right) and fullscreen.
  return (
    <View
      pointerEvents={isOpen ? "auto" : "box-none"}
      style={[
        isOpen ? styles.fullscreen : styles.collapsed,
        isOpen && { paddingTop: insets.top, paddingBottom: insets.bottom } // Safely handles notches when open
      ]}
    >
      <WebView
        source={{ html, baseUrl: "https://localhost" }}
        style={styles.webView}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        transparent={true}
        scrollEnabled={false}
        scalesPageToFit={false}
        onMessage={handleMessage}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  collapsed: {
    position: "absolute",
    bottom: 150, // Sits above your bottom navigation tabs
    right: 5,    
    width: 100,  // Prevents chat circle from being cut off
    height: 100,
    zIndex: 99999,
    elevation: 20,
  },
  fullscreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 20,
    backgroundColor: "transparent",
  },
  webView: {
    backgroundColor: "transparent",
    flex: 1,
  },
});

export default TidioChat;