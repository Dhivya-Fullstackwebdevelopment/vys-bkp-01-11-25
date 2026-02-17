import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';



// Base URL for the API
// const BASE_URL = "http://103.214.132.20:8000/auth";
// const BASE_URL = "https://matrimonyapi.rainyseasun.com/auth";
// const BASE_URL ="https://vysyamaladev-afcbe2fdb9c7ckdv.westus2-01.azurewebsites.net/auth";
// const BASE_URL = "https://vysyamaladevnew-aehaazdxdzegasfb.westus2-01.azurewebsites.net/auth";
const BASE_URL = "https://app.vysyamala.com/auth";

// Retrieve Profile ID from session storage
const retrieveProfileId = async () => {
    let profileId = await AsyncStorage.getItem("loginuser_profileId");
    if (!profileId) {
        // Fallback to another key if not found
        profileId = await AsyncStorage.getItem("profile_id_new");
    }
    return profileId;
};

// Fetch profiles API call
// export const fetchProfiles = async (perPage, pageNumber,) => {
//     try {
//         const profileId = await retrieveProfileId();
//         if (!profileId) {
//             console.warn('Profile ID is empty, skipping API call.');
//             return [];
//         }
//         const requestData = {
//             profile_id: profileId,
//             per_page: perPage,
//             page_number: pageNumber,
//             order_by : "2"
//             // serach_age : 3,
//             // search_location : 2
//         };

//         const response = await axios.post(`${BASE_URL}/Get_prof_list_match/`, requestData);

//         console.log('API Response of data ===>', response.data);

//         if (response.data.Status === 1) {
//             return response.data;
//         } else {
//             return response.data;
//         }
//     } catch (error) {
//         console.error('Error fetching profiles:', error.response?.data || error.message);
//         return [];
//     }
// };

export const fetchProfiles = async (perPage, pageNumber, orderBy = "1") => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return [];
        }

        const requestData = {
            profile_id: profileId,
            per_page: perPage,
            page_number: pageNumber,
            order_by: orderBy.toString() // Dynamic orderBy
        };

        console.log('FETCH PROFILES - Order By:', orderBy);
        const response = await axios.post(`${BASE_URL}/Get_prof_list_match/`, requestData);
        console.log('FETCH PROFILES - Response IDs:', response.data.all_profile_ids);

        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error('Error fetching profiles:', error.response?.data || error.message);
        return [];
    }
};



// export const fetchProfiles = async (perPage, pageNumber) => {
//     try {
//         const profileId = await retrieveProfileId();
//         if (!profileId) {
//             console.warn('Profile ID is empty, skipping API call.');
//             return [];
//         }

//         const requestData = {
//             profile_id: profileId,
//             per_page: perPage,
//             page_number: pageNumber,
//         };

//         console.log('Sending API Request with:', requestData);

//         const response = await axios.post(`${BASE_URL}/Get_prof_list_match/`, requestData);

//         console.log('Full API Response:', response);
//         console.log('API Response Data:', response.data);

//         if (response.data?.Status === 1) {
//             const profiles = response.data.profiles || [];

//             console.log(`Successfully fetched ${profiles.length} profiles.`);
//             return profiles;
//         } else {
//             console.warn('API returned non-success status:', response.data?.Status, response.data?.message);
//             return [];
//         }
//     } catch (error) {
//         console.error('Full Error:', error);
//         if (error.response) {
//             console.error('Error Response Data:', error.response.data);
//             console.error('Error Response Status:', error.response.status);
//             console.error('Error Response Headers:', error.response.headers);
//         } else if (error.request) {
//             console.error('No response received:', error.request);
//         } else {
//             console.error('Request Setup Error:', error.message);
//         }
//         return [];
//     }
// };




// Handle bookmark API call
export const handleBookmark = async (viewedProfileId, status) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return false;
        }

        await axios.post(`${BASE_URL}/Mark_profile_wishlist/`, {
            profile_id: profileId,
            profile_to: viewedProfileId,
            status: status
        });
        return true;
    } catch (error) {
        console.error('Error updating bookmark status:', error);
        return false;
    }
};

// Log profile visit API call
export const logProfileVisit = async (viewedProfileId) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return false;
        }

        console.log("viewedProfileId", viewedProfileId);

        await axios.post(`${BASE_URL}/Create_profile_visit/`, {
            profile_id: profileId,
            viewed_profile: viewedProfileId
        });
        return true;
    } catch (error) {
        console.error('Error creating profile visit:', error);
        return false;
    }
};

// Fetch profile data API call
export const fetchProfileData = async (viewedProfileId) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        const response = await axios.post(`${BASE_URL}/Get_profile_det_match/`, {
            profile_id: profileId,
            user_profile_id: viewedProfileId
        });

        return response.data;

    } catch (error) {
        console.error("Error fetching profile data:", error);
        throw error;
    }
};

// Handle express interest API call
export const handleExpressInterest = async (viewedProfileId, expressInt, interestMessage, selectedCategory) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        console.log("sdsed", expressInt);
        const response = await axios.post(`${BASE_URL}/Send_profile_intrests/`, {
            profile_id: profileId,
            profile_to: viewedProfileId,
            status: !expressInt ? "1" : "0",
            to_express_message: interestMessage || selectedCategory,
        });

        return response.data;

    } catch (error) {
        console.error("Error updating express interest:", error);
        throw error;
    }
};

// New API calls

// Fetch profile interests list API call
export const fetchProfileInterests = async () => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return [];
        }

        const response = await axios.post(`${BASE_URL}/Get_profile_intrests_list/`, {
            profile_id: profileId
        });

        if (response.data.Status === 1) {
            return response.data.data.profiles || [];
        } else {
            return [];
        }
    } catch (error) {
        throw new Error('Error fetching profile interests.');
    }
};




// Update profile interests API call


// Fetch dashboard data API call
export const fetchDashboardData = async () => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        const response = await axios.post(`${BASE_URL}/Get_dashboard_details/`, {
            profile_id: profileId
        });

        // Log the entire response for debugging
        // console.log('Dashboard Data Response:', response);

        if (response.data.Status === 1) {
            return response.data.data;
        } else {
            console.warn('No data found in response.');
            throw new Error('No data found.');
        }

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw new Error('Error fetching dashboard data.');
    }
};


export const fetchMutualInterests = async (perPage, page, sortBy = "datetime") => {
    try {

        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Get_mutual_intrests/`, {
            profile_id: profileId,
            sort_by: sortBy,
            per_page: perPage,
            page_number: page,
        });

        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching mutual interests:", error);
        throw new Error('Error fetching mutual interests.');
    }
};

export const fetchMutualInterestsCount = async () => {
    try {

        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Get_mutual_intrests/`, {
            profile_id: profileId
        });

        if (response.data.Status === 1) {
            return response.data || [];
        } else {
            throw new Error('No mutual interest found.');
        }
    } catch (error) {
        console.error("Error fetching mutual interests:", error);
        throw new Error('Error fetching mutual interests.');
    }
};

export const fetchGalleryCount = async () => {
    try {

        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Get_Gallery_lists/`, {
            profile_id: profileId
        });

        if (response.data.Status === 1) {
            return response.data || [];
        } else {
            throw new Error('No gallery found.');
        }
    } catch (error) {
        console.error("Error fetching gallery:", error);
        throw new Error('Error fetching gallery.');
    }
};

export const getWishlistProfiles = async (perPage, page, sortBy = "datetime") => {

    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_profile_wishlist/`, {
            profile_id: profileId,
            sort_by: sortBy,
            per_page: perPage,
            page_number: page,
        });
        if (response.data.Status === 1) {
            //console.log(response)
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching profiles:", error);
        return [];
    }
};

export const getWishlistProfilesCount = async () => {

    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_profile_wishlist/`, {
            profile_id: profileId
        });
        if (response.data.Status === 1) {
            //console.log(response);

            return response.data;
        } else {
            console.error("Failed to fetch wishlist:", response.data.message);
            return [];
        }
    } catch (error) {
        // console.error("Error fetching wishlist:", error);
        return [];
    }
};

export const getInterestsList = async (perPage, page, sortBy = "datetime") => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/My_intrests_list/`, {
            profile_id: profileId,
            sort_by: sortBy,
            per_page: perPage,
            page_number: page
        });

        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
            // throw new Error(response.data.message);
        }
    } catch (error) {
        console.log("Error fetching profiles:", error);
        throw error;
    }
};

