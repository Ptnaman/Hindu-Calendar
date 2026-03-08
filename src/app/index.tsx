import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarDayCell } from '@/components/calendar-day-cell';
import { festivalTheme, layout, palette, radii, shadows, spacing, typography } from '@/constants/theme';
import {
  addMonths,
  describeRelativeDay,
  formatMonthTitle,
  formatWeekdayDate,
  getMonthMatrix,
  isSameDay,
  startOfDay,
  startOfMonth,
  WEEKDAY_LABELS,
} from '@/lib/calendar';
import { getHinduDayDetails, getMonthSubtitle } from '@/lib/panchang';

const MENU_ITEMS = [
  {
    key: 'settings',
    label: 'Settings',
    description: 'Language, location, reminders',
    icon: 'settings',
  },
  {
    key: 'panchang',
    label: 'Daily Panchang',
    description: 'See selected day below',
    icon: 'sun',
  },
  {
    key: 'festivals',
    label: 'Festivals',
    description: 'Upcoming vrat and observances',
    icon: 'star',
  },
  {
    key: 'about',
    label: 'About app',
    description: 'Version and app info',
    icon: 'info',
  },
] as const;

const MONTH_SWIPE_DISTANCE = 48;
const MONTH_SWIPE_VELOCITY = 420;

export default function Index() {
  const today = startOfDay(new Date());
  const insets = useSafeAreaInsets();
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const monthGrid = getMonthMatrix(visibleMonth);
  const headerHeight = insets.top + spacing.xs + 40 + spacing.xs;
  const menuTopOffset = headerHeight + spacing.xs;
  const monthSubtitle = getMonthSubtitle(visibleMonth);
  const summaryDate =
    selectedDate ??
    (visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() === today.getMonth()
      ? today
      : visibleMonth);
  const summaryDetails = getHinduDayDetails(summaryDate);
  const summaryText = `${formatWeekdayDate(summaryDate)}, ${describeRelativeDay(summaryDate, today).toLowerCase()}`;

  function changeMonth(offset: number) {
    setVisibleMonth(addMonths(visibleMonth, offset));
    setSelectedDate(null);
  }

  function selectDate(date: Date) {
    setSelectedDate(date);
    setVisibleMonth(startOfMonth(date));
  }

  function handleDatePress(date: Date) {
    selectDate(date);
  }

  function handleMonthSwipe(translationX: number, velocityX: number) {
    if (
      Math.abs(translationX) < MONTH_SWIPE_DISTANCE &&
      Math.abs(velocityX) < MONTH_SWIPE_VELOCITY
    ) {
      return;
    }

    changeMonth(translationX < 0 ? 1 : -1);
  }

  const monthSwipeGesture = Gesture.Pan()
    .enabled(!isMenuVisible)
    .runOnJS(true)
    .activeOffsetX([-24, 24])
    .failOffsetY([-24, 24])
    .onEnd((event) => {
      handleMonthSwipe(event.translationX, event.velocityX);
    });

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <View style={[styles.headerShell, { paddingTop: insets.top }]}>
        <View style={styles.appHeader}>
          <Text numberOfLines={1} style={styles.appHeaderTitle}>
            Hindu Calendar
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isMenuVisible ? 'Close menu' : 'Open menu'}
            onPress={() => setIsMenuVisible((currentValue) => !currentValue)}
            style={({ pressed }) => [
              styles.headerMenuButton,
              pressed && styles.pressedButton,
            ]}>
            <Feather color={palette.textPrimary} name="more-vertical" size={18} />
          </Pressable>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View
          style={[
            styles.calendarArea,
            {
              paddingTop: headerHeight + spacing.sm,
              paddingBottom: Math.max(insets.bottom, spacing.sm),
            },
          ]}>
          <GestureDetector gesture={monthSwipeGesture}>
            <View style={styles.screenContent}>
              <View style={styles.calendarSection}>
                <View style={styles.pageShell}>
                  <View style={styles.calendarBlock}>
                    <View style={styles.monthHeaderRow}>
                      <View style={styles.monthHeading}>
                        <Text style={styles.monthTitle}>{formatMonthTitle(visibleMonth)}</Text>
                        <Text style={styles.monthSubtitle}>{monthSubtitle}</Text>
                      </View>
                    </View>

                    <View style={styles.weekdayRow}>
                      {WEEKDAY_LABELS.map((weekday) => (
                        <Text key={weekday} style={styles.weekdayLabel}>
                          {weekday}
                        </Text>
                      ))}
                    </View>
                    <View style={styles.weekdayDivider} />

                    <View style={styles.monthGrid}>
                      {monthGrid.map((week, weekIndex) => (
                        <View key={`week-${weekIndex}`} style={styles.weekRow}>
                          {week.map((day) => {
                            const dayDetails = getHinduDayDetails(day.date);

                            return (
                              <CalendarDayCell
                                key={day.key}
                                day={day}
                                isSelected={selectedDate ? isSameDay(day.date, selectedDate) : false}
                                isToday={isSameDay(day.date, today)}
                                markers={dayDetails.markers}
                                onPress={handleDatePress}
                                secondaryLabel={`${dayDetails.hinduMonthDay}`}
                              />
                            );
                          })}
                        </View>
                      ))}
                    </View>

                    <Text style={styles.calendarSummary}>{summaryText}</Text>
                  </View>

                  <View style={styles.festivalSection}>
                    <ScrollView
                      contentContainerStyle={
                        summaryDetails.festivalEntries.length > 0
                          ? styles.festivalScrollContent
                          : styles.emptyFestivalScrollContent
                      }
                      showsVerticalScrollIndicator={summaryDetails.festivalEntries.length > 0}
                      style={styles.festivalScroll}>
                      {summaryDetails.festivalEntries.length > 0 ? (
                        summaryDetails.festivalEntries.map((festival, index) => (
                          <View
                            key={`${festival.title}-${festival.category}-${index}`}
                            style={styles.festivalCard}>
                            <View style={styles.festivalAccent} />
                            <View style={styles.festivalCopy}>
                              <Text style={styles.festivalTitle}>{festival.title}</Text>
                              <View style={styles.festivalMetaRow}>
                                <Feather
                                  color={palette.textMuted}
                                  name="bookmark"
                                  size={festivalTheme.metaIconSize}
                                />
                                <Text style={styles.festivalMeta}>{festival.category}</Text>
                              </View>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyFestivalState}>
                          <Image
                            contentFit="contain"
                            source={require('../../assets/images/no-festival.svg')}
                            style={styles.emptyFestivalArt}
                          />
                          <Text style={styles.emptyFestivalTitle}>No festival</Text>
                          
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </View>
            </View>
          </GestureDetector>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
        statusBarTranslucent
        transparent
        visible={isMenuVisible}>
        <View style={styles.menuRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsMenuVisible(false)} />

          <View style={[styles.menuCard, { top: menuTopOffset }]}>
            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => setIsMenuVisible(false)}
                style={({ pressed }) => [
                  styles.menuItem,
                  index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                  pressed && styles.pressedButton,
                ]}>
                <View style={styles.menuItemIcon}>
                  <Feather color={palette.textPrimary} name={item.icon} size={16} />
                </View>
                <View style={styles.menuItemCopy}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  headerShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    width: '100%',
    paddingBottom: spacing.xs,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  appHeader: {
    width: '100%',
    maxWidth: layout.maxWidth,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  appHeaderTitle: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  calendarArea: {
    width: '100%',
    maxWidth: layout.maxWidth,
    flex: 1,
  },
  screenContent: {
    width: '100%',
    flex: 1,
  },
  calendarSection: {
    width: '100%',
    minHeight: 0,
    flex: 1,
  },
  pageShell: {
    width: '100%',
    gap: spacing.sm,
    flex: 1,
  },
  calendarBlock: {
    gap: spacing.sm,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(222, 212, 201, 0.8)',
    ...shadows,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthHeading: {
    flex: 1,
    gap: spacing.xxs,
  },
  monthTitle: {
    color: palette.textPrimary,
    fontSize: typography.display,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  monthSubtitle: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 18,
  },
  pressedButton: {
    opacity: 0.78,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xxs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: palette.textSecondary,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '500',
  },
  weekdayDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  monthGrid: {
    borderRadius: radii.lg,
    backgroundColor: palette.background,
    gap: spacing.xs,
  },
  calendarSummary: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 26,
    fontWeight: '500',
    paddingTop: spacing.sm,
  },
  festivalSection: {
    height: festivalTheme.containerHeight,
    minHeight: 0,
    overflow: 'hidden',
  },
  festivalScroll: {
    flex: 1,
  },
  festivalScrollContent: {
    paddingTop: festivalTheme.listPaddingTop,
    paddingBottom: festivalTheme.listPaddingBottom,
    gap: festivalTheme.listGap,
  },
  emptyFestivalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: festivalTheme.listPaddingBottom,
  },
  festivalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  festivalAccent: {
    width: festivalTheme.accentWidth,
    height: festivalTheme.accentHeight,
    borderRadius: radii.pill,
    backgroundColor: festivalTheme.accentColor,
    marginTop: 2,
  },
  festivalCopy: {
    flex: 1,
    gap: spacing.xxs,
    paddingTop: 1,
  },
  festivalTitle: {
    color: palette.textPrimary,
    fontSize: festivalTheme.titleSize,
    lineHeight: festivalTheme.titleLineHeight,
    fontWeight: '500',
    letterSpacing: festivalTheme.titleLetterSpacing,
  },
  festivalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  festivalMeta: {
    color: palette.textMuted,
    fontSize: festivalTheme.metaSize,
    lineHeight: festivalTheme.metaLineHeight,
    fontWeight: '400',
  },
  emptyFestivalState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: festivalTheme.emptyPaddingHorizontal,
    paddingVertical: festivalTheme.emptyPaddingVertical,
    gap: festivalTheme.emptyGap,
  },
  emptyFestivalArt: {
    width: festivalTheme.emptyIllustrationWidth,
    height: festivalTheme.emptyIllustrationHeight,
  },
  emptyFestivalTitle: {
    color: festivalTheme.emptyTitleColor,
    fontSize: festivalTheme.emptyTitleSize,
    lineHeight: festivalTheme.emptyTitleLineHeight,
    fontWeight: '400',
  },
  weekRow: {
    flexDirection: 'row',
  },
  menuRoot: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 17, 0.08)',
  },
  menuCard: {
    position: 'absolute',
    right: spacing.md,
    width: 250,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    ...shadows,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  menuItemIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: palette.surfaceMuted,
  },
  menuItemCopy: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    color: palette.textPrimary,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: '600',
  },
  menuItemDescription: {
    color: palette.textSecondary,
    fontSize: typography.small,
    lineHeight: 18,
  },
});
