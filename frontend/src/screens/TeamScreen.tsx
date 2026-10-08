import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

const TEAM = [
  { name: 'Kledi', role: 'Lead Dev', desc: 'Ecommerce Architect' },
  { name: 'Orgito', role: 'Fashion Designer', desc: 'Visionary' },
  { name: 'Klea', role: 'Graphic Designer', desc: 'Visuals' },
  { name: 'Abi', role: 'Graphic Designer', desc: 'Creative Dir.' },
];

export default function TeamScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>THE TEAM</Text>
      <View style={styles.grid}>
        {TEAM.map((member) => (
          <LinearGradient key={member.name} colors={['#222', '#111']} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{member.name[0]}</Text>
            </View>
            <Text style={styles.name}>{member.name}</Text>
            <Text style={styles.role}>{member.role}</Text>
            <Text style={styles.desc}>{member.desc}</Text>
          </LinearGradient>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 24,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    padding: 18,
    borderRadius: radius.lg,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: colors.text, fontWeight: 'bold', fontSize: 22 },
  name: { color: colors.text, fontWeight: 'bold', fontSize: 16 },
  role: { color: colors.textSoft, fontSize: 12, marginTop: 4 },
  desc: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
});
