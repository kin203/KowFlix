import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>KowFlix Mobile Test</Text>
            <Text style={styles.subtext}>If you see this, basic app works!</Text>
            <StatusBar style="light" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 16,
    },
    subtext: {
        fontSize: 16,
        color: '#B0B0B0',
    },
});
