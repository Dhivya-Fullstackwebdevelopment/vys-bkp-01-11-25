// import React, { useState, useEffect, useRef } from 'react';
// import {
//     Modal,
//     View,
//     TouchableOpacity,
//     Text,
//     ActivityIndicator,
//     StyleSheet,
//     Platform,
//     Alert,
//     StatusBar,
//     Animated,
//     Easing,
// } from 'react-native';
// import { WebView } from 'react-native-webview';
// import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
// import { SafeAreaView } from "react-native-safe-area-context";
// import * as FileSystem from "expo-file-system/legacy";
// import * as Sharing from "expo-sharing";

// export const InAppPdfModal = ({
//     visible,
//     onClose,
//     pdfUrl,
//     title = "Horoscope Report",
//     profileId = ""
// }) => {
//     const [base64Pdf, setBase64Pdf] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [actionLoading, setActionLoading] = useState(false);
//     const [progressPercent, setProgressPercent] = useState(15);
//     const webViewRef = useRef(null);

//     // ─── ANIMATION REFS ────────────────────────────────────────────────────────
//     const pulseAnim = useRef(new Animated.Value(1)).current;
//     const barAnim = useRef(new Animated.Value(0.15)).current;
//     const fadeAnim = useRef(new Animated.Value(1)).current;

//     // ─── RESET STATES WHEN MODAL OPENS ─────────────────────────────────────────
//     useEffect(() => {
//         if (visible) {
//             setLoading(true);
//             setProgressPercent(15);
//             fadeAnim.setValue(1);
//             barAnim.setValue(0.15);
//             pulseAnim.setValue(1);
//         } else {
//             setBase64Pdf(null);
//         }
//     }, [visible]);

//     // ─── PULSE & PROGRESS BAR ANIMATION ───────────────────────────────────────
//     useEffect(() => {
//         if (loading && visible) {
//             const pulseLoop = Animated.loop(
//                 Animated.sequence([
//                     Animated.timing(pulseAnim, {
//                         toValue: 1.1,
//                         duration: 900,
//                         easing: Easing.inOut(Easing.ease),
//                         useNativeDriver: true,
//                     }),
//                     Animated.timing(pulseAnim, {
//                         toValue: 1,
//                         duration: 900,
//                         easing: Easing.inOut(Easing.ease),
//                         useNativeDriver: true,
//                     }),
//                 ])
//             );
//             pulseLoop.start();

//             const progressTimer1 = setTimeout(() => {
//                 setProgressPercent(45);
//                 Animated.timing(barAnim, {
//                     toValue: 0.45,
//                     duration: 400,
//                     useNativeDriver: false,
//                 }).start();
//             }, 300);

//             const progressTimer2 = setTimeout(() => {
//                 setProgressPercent(78);
//                 Animated.timing(barAnim, {
//                     toValue: 0.78,
//                     duration: 600,
//                     useNativeDriver: false,
//                 }).start();
//             }, 800);

//             return () => {
//                 pulseLoop.stop();
//                 clearProgress(progressTimer1, progressTimer2, pulseLoop);
//             };
//         }
//     }, [loading, visible]);

//     const clearProgress = (t1, t2, loop) => {
//         if (loop) loop.stop();
//         if (t1) clearTimeout(t1);
//         if (t2) clearTimeout(t2);
//     };

//     // ─── FILE READING EFFECT ──────────────────────────────────────────────────
//     useEffect(() => {
//         let isMounted = true;

//         const loadPdfAsBase64 = async () => {
//             if (!pdfUrl) {
//                 if (isMounted) setBase64Pdf(null);
//                 return;
//             }

//             try {
//                 let targetUri = pdfUrl;

//                 if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
//                     const localPath = `${FileSystem.cacheDirectory}preview_${Date.now()}.pdf`;
//                     const downloadRes = await FileSystem.downloadAsync(pdfUrl, localPath);
//                     targetUri = downloadRes.uri;
//                 }

//                 const base64 = await FileSystem.readAsStringAsync(targetUri, {
//                     encoding: FileSystem.EncodingType.Base64,
//                 });

//                 if (isMounted) {
//                     setBase64Pdf(base64);
//                 }
//             } catch (error) {
//                 console.error("Error reading PDF file:", error);
//                 Alert.alert("Error", "Could not load document preview.");
//                 if (isMounted) setLoading(false);
//             }
//         };

