import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Notifications } from "../Screens/Notifications";
import { AccountSetup } from "../Screens/AccountSetup";
import { OtpVerify } from "../Screens/OtpVerify";
import { OtpVerifyLogin } from "../Screens/OtpVerifyLogin";
import { BasicDetails } from "../Screens/BasicDetails";
import { LoginPage } from "../Screens/LoginPage";
import { ForgetPassword } from "../Screens/ForgetPassword";
import { EmailSent } from "../Screens/EmailSent";
import { LoginWithPhoneNumber } from "../Screens/LoginWithPhoneNumber";
import { TabNavigation } from "./TabNavigation";
import { MyProfile } from "../Screens/AfterLogin/MyProfile";
import { ThankYou } from "../Screens/ThankYou";
import { ContactInfo } from "../Screens/ContactInfo";
import { UploadImages } from "../Screens/UploadImages";
import { FamilyDetails } from "../Screens/FamilyDetails";
import { EduDetails } from "../Screens/EduDetails";
import { HoroDetails } from "../Screens/HoroDetails";
import { PartnerSettings } from "../Screens/PartnerSettings";
import { MembershipPlan } from "../Screens/MembershipPlan";
import { PayNow } from "../Screens/PayNow";
import { ThankYouReg } from "../Screens/ThankYouReg";
import { Home } from "../Screens/Home";
import HomeWithToast from "../Tabs/HomeWithToast";
import { SearchResults } from "../Screens/AfterLogin/SearchResults";
import { FilterScreen } from "../Screens/AfterLogin/FilterScreen";
import { ProfileDetails } from "../Screens/AfterLogin/ProfileDetails";
import { ProfileDetailsRequest } from "../Screens/AfterLogin/ProfileDetailsRequest";
import { DashBoardMatchingProfiles } from "../Screens/AfterLogin/DashBoardMatchingProfiles";
import { DashBoardMutualInterest } from "../Screens/AfterLogin/DashBoardMutualInterest";
import { DashBoardWishlist } from "../Screens/AfterLogin/DashBoardWishlist";
import { InterestSent } from "../Screens/AfterLogin/InterestSent";
import { ViewedProfiles } from "../Screens/AfterLogin/ViewedProfiles";
import { MyVisitors } from "../Screens/AfterLogin/MyVisitors";
import { PhotoRequest } from "../Screens/AfterLogin/PhotoRequest";
import { PersonalNotes } from "../Screens/AfterLogin/PersonalNotes";
import { OtherSettings } from "../Screens/AfterLogin/OtherSettings";
import { WebViewPage } from "../Screens/AfterLogin/WebViewPage";
import { VysassistResults } from "../Screens/AfterLogin/VysassistResults";
import { GalleryResults } from "../Screens/AfterLogin/GalleryResults";
import { ReportedProfiles } from "../Screens/AfterLogin/ReportedProfiles";
import ChatRoom from "../Tabs/ChatRoom";
import Message from "../Tabs/Message";
import MatchingProfileSearch from "../Tabs/MatchingProfileSearch";
import { Header } from "../Components/Header";
import { LogoHeader } from "../Components/LogoHeader";
import { ForgotPasswordOtp } from "../Screens/ForgotPasswordOtp";
import { ResetPassword } from "../Screens/ResetPassword";
import { FeaturedOrSuggestProfiles } from "../Screens/AfterLogin/FeaturedOrSuggestProfiles";
import { ProfileCompletionForm } from "../Screens/AfterLogin/ProfileCompletionForm";
import { HelpSupport } from "../Tabs/HelpSupport";
import { UploadWedding } from "../Tabs/UploadWedding";
// import { ForgetPassword } from "../Components/ForgotPassword";


const Stack = createStackNavigator();

