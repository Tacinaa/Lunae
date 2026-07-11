import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../utils/theme';

interface BackButtonProps {
  onPress: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Retour"
    >
      <Text style={styles.icon}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 8,
    left: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  icon: { fontSize: 30, color: colors.primary, fontWeight: '600' },
});