//         if (visible) {
//             loadPdfAsBase64();
//         }

//         return () => {
//             isMounted = false;
//         };
//     }, [pdfUrl, visible]);

//     // ─── SHARE & DOWNLOAD HANDLER ─────────────────────────────────────────────
//     const handleDownloadShare = async () => {
//         if (!pdfUrl) return;

//         try {
//             setActionLoading(true);

//             const isAvailable = await Sharing.isAvailableAsync();
//             if (!isAvailable) {
//                 Alert.alert("Notice", "Direct sharing is not supported on this device.");
//                 return;
//             }

//             // Create a clean, safe filename with unique timestamp to prevent caching locks
//             const cleanTitle = (title || "Document").replace(/[^a-zA-Z0-9]/g, '_');
//             const targetFileUri = `${FileSystem.documentDirectory || FileSystem.cacheDirectory}${cleanTitle}_${Date.now()}.pdf`;

//             let shareableLocalUri = targetFileUri;

//             if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
//                 const downloadResult = await FileSystem.downloadAsync(pdfUrl, targetFileUri);
//                 shareableLocalUri = downloadResult.uri;
//             } else if (pdfUrl.startsWith('file://')) {
//                 await FileSystem.copyAsync({
//                     from: pdfUrl,
//                     to: targetFileUri,
//                 });
//                 shareableLocalUri = targetFileUri;
//             } else if (base64Pdf) {
//                 await FileSystem.writeAsStringAsync(targetFileUri, base64Pdf, {
//                     encoding: FileSystem.EncodingType.Base64,
//                 });
//                 shareableLocalUri = targetFileUri;
//             }

//             // Verify file exists and has content before opening intent
//             const fileInfo = await FileSystem.getInfoAsync(shareableLocalUri);
//             if (!fileInfo.exists || fileInfo.size === 0) {
//                 throw new Error("File preparation failed or output file is empty.");
//             }

//             await Sharing.shareAsync(shareableLocalUri, {
//                 mimeType: 'application/pdf',
//                 dialogTitle: `Share ${title}`,
//                 UTI: 'com.adobe.pdf',
//             });

//         } catch (error) {
//             console.error("Share error:", error);
//             Alert.alert("Share Error", "Unable to share file. Please try again.");
//         } finally {
//             setActionLoading(false);
//         }
//     };

//     // ─── WEBVIEW MESSAGES ─────────────────────────────────────────────────────
//     const onWebViewMessage = (event) => {
//         try {
//             const data = JSON.parse(event.nativeEvent.data);
//             if (data.type === 'PDF_RENDERED') {
//                 setProgressPercent(100);
//                 Animated.timing(barAnim, {
//                     toValue: 1,
//                     duration: 250,
//                     useNativeDriver: false,
//                 }).start(() => {
//                     Animated.timing(fadeAnim, {
//                         toValue: 0,
//                         duration: 300,
//                         useNativeDriver: true,
//                     }).start(() => {
//                         setLoading(false);
//                     });
//                 });
//             }
//         } catch (e) {
//             setLoading(false);
//         }
//     };

//     if (!visible) return null;

//     // ─── PDF.JS HIGH-RES HTML ─────────────────────────────────────────────────
//     const htmlContent = base64Pdf
//         ? `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
//           <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
//           <style>
//             * { margin: 0; padding: 0; box-sizing: border-box; }
//             html, body {
//               background-color: #F5EFE6;
//               width: 100%;
//               min-height: 100%;
//               display: flex;
//               flex-direction: column;
//               align-items: center;
//               padding: 14px 0 28px 0;
//               font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//             }
//             #pdf-container {
//               width: 100%;
//               display: flex;
//               flex-direction: column;
//               align-items: center;
//               gap: 16px;
//             }
//             .page-wrapper {
//               position: relative;
//               box-shadow: 0 6px 20px rgba(80, 50, 20, 0.12);
//               border-radius: 8px;
//               overflow: hidden;
//               background-color: #FFFFFF;
//               border: 1px solid #EADBCC;
//             }
//             canvas {
//               display: block;
//               width: 100% !important;
//               height: auto !important;
//             }
//             .page-badge {
//               position: absolute;
//               bottom: 10px;
//               right: 12px;
//               background: rgba(45, 30, 20, 0.7);
//               color: #FFF;
//               font-size: 11px;
//               font-weight: 600;
//               padding: 3px 9px;
//               border-radius: 12px;
//               backdrop-filter: blur(4px);
//             }
//             @media print {
//               body { background-color: #FFF; padding: 0; }
//               .page-wrapper { box-shadow: none; border-radius: 0; border: none; }
//               .page-badge { display: none; }
//             }
//           </style>
//         </head>
//         <body>
//           <div id="pdf-container"></div>
//           <script>
//             const pdfData = atob("${base64Pdf}");
//             const loadingTask = pdfjsLib.getDocument({ data: pdfData });
//             loadingTask.promise.then(async function(pdf) {
//               const container = document.getElementById('pdf-container');

