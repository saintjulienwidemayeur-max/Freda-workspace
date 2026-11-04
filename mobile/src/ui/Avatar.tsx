import { Image } from 'expo-image';
import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { avatarColorFor, initialsOf } from '../core/format';
import { fonts } from '../core/theme';
import { services } from '../services';
import { useAuth } from '../state/auth';
import { usePhotos } from '../state/photos';

/** Avatar : photo de profil Freda si la personne en a une, sinon initiales (couleur stable par adresse). */
export const Avatar = memo(function Avatar({ email, name, size = 46 }: { email: string; name: string; size?: number }) {
  const key = email.trim().toLowerCase();
  const version = usePhotos((s) => s.versions[key]);
  const token = useAuth((s) => s.token);
  useEffect(() => { if (!version) usePhotos.getState().want(key); }, [key, version]);
  if (version && token) {
    return <Image source={services.api.photoSource(token, key, version)} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" cachePolicy="disk" transition={150} accessibilityLabel={`Photo de ${name || email}`} />;
  }
  const c = avatarColorFor(email);
  return (
    <LinearGradient colors={[c, '#00000038']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: c }]}>
      <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: size * 0.36, letterSpacing: 0.3 }}>{initialsOf(name || email)}</Text>
    </LinearGradient>
  );
});
const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } });
void View;