export const getInterestsListCount = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/My_intrests_list/`, {
            profile_id: profileId,
        });

        if (response.data.Status === 1) {
            return response.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        console.log("Error fetching profiles:", error);
        throw error;
    }
};

// Function to update the bookmark status
export const markProfileWishlist = async (profilebookmark_to, newStatus) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        await axios.post(`${BASE_URL}/Mark_profile_wishlist/`, {
            profile_id: profileId,
            profile_to: profilebookmark_to,
            status: newStatus,
        });

        if (newStatus === "1") {
            Toast.show({
                type: "success",
                text1: "Saved",
                text2: "Profile has been saved to bookmarks.",
                position: "bottom",
            });
        } else {
            Toast.show({
                type: "info",
                text1: "Unsaved",
                text2: "Profile has been removed from bookmarks.",
                position: "bottom",
            });
        }
    } catch (error) {
        console.error("Error updating bookmark status:", error);
        Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to update bookmark status.",
            position: "bottom",
        });
        throw error;
    }
};


// export const fetchViewedProfiles = async (perPage, page) => {
//     const profileId = await retrieveProfileId();
//     if (!profileId) {
//         console.warn('Profile ID is empty, skipping API call.');
//         return null;
//     }
//     try {
//         const response = await axios.post(`${BASE_URL}/My_viewed_profiles/`, {
//             profile_id: profileId,
//             per_page: perPage,
//             page_number: page,
//             sort_by: "datetime",
//             // page_number: "1"
//         });

//         if (response.data.Status === 1) {
//             return response.data;
//         } else {
//             // throw new Error(response.data.message);
//             return response.data;
//         }
//     } catch (error) {
//         console.error("Error fetching viewed profiles:", error);
//         throw error;
//     }
// };

export const fetchViewedProfiles = async (perPage, page, sortBy = "datetime") => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/My_viewed_profiles/`, {
            profile_id: profileId,
            per_page: perPage,
            page_number: page,
            sort_by: sortBy, // Use the sortBy parameter
        });

        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching viewed profiles:", error);
        throw error;
    }
};


export const fetchViewedProfilesCount = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/My_viewed_profiles/`, {
            profile_id: profileId,

        });

        if (response.data.Status === 1) {
            return response.data;
        } else {
            throw new Error(response.data.message);
        }
    } catch (error) {
        console.error("Error fetching viewed profiles:", error);
        throw error;
    }
};

export const fetchVisitorProfiles = async (perPage, page, sortBy = "datetime") => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(
            `${BASE_URL}/My_profile_visit/`,
            { profile_id: profileId, per_page: perPage, page_number: page, sort_by: sortBy, },
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        );

        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching visitor profiles:", error);
        throw error;
    }
};


export const fetchVisitorProfilesCount = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(
            `${BASE_URL}/My_profile_visit/`,
            { profile_id: profileId },
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        );

        const result = response.data;
        if (result.Status === 1) {
            return result;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error fetching visitor profiles:", error);
        throw error;
    }
};

export const fetchVysassistCount = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(
            `${BASE_URL}/My_vysassist_list/`,
            { profile_id: profileId },
            {
                headers: {
                    "Content-Type": "application/json",
                }
            }
        );

        const result = response.data;
        if (result.Status === 1) {
            return result;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Error fetching visitor profiles:", error);
        throw error;
    }
};

export const getPhotoByPassword = async (userProfileId, password) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_photo_bypassword/`, {
            profile_id: profileId,
            profile_to: userProfileId,
            photo_password: password
        });
        if (response.data.status === "success") {
            return response.data.data; // Assuming the data you need is in `response.data.data`
        } else {
            // console.error('Failed to fetch photo:', response.data.message);
            //alert("Wrong password");
            return null;
        }
    } catch (error) {
        console.error('Error fetching photo:', error);
        return null;
    }
};

export const getPersonalNotes = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_personal_notes/`, {
            profile_id: profileId,

        });
        if (response.data.Status === 1) {
            return response.data.data.profiles;
        } else {
            console.error("Failed to fetch personal notes:", response.data.message);
            return [];
        }
    } catch (error) {
        console.error("Error fetching personal notes:", error);
        return [];
    }
};



export const savePersonalNotes = async (profileTo, notes) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Save_personal_notes/`, {
            profile_id: profileId,
            profile_to: profileTo,
            notes: notes
        });

        // Check the response status and return data
        if (response.data.Status === 1) {
            return response.data;
        } else {
            console.error("Failed to save notes:", response.data.message);
            return response.data;
        }
    } catch (error) {
        console.error("Error saving notes:", error);
        throw error;
    }
};

export const getAdvanceSearchResults = async (perPage, pageNumber) => {
    try {
        // Retrieve the parameters from AsyncStorage
        const paramsString = await AsyncStorage.getItem('searchParams');
        if (!paramsString) {
            console.warn('Search parameters are empty, skipping API call.');
            return null;
        }

        const params = JSON.parse(paramsString);

        // Retrieve profile ID
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        // Include profile_id, per_page, and page_number in the params object
        const requestData = {
            profile_id: profileId,
            per_page: perPage,
            page_number: pageNumber,
            ...params,
        };
        console.log("requestData response all data==>", requestData)
        // Make the API call
        const response = await axios.post(`${BASE_URL}/Get_advance_search/`, requestData);
        console.log("Api response ==>", response)
        if (response.data.status === "failure") {
            console.log('response.data.status:', response.data.status);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: response.data.message,
            });
            return response.data;
        } else {
            return response.data;
        }
        // return response.data;
    } catch (error) {
        console.error('Error fetching search results:', error);
        throw error;
    }
};


export const Search_By_profileId = async (searchProfileId) => {

    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        // Return a structure that mimics a failure/empty response for robustness
        return { status: "failure", data: { message: "User not logged in." } };
    }
    try {
        const response = await axios.post(`${BASE_URL}/Search_byprofile_id/`,
            {
                profile_id: profileId,
                search_profile_id: searchProfileId,
            }
        );

        // ALWAYS return the full response body (which contains status and data)
        return response.data;

    } catch (error) {
        console.error("Error fetching profile:", error);
        // Throwing the error here will be caught by the catch block in handleFilterPress
        throw error;
    }
};

export const Search_By_profileId_matchingProfile = async (searchProfileId) => {

    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(
            `${BASE_URL}/Get_prof_list_match/`,
            {
                profile_id: profileId, // Ensure this value is available or passed appropriately
                search_profile_id: searchProfileId,
            }
        );
        console.log("rrrrrrrrrrrrrrrrr", response.data.Status);
        if (response.data.Status === 1) {
            return response.data; // Return the profile data from the API response
        } else {
            return response.data; // Return the profile data from the API response
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw new Error("Profile not found. Please check the profile ID.");
    }
};




export const getAlertSettings = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/Get_alert_settings/`);
        if (response.data.status === "1") {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to fetch alert settings.');
        }
    } catch (error) {
        console.error('Error fetching alert settings:', error);
        throw error;
    }
};

export const updateNotificationSettings = async (selectedvalues) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Update_notification_settings/`, {
            profile_id: profileId,
            Notifcation_enabled: selectedvalues,
        });

        if (response.data.status === "1") {
            console.log('Notification settings updated successfully:', response.data);
            return response.data;

            // Handle success (e.g., return result or success message)
        } else {
            console.error('Failed to update notification settings:', response.data);
            // Handle failure (e.g., return failure message)
            return response.data;
        }
    } catch (error) {
        console.error('Error updating notification settings:', error.message);
        // Handle error (e.g., return error message)
        return { success: false, message: error.message };
    }
};

export const updatePartnerPreferences = async (formattedData) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const payload = {
            ...formattedData,
            profile_id: profileId,
        };
        const response = await axios.post(`${BASE_URL}/Update_myprofile_partner/`, payload);
        return response;
    } catch (error) {
        console.error("Error updating partner preferences:", error);
        throw error;
    }
};


export const updateProfileVisibility = async (formattedData) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const payload = {
            ...formattedData,
            profile_id: profileId,
        };
        const response = await axios.post(`${BASE_URL}/Update_profile_visibility/`, payload);
        return response;
    } catch (error) {
        console.error("Error updating partner preferences:", error);
        throw error;
    }
};

