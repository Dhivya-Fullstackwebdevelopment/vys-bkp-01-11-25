// ProfileVysAssistPopup
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../../API/Apiurl';
import axios from 'axios';

const ProfileVysAssistPopup = ({ viewedProfileId, closePopup }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [VysassistEnable,setVysassistEnable]=useState()
  const [vysassits,setVysassits]=useState()
  const [data,setData]=useState([])
  const [options,setOptions]=useState([])
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const fetchProfileData = async () => {
            const loginuser_profileId = await AsyncStorage.getItem("loginuser_profileId");
            const formattedMessage = `We have shared the horoscope to ${loginuser_profileId}`;
            const options = [
              formattedMessage,
              "We got ok from our Astrologer",
              "We are satisfied with the basic details",
              "We are yet to see the Astrologer",
              "We want to know the family background details",
              "No response from the opposite side"
          ];
          setOptions(options)
            console.log("options ==>", options);

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
                setVysassistEnable(response.data.basic_details.vysy_assist_enable)
            setVysassits(response.data.basic_details.vys_assits)
           
          setData(response.data.basic_details.vys_list)
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

    const handleCheckboxChange = (option) => {
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter((item) => item !== option));
      } else {
        setSelectedOptions([...selectedOptions, option]);
      }
    };
  
    const handleSubmit = () => {
      console.log("Selected Options:", selectedOptions);
      closePopup();
    };
  
    const formDate = (isoString) => {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    };
    

  return (
    < >
    {
         VysassistEnable === 1 &&  vysassits === true&& data !== null&& (
          <Modal 
            isVisible={isVisible} 
            onBackdropPress={closePopup} 
            style={styles.fullScreenModal}
          >
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vysassist Notes </Text>
              <TouchableOpacity onPress={closePopup}>
                <Ionicons name="close" size={22} color="#007AFF" />
              </TouchableOpacity>
            </View>
    
            {/* Form */}
            <ScrollView style={styles.modalBody}>
              <Text style={styles.subTitle}>
                Apply for Vysya Assist: ({selectedOptions.length}/{options.length})
              </Text>
    
              {/* Checkboxes */}
              <View>
                {options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.checkboxContainer}
                    onPress={() => handleCheckboxChange(option)}
                  >
                    <Text style={styles.checkboxText}>
                      {selectedOptions.includes(option) ? "☑" : "☐"} {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
    
              {/* Notes Input */}
              <Text style={styles.label}>Add Your Notes/Instructions</Text>
              <TextInput
                style={styles.textInput}
                value={selectedOptions.join(", ")}
                placeholder="Selected options will appear here"
                editable={false}
              />
            </ScrollView>
    
            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={closePopup}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
         )}
         {
         VysassistEnable === 0 &&(
<Modal transparent isVisible={isVisible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer1}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Apply for VysAssist 12</Text>
            <TouchableOpacity onPress={closePopup}>
              <Ionicons name="close" size={22} color="#007bff" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            You have not activated VysAssist for your plan. You can opt for 5
            matching profiles for Rs.900/-
          </Text>

          {/* Process List */}
          <Text style={styles.processTitle}>VysAssist Process:</Text>
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>
              • Analyze your request and our relationship executive will share
              the profile with prospective matches.
            </Text>
            <Text style={styles.listItem}>
              • Follow-up (5 attempts) with prospective matches and update the
              status.
            </Text>
            <Text style={styles.listItem}>
              • Collect necessary family background information/photos (if
              available) and share it with you.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={closePopup} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                closePopup();
                navigation.navigate("UpgradePlan");
              }}
              style={styles.payButton}
            >
              <Text style={styles.payText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
         )}
         {
        VysassistEnable === 2 &&  vysassits === true&& data !== null && (
          <Modal
          isVisible={isVisible}
          style={styles.fullScreenModal}
          onRequestClose={closePopup}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>VysAssist applied on 24th Dec 2024</Text>
                <TouchableOpacity onPress={closePopup}>
                  <Ionicons name="close" size={24} color="#1E40AF" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.statusText}>
                  Here is the status of your VysAssist Request:
                </Text>

                {/* List of Updates */}
                <FlatList
                  data={data}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.listItem}>
                      <Text style={styles.dateText}>{formDate(item.update_at)}</Text>
                      <View style={styles.timeline}>
                        <Text style={styles.bullet}>•</Text>
                        {index !== data.length - 1 && <View style={styles.line} />}
                      </View>
                      <Text style={styles.comment}>{item.comments}</Text>
                    </View>
                  )}
                />
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={closePopup}>
                  <Text style={styles.buttonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    width: '90%',
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  modalBody: {
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxText: {
    fontSize: 16,
    color: "#333",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginTop: 15,
  },
  textInput: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#F5F5F5",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
  submitText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer1: {
    width: 320,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007bff",
  },
  description: {
    fontSize: 14,
    color: "black",
    marginBottom: 10,
  },
  processTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    marginBottom: 5,
  },
  listContainer: {
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    color: "black",
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  payButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  payText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  fullScreenModal: {
    justifyContent: 'flex-start',
    margin: 0,
  },
  textArea: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    backgroundColor: "#F5F5F5",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    padding: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  content: {
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    color: "black",
    marginBottom: 5,
  },
  timeline: {
    flexDirection: "row",
    alignItems: "center",
  },
  bullet: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    marginRight: 5,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "black",
  },
  comment: {
    fontSize: 14,
    color: "black",
  },
});
export default ProfileVysAssistPopup;
