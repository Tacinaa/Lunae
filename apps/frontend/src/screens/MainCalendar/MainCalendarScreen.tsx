import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MainCalendar'>;

export function MainCalendarScreen(_props: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendrier</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { fontSize: 20, color: colors.text },
});