export const handleSavePasswordChange = async (password, checked) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Update_photo_password/`, {
            profile_id: profileId,
            photo_password: password,
            photo_protection: checked ? 1 : 0,
        });
        console.log(response.data);
        if (response.data.status === 1) {
            console.log('Password updated successfully');
            return response;
        } else {
            console.error('Failed to update password:', response.data.message);
            return response;
        }
    } catch (error) {
        console.error('Error updating password:', error);
        return { success: false, message: 'Error updating password' };
    }
};


export const changeUserPassword = async (oldPassword, newPassword, confirmPassword) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    console.log(oldPassword);
    console.log(newPassword);
    console.log(confirmPassword);
    console.log(profileId);
    try {
        const response = await axios.post(`${BASE_URL}/User_change_password/`, {
            ProfileId: profileId,
            old_password: oldPassword,
            new_password: newPassword,
            Re_enter_new_password: confirmPassword,
        });
        console.log(response.data);
        return response.data; // Return the API response
    } catch (error) {
        // console.error('Error updating password:', error);
        throw error; // Re-throw the error so it can be caught in the component
    }
};

export const fetchAlertSettingsGet = async () => {
    try {
        const profileId = await retrieveProfileId();

        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        // Log profileId for debugging
        console.log('Fetching alert settings for Profile ID:', profileId);

        const response = await axios.post(`${BASE_URL}/Get_enabled_notifications/`, {
            profile_id: profileId
        });

        // Log response for debugging
        console.log('API response:', response.data.data);

        if (response.data.status === '1') {
            return response.data.data;
        } else {
            throw new Error('Failed to fetch alert settings: ' + (response.data.message || 'Unknown error'));
        }
    } catch (error) {
        // Log error details for debugging
        console.error('Error fetching alert settings:', error.response ? error.response.data : error.message);
        throw error;
    }
};


export const fetchPartnerProfile = async () => {

    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_myprofile_partner/`, { profile_id: profileId });
        const data = response.data.data;

        // Map the selected values for education, profession, and income
        const selectedEducation = data.partner_edu_id.split(',').map((id) => id.trim());
        const selectedFieldofStudy = data.partner_field_of_study.split(',').map((id) => id.trim());
        const selectedProfession = data.partner_profe.split(',').map((id) => id.trim());
        const selectedIncome = data.partner_ann_inc.split(',').map((id) => id.trim());
        const selectedIncomeMax = data.partner_ann_inc_max.split(',').map((id) => id.trim());
        const selectedStatus = data.partner_marital_status.split(',').map((id) => id.trim());
        // console.log(data.partner_fgn_Int);

        return {
            // fromAge: data.partner_age || '',
            fromAge: data.partner_age || '',
            fromHeight: data.partner_height_from || '',
            // toHeight: data.partner_height_to || '',
            toHeight: data.partner_height_to || '',
            education: selectedEducation,
            fieldofstudy: selectedFieldofStudy,
            maritalStatus: selectedStatus,
            income: selectedIncome,
            profession: selectedProfession,
            rahuKetuDhosam: data.partner_rahu_kethu || '',
            chevvaiDhosam: data.partner_chev_dho || '',
            foreignInterest: data.partner_forign_int || '',
            // incomeStatus: data.partner_ann_inc || '',
            incomeStatusMax: selectedIncomeMax,
        };
    } catch (error) {
        console.error('Error fetching partner profile:', error);
        throw error; // Rethrow the error so the calling function can handle it
    }
};

export const fetchPartnerProfilenew = async () => {
    // Assuming retrieveProfileId and BASE_URL are defined elsewhere
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_myprofile_partner/`, { profile_id: profileId });
        const data = response.data.data;

        // Helper function for safe splitting
        const safeSplit = (value) => {
            // Check if value is null/undefined or an empty string, if so return an empty array.
            // Otherwise, split the string.
            return (value && typeof value === 'string' && value.trim() !== '')
                ? value.split(',').map((id) => id.trim())
                : [];
        };

        // Apply safeSplit to all comma-separated fields
        const selectedEducation = safeSplit(data.partner_edu_id);
        const selectedFieldofStudy = safeSplit(data.partner_field_of_study);
        const selectedProfession = safeSplit(data.partner_profe);
        const selectedIncome = safeSplit(data.partner_ann_inc);
        const selectedIncomeMax = safeSplit(data.partner_ann_inc_max);
        const selectedStatus = safeSplit(data.partner_marital_status);

        return {
            fromAge: data.partner_age || '',
            fromHeight: data.partner_height_from || '',
            toHeight: data.partner_height_to || '',
            // Now these fields are guaranteed to be Arrays (or empty Arrays)
            education: selectedEducation,
            fieldofstudy: selectedFieldofStudy,
            maritalStatus: selectedStatus,
            profession: selectedProfession,

            // Income should be passed as the first element of the array if it exists, or empty string if array is empty
            // We use [0] because your original code mapped income to a single selection value
            income: selectedIncome[0] || '',
            incomeStatusMax: selectedIncomeMax[0] || '',

            rahuKetuDhosam: data.partner_rahu_kethu || '',
            chevvaiDhosam: data.partner_chev_dho || '',
            foreignInterest: data.partner_forign_int || '',
            partner_porutham_ids: data.partner_porutham_ids || '', // Ensure this is also safely retrieved
        };
    } catch (error) {
        console.error('Error fetching partner profile:', error);
        throw error;
    }
};



export const fetchProfileVisibility = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_profile_visibility/`, { profile_id: profileId });
        const data = response.data.data;

        if (!data || data.length === 0) {
            console.warn('No data found in response.');
            return null;
        }

        const visibility = data[0]; // Assuming the response contains an array
        console.log("Fetched Data:", visibility);

        // Map the selected values for education, profession, and income safely
        const selectedEducation = visibility.visibility_education
            ? visibility.visibility_education.split(',').map((id) => id.trim())
            : [];
        const selectedProfession = visibility.visibility_profession
            ? visibility.visibility_profession.split(',').map((id) => id.trim())
            : [];
        const selectedIncome = visibility.visibility_anual_income
            ? visibility.visibility_anual_income.split(',').map((id) => id.trim())
            : [];

        return {
            fromAge: visibility.visibility_age_from || '',
            toage: visibility.visibility_age_to || '',
            fromHeight: visibility.visibility_height_from || '',
            toHeight: visibility.visibility_height_to || '',
            education: selectedEducation,
            income: selectedIncome,
            profession: selectedProfession,
            rahuKetuDhosam: visibility.visibility_ragukethu || '',
            chevvaiDhosam: visibility.visibility_chevvai || '',
            foreignInterest: visibility.visibility_foreign_interest || '',
            incomeStatus: visibility.visibility_anual_income || '',
        };
    } catch (error) {
        console.error('Error fetching profile visibility:', error);
        throw error; // Rethrow the error for handling
    }
};





export const getFeaturedProfiles = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_Featured_List/`, {
            profile_id: profileId,
        });
        // console.log("gvgvhbh",response.data.data);
        if (response.data.status === 'success') {
            return response.data.data;
        } else {
            throw new Error('Failed to fetch profiless');
        }
    } catch (error) {
        console.error('Error fetching profiless:', error);
        throw error; // Re-throw error for handling in component
    }
};

export const fetchSuggestedProfiles = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_Suggested_List/`, {
            profile_id: profileId,

        });
        if (response.data.status === 'success') {
            return response.data.data;
        } else {
            throw new Error('Failed to fetch suggested profiles');
        }
    } catch (error) {
        console.error('Error fetching suggested profiles:', error);
        throw error;
    }
};


export const searchByProfileId = async (searchprofile_id) => {

    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Search_byprofile_id/`, {
            profile_id: profileId,
            search_profile_id: searchprofile_id
        });
        console.log("searchresult", response.data);


        if (response.data.status === 'success') {
            return response.data.data; // Return the array of profiles
        } else {
            throw new Error('Failed to fetch profiles');
        }
    } catch (error) {
        console.error('Error fetching profiles:', error);
        throw error; // Propagate the error to handle it in the component
    }
};

export const getNotifications = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_notification_list/`, {
            profile_id: profileId,
        });

        if (response.data.Status === 1) {
            return response.data.data;
        } else {
            throw new Error(`Failed to fetch notifications: ${response.data.message}`);
        }
    } catch (error) {
        throw new Error(`Error fetching notifications: ${error.message}`);
    }
};


