import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, IoClose } from '@expo/vector-icons'; // Ensure you have vector-icons installed

export const PlatinumModalPopup = ({ visible, onClose }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={modalStyles.overlay}>
                <View style={modalStyles.modalContainer}>
                    
                    {/* X Close Icon at Top Right */}
                    <TouchableOpacity style={modalStyles.closeX} onPress={onClose}>
                        <MaterialIcons name="close" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Header - Light Red Theme */}
                    <View style={modalStyles.header}>
                        <View style={modalStyles.iconCircle}>
                            <MaterialIcons name="security" size={28} color="#FF6666" />
                        </View>
                        <Text style={modalStyles.headerTitle}>Platinum Private Membership</Text>
                    </View>

                    {/* Body */}
                    <View style={modalStyles.body}>
                        <Text style={modalStyles.description}>
                            This profile is secured under{" "}
                            <Text style={modalStyles.boldText}>Platinum Private Membership</Text>. 
                            {"\n"}For access and assisted viewing, please contact our Customer Support.
                        </Text>

                        {/* Phone Number - Gray Theme (Non-clickable) */}
                        <View style={modalStyles.numberContainer}>
                            <MaterialIcons name="phone" size={18} color="#85878C" />
                            <Text style={modalStyles.phoneNumber}>99448 51550</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '90%',
        maxWidth: 340,
        backgroundColor: 'white',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 10,
    },
    closeX: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    header: {
        backgroundColor: '#FF6666', // Light Red / Primary Theme
        paddingVertical: 5,
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    body: {
        padding: 25,
        alignItems: 'center',
    },
    description: {
        textAlign: 'center',
        color: '#4F515D',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    boldText: {
        fontWeight: '700',
        color: '#FF6666',
    },
    numberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5', // Gray background similar to web
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    phoneNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F515D', // Dark Gray text
        marginLeft: 8,
    },
});