//               for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//                 const page = await pdf.getPage(pageNum);
//                 const viewport = page.getViewport({ scale: 2.2 });
                
//                 const wrapper = document.createElement('div');
//                 wrapper.className = 'page-wrapper';
//                 wrapper.style.width = '94%';
//                 wrapper.style.maxWidth = '720px';

//                 const canvas = document.createElement('canvas');
//                 const context = canvas.getContext('2d');
//                 canvas.height = viewport.height;
//                 canvas.width = viewport.width;

//                 wrapper.appendChild(canvas);
                
//                 if (pdf.numPages > 1) {
//                   const badge = document.createElement('div');
//                   badge.className = 'page-badge';
//                   badge.innerText = pageNum + ' / ' + pdf.numPages;
//                   wrapper.appendChild(badge);
//                 }

//                 container.appendChild(wrapper);

//                 await page.render({
//                   canvasContext: context,
//                   viewport: viewport
//                 }).promise;

//                 if (pageNum === 1) {
//                   window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
//                     type: 'PDF_RENDERED',
//                     totalPages: pdf.numPages
//                   }));
//                 }
//               }
//             }).catch(function(err) {
//               document.body.innerHTML = '<div style="color:#7A6E5F; margin-top:60px; font-size:15px; font-weight:600; text-align:center;">Failed to render document preview.</div>';
//             });
//           </script>
//         </body>
//       </html>
//     `
//         : "";

//     return (
//         <Modal
//             visible={visible}
//             animationType="slide"
//             onRequestClose={onClose}
//             statusBarTranslucent={false}
//         >
//             <StatusBar barStyle="dark-content" backgroundColor="#FBF5ED" />
//             <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

//                 {/* ── HEADER ── */}
//                 <View style={styles.header}>
//                     <TouchableOpacity
//                         onPress={onClose}
//                         style={styles.backButton}
//                         hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
//                         activeOpacity={0.7}
//                     >
//                         <View style={styles.backIconCircle}>
//                             <Ionicons name="arrow-back" size={20} color="#332414" />
//                         </View>
//                         <View style={styles.titleColumn}>
//                             <Text style={styles.headerMainTitle} numberOfLines={1}>
//                                 {title}
//                             </Text>
//                             <Text style={styles.headerSubtitle} numberOfLines={1}>
//                                 {profileId ? `${profileId} • ` : ''}Document Viewer
//                             </Text>
//                         </View>
//                     </TouchableOpacity>

//                     <View style={styles.actionGroup}>
//                         <TouchableOpacity
//                             onPress={handleDownloadShare}
//                             style={[styles.actionButton, styles.downloadButton]}
//                             activeOpacity={0.75}
//                             disabled={loading || actionLoading}
//                         >
//                             <Feather name="download" size={17} color="#FFFFFF" />
//                         </TouchableOpacity>
//                     </View>
//                 </View>

//                 {/* ── VIEWPORT ── */}
//                 <View style={styles.contentContainer}>
//                     {base64Pdf && (
//                         <WebView
//                             ref={webViewRef}
//                             originWhitelist={['*']}
//                             source={{ html: htmlContent }}
//                             style={styles.webview}
//                             scalesPageToFit={true}
//                             javaScriptEnabled={true}
//                             domStorageEnabled={true}
//                             onMessage={onWebViewMessage}
//                             showsVerticalScrollIndicator={false}
//                             showsHorizontalScrollIndicator={false}
//                         />
//                     )}

//                     {/* ── SKELETON LOADER OVERLAY ── */}
//                     {loading && (
//                         <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
//                             <View style={styles.loaderCard}>
//                                 <Animated.View
//                                     style={[
//                                         styles.iconHaloOuter,
//                                         { transform: [{ scale: pulseAnim }] }
//                                     ]}
//                                 >
//                                     <View style={styles.iconHaloInner}>
//                                         <MaterialCommunityIcons name="file-pdf-box" size={40} color="#70121E" />
//                                     </View>
//                                 </Animated.View>