export const fetchNotifications = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_notification_list/`, {
            profile_id: profileId,
        });
        if (response.data.Status === 1) {
            return response.data;
        } else {
            throw new Error("Failed to fetch notifications");
        }
    } catch (error) {
        throw new Error(`Error fetching notifications: ${error.message}`);
    }
};


export const markNotificationsAsRead = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        await axios.post(`${BASE_URL}/Read_notifications/`, {
            profile_id: profileId,
        });
    } catch (error) {
        throw new Error(`Error marking notifications as read: ${error.message}`);
    }
};

export const getProfileDetailsMatch = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Get_profile_det_match/`, {
            profile_id: profileId,
            user_profile_id: profileId,

        });
        // console.log("ssssssssssssssssss",response.data);

        return response.data; // Axios stores the response data in the `data` field
    } catch (error) {
        console.error('Error fetching profile details:', error);
        throw error;
    }
};


export const getMyProfilePersonal = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/get_myprofile_personal/`, {
            profile_id: profileId,
        });

        return response.data; // Return the data from the API
    } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error; // Throw the error to handle it in the calling function
    }
};

export const getMyEducationalDetails = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/get_myprofile_education/`, {
            profile_id: profileId,
        });

        return response.data; // Return the data from the API
    } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error; // Throw the error to handle it in the calling function
    }
};


export const getMyFamilyDetails = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/get_myprofile_family/`, {
            profile_id: profileId,
        });

        return response.data; // Return the data from the API
    } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error; // Throw the error to handle it in the calling function
    }
};


export const getMyHoroscopeDetails = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/get_myprofile_horoscope/`, {
            profile_id: profileId,
        });

        return response.data; // Return the data from the API
    } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error; // Throw the error to handle it in the calling function
    }
};


export const getMyContactDetails = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/get_myprofile_contact/`, {
            profile_id: profileId,
        });

        return response.data; // Return the data from the API
    } catch (error) {
        console.error('Error fetching profile data:', error);
        throw error; // Throw the error to handle it in the calling function
    }
};

export const fetchChatList = async () => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await fetch(`${BASE_URL}/Get_user_chatlist/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                profile_id: profileId,  // Accept dynamic profile_id
            }),
        });

        const data = await response.json();
        if (data.status === 1) {
            return data.data; // Return chat list data
        } else {
            console.error("Failed to fetch chat list");
            return [];
        }
    } catch (error) {
        console.error("Error in fetchChatList:", error);
        return [];
    }
};


export const fetchChatListSearch = async (search_id) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await fetch(`${BASE_URL}/Get_user_chatlist_search/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                profile_id: profileId,
                search_id: search_id, // Text input for search
            }),
        });

        const data = await response.json();
        if (data.status === 1) {
            return data.data;
        } else {
            console.error("Failed to fetch search results");
            return [];
        }
    } catch (error) {
        console.error("Error in fetchChatListSearch:", error);
        return [];
    }
};

export const createOrRetrieveChat = async (profileto) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        const response = await axios.post(`${BASE_URL}/Create_or_retrievechat/`, {
            profile_id: profileId,
            profile_to: profileto,
        });
        return response.data;  // Return the data from the response
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const fetchMessages = async (room_name) => {

    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {
        // Make the POST request using axios
        const response = await axios.post(`${BASE_URL}/GetMessages/`, {
            room_name: room_name,
            profile_id: profileId,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // Check if the response is successful
        if (response.status === 200) {
            return response.data.messages;  // Assuming 'messages' is the field in the response
        } else {
            console.error("Failed to fetch messages from the server");
        }
    } catch (error) {
        console.error("Error fetching messages:", error);
    }
    return [];
};

export const updateProfilePersonal = async (profileData) => {
    const profileId = await retrieveProfileId();  // Assuming you have a function that retrieves the profile ID
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    // Append the profileId to the profileData object
    const updatedProfileData = {
        ...profileData,
        profile_id: profileId,  // Add profile_id to the request payload
    };

    try {
        const response = await axios.post(`${BASE_URL}/update_myprofile_personal/`, updatedProfileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', JSON.stringify(error));
        throw error;
    }
};


export const updateProfileEducation = async (profileData) => {
    const profileId = await retrieveProfileId(); // Assuming you retrieve the profile ID here
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    // Append the profile ID if it's not included already
    const updatedProfileData = {
        ...profileData,
        profile_id: profileId,  // If not already provided, append profile_id
    };

    try {
        const response = await axios.post(`${BASE_URL}/update_myprofile_education/`, updatedProfileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};


export const updateProfileHoroscope = async (profileData) => {
    const profileId = await retrieveProfileId(); // Assuming you retrieve the profile ID here
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    // Append the profile ID if it's not included already
    const updatedProfileData = {
        ...profileData,
        profile_id: profileId,  // If not already provided, append profile_id
    };

    try {
        const response = await axios.post(`${BASE_URL}/update_myprofile_horoscope/`, updatedProfileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};



export const updateProfileFamily = async (profileData) => {
    const profileId = await retrieveProfileId();  // Assuming you have a function that retrieves the profile ID
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    // Append the profileId to the profileData object
    const updatedProfileData = {
        ...profileData,
        profile_id: profileId,  // Add profile_id to the request payload
    };
    console.log("sdkjfj==>", updatedProfileData)
    try {
        const response = await axios.post(`${BASE_URL}/update_myprofile_family/`, updatedProfileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};






export const updateProfileContact = async (profileData) => {
    const profileId = await retrieveProfileId(); // Assuming you retrieve the profile ID here
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    // Append the profile ID if it's not included already
    const updatedProfileData = {
        ...profileData,
        profile_id: profileId,  // If not already provided, append profile_id
    };

    try {
        const response = await axios.post(`${BASE_URL}/update_myprofile_contact/`, updatedProfileData);
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};



export const fetchImages = async (profileData) => {
    const profileId = await retrieveProfileId(); // Assuming you retrieve the profile ID here
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }



    try {
        const response = await axios.post(`${BASE_URL}/Get_profile_images/`, {
            profile_id: profileId,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

//remove image in myprofile
export const removeProfileImage = async (formData) => {
    try {
        const response = await axios.post(`${BASE_URL}/Remove_profile_img/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const result = response.data;

        if (result.success === 1) {
            return { success: true, message: result.message };
        } else {
            throw new Error(result.message || 'Failed to remove image');
        }
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Network error occurred');
    }
};

export const downloadPdf = async (idparam) => {
    console.log("idparam ==>", idparam)
    const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    // console.log("profileId ==>", `https://vysyamaladevnew-aehaazdxdzegasfb.westus2-01.azurewebsites.net/auth/New_horoscope_color/${idparam}/${profileId}/`)
    // const url = `http://apiupg.rainyseasun.com/auth/generate-pdf/${profileId}/${idparam}`;
    // const url = `https://vysyamaladev-afcbe2fdb9c7ckdv.westus2-01.azurewebsites.net/auth/generate-pdf/${profileId}/${idparam}`;
    // const url = `https://vysyamaladevnew-aehaazdxdzegasfb.westus2-01.azurewebsites.net/auth/New_horoscope_color/${idparam}/${profileId}/`;
    // const url = `https://vysyamaladevnew-aehaazdxdzegasfb.westus2-01.azurewebsites.net/auth/New_horoscope_color/${idparam}/${profileId}/`;
    const url = `https://app.vysyamala.com/auth/New_horoscope_color/${idparam}/${profileId}/`;
    const fileName = `pdf_${idparam}.pdf`;

    // Request storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
        return null;
    }

    // Request notification permission
    const notificationPermission = await Notifications.requestPermissionsAsync();
    if (!notificationPermission.granted) {
        console.warn('Notification permission not granted');
        return;
    }

    // Show initial download notification
    let notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Download Started',
            body: `Downloading ${fileName}...`,
            data: { idparam },
        },
        trigger: null,
    });

    try {
        let fileUri;
        let progress = 0;

        // Use Storage Access Framework (SAF) for Android 10+
        if (Platform.OS === 'android' && Platform.Version >= 29) {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
                console.warn('Permission to access the Documents folder was denied.');
                return null;
            }

            // Create the file in the user-selected directory
            fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/pdf'
            );

            // Download the file with progress tracking
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + fileName,
                {},
                (downloadProgress) => {
                    progress = Math.round(
                        (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                    );
                    updateDownloadNotification(notificationId, progress); // Update progress notification
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            const pdfData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

            // Write the PDF to the selected folder via SAF
            await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, pdfData, {
                encoding: FileSystem.EncodingType.Base64,
            });

        } else {
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + fileName,
                {},
                (downloadProgress) => {
                    progress = Math.round(
                        (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                    );
                    updateDownloadNotification(notificationId, progress); // Update progress notification
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            fileUri = uri;
        }

        // Complete notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Download Complete',
                body: `File saved to: ${fileUri}`,
            },
            trigger: null,
        });

        console.log('PDF downloaded successfully:', fileUri);

        // Automatically open the downloaded PDF
        openPdf(fileUri);

        return fileUri;

    } catch (error) {
        console.log('Error downloading PDF:', error.message);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Download Error',
                body: `Failed to download: ${error.message}`,
            },
            trigger: null,
        });
        return null;
    }
};