export const AppNavigation = () => {
  const [initialRoute, setInitialRoute] = useState(null); // Initialize with null to distinguish initial loading state

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          setInitialRoute("HomeWithToast");
        } else {
          setInitialRoute("LoginPage");
          //setInitialRoute("PartnerSettings");
        }
      } catch (error) {
        console.error("Error reading auth token:", error);
        setInitialRoute("LoginPage");
      }
    };

    // Initialize the app and then set a timeout to display the loading screen for at least 3 seconds
    initializeApp();
    setTimeout(() => {
      setInitialRoute((prev) => prev || "LoginPage"); // Ensure we have a valid route
    }, 3000);
  }, []);

  // console.log("Initial Route:", initialRoute); // Log the initialRoute state

  useEffect(() => {
    if (initialRoute !== null) {
      console.log("Initial Route:", initialRoute);
    }
  }, [initialRoute]);


  if (initialRoute === null) {
    return <Home />; // Render loading screen while waiting for async operation
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      {/* Your screen configurations */}
      <Stack.Screen
        name="AccountSetup"
        component={AccountSetup}
        // options={{ headerShown: false }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoom}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OtpVerify"
        component={OtpVerify}
        // options={{ headerShown: false }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="OtpVerifyLogin"
        component={OtpVerifyLogin}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ForgotPasswordOtp"
        component={ForgotPasswordOtp}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPassword}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BasicDetails"
        component={BasicDetails}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="BasicDetails" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="LoginPage"
        component={LoginPage}
        // options={{ headerShown: false }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ForgetPassword"
        component={ForgetPassword}
        // options={{ headerShown: false }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="EmailSent"
        component={EmailSent}
        // options={{ headerShown: false }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="LoginWithPhoneNumber"
        component={LoginWithPhoneNumber}
        // options={{ headerShown: false }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="HomeWithToast"
        component={TabNavigation}
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen
        name="HomeWithToastt"
        component={TabNavigation}
        options={{ headerShown: false }}
      /> */}
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="ThankYou"
        component={ThankYou}
        // options={{ headerShown: false }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ContactInfo"
        component={ContactInfo}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="UploadImages"
        component={UploadImages}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="FamilyDetails"
        component={FamilyDetails}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="EduDetails"
        component={EduDetails}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="HoroDetails"
        component={HoroDetails}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="PartnerSettings"
        component={PartnerSettings}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="MembershipPlan"
        component={MembershipPlan}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="PayNow"
        component={PayNow}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          // headerLeft: null,
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ThankYouReg"
        component={ThankYouReg}
        // options={{ headerShown: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
          headerTitle: () => <LogoHeader name="HomeWithToast" />,
          //   tabBarActiveTintColor: "#FF0000",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerLeft: null,
          headerShown: true,
        }}
      />

      {/* After Login Screens */}
      <Stack.Screen
        name="SearchResults"
        component={SearchResults}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FilterScreen"
        component={FilterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileDetails"
        component={ProfileDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileDetailsRequest"
        component={ProfileDetailsRequest}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="MyProfile"
        component={MyProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileCompletionForm"
        component={ProfileCompletionForm}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DashBoardMatchingProfiles"
        component={DashBoardMatchingProfiles}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DashBoardMutualInterest"
        component={DashBoardMutualInterest}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DashBoardWishlist"
        component={DashBoardWishlist}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InterestSent"
        component={InterestSent}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Message"
        component={Message}
        options={{ headerShown: true }}
      />

      <Stack.Screen
        name="MatchingProfileSearch"
        component={MatchingProfileSearch}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ViewedProfiles"
        component={ViewedProfiles}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyVisitors"
        component={MyVisitors}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PhotoRequest"
        component={PhotoRequest}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PersonalNotes"
        component={PersonalNotes}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OtherSettings"
        component={OtherSettings}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WebViewPage"
        component={WebViewPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VysassistResults"
        component={VysassistResults}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GalleryResults"
        component={GalleryResults}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportedProfiles"
        component={ReportedProfiles}
        options={{ headerShown: true }}
      />

      <Stack.Screen
        name="FeaturedOrSuggestProfiles"
        component={FeaturedOrSuggestProfiles}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="HelpSupport" component={HelpSupport} options={{ headerShown: false }} />
      <Stack.Screen
        name="UploadWedding"
        component={UploadWedding}
        options={{ headerShown: false }} // Hides default header to use your custom back button design
      />
    </Stack.Navigator>
  );
};
