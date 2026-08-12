import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import noResultFound from '../assets/img/noResultFound.png';

export const ProfileNotFound = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image source={noResultFound} style={styles.image} />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>No Results Found</Text>

                    <Text style={styles.description}>
                        Sorry, there are no results for this search. Please try another filter. Click{' '}
                        <Text
                            style={styles.link}
                            onPress={() => navigation.navigate('Search')}
                        >
                            advanced Search
                        </Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 130,
        height: 130,
        resizeMode: 'contain',
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: 'black',
        textAlign: 'center',
    },
    link: {
        fontSize: 14,
        color: 'blue',
        textDecorationLine: 'underline',
    },
});