// Function to download the Matching Report PDF
export const downloadMatchingReportPdf = async (viewedProfileId) => {
    console.log("viewedProfileId for Matching Report ==>", viewedProfileId);

    // The current user's profile ID (the one generating the report)
    const currentProfileId = await retrieveProfileId();

    if (!currentProfileId) {
        console.warn('Current Profile ID is empty, skipping Matching Report API call.');
        return null;
    }

    // Construct the URL using the required format: /auth/generate-porutham-pdf-mobile/{currentProfileId}/{viewedProfileId}/
    const url = `https://app.vysyamala.com/auth/generate-porutham-pdf-mobile/${currentProfileId}/${viewedProfileId}/`;

    // Set the file name
    const fileName = `matching_report_${viewedProfileId}.pdf`;

    // --- The rest of the download logic is similar to downloadPdf ---

    // Request storage permission
    const hasPermission = await requestStoragePermission(); // You need this function defined globally or passed in
    if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
        return null;
    }

    // Request notification permission
    const notificationPermission = await Notifications.requestPermissionsAsync(); // You need Notifications imported
    if (!notificationPermission.granted) {
        console.warn('Notification permission not granted');
        // return; // Don't return here, just warn, as the download can still proceed.
    }

    // Show initial download notification
    let notificationId;
    try {
        notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Matching Report Download Started',
                body: `Downloading ${fileName}...`,
                data: { viewedProfileId },
            },
            trigger: null,
        });
    } catch (e) {
        console.warn("Could not schedule notification:", e);
    }


    try {
        let fileUri;
        let progress = 0;

        // You'll need the same logic for Android SAF and FileSystem download/writing
        // For simplicity, sticking to the existing logic from downloadPdf for demonstration:

        const downloadCallback = (downloadProgress) => {
            progress = Math.round(
                (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
            );
            if (notificationId) {
                updateDownloadNotification(notificationId, progress); // You need this function defined
            }
        };

        const downloadResumable = FileSystem.createDownloadResumable(
            url,
            FileSystem.documentDirectory + fileName,
            {},
            downloadCallback
        );

        const { uri } = await downloadResumable.downloadAsync();
        fileUri = uri;

        // If Android >= 29 (SAF logic) is implemented: 
        // You'd repeat the check from downloadPdf here and potentially write the file
        // to the user-selected location after downloading it to a temporary location (uri).

        // Complete notification
        if (notificationId) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Download Complete',
                    body: `Matching Report saved to: ${fileUri}`,
                },
                trigger: null,
            });
        }

        console.log('Matching Report PDF downloaded successfully:', fileUri);

        // Automatically open the downloaded PDF
        // openPdf(fileUri); // You need this function defined globally or imported

        return fileUri;

    } catch (error) {
        console.log('Error downloading Matching Report PDF:', error.message);
        if (notificationId) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Download Error',
                    body: `Failed to download: ${error.message}`,
                },
                trigger: null,
            });
        }
        return null;
    }
};


// Function to request storage permission
async function requestStoragePermission() {
    if (Platform.OS === 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        return status === 'granted';
    }
    return true; // iOS does not need explicit permission for document directory
}

// Function to update download progress in the notification
async function updateDownloadNotification(notificationId, progress) {
    await Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Download in Progress',
            body: `Downloading... ${progress}% complete`,
        },
        identifier: notificationId,
    });
}

// Function to open the PDF file
const openPdf = async (fileUri) => {
    if (Platform.OS === 'android') {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: fileUri,
            flags: 1,
            type: 'application/pdf',
        });
    } else if (Platform.OS === 'ios') {
        await Linking.openURL(fileUri);
    }
};


export const uploadImageToServer = async (formData) => {
    const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    // Append profile_id to formData after confirming it's not empty
    formData.append("profile_id", profileId);

    try {
        console.log("image formdata ==>", JSON.stringify(formData), `${BASE_URL}/ImageSetEdit/`)
        const response = await axios.post(`${BASE_URL}/ImageSetEdit/`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data; // Return the API response data
    } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("Image upload failed. Please try again.");
    }
};

export const fetchSearchProfiles = async (
    search_profile_id,
    profession,
    age,
    location,
    page_number,
    per_page
) => {
    const profileId = await retrieveProfileId();

    if (!profileId) {
        console.warn("⚠️ No profile id found!");
        return null;
    }

    const requestBody = {
        profile_id: profileId,
        search_profile_id: search_profile_id,
        search_profession: profession,
        search_age: age,
        search_location: location,
        page_number: page_number,
        per_page: per_page
    };

    console.log("📌 RAW API REQUEST BODY (Common Function):", JSON.stringify(requestBody, null, 2));

    try {
        const response = await axios.post(
            `${BASE_URL}/Get_prof_list_match/`,
            requestBody,
            { headers: { "Content-Type": "application/json" } }
        );

        return response.data;
    } catch (error) {
        console.error("❌ Error in fetchSearchProfiles:", error);
        throw error;
    }
};

export const downloadPdfPorutham = async () => {
    const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    const url = `http://apiupg.rainyseasun.com/auth/generate-pdf/${profileId}/${profileId}`;
    const fileName = `pdf_${profileId}.pdf`;

    // Request storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
        return null;
    }

    // Request notification permission
    const notificationPermission = await Notifications.requestPermissionsAsync();
    if (!notificationPermission.granted) {
        console.warn('Notification permission not granted');
        return;
    }

    // Show initial download notification
    let notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Download Started',
            body: `Downloading ${fileName}...`,
            data: { profileId },
        },
        trigger: null,
    });

    try {
        let fileUri;
        let progress = 0;

        // Use Storage Access Framework (SAF) for Android 10+
        if (Platform.OS === 'android' && Platform.Version >= 29) {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
                console.warn('Permission to access the Documents folder was denied.');
                return null;
            }

            // Create the file in the user-selected directory
            fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/pdf'
            );

            // Download the file with progress tracking
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + fileName,
                {},
                (downloadProgress) => {
                    progress = Math.round(
                        (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                    );
                    updateDownloadNotification(notificationId, progress); // Update progress notification
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            const pdfData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

            // Write the PDF to the selected folder via SAF
            await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, pdfData, {
                encoding: FileSystem.EncodingType.Base64,
            });

        } else {
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + fileName,
                {},
                (downloadProgress) => {
                    progress = Math.round(
                        (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                    );
                    updateDownloadNotification(notificationId, progress); // Update progress notification
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            fileUri = uri;
        }

        // Complete notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Download Complete',
                body: `File saved to: ${fileUri}`,
            },
            trigger: null,
        });

        console.log('PDF downloaded successfully:', fileUri);

        // Automatically open the downloaded PDF
        openPdf(fileUri);

        return fileUri;

    } catch (error) {
        console.log('Error downloading PDF:', error.message);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Download Error',
                body: `Failed to download: ${error.message}`,
            },
            trigger: null,
        });
        return null;
    }
};



export const fetchProfileStatus = async (profile_to) => {
    const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {

        const response = await axios.post(`${BASE_URL}/Get_expresint_status/`, {
            profile_id: profileId,
            profile_to: profile_to
        });
        console.log("Interest Status:", response.data.data.interest_status);
        return response.data.data.interest_status; // Return the status
    } catch (error) {
        console.error("Failed to fetch profile status:", error);
        return null; // Return null in case of an error
    }
};




export const fetchProfileStatusNew = async (profile_to) => {
    const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }
    try {

        const response = await axios.post(`${BASE_URL}/Get_expresint_status/`, {
            profile_id: profileId,
            profile_to: profile_to
        });
        console.log("Interest Status:", response.data.data.interest_status);
        return response.data.data.interest_status; // Return the status
    } catch (error) {
        console.error("Failed to fetch profile status:", error);
        return null; // Return null in case of an error
    }
};


export const updateProfileInterest = async (profileFrom, status) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        const response = await axios.post(`${BASE_URL}/Update_profile_intrests/`, {
            profile_id: profileId,
            profile_from: profileFrom,
            status: status
        });

        return response.data;
    } catch (error) {
        throw new Error('Error updating profile interests.');
    }
};


