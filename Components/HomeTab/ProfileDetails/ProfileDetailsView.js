import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { FontAwesome5, MaterialIcons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../../API/Apiurl';

export const ProfileDetailsView = ({ viewedProfileId }) => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for toggling personal details
    const [showPersonalDetails, setShowPersonalDetails] = useState(true);
    const [showEducationDetails, setShowEducationDetails] = useState(false);
    const [showFamilyDetails, setShowFamilyDetails] = useState(false);
    const [showHoroscopeDetails, setShowHoroscopeDetails] = useState(false);
    const [showContactDetails, setShowContactDetails] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            const loginuser_profileId = await AsyncStorage.getItem("loginuser_profileId");
            console.log("Login & view id ==>", loginuser_profileId, viewedProfileId);

            setLoading(true);
            try {
                const response = await axios.post(
                    `${config.apiUrl}/auth/Get_profile_det_match/`,
                    {
                        profile_id: loginuser_profileId,
                        user_profile_id: viewedProfileId,
                    }
                );
                setProfileData(response.data);
                setError(null); // Clear any previous errors
            } catch (error) {
                setError('Error fetching profile data.');
                console.error(
                    'Error fetching profile data:',
                    error.response ? error.response.data : error.message
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [viewedProfileId]);

    if (loading) {
        return <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />;
    }

    if (error) {
        return <Text style={styles.errorText}>{error}</Text>;
    }

    const togglePersonalDetails = () => {
        setShowEducationDetails(false)
        setShowFamilyDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails(false)
        setShowPersonalDetails((prev) => !prev);
    };

    const toggleEducationDetails = () => {
        setShowPersonalDetails(false)
        setShowFamilyDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails(false)
        setShowEducationDetails((prev) => !prev);
    };

    const toggleFamilyDetails = () => {
        setShowPersonalDetails(false)
        setShowEducationDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails(false)
        setShowFamilyDetails((prev) => !prev);
    };

    const toggleHoroscopeDetails = () => {
        setShowPersonalDetails(false)
        setShowEducationDetails(false)
        setShowFamilyDetails(false)
        setShowContactDetails(false)
        setShowHoroscopeDetails((prev) => !prev);
    };

    const toggleContactDetails = () => {
        setShowPersonalDetails(false)
        setShowEducationDetails(false)
        setShowFamilyDetails(false)
        setShowHoroscopeDetails(false)
        setShowContactDetails((prev) => !prev);
    };

    return (
        <View style={styles.scrollViewContentContainer}>
            {/* Icons Row */}
            <View style={styles.iconsRowContainer}>
                <View style={styles.iconContainer}>
                    {/* Personal Icon */}

                    <TouchableOpacity onPress={togglePersonalDetails}>
                        <FontAwesome5
                            name="user-circle"
                            size={22}
                            color={showPersonalDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showPersonalDetails ? '#FFFFFF' : '#85878C' }]}>Personal</Text>
                </View>

                <View style={styles.iconContainer}>
                    {/* Work */}

                    <TouchableOpacity onPress={toggleEducationDetails}>
                        <MaterialIcons
                            name="work"
                            size={22}
                            color={showEducationDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showEducationDetails ? '#FFFFFF' : '#85878C' }]}>Work</Text>
                </View>

                <View style={styles.iconContainer}>
                    {/* Family */}

                    <TouchableOpacity onPress={toggleFamilyDetails}>
                        <FontAwesome5
                            name="users"
                            size={22}
                            color={showFamilyDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                        <Text style={[styles.iconText, { color: showFamilyDetails ? '#FFFFFF' : '#85878C' }]}>Family</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.iconContainer}>
                    {/* Horoscope */}

                    <TouchableOpacity onPress={toggleHoroscopeDetails}>
                        <MaterialCommunityIcons
                            name="zodiac-libra"
                            size={22}
                            color={showHoroscopeDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showHoroscopeDetails ? '#FFFFFF' : '#85878C' }]}>Horoscope</Text>
                </View>

                <View style={styles.iconContainer}>
                    {/* Contact */}

                    <TouchableOpacity onPress={toggleContactDetails}>
                        <MaterialIcons
                            name="phone"
                            size={22}
                            color={showContactDetails ? '#FFFFFF' : '#85878C'}
                            style={styles.iconStyle}
                        />
                    </TouchableOpacity>
                    <Text style={[styles.iconText, { color: showContactDetails ? '#FFFFFF' : '#85878C' }]}>Contact</Text>
                </View>
            </View>

            {/* Details Sections */}
            {/* Personal Details */}
            {showPersonalDetails && (
                <View style={styles.menuChanges}>
                    <View style={styles.editOptions}>
                        <Text style={styles.titleNew}>Personal Details</Text>
                        <View style={styles.line} />
                        <Text style={styles.labelNew}>Name : <Text style={styles.valueNew}>{profileData.personal_details.profile_name}</Text></Text>
                        <Text style={styles.labelNew}>Gender : <Text style={styles.valueNew}>{profileData.personal_details.gender}</Text></Text>
                        <Text style={styles.labelNew}>Age : <Text style={styles.valueNew}>{profileData.personal_details.age} Years</Text></Text>
                        <Text style={styles.labelNew}>DOB : <Text style={styles.valueNew}>{profileData.personal_details.dob}</Text></Text>
                        <Text style={styles.labelNew}>Place of Birth : <Text style={styles.valueNew}>{profileData.personal_details.place_of_birth}</Text></Text>
                        <Text style={styles.labelNew}>Time of Birth : <Text style={styles.valueNew}>{profileData.personal_details.time_of_birth}</Text></Text>
                        <Text style={styles.labelNew}>Weight : <Text style={styles.valueNew}>{profileData.personal_details.weight}</Text></Text>
                        <Text style={styles.labelNew}>Height : <Text style={styles.valueNew}>{profileData.personal_details.height}</Text></Text>
                        <Text style={styles.labelNew}>Marital Status : <Text style={styles.valueNew}>{profileData.personal_details.marital_status}</Text></Text>
                        <Text style={styles.labelNew}>Blood Group : <Text style={styles.valueNew}>{profileData.personal_details.blood_group}</Text></Text>
                        <Text style={styles.labelNew}>Body Type : <Text style={styles.valueNew}>{profileData.personal_details.body_type}</Text></Text>
                        <Text style={styles.labelNew}>About Myself : <Text style={styles.valueNew}>{profileData.personal_details.about_self}</Text></Text>
                        <Text style={styles.labelNew}>Complexion : <Text style={styles.valueNew}>{profileData.personal_details.complexion}</Text></Text>
                        <Text style={styles.labelNew}>Hobbies : <Text style={styles.valueNew}>{profileData.personal_details.hobbies}</Text></Text>
                        <Text style={styles.labelNew}>Physical Status : <Text style={styles.valueNew}>{profileData.personal_details.physical_status}</Text></Text>
                        <Text style={styles.labelNew}>Eye Wear : <Text style={styles.valueNew}>{profileData.personal_details.eye_wear}</Text></Text>
                        <Text style={styles.labelNew}>Profile Created By : <Text style={styles.valueNew}>{profileData.personal_details.profile_created_by}</Text></Text>
                        <Text style={styles.labelNew}>Profile Created By : <Text style={styles.valueNew}>{profileData.personal_details.profile_created_by}</Text></Text>
                    </View>
                </View>
            )}

            {showEducationDetails && (
                <View style={styles.menuChanges}>
                    <View style={styles.editOptions}>
                        <Text style={styles.titleNew}>Education & Profession Details</Text>
                        <View style={styles.line} />
                        <Text style={styles.labelNew}>Education Level : <Text style={styles.valueNew}>{profileData.education_details.education_level}</Text></Text>
                        <Text style={styles.labelNew}>Educational Details : <Text style={styles.valueNew}>{profileData.education_details.education_detail}</Text></Text>
                        <Text style={styles.labelNew}>About Education : <Text style={styles.valueNew}>{profileData.education_details.about_education}</Text></Text>
                        <Text style={styles.labelNew}>Profession : <Text style={styles.valueNew}>{profileData.education_details.profession}</Text></Text>
                        <Text style={styles.labelNew}>Company Name : <Text style={styles.valueNew}>{profileData.education_details.company_name}</Text></Text>
                        <Text style={styles.labelNew}>Business Name : <Text style={styles.valueNew}>{profileData.education_details.business_name}</Text></Text>
                        <Text style={styles.labelNew}>Business Address : <Text style={styles.valueNew}>{profileData.education_details.business_address}</Text></Text>
                        <Text style={styles.labelNew}>Annual Income : <Text style={styles.valueNew}>{profileData.education_details.annual_income}</Text></Text>
                        <Text style={styles.labelNew}>Gross annual Income : <Text style={styles.valueNew}>{profileData.education_details.gross_annual_income}</Text></Text>
                        <Text style={styles.labelNew}>Place of Stay : <Text style={styles.valueNew}>{profileData.education_details.place_of_stay}</Text></Text>
                    </View>
                </View>
            )}

            {showFamilyDetails && (
                <View style={styles.menuChanges}>
                    <View style={styles.editOptions}>
                        <Text style={styles.titleNew}>Family Details</Text>
                        <View style={styles.line} />
                        <Text style={styles.labelNew}>About Family : <Text style={styles.valueNew}>{profileData.family_details.about_family}</Text></Text>
                        <Text style={styles.labelNew}>Father's Name : <Text style={styles.valueNew}>{profileData.family_details.father_name}</Text></Text>
                        <Text style={styles.labelNew}>Father's occupation : <Text style={styles.valueNew}>{profileData.family_details.father_occupation}</Text></Text>
                        <Text style={styles.labelNew}>Mother's Name : <Text style={styles.valueNew}>{profileData.family_details.mother_name}</Text></Text>
                        <Text style={styles.labelNew}>Mother's occupation : <Text style={styles.valueNew}>{profileData.family_details.mother_occupation}</Text></Text>
                        <Text style={styles.labelNew}>Family Status : <Text style={styles.valueNew}>{profileData.family_details.family_status}</Text></Text>
                        <Text style={styles.labelNew}>No. of sisters : <Text style={styles.valueNew}>{profileData.family_details.no_of_sisters}</Text></Text>
                        <Text style={styles.labelNew}>No. of Brothers : <Text style={styles.valueNew}>{profileData.family_details.no_of_brothers}</Text></Text>
                        <Text style={styles.labelNew}>No. of sis Married : <Text style={styles.valueNew}>{profileData.family_details.no_of_sis_married}</Text></Text>
                        <Text style={styles.labelNew}>No. of sis Married : <Text style={styles.valueNew}>{profileData.family_details.no_of_bro_married}</Text></Text>
                        <Text style={styles.labelNew}>Property details : <Text style={styles.valueNew}>{profileData.family_details.property_details}</Text></Text>
                    </View>
                </View>
            )}

            {showHoroscopeDetails && (
                <View style={styles.menuChanges}>
                    <View style={styles.editOptions}>
                        <Text style={styles.titleNew}>Horoscope Details</Text>
                        <View style={styles.line} />
                        <Text style={styles.labelNew}>Rasi : <Text style={styles.valueNew}>{profileData.horoscope_details.rasi}</Text></Text>
                        <Text style={styles.labelNew}>Star : <Text style={styles.valueNew}>{profileData.horoscope_details.star_name}</Text></Text>
                        <Text style={styles.labelNew}>Lagnam : <Text style={styles.valueNew}>{profileData.horoscope_details.lagnam}</Text></Text>
                        <Text style={styles.labelNew}>Nallikai : <Text style={styles.valueNew}>{profileData.horoscope_details.nallikai}</Text></Text>
                        <Text style={styles.labelNew}>Didi : <Text style={styles.valueNew}>{profileData.horoscope_details.didi}</Text></Text>
                        <Text style={styles.labelNew}>Surya Gothram : <Text style={styles.valueNew}>{profileData.horoscope_details.surya_gothram}</Text></Text>
                        <Text style={styles.labelNew}>Dasa Name : <Text style={styles.valueNew}>{profileData.horoscope_details.dasa_name}</Text></Text>
                        <Text style={styles.labelNew}>Dasa Balance : <Text style={styles.valueNew}>{profileData.horoscope_details.dasa_balance}</Text></Text>
                        <Text style={styles.labelNew}>Chevvai Dosham : <Text style={styles.valueNew}>{profileData.horoscope_details.chevvai_dosham}</Text></Text>
                        <Text style={styles.labelNew}>Sarpadosham : <Text style={styles.valueNew}>{profileData.horoscope_details.sarpadosham}</Text></Text>
                    </View>
                </View>
            )}

            {showContactDetails && (
                <View style={styles.menuChanges}>
                    <View style={styles.editOptions}>
                        <Text style={styles.titleNew}>Contact Details</Text>
                        <View style={styles.line} />
                        <Text style={styles.labelNew}>Address : <Text style={styles.valueNew}>{profileData.contact_details.address}</Text></Text>
                        <Text style={styles.labelNew}>City : <Text style={styles.valueNew}>{profileData.contact_details.city}</Text></Text>
                        <Text style={styles.labelNew}>State : <Text style={styles.valueNew}>{profileData.contact_details.state}</Text></Text>
                        <Text style={styles.labelNew}>Country : <Text style={styles.valueNew}>{profileData.contact_details.country}</Text></Text>
                        <Text style={styles.labelNew}>Phone no : <Text style={styles.valueNew}>{profileData.contact_details.phone}</Text></Text>
                        <Text style={styles.labelNew}>Mobile no : <Text style={styles.valueNew}>{profileData.contact_details.mobile}</Text></Text>
                        <Text style={styles.labelNew}>Whatsapp : <Text style={styles.valueNew}>{profileData.contact_details.whatsapps}</Text></Text>
                        <Text style={styles.labelNew}>Email : <Text style={styles.valueNew}>{profileData.contact_details.email}</Text></Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    scrollViewContentContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        // padding: 16,
    },
    iconsRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // alignItems: 'center',
        width: '100%',
        paddingHorizontal: 16,
        backgroundColor: '#4F515D',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderColor: '#fff',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 12,
        marginBottom: 2,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    menuChanges: {
        width: '100%', backgroundColor: '#4F515D',
        justifyContent: 'center', alignItems: 'center'
    },
    editOptions: {
        width: '90%',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 2,
        marginTop: 10
    },
    titleNew: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#282C3F',
        // fontFamily : 'Inter'
    },
    line: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',  // Change color as needed
        width: '100%',  // Adjust width as needed
    },
    labelNew: {
        color: '#282C3F',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 5,
        marginTop: 7
    },
    valueNew: {
        color: '#282C3F',
        fontSize: 15,
        fontWeight: '500',
    },
    iconStyle: {
        marginHorizontal: 8,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    loadingIndicator: {
        marginTop: 20,
    },
});