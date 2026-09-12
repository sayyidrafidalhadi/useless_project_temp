import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Modal, PanResponder, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { Banana } from './src/components/Banana';
import { getMessage, getSwipes, getTarget, isComplete, isPeelGesture, nextBanana, peel, setMode } from './src/game';
import { useGame } from './src/useGame';

const C = { ink: '#29291F', muted: '#797969', paper: '#FFFEF5', yellow: '#FCE44D', line: '#E9E7D6', green: '#576842' };
const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

function Icon({ name, size = 22, color = C.ink }: { name: 'settings' | 'arrow' | 'close' | 'spark'; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {name === 'settings' && <><Path d="M4 7h16M4 17h16" /><Circle cx="9" cy="7" r="3" fill={C.paper} /><Circle cx="15" cy="17" r="3" fill={C.paper} /></>}
    {name === 'arrow' && <Path d="M12 4v16m-6-6 6 6 6-6" />}
    {name === 'close' && <Path d="m6 6 12 12M18 6 6 18" />}
    {name === 'spark' && <Path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z" />}
  </Svg>;
}

function timeLabel(seconds: number) {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function Peeler() {
  const { game, setGame, ready, storageError } = useGame();
  const [settings, setSettings] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { width, height } = useWindowDimensions();
  const wobble = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const count = getSwipes(game);
  const target = getTarget(game);
  const complete = isComplete(game);
  const progress = count / target;
  const message = getMessage(game);
  const compact = height < 760;
  const artSize = Math.min(width - 76, compact ? 235 : 280);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => listener.remove();
  }, []);

  useEffect(() => {
    if (ready) AccessibilityInfo.announceForAccessibility(message);
  }, [message, ready]);

  const doPeel = useCallback(() => {
    if (!ready || complete || settings) return;
    setGame(peel);
    if (game.haptics) {
      if (count + 1 === target) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else void Haptics.selectionAsync().catch(() => {});
    }
    if (!reducedMotion) {
      wobble.stopAnimation();
      wobble.setValue(0);
      Animated.sequence([
        Animated.timing(wobble, { toValue: -1, duration: 65, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(wobble, { toValue: 0, friction: 3, tension: 220, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  }, [ready, complete, settings, setGame, game.haptics, count, target, reducedMotion, wobble]);

  const gesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => ready && !complete && !settings,
    onMoveShouldSetPanResponder: () => ready && !complete && !settings,
    onPanResponderMove: (_, state) => {
      if (!reducedMotion) drag.setValue(Math.min(20, Math.max(0, state.dy / 5)));
    },
    onPanResponderRelease: (_, state) => {
      drag.setValue(0);
      if (isPeelGesture(state.dx, state.dy)) doPeel();
    },
    onPanResponderTerminate: () => drag.setValue(0),
    onPanResponderTerminationRequest: () => false,
  }), [ready, complete, settings, reducedMotion, drag, doPeel]);

  const startAgain = () => {
    setGame(nextBanana);
    wobble.setValue(0);
    drag.setValue(0);
  };

  return <SafeAreaView style={s.safe}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={s.scroll} bounces={false}>
      <View style={s.screen}>
        <View style={s.header}>
          <View style={s.wordmarkRow}>
            <View style={s.logo}><Icon name="arrow" size={20} /></View>
            <Text style={s.wordmark}>peel.</Text>
            <View style={s.wordmarkDivider} />
            <Text style={s.brandAside}>a very useless app</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => setSettings(true)} style={({ pressed }) => [s.iconButton, pressed && s.pressed]}>
            <Icon name="settings" />
          </Pressable>
        </View>

        <View style={[s.titleBlock, compact && { marginTop: 20 }]}>
          <View style={s.eyebrowRow}><View style={s.greenDot} /><Text style={s.eyebrow}>100% ORGANIC TIME WASTING</Text></View>
          <Text accessibilityRole="header" style={[s.title, compact && { fontSize: 39, lineHeight: 41 }]}>{complete ? 'Well, that was\npointless.' : 'Big peel.\nZero purpose.'}</Text>
          <Text style={s.subtitle}>{complete ? 'You found another banana. Of course you did.' : game.mode === 'demo' ? 'One banana. Twenty swipes. Same disappointment.' : 'One banana. A thousand swipes. Absolutely nothing.'}</Text>
        </View>

        <View style={[s.stage, { minHeight: artSize * 1.125 + 14 }]} testID="banana-gesture" {...gesture.panHandlers}>
          <View style={[s.halo, { pointerEvents: 'none', width: artSize * .95, height: artSize * .95, borderRadius: artSize }]} />
          <View style={[s.bananaTag, { pointerEvents: 'none' }]}><Text style={s.tagText}>BANANA No. {String(game.bananas + (complete ? 0 : 1)).padStart(3, '0')}</Text></View>
          <View style={[s.starOne, { pointerEvents: 'none' }]}><Icon name="spark" size={18} color="#A5A171" /></View>
          <View style={[s.starTwo, { pointerEvents: 'none' }]}><Icon name="spark" size={12} color="#A5A171" /></View>
          <Animated.View style={{ pointerEvents: 'none', transform: [{ translateY: drag }, { rotate: wobble.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-5deg', '0deg', '5deg'] }) }] }}>
            <Banana size={artSize} progress={progress} revealed={complete} />
          </Animated.View>
          {!complete && <View style={[s.swipeHint, { pointerEvents: 'none' }]}><View style={s.hintLine} /><Icon name="arrow" size={17} color={C.muted} /><Text style={s.hintText}>swipe down</Text></View>}
          {complete && <View style={s.revealPill}><Text style={s.revealText}>SURPRISE. MORE BANANA.</Text></View>}
        </View>

        <View style={s.progressSection}>
          <View style={s.progressLabels}>
            <Text style={s.progressCaption}>{complete ? 'PEEL COMPLETE. LIFE UNCHANGED.' : game.mode === 'demo' ? 'DEMO PEEL · 20 SWIPES' : 'YOUR ENTIRE ACHIEVEMENT'}</Text>
            <Text style={s.percentage}>{(progress * 100).toFixed(1)}%</Text>
          </View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel="Banana peeled" accessibilityValue={{ min: 0, max: target, now: count, text: `${count} of ${target} swipes` }} style={s.track}>
            <View style={[s.fill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={s.progressFoot}>
            <Text testID="swipe-count" style={s.count}><Text style={s.countStrong}>{count.toLocaleString()}</Text> / {target.toLocaleString()} swipes</Text>
            <Text style={s.noRush}>{complete ? 'worth it? no.' : 'no rush. literally.'}</Text>
          </View>
        </View>

        <View style={s.quoteBox}><Text style={s.quote}>{ready ? `“${message}”` : 'Locating your completely unnecessary progress…'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={complete ? 'Peel another banana' : 'Peel once'} accessibilityHint={complete ? 'Start again with the banana inside this one.' : 'An alternative to swiping. Adds one peel.'} disabled={!ready} onPress={complete ? startAgain : doPeel} style={({ pressed }) => [s.peelButton, pressed && s.peelPressed, !ready && { opacity: .5 }]}>
          <Text style={s.peelButtonText}>{complete ? 'Peel another banana' : 'Peel once'}</Text>
          <Icon name={complete ? 'spark' : 'arrow'} size={21} />
        </Pressable>
        <Text style={s.buttonCaption}>{complete ? 'This one is probably the last. Probably.' : 'swipe the banana, or tap if you insist'}</Text>

        <View style={s.stats}>
          <View style={s.stat}><Text style={s.statValue}>{game.totalSwipes.toLocaleString()}</Text><Text style={s.statLabel}>total swipes</Text></View>
          <View style={s.statDivider} />
          <View style={s.stat}><Text style={s.statValue}>{game.bananas.toLocaleString()}</Text><Text style={s.statLabel}>bananas peeled</Text></View>
          <View style={s.statDivider} />
          <View style={s.stat}><Text style={s.statValue}>{timeLabel(game.activeSeconds)}</Text><Text style={s.statLabel}>time well wasted</Text></View>
        </View>
        {storageError && <Text accessibilityRole="alert" style={s.storageError}>Your progress couldn't be saved on this device.</Text>}
        <Text style={s.footer}>NO GOALS. NO GROWTH. JUST BANANA.</Text>
      </View>
    </ScrollView>

    <Modal visible={settings} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => setSettings(false)}>
      <View style={s.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettings(false)} accessibilityRole="button" accessibilityLabel="Dismiss settings" />
        <View style={s.sheet} accessibilityViewIsModal>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}><Text accessibilityRole="header" style={s.sheetTitle}>A little less useless.</Text><Pressable accessibilityRole="button" accessibilityLabel="Close settings" onPress={() => setSettings(false)} style={s.iconButton}><Icon name="close" /></Pressable></View>
          <Text style={s.sheetSubtitle}>Fine. A couple of actual features.</Text>
          <View style={s.settingRow}>
            <View style={s.settingCopy}><Text style={s.settingTitle}>Tiny vibrations</Text><Text style={s.settingHelp}>Feel like you're accomplishing something.</Text></View>
            <Switch accessibilityLabel="Tiny vibrations" disabled={!ready} value={game.haptics} onValueChange={(haptics) => setGame((current) => ({ ...current, haptics }))} trackColor={{ false: '#DDDCCB', true: C.green }} thumbColor={C.paper} />
          </View>
          <View style={s.settingRow}>
            <View style={s.settingCopy}><Text style={s.settingTitle}>Hackathon demo</Text><Text style={s.settingHelp}>20 swipes. Same disappointment. Your classic peel is kept safe.</Text></View>
            <Switch accessibilityLabel="Hackathon demo" disabled={!ready} value={game.mode === 'demo'} onValueChange={(enabled) => setGame((current) => setMode(current, enabled ? 'demo' : 'classic'))} trackColor={{ false: '#DDDCCB', true: C.green }} thumbColor={C.paper} />
          </View>
          <View style={s.howTo}><Icon name="arrow" size={20} /><Text style={s.howToText}>Swipe down on the banana, or use “Peel once.” Finish the peel. Discover another banana. Repeat for no reason.</Text></View>
          <Text style={s.localNote}>Progress lives on this device. No account. No grand purpose.</Text>
          <Pressable accessibilityRole="button" onPress={() => setSettings(false)} style={({ pressed }) => [s.peelButton, pressed && s.peelPressed]}><Text style={s.peelButtonText}>Back to doing nothing</Text><Icon name="arrow" size={21} /></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </SafeAreaView>;
}

export default function App() {
  return <SafeAreaProvider><Peeler /></SafeAreaProvider>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  scroll: { flexGrow: 1, alignItems: 'center' },
  screen: { width: '100%', maxWidth: 470, paddingHorizontal: 26, paddingTop: 14, paddingBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.yellow, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-9deg' }] },
  wordmark: { color: C.ink, fontSize: 26, fontWeight: '900', letterSpacing: -1.5 },
  wordmarkDivider: { width: 1, height: 19, backgroundColor: C.line, marginHorizontal: 2 },
  brandAside: { color: C.muted, fontSize: 10, fontWeight: '500' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  pressed: { opacity: .55 },
  titleBlock: { marginTop: 26 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  eyebrow: { fontFamily: mono, fontSize: 9, letterSpacing: 1.2, color: C.green, fontWeight: '600' },
  title: { fontSize: 47, fontWeight: '900', color: C.ink, letterSpacing: -2.3, lineHeight: 49 },
  subtitle: { fontSize: 12, lineHeight: 19, color: C.muted, marginTop: 10, maxWidth: 310 },
  stage: { alignItems: 'center', justifyContent: 'center', marginTop: 7, marginBottom: 6, position: 'relative', ...Platform.select({ web: { touchAction: 'none', userSelect: 'none' } as object, default: {} }) },
  halo: { backgroundColor: '#F8F2C9', position: 'absolute' },
  bananaTag: { position: 'absolute', top: 19, left: 0, zIndex: 2, borderColor: '#DFDBC1', borderWidth: 1, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: C.paper, transform: [{ rotate: '-8deg' }] },
  tagText: { fontFamily: mono, fontSize: 8, letterSpacing: 1, color: '#737358' },
  starOne: { position: 'absolute', top: 66, right: 15 },
  starTwo: { position: 'absolute', bottom: 61, left: 20 },
  swipeHint: { position: 'absolute', right: 0, top: '44%', alignItems: 'center', gap: 5 },
  hintLine: { height: 25, width: 1, backgroundColor: '#C8C5A9' },
  hintText: { color: C.muted, fontSize: 9, fontStyle: 'italic' },
  revealPill: { position: 'absolute', bottom: 11, backgroundColor: C.ink, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, transform: [{ rotate: '-4deg' }] },
  revealText: { color: C.paper, fontFamily: mono, fontSize: 9, letterSpacing: 1 },
  progressSection: { marginTop: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  progressCaption: { fontFamily: mono, color: C.muted, fontSize: 8, letterSpacing: .6 },
  percentage: { fontFamily: mono, fontSize: 12, fontWeight: '700', color: C.ink },
  track: { height: 12, backgroundColor: '#EFEDDD', borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.yellow, borderRadius: 5 },
  progressFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 9 },
  count: { color: C.muted, fontSize: 11, fontFamily: mono },
  countStrong: { color: C.ink, fontWeight: '700' },
  noRush: { fontSize: 10, color: C.muted, fontStyle: 'italic' },
  quoteBox: { minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  quote: { color: '#62624F', fontSize: 12, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' },
  peelButton: { minHeight: 55, backgroundColor: C.yellow, borderWidth: 1, borderColor: '#DACA48', borderBottomWidth: 3, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13, paddingHorizontal: 15, paddingVertical: 13 },
  peelPressed: { backgroundColor: '#EFDA3E', transform: [{ translateY: 2 }] },
  peelButtonText: { color: C.ink, fontSize: 15, fontWeight: '800' },
  buttonCaption: { fontSize: 9, color: C.muted, textAlign: 'center', marginTop: 9 },
  stats: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, paddingVertical: 18, marginTop: 23 },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  statValue: { color: C.ink, fontSize: 16, fontFamily: mono, fontWeight: '700' },
  statLabel: { color: C.muted, fontSize: 9 },
  statDivider: { height: 25, width: 1, backgroundColor: C.line },
  footer: { color: '#9D9B87', fontFamily: mono, fontSize: 8, letterSpacing: 1.3, textAlign: 'center', marginTop: 18 },
  storageError: { color: '#985230', fontSize: 12, textAlign: 'center', paddingTop: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(34, 34, 22, .35)', alignItems: 'center', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 25, paddingBottom: 38, width: '100%', maxWidth: 470, maxHeight: '92%' },
  sheetHandle: { width: 32, height: 4, backgroundColor: C.line, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sheetTitle: { flex: 1, fontSize: 25, letterSpacing: -1, fontWeight: '800', color: C.ink },
  sheetSubtitle: { fontSize: 12, color: C.muted, marginTop: 5, marginBottom: 17 },
  settingRow: { flexDirection: 'row', gap: 15, alignItems: 'center', borderBottomWidth: 1, borderColor: C.line, paddingVertical: 19 },
  settingCopy: { flex: 1, gap: 5 },
  settingTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  settingHelp: { fontSize: 12, lineHeight: 18, color: C.muted },
  howTo: { flexDirection: 'row', backgroundColor: '#F6F2D9', padding: 15, borderRadius: 13, gap: 11, marginTop: 22 },
  howToText: { flex: 1, color: '#63634F', fontSize: 12, lineHeight: 19 },
  localNote: { fontSize: 10, color: C.muted, textAlign: 'center', marginVertical: 20, lineHeight: 16 },
});