export const sendPhotoRequest = async (viewedprofileid) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Send_photo_request/`,
            {
                profile_id: profileId,
                profile_to: viewedprofileid,
                status: 1,
            }
        );
        return response.data; // Return response data only
    } catch (error) {
        console.error(
            "Error sending photo request:",
            error.response ? error.response.data : error.message
        );
        throw error; // Propagate the error for handling in the component
    }
};


export const sendVysassistRequest = async (viewedid, message) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        console.log("viewedid:", viewedid, "message:", message);

        const response = await axios.post(`${BASE_URL}/Send_vysassist_request/`, {
            profile_id: profileId,
            profile_to: viewedid,
            status: 1,
            to_message: message,
        });

        console.log("Response Data:", response.data); // Logs the response data to verify
        return response.data; // Returns the API response
    } catch (error) {
        console.error(
            'Error sending Vysassist request:',
            error.response ? error.response.data : error.message
        );
        throw error; // Re-throw the error for handling by the caller
    }
};

export const fetchPhotoRequest = async (perPage, page, sortBy = "datetime") => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Get_photo_request_list/`,
            {
                profile_id: profileId,
                sort_by: sortBy,
                per_page: perPage,
                page_number: page,
            }
        );

        if (response.data.Status === 1) {
            // Return the complete data structure
            return {
                success: true,
                data: response.data.data,
                Status: response.data.Status
            };
        } else {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: response.data.message,
            });
            return {
                success: false,
                data: null,
                Status: response.data.Status
            };
        }
    } catch (error) {
        Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load profiles.",
        });
        console.error(error);
        return {
            success: false,
            data: null,
            Status: 0
        };
    }
};



export const fetchPhotoRequestNew = async () => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Get_photo_request_list/`,
            {
                profile_id: profileId,
            }
        );

        if (response.data.Status === 1) {
            return { success: true, profiles: response };
        } else {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: response.data.message,
            });
            return { success: false, profiles: [] };
        }
    } catch (error) {
        Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to load profiles.",
        });
        console.error(error);
        return { success: false, profiles: [] };
    }
};


export const updatePhotoRequest = async (selectedProfileId, status = "2") => {
    try {

        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Update_photo_request/`,
            {
                profile_id: profileId,
                profile_from: selectedProfileId,
                status,
            }
        );

        if (response.data.Status === 1) {
            Toast.show({
                type: "success",
                text1: "Success",
                text2: "Photo request accepted successfully.",
            });
            return true;
        } else {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: response.data.message || "Failed to accept the request.",
            });
            return false;
        }
    } catch (error) {
        Toast.show({
            type: "error",
            text1: "Error",
            text2: "An error occurred while accepting the request.",
        });
        console.error(error);
        return false;
    }
};


export const updatePhotoRequestReject = async (selectedProfileId, rejectionReason, status = "3") => {
    try {

        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        console.log("idddd", selectedProfileId);
        const response = await axios.post(`${BASE_URL}/Update_photo_request/`,
            {
                profile_id: profileId,
                profile_from: selectedProfileId,
                response_message: rejectionReason,
                status,
            }
        );

        if (response.data.Status === 1) {
            Toast.show({
                type: "success",
                text1: "Rejected",
                text2: "Photo request Rejected successfully.",
            });
            return true;
        } else {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: response.data.message || "Failed to accept the request.",
            });
            return false;
        }
    } catch (error) {
        Toast.show({
            type: "error",
            text1: "Error",
            text2: "An error occurred while accepting the request.",
        });
        console.error(error);
        return false;
    }
};


export const fetchPersonalNotes = async (perPage, page, sortBy = "datetime") => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Get_personal_notes/`,
            {
                profile_id: profileId,
                sort_by: sortBy,
                per_page: perPage,
                page_number: page,
            }
        );

        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error('Error fetching personal notes:', error.message);
        return [];
    }
};


export const fetchPersonalNotesCount = async () => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }
        const response = await axios.post(`${BASE_URL}/Get_personal_notes/`,
            {
                profile_id: profileId,
            }
        );

        //   if (response.data?.Status === 1) {
        //     const profiles = response.data.personal_note_count || [];
        //     console.log('Fetched Profiles:', profiles); // Debugging line
        //     return profiles; // Store or use the profiles as needed
        //   } else {
        //     console.error('Failed to fetch personal notes:', response.data?.message);
        //     return [];
        //   }
        if (response.data.Status === 1) {
            //console.log(response);

            return response.data;
        } else {
            console.error("Failed to fetch personal notes:", response.data.message);
            return [];
        }
    } catch (error) {
        console.error('Error fetching personal notes:', error.message);
        return [];
    }
};

// profile compl edit
export const ProfileCompletionFormAPI = async (formData) => {
    try {
        console.log("image formdata ==>", JSON.stringify(formData), `${BASE_URL}/Profile_other_fields/`)
        const response = await axios.post(`${BASE_URL}/Profile_other_fields/`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching data:", error.message);
        throw error;
    }
};

export const downloadPdfmyprofile = async (idparam) => {
    // const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
    // if (!profileId) {
    //     console.warn('Profile ID is empty, skipping API call.');
    //     return null;
    // }

    // const url = `http://apiupg.rainyseasun.com/auth/My_horoscope_pdf_color/${idparam}`;
    // const url = `https://vysyamaladevnew-aehaazdxdzegasfb.westus2-01.azurewebsites.net/auth/My_horoscope_pdf_color/${idparam}`;
    const url = `${BASE_URL}/My_horoscope_pdf_color/${idparam}`;
    const fileName = `pdf_${idparam}.pdf`;

    // Request storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
        return null;
    }

    // Request notification permission
    const notificationPermission = await Notifications.requestPermissionsAsync();
    if (!notificationPermission.granted) {
        console.warn('Notification permission not granted');
        return;
    }

    // Show initial download notification
    let notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Download Started',
            body: `Downloading ${fileName}...`,
            data: { idparam },
        },
        trigger: null,
    });

    try {
        let fileUri;
        let progress = 0;

        // Use Storage Access Framework (SAF) for Android 10+
        if (Platform.OS === 'android' && Platform.Version >= 29) {
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
                console.warn('Permission to access the Documents folder was denied.');
                return null;
            }

            // Create the file in the user-selected directory
            fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                permissions.directoryUri,
                fileName,
                'application/pdf'
            );

            // Download the file with progress tracking
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + fileName,
                {},
                (downloadProgress) => {
                    progress = Math.round(
                        (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                    );
                    updateDownloadNotification(notificationId, progress); // Update progress notification
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            const pdfData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

            // Write the PDF to the selected folder via SAF
            await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, pdfData, {
                encoding: FileSystem.EncodingType.Base64,
            });

        } else {
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                FileSystem.documentDirectory + fileName,
                {},
                (downloadProgress) => {
                    progress = Math.round(
                        (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                    );
                    updateDownloadNotification(notificationId, progress); // Update progress notification
                }
            );

            const { uri } = await downloadResumable.downloadAsync();
            fileUri = uri;
        }

        // Complete notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Download Complete',
                body: `File saved to: ${fileUri}`,
            },
            trigger: null,
        });

        console.log('PDF downloaded successfully:', fileUri);

        // Automatically open the downloaded PDF
        openPdf(fileUri);

        return fileUri;

    } catch (error) {
        console.log('Error downloading PDF:', error.message);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Download Error',
                body: `Failed to download: ${error.message}`,
            },
            trigger: null,
        });
        return null;
    }
};

// Create Order paymnet
export const createOrder = async (amount, profileID, planID, packageids) => {
    try {

        // Sending the POST request with the required params
        const response = await axios.post(`${BASE_URL}/create-orderid/`,
            {
                amount: amount,
                profile_id: profileID,
                plan_id: planID,
                addon_package_id: packageids
            }
        );
        // Log the response data
        console.log("Create Order response:", response.data);

        // Check if the response is successful (status code 200 or 201)
        if (!response.data || (response.status !== 200)) {
            throw new Error("Failed to create order. Unexpected response.");
        }

        // If successful, return the order details (response.data)
        return response.data;
    } catch (error) {
        //   console.error("Error creating order:", error.response?.data?.error || error.message || error);

        // Provide a user-friendly message only for actual errors
        const backendError = error.response?.data?.error;
        if (backendError) {
            throw new Error(backendError);
        } else {
            throw new Error("Unable to create order. Please try again later.");
        }
    }
};

