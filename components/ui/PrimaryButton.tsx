import { Pressable, StyleSheet, Text } from 'react-native';

export function PrimaryButton({
  title,
  onPress,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, variant === 'secondary' && styles.secondary, disabled && styles.disabled]}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#1E1A17',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#1E1A17',
  },
  disabled: { opacity: 0.5 },
  text: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secondaryText: { color: '#1E1A17' },
});