//                                 <Text style={styles.loadingHeading}>Loading Document</Text>

//                                 <View style={styles.progressBarTrack}>
//                                     <Animated.View
//                                         style={[
//                                             styles.progressBarFill,
//                                             {
//                                                 width: barAnim.interpolate({
//                                                     inputRange: [0, 1],
//                                                     outputRange: ['0%', '100%'],
//                                                 }),
//                                             }
//                                         ]}
//                                     />
//                                 </View>

//                                 <View style={styles.progressFooterRow}>
//                                     <Text style={styles.progressPercentText}>{progressPercent}%</Text>
//                                     <ActivityIndicator size="small" color="#70121E" />
//                                 </View>
//                             </View>
//                         </Animated.View>
//                     )}
//                 </View>

//                 {/* Action Spinner */}
//                 {actionLoading && (
//                     <View style={styles.actionOverlay}>
//                         <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
//                         <Text style={styles.actionOverlayText}>Processing request...</Text>
//                     </View>
//                 )}
//             </SafeAreaView>
//         </Modal>
//     );
// };

// const styles = StyleSheet.create({
//     safeArea: {
//         flex: 1,
//         backgroundColor: '#FBF5ED',
//     },
//     header: {
//         height: 60,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: 14,
//         backgroundColor: '#FBF5ED',
//         borderBottomWidth: 1,
//         borderBottomColor: '#EADBCC',
//         ...Platform.select({
//             ios: {
//                 shadowColor: '#000',
//                 shadowOffset: { width: 0, height: 2 },
//                 shadowOpacity: 0.05,
//                 shadowRadius: 3,
//             },
//             android: {
//                 elevation: 2,
//             },
//         }),
//     },
//     backButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         flex: 1,
//         gap: 10,
//     },
//     backIconCircle: {
//         width: 36,
//         height: 36,
//         borderRadius: 18,
//         backgroundColor: 'rgba(255, 255, 255, 0.9)',
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#EADBCC',
//     },
//     titleColumn: {
//         flex: 1,
//         justifyContent: 'center',
//     },
//     headerMainTitle: {
//         fontSize: 15,
//         fontWeight: '700',
//         color: '#261B11',
//         fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
//     },
//     headerSubtitle: {
//         fontSize: 11.5,
//         color: '#8A7D6F',
//         fontWeight: '500',
//         marginTop: 1,
//     },
//     actionGroup: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 8,
//     },
//     actionButton: {
//         width: 38,
//         height: 38,
//         borderRadius: 19,
//         backgroundColor: '#FFFFFF',
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#E8DEC8',
//         ...Platform.select({
//             ios: {
//                 shadowColor: '#000',
//                 shadowOffset: { width: 0, height: 1 },
//                 shadowOpacity: 0.06,
//                 shadowRadius: 2,
//             },
//             android: {
//                 elevation: 1,
//             },
//         }),
//     },
//     downloadButton: {
//         backgroundColor: '#70121E',
//         borderColor: '#70121E',
//     },
//     contentContainer: {
//         flex: 1,
//         position: 'relative',
//         backgroundColor: '#F5EFE6',
//     },
//     webview: {
//         flex: 1,
//         backgroundColor: '#F5EFE6',
//     },
//     loadingOverlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: '#F5EFE6',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 99,
//         paddingHorizontal: 24,
//     },
//     loaderCard: {
//         backgroundColor: '#FFFFFF',
//         width: '100%',
//         maxWidth: 310,
//         borderRadius: 24,
//         paddingVertical: 32,
//         paddingHorizontal: 24,
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#EADBCC',
//         shadowColor: '#38220F',
//         shadowOffset: { width: 0, height: 8 },
//         shadowOpacity: 0.08,
//         shadowRadius: 18,
//         elevation: 4,
//     },
//     iconHaloOuter: {
//         width: 76,
//         height: 76,
//         borderRadius: 38,
//         backgroundColor: '#FBECEE',
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginBottom: 16,
//     },
//     iconHaloInner: {
//         width: 58,
//         height: 58,
//         borderRadius: 29,
//         backgroundColor: '#FFFFFF',
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#F3D2D7',
//     },
//     loadingHeading: {
//         fontSize: 16.5,
//         fontWeight: '700',
//         color: '#261B11',
//         fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
//     },
//     loadingSubtext: {
//         fontSize: 12.5,
//         color: '#8A7D6F',
//         textAlign: 'center',
//         marginTop: 4,
//         marginBottom: 20,
//     },
//     progressBarTrack: {
//         width: '100%',
//         height: 6,
//         borderRadius: 3,
//         backgroundColor: '#F0E5D8',
//         overflow: 'hidden',
//     },
//     progressBarFill: {
//         height: '100%',
//         backgroundColor: '#70121E',
//         borderRadius: 3,
//     },
//     progressFooterRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         width: '100%',
//         marginTop: 12,
//     },
//     progressPercentText: {
//         fontSize: 12,
//         fontWeight: '700',
//         color: '#70121E',
//     },
//     actionOverlay: {
//         position: 'absolute',
//         bottom: 24,
//         alignSelf: 'center',
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: 'rgba(38, 27, 17, 0.88)',
//         paddingHorizontal: 20,
//         paddingVertical: 11,
//         borderRadius: 24,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.2,
//         shadowRadius: 4,
//         elevation: 6,
//     },
//     actionOverlayText: {
//         color: '#FFFFFF',
//         fontSize: 13,
//         fontWeight: '600',
//     },
// });