// verify payment razorpay
export const verifyPayment = async (profileID, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    try {

        // Sending the POST request with the required params
        const response = await axios.post(`${BASE_URL}/razorpay-webhook/`,
            {
                profile_id: profileID,
                order_id: razorpayOrderId,
                payment_id: razorpayPaymentId,
                signature: razorpaySignature,
            }
        );
        // Log the response data
        console.log("Create verify response:", response.data);

        // Check if the response is successful (status code 200 or 201)
        if (!response.data || (response.status !== 200)) {
            throw new Error("Failed to create verify. Unexpected response.");
        }

        // If successful, return the order details (response.data)
        return response.data;
    } catch (error) {
        console.error("Error creating verify:", error.message || error);

        // Provide a user-friendly message only for actual errors
        const errorMessage = error.response?.data?.message || "Unable to create verify. Please try again later.";
        throw new Error(errorMessage);
    }
};

//save plan and packages api
export const savePlanPackage = async (
    profileId,
    selectedPlanId,
    selectedAddons,
    totalAmount,
    gpay_online // Make it optional (no default value)
) => {
    try {
        const packageids = selectedAddons.join(",");

        // Create request body dynamically
        const requestBody = {
            profile_id: profileId,
            plan_id: selectedPlanId,
            addon_package_id: packageids,
            total_amount: totalAmount
        };

        // Only add gpay_online to request if it's provided
        if (gpay_online !== undefined) {
            requestBody.gpay_online = gpay_online;
        }

        console.log("Saving plan package with data:", JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `${BASE_URL}/Save_plan_package/`,
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Save plan package response:", response.data);

        if (response.data.status === "success" || response.data.Status === 1) {
            return {
                success: true,
                message: response.data.message || "Plan package saved successfully",
            };
        } else {
            console.error("Error saving plan package:", JSON.stringify(response.data));
            return {
                success: false,
                message: response.data.message || "Failed to save plan package",
            };
        }
    } catch (error) {
        console.error("Error saving plan package:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Error saving plan package. Please try again.",
        };
    }
};

export const getVysassistList = async (perPage, page, sortBy = "datetime") => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        const requestData = {
            profile_id: profileId,
            sort_by: sortBy,
            per_page: perPage,
            page_number: page,
        };

        const response = await axios.post(`${BASE_URL}/My_vysassist_list/`, requestData);
        console.log("Vysassist API response ==>", response);

        if (response.data.Status === 1) {
            return response.data;
        } else {
            return response.data;
        }
    } catch (error) {
        console.error('Error fetching Vysassist list:', error);
        throw error;
    }
};

export const getGalleryList = async (perPage, pageNumber) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        const requestData = {
            profile_id: profileId,
            per_page: perPage,
            page_number: pageNumber,
        };

        const response = await axios.post(`${BASE_URL}/Get_Gallery_lists/`, requestData);
        console.log("Gallery API response ==>", JSON.stringify(response.data));

        if (response.data.Status === 1) {
            console.log("Gallery API data response ==>", JSON.stringify(response.data));
            return response.data;
        } else {
            console.log("Gallery API data - response ==>", JSON.stringify(response.data));
            return response.data;
        }
    } catch (error) {
        console.error('Error fetching Vysassist list:', error);
        throw error;
    }
};

// export const callRequestDetails = async (formdata) => {
//     try {
//         const response = await axios.post(`${BASE_URL}/Click_call_request/`,
//             formdata,
//             {
//                 headers: {
//                     "Content-Type": "multipart/form-data",
//                 },
//             });
//         if (response.data.Status === 1) {
//             return response.data;
//         } else {
//             return response.data;
//         }
//     } catch (error) {
//         console.error('Error fetching request details:', error);
//         throw error;
//     }
// };

export const callRequestDetails = async (formdata) => {
    try {
        const response = await axios.post(`${BASE_URL}/Click_call_request/`,
            formdata,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    // If your API requires auth tokens, add them here:
                    // "Authorization": `Bearer ${token}` 
                },
            });
        return response.data; // Consistently return the data object
    } catch (error) {
        console.error('API Error in callRequestDetails:', error.message);
        throw error; // Let the handlePhoneCall function catch the error
    }
};

export const downloadPdfPoruthamNew = async (idparam) => {
    const profileId = await retrieveProfileId();
    if (!profileId) {
        console.warn('Profile ID is empty, skipping API call.');
        return null;
    }

    const url = `${BASE_URL}/generate-porutham-pdf-mobile/${profileId}/${idparam}`;
    const fileName = `pdf_${idparam}.pdf`;

    // Request storage permission
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
        Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
        return null;
    }

    // Request notification permission
    const notificationPermission = await Notifications.requestPermissionsAsync();
    if (!notificationPermission.granted) {
        console.warn('Notification permission not granted');
    }

    // Show initial download notification
    let notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Download Started',
            body: `Downloading ${fileName}...`,
            data: { idparam },
        },
        trigger: null,
    });

    try {
        // First, make a fetch request to check the response type
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/pdf, application/json',
            },
        });

        const contentType = response.headers.get('content-type');

        // Check if response is JSON (error response)
        if (contentType && contentType.includes('application/json')) {
            const jsonData = await response.json();

            // Cancel the notification for error case
            await Notifications.dismissNotificationAsync(notificationId);

            // Return the error response
            return jsonData;
        }

        // If it's a PDF, proceed with download
        if (response.ok && contentType && contentType.includes('application/pdf')) {
            let fileUri;
            let progress = 0;

            // Use Storage Access Framework (SAF) for Android 10+
            if (Platform.OS === 'android' && Platform.Version >= 29) {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (!permissions.granted) {
                    console.warn('Permission to access the Documents folder was denied.');
                    await Notifications.dismissNotificationAsync(notificationId);
                    return null;
                }

                // Create the file in the user-selected directory
                fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    fileName,
                    'application/pdf'
                );

                // Download the file with progress tracking
                const downloadResumable = FileSystem.createDownloadResumable(
                    url,
                    FileSystem.documentDirectory + fileName,
                    {},
                    (downloadProgress) => {
                        progress = Math.round(
                            (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                        );
                        updateDownloadNotification(notificationId, progress);
                    }
                );

                const { uri } = await downloadResumable.downloadAsync();
                const pdfData = await FileSystem.readAsStringAsync(uri, {
                    encoding: FileSystem.EncodingType.Base64
                });

                // Write the PDF to the selected folder via SAF
                await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, pdfData, {
                    encoding: FileSystem.EncodingType.Base64,
                });

            } else {
                const downloadResumable = FileSystem.createDownloadResumable(
                    url,
                    FileSystem.documentDirectory + fileName,
                    {},
                    (downloadProgress) => {
                        progress = Math.round(
                            (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                        );
                        updateDownloadNotification(notificationId, progress);
                    }
                );

                const { uri } = await downloadResumable.downloadAsync();
                fileUri = uri;
            }

            // Complete notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Download Complete',
                    body: `File saved to: ${fileUri}`,
                },
                trigger: null,
            });

            console.log('PDF downloaded successfully:', fileUri);

            // Automatically open the downloaded PDF
            openPdf(fileUri);

            return fileUri;
        }

        throw new Error('Unexpected response format');

    } catch (error) {
        console.log('Error downloading PDF:', error.message);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Download Error',
                body: `Failed to download: ${error.message}`,
            },
            trigger: null,
        });
        return null;
    }
};
// Fetch profile data API call
export const fetchProfileDataCheck = async (viewedProfileId, pageID) => {
    try {
        const profileId = await retrieveProfileId();
        if (!profileId) {
            console.warn('Profile ID is empty, skipping API call.');
            return null;
        }

        const response = await axios.post(`${BASE_URL}/Get_profile_det_match/`, {
            profile_id: profileId,
            user_profile_id: viewedProfileId,
            page_id: pageID
        });
        console.log("response.data", JSON.stringify(response));
        return response.data;

    } catch (error) {
        console.error("Error fetching profile data:", error);
        throw error;
    }
};

