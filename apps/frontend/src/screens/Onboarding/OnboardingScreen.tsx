import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../utils/theme';
import { setOnboardingSeen } from '../../utils/onboarding';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

interface Slide {
  key: string;
  emoji: string;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    emoji: '🌙',
    title: 'Bienvenue sur Lunae',
    text: "Un agenda qui s'adapte à votre cycle, pas l'inverse.",
  },
  {
    key: 'cycle',
    emoji: '📅',
    title: 'Suivez votre cycle',
    text: 'Lunae calcule vos phases et prédit vos prochaines règles automatiquement.',
  },
  {
    key: 'energy',
    emoji: '✨',
    title: 'Optimisez votre énergie',
    text: 'Recevez des suggestions pour déplacer vos événements selon votre phase.',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function OnboardingScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const goToWelcome = () => {
    void setOnboardingSeen();
    navigation.replace('Welcome');
  };

  const scrollToIndex = (index: number) => {
    // activeIndex n'est mis à jour que par onScroll (source de vérité unique) :
    // le fixer ici en plus créerait une valeur transitoire incohérente pendant
    // l'animation, provoquant un aller-retour visible sur les points.
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const handleNext = () => {
    if (isLastSlide) {
      goToWelcome();
      return;
    }
    scrollToIndex(activeIndex + 1);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.skip}
        onPress={goToWelcome}
        accessibilityRole="button"
        accessibilityLabel="Passer l'introduction"
        hitSlop={8}
      >
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.text}>{slide.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((slide, index) => (
          <View
            key={slide.key}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      <Pressable
        style={styles.cta}
        onPress={handleNext}
        accessibilityRole="button"
        accessibilityLabel={isLastSlide ? "C'est parti" : 'Suivant'}
      >
        <Text style={styles.ctaText}>{isLastSlide ? "C'est parti !" : 'Suivant'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skip: {
    alignSelf: 'flex-end',
    padding: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: { color: colors.textMuted, fontSize: 15 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  text: { fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  cta: {
    backgroundColor: colors.primary,
    marginHorizontal: 24,
    marginBottom: 32,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