import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    Platform,
    Alert,
    StatusBar,
    Animated,
    Easing,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export const InAppPdfModal = ({
    visible,
    onClose,
    pdfUrl,
    title = "Horoscope Report",
    profileId = ""
}) => {
    const [base64Pdf, setBase64Pdf] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [progressPercent, setProgressPercent] = useState(15);
    const webViewRef = useRef(null);

    // ─── ANIMATION REFS ────────────────────────────────────────────────────────
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const barAnim = useRef(new Animated.Value(0.15)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // ─── RESET STATES WHEN MODAL OPENS ─────────────────────────────────────────
    useEffect(() => {
        if (visible) {
            setLoading(true);
            setProgressPercent(15);
            fadeAnim.setValue(1);
            barAnim.setValue(0.15);
            pulseAnim.setValue(1);
        } else {
            setBase64Pdf(null);
        }
    }, [visible]);

    // ─── PULSE & PROGRESS BAR ANIMATION ───────────────────────────────────────
    useEffect(() => {
        if (loading && visible) {
            const pulseLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 900,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 900,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseLoop.start();

            const progressTimer1 = setTimeout(() => {
                setProgressPercent(45);
                Animated.timing(barAnim, {
                    toValue: 0.45,
                    duration: 400,
                    useNativeDriver: false,
                }).start();
            }, 300);

            const progressTimer2 = setTimeout(() => {
                setProgressPercent(78);
                Animated.timing(barAnim, {
                    toValue: 0.78,
                    duration: 600,
                    useNativeDriver: false,
                }).start();
            }, 800);

            return () => {
                pulseLoop.stop();
                clearTimeout(progressTimer1);
                clearTimeout(progressTimer2);
            };
        }
    }, [loading, visible]);

    // ─── SAFE LOCAL FILE PATH RESOLUTION ───────────────────────────────────────
    const ensureValidLocalFile = async () => {
        const cleanTitle = (title || "Document").replace(/[^a-zA-Z0-9]/g, '_');
        const targetDirectory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
        const targetPath = `${targetDirectory}${cleanTitle}_${Date.now()}.pdf`;

        // 1. If it's a remote URL, download directly to the target path
        if (typeof pdfUrl === 'string' && (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://'))) {
            const downloadRes = await FileSystem.downloadAsync(pdfUrl, targetPath);
            return downloadRes.uri;
        }

        // 2. If it's a local file path, check if it actually exists before copying
        if (typeof pdfUrl === 'string' && (pdfUrl.startsWith('file://') || pdfUrl.startsWith('/'))) {
            const normalizedSource = pdfUrl.startsWith('file://') ? pdfUrl : `file://${pdfUrl}`;
            const fileCheck = await FileSystem.getInfoAsync(normalizedSource);

            if (fileCheck.exists && fileCheck.size > 0) {
                await FileSystem.copyAsync({
                    from: normalizedSource,
                    to: targetPath,
                });
                return targetPath;
            }
        }

        // 3. Fallback: Write from base64 state if source file was missing or deleted
        if (base64Pdf) {
            await FileSystem.writeAsStringAsync(targetPath, base64Pdf, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return targetPath;
        }

        // 4. If pdfUrl itself is raw base64 string
        if (typeof pdfUrl === 'string' && !pdfUrl.startsWith('http') && !pdfUrl.startsWith('/')) {
            const rawBase64 = pdfUrl.replace(/^data:application\/pdf;base64,/, '');
            await FileSystem.writeAsStringAsync(targetPath, rawBase64, {
                encoding: FileSystem.EncodingType.Base64,
            });
            return targetPath;
        }

        throw new Error("Unable to resolve PDF source file.");
    };

    // ─── FILE READING EFFECT ──────────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true;

        const loadPdfAsBase64 = async () => {
            if (!pdfUrl) {
                if (isMounted) setLoading(false);
                return;
            }

            try {
                // If it's already a base64 string
                if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://') && !pdfUrl.startsWith('file://') && !pdfUrl.startsWith('/')) {
                    const cleanBase64 = pdfUrl.replace(/^data:application\/pdf;base64,/, '');
                    if (isMounted) {
                        setBase64Pdf(cleanBase64);
                    }
                    return;
                }

                // Download or copy to a guaranteed local persistent path
                const localUri = await ensureValidLocalFile();
                const base64Data = await FileSystem.readAsStringAsync(localUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                if (isMounted) {
                    setBase64Pdf(base64Data);
                }
            } catch (error) {
                console.error("Error reading PDF file:", error);
                Alert.alert("Error", "Could not load document preview.");
                if (isMounted) setLoading(false);
            }
        };

        if (visible) {
            loadPdfAsBase64();
        }

        return () => {
            isMounted = false;
        };
    }, [pdfUrl, visible]);

    // ─── SHARE & DOWNLOAD HANDLER ─────────────────────────────────────────────
    const handleDownloadShare = async () => {
        if (!pdfUrl && !base64Pdf) return;

        try {
            setActionLoading(true);

            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert("Notice", "Direct sharing is not supported on this device.");
                return;
            }

            const readyFileUri = await ensureValidLocalFile();

            // Verify file exists and has content before opening Android intent
            const fileInfo = await FileSystem.getInfoAsync(readyFileUri);
            if (!fileInfo.exists || fileInfo.size === 0) {
                throw new Error("File preparation failed or output file is empty.");
            }

            await Sharing.shareAsync(readyFileUri, {
                mimeType: "application/pdf",
                dialogTitle: `Share ${title}`,
                UTI: "com.adobe.pdf",
            });
        } catch (error) {
            console.error("Share error:", error);
            Alert.alert("Share Error", "Unable to share file. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── WEBVIEW MESSAGES ─────────────────────────────────────────────────────
    const onWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'PDF_RENDERED') {
                setProgressPercent(100);
                Animated.timing(barAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: false,
                }).start(() => {
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => {
                        setLoading(false);
                    });
                });
            }
        } catch (e) {
            setLoading(false);
        }
    };

    if (!visible) return null;

    // ─── PDF.JS HIGH-RES HTML ─────────────────────────────────────────────────
    const htmlContent = base64Pdf
        ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              background-color: #F5EFE6;
              width: 100%;
              min-height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 14px 0 28px 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            #pdf-container {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            }
            .page-wrapper {
              position: relative;
              box-shadow: 0 6px 20px rgba(80, 50, 20, 0.12);
              border-radius: 8px;
              overflow: hidden;
              background-color: #FFFFFF;
              border: 1px solid #EADBCC;
            }
            canvas {
              display: block;
              width: 100% !important;
              height: auto !important;
            }
            .page-badge {
              position: absolute;
              bottom: 10px;
              right: 12px;
              background: rgba(45, 30, 20, 0.7);
              color: #FFF;
              font-size: 11px;
              font-weight: 600;
              padding: 3px 9px;
              border-radius: 12px;
              backdrop-filter: blur(4px);
            }
            @media print {
              body { background-color: #FFF; padding: 0; }
              .page-wrapper { box-shadow: none; border-radius: 0; border: none; }
              .page-badge { display: none; }
            }
          </style>
        </head>
        <body>
          <div id="pdf-container"></div>
          <script>
            const pdfData = atob("${base64Pdf}");
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            loadingTask.promise.then(async function(pdf) {
              const container = document.getElementById('pdf-container');

              for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.2 });
                
                const wrapper = document.createElement('div');
                wrapper.className = 'page-wrapper';
                wrapper.style.width = '94%';
                wrapper.style.maxWidth = '720px';

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                wrapper.appendChild(canvas);
                
                if (pdf.numPages > 1) {
                  const badge = document.createElement('div');
                  badge.className = 'page-badge';
                  badge.innerText = pageNum + ' / ' + pdf.numPages;
                  wrapper.appendChild(badge);
                }

                container.appendChild(wrapper);

                await page.render({
                  canvasContext: context,
                  viewport: viewport
                }).promise;

                if (pageNum === 1) {
                  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PDF_RENDERED',
                    totalPages: pdf.numPages
                  }));
                }
              }
            }).catch(function(err) {
              document.body.innerHTML = '<div style="color:#7A6E5F; margin-top:60px; font-size:15px; font-weight:600; text-align:center;">Failed to render document preview.</div>';
            });
          </script>
        </body>
      </html>
    `
        : "";

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={false}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FBF5ED" />
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.backButton}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.backIconCircle}>
                            <Ionicons name="arrow-back" size={20} color="#332414" />
                        </View>
                        <View style={styles.titleColumn}>
                            <Text style={styles.headerMainTitle} numberOfLines={1}>
                                {title}
                            </Text>
                            <Text style={styles.headerSubtitle} numberOfLines={1}>
                                {profileId ? `${profileId} • ` : ''}Document Viewer
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.actionGroup}>
                        <TouchableOpacity
                            onPress={handleDownloadShare}
                            style={[styles.actionButton, styles.downloadButton]}
                            activeOpacity={0.75}
                            disabled={loading || actionLoading}
                        >
                            <Feather name="download" size={17} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── VIEWPORT ── */}
                <View style={styles.contentContainer}>
                    {base64Pdf && (
                        <WebView
                            ref={webViewRef}
                            originWhitelist={['*']}
                            source={{ html: htmlContent }}
                            style={styles.webview}
                            scalesPageToFit={true}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            onMessage={onWebViewMessage}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                        />
                    )}

                    {/* ── SKELETON LOADER OVERLAY ── */}
                    {loading && (
                        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
                            <View style={styles.loaderCard}>
                                <Animated.View
                                    style={[
                                        styles.iconHaloOuter,
                                        { transform: [{ scale: pulseAnim }] }
                                    ]}
                                >
                                    <View style={styles.iconHaloInner}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={40} color="#70121E" />
                                    </View>
                                </Animated.View>

                                <Text style={styles.loadingHeading}>Loading Document</Text>

                                <View style={styles.progressBarTrack}>
                                    <Animated.View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: barAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%'],
                                                }),
                                            }
                                        ]}
                                    />
                                </View>

                                <View style={styles.progressFooterRow}>
                                    <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                                    <ActivityIndicator size="small" color="#70121E" />
                                </View>
                            </View>
                        </Animated.View>
                    )}
                </View>

                {/* Action Spinner */}
                {actionLoading && (
                    <View style={styles.actionOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 10 }} />
                        <Text style={styles.actionOverlayText}>Processing request...</Text>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBF5ED',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        backgroundColor: '#FBF5ED',
        borderBottomWidth: 1,
        borderBottomColor: '#EADBCC',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    backIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EADBCC',
    },
    titleColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    headerMainTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#261B11',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    headerSubtitle: {
        fontSize: 11.5,
        color: '#8A7D6F',
        fontWeight: '500',
        marginTop: 1,
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8DEC8',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    downloadButton: {
        backgroundColor: '#70121E',
        borderColor: '#70121E',
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#F5EFE6',
    },
    webview: {
        flex: 1,
        backgroundColor: '#F5EFE6',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F5EFE6',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99,
        paddingHorizontal: 24,
    },
    loaderCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: 310,
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EADBCC',
        shadowColor: '#38220F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 4,
    },
    iconHaloOuter: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#FBECEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconHaloInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3D2D7',
    },
    loadingHeading: {
        fontSize: 16.5,
        fontWeight: '700',
        color: '#261B11',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    loadingSubtext: {
        fontSize: 12.5,
        color: '#8A7D6F',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 20,
    },
    progressBarTrack: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F0E5D8',
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#70121E',
        borderRadius: 3,
    },
    progressFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 12,
    },
    progressPercentText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#70121E',
    },
    actionOverlay: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(38, 27, 17, 0.88)',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
    },
    actionOverlayText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
});