// Add this to your CommonApiCall/CommonApiCall.js file
export const getProfileListMatch = async (allProfileIds) => {
    try {
        const token = await AsyncStorage.getItem("authToken");
        const loginuser_profileId = await AsyncStorage.getItem("loginuser_profileId");

        const formData = new FormData();
        formData.append('all_profile_ids', allProfileIds);

        const response = await axios.post(
            `${Base_Url}/auth/Get_prof_list_match/`,
            formData,
            {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        if (response.data) {
            console.log("Profile list match response:", response.data);
            return response.data;
        }
    } catch (error) {
        console.error("Error fetching profile list match:", error);
        return null;
    }
};

export const fetchRasiImage = async (profileId) => {
    try {
        if (!profileId) return { status: 0, message: "Profile ID missing" };

        const timestamp = new Date().getTime();
        const url = `https://app.vysyamala.com/auth/rasi-image/?profile_id=${profileId}&t=${timestamp}`;

        const response = await fetch(url);
        if (response.status === 200) {
            const htmlString = await response.text();
            return { status: 1, html: htmlString };
        }
        return { status: 0, message: "Chart not available" };
    } catch (error) {
        return { status: 0, message: "Network error" };
    }
};

export const fetchAmsamImage = async (profileId) => {
    try {
        if (!profileId) return { status: 0, message: "Profile ID missing" };

        const timestamp = new Date().getTime();
        const url = `https://app.vysyamala.com/auth/amsa-image/?profile_id=${profileId}&t=${timestamp}`;

        const response = await fetch(url);
        if (response.status === 200) {
            const htmlString = await response.text();
            return { status: 1, html: htmlString };
        }
        return { status: 0, message: "Chart not available" };
    } catch (error) {
        return { status: 0, message: "Network error" };
    }
};

// export const downloadPdfPoruthamNew = async (idparam) => {

//     const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
//     if (!profileId) {
//         console.warn('Profile ID is empty, skipping API call.');
//         return null;
//     }

//     const url = `http://apiupg.rainyseasun.com/auth/generate-porutham-pdf-mobile/${profileId}/${profileId}`;
//     const fileName = `pdf_${profileId}.pdf`;

//     // Request storage permission
//     const hasPermission = await requestStoragePermission();
//     if (!hasPermission) {
//         Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
//         return null;
//     }

//     // Request notification permission
//     const notificationPermission = await Notifications.requestPermissionsAsync();
//     if (!notificationPermission.granted) {
//         console.warn('Notification permission not granted');
//         return;
//     }

//     // Show initial download notification
//     let notificationId = await Notifications.scheduleNotificationAsync({
//         content: {
//             title: 'Download Started',
//             body: `Downloading ${fileName}...`,
//             data: { profileId },
//         },
//         trigger: null,
//     });

//     try {
//         let fileUri;
//         let progress = 0;

//         // Use Storage Access Framework (SAF) for Android 10+
//         if (Platform.OS === 'android' && Platform.Version >= 29) {
//             const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
//             if (!permissions.granted) {
//                 console.warn('Permission to access the Documents folder was denied.');
//                 return null;
//             }

//             // Create the file in the user-selected directory
//             fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
//                 permissions.directoryUri,
//                 fileName,
//                 'application/pdf'
//             );

//             // Download the file with progress tracking
//             const downloadResumable = FileSystem.createDownloadResumable(
//                 url,
//                 FileSystem.documentDirectory + fileName,
//                 {},
//                 (downloadProgress) => {
//                     progress = Math.round(
//                         (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
//                     );
//                     updateDownloadNotification(notificationId, progress); // Update progress notification
//                 }
//             );

//             const { uri } = await downloadResumable.downloadAsync();
//             const pdfData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

//             // Write the PDF to the selected folder via SAF
//             await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, pdfData, {
//                 encoding: FileSystem.EncodingType.Base64,
//             });

//         } else {
//             const downloadResumable = FileSystem.createDownloadResumable(
//                 url,
//                 FileSystem.documentDirectory + fileName,
//                 {},
//                 (downloadProgress) => {
//                     progress = Math.round(
//                         (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
//                     );
//                     updateDownloadNotification(notificationId, progress); // Update progress notification
//                 }
//             );

//             const { uri } = await downloadResumable.downloadAsync();
//             fileUri = uri;
//         }

//         // Complete notification
//         await Notifications.scheduleNotificationAsync({
//             content: {
//                 title: 'Download Complete',
//                 body: `File saved to: ${fileUri}`,
//             },
//             trigger: null,
//         });

//         console.log('PDF downloaded successfully:', fileUri);

//         // Automatically open the downloaded PDF
//         openPdf(fileUri);

//         return fileUri;

//     } catch (error) {
//         console.log('Error downloading PDF:', error.message);
//         await Notifications.scheduleNotificationAsync({
//             content: {
//                 title: 'Download Error',
//                 body: `Failed to download: ${error.message}`,
//             },
//             trigger: null,
//         });
//         return null;
//     }

//     // const profileId = await retrieveProfileId(); // Implement this to retrieve the profile ID
//     // if (!profileId) {
//     //     console.warn('Profile ID is empty, skipping API call.');
//     //     return null;
//     // }

//     // const url = `https://vysyamaladev-afcbe2fdb9c7ckdv.westus2-01.azurewebsites.net/auth/generate-porutham-pdf`;
//     // const fileName = `pdf_${idparam}.pdf`;

//     // // Request storage permission
//     // const hasPermission = await requestStoragePermission();
//     // if (!hasPermission) {
//     //     Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
//     //     return null;
//     // }

//     // // Request notification permission
//     // const notificationPermission = await Notifications.requestPermissionsAsync();
//     // if (!notificationPermission.granted) {
//     //     console.warn('Notification permission not granted');
//     //     return;
//     // }

//     // // Show initial download notification
//     // let notificationId = await Notifications.scheduleNotificationAsync({
//     //     content: {
//     //         title: 'Download Started',
//     //         body: `Downloading ${fileName}...`,
//     //         data: { idparam },
//     //     },
//     //     trigger: null,
//     // });

//     // try {
//     //     let fileUri;
//     //     let progress = 0;

//     //     // Use Storage Access Framework (SAF) for Android 10+
//     //     if (Platform.OS === 'android' && Platform.Version >= 29) {
//     //         const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
//     //         if (!permissions.granted) {
//     //             console.warn('Permission to access the Documents folder was denied.');
//     //             return null;
//     //         }

//     //         // Create the file in the user-selected directory
//     //         fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
//     //             permissions.directoryUri,
//     //             fileName,
//     //             'application/pdf'
//     //         );

//     //         // Download the file with progress tracking using POST request with payload
//     //         const downloadResumable = FileSystem.createDownloadResumable(
//     //             url,
//     //             FileSystem.documentDirectory + fileName,
//     //             {
//     //                 method: 'POST',
//     //                 headers: {
//     //                     'Content-Type': 'application/json',
//     //                 },
//     //                 body: JSON.stringify({
//     //                     profile_id: profileId,
//     //                     id_param: idparam
//     //                 })
//     //             },
//     //             (downloadProgress) => {
//     //                 progress = Math.round(
//     //                     (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
//     //                 );
//     //                 updateDownloadNotification(notificationId, progress); // Update progress notification
//     //             }
//     //         );

//     //         const { uri } = await downloadResumable.downloadAsync();
//     //         const pdfData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

//     //         // Write the PDF to the selected folder via SAF
//     //         await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, pdfData, {
//     //             encoding: FileSystem.EncodingType.Base64,
//     //         });

//     //     } else {
//     //         const downloadResumable = FileSystem.createDownloadResumable(
//     //             url,
//     //             FileSystem.documentDirectory + fileName,
//     //             {
//     //                 method: 'POST',
//     //                 headers: {
//     //                     'Content-Type': 'application/json',
//     //                 },
//     //                 body: JSON.stringify({
//     //                     profile_id: profileId,
//     //                     id_param: idparam
//     //                 })
//     //             },
//     //             (downloadProgress) => {
//     //                 progress = Math.round(
//     //                     (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
//     //                 );
//     //                 updateDownloadNotification(notificationId, progress); // Update progress notification
//     //             }
//     //         );

//     //         const { uri } = await downloadResumable.downloadAsync();
//     //         fileUri = uri;
//     //     }

//     //     // Complete notification
//     //     await Notifications.scheduleNotificationAsync({
//     //         content: {
//     //             title: 'Download Complete',
//     //             body: `File saved to: ${fileUri}`,
//     //         },
//     //         trigger: null,
//     //     });

//     //     console.log('PDF downloaded successfully:', fileUri);

//     //     // Automatically open the downloaded PDF
//     //     openPdf(fileUri);

//     //     return fileUri;

//     // } catch (error) {
//     //     console.log('Error downloading PDF:', error.message);
//     //     await Notifications.scheduleNotificationAsync({
//     //         content: {
//     //             title: 'Download Error',
//     //             body: `Failed to download: ${error.message}`,
//     //         },
//     //         trigger: null,
//     //     });
//     //     return null;
//     // }
// };