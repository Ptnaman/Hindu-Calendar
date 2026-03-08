import { Feather } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalendarDayCell } from '@/components/calendar-day-cell';
import { layout, palette, radii, shadows, spacing, typography } from '@/constants/theme';
import {
  addMonths,
  describeRelativeDay,
  formatMonthTitle,
  formatWeekdayDate,
  getDaysInMonth,
  getMonthMatrix,
  isSameDay,
  startOfDay,
  startOfMonth,
  WEEKDAY_LABELS,
} from '@/lib/calendar';
import { getHinduDayDetails, getMonthSubtitle, getUpcomingHighlights } from '@/lib/panchang';

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
    description: 'Open full day details',
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

export default function Index() {
  const today = startOfDay(new Date());
  const headerHeight = useHeaderHeight();
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const monthGrid = getMonthMatrix(visibleMonth);
  const selectedDetails = getHinduDayDetails(selectedDate);
  const upcomingHighlights = getUpcomingHighlights(selectedDate);

  function changeMonth(offset: number) {
    const nextMonth = addMonths(visibleMonth, offset);
    const nextSelectedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(selectedDate.getDate(), getDaysInMonth(nextMonth))
    );

    setVisibleMonth(nextMonth);
    setSelectedDate(nextSelectedDate);
  }

  function jumpToToday() {
    setVisibleMonth(startOfMonth(today));
    setSelectedDate(today);
  }

  function selectDate(date: Date) {
    setSelectedDate(date);
    setVisibleMonth(startOfMonth(date));
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: 'Hindu Calendar',
          headerTitleAlign: 'left',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTitleStyle: {
            color: palette.textPrimary,
            fontSize: 19,
            fontWeight: '700',
          },
          headerRight: () => (
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
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingTop: headerHeight + spacing.sm }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.pageShell}>
          <View style={styles.monthHeaderRow}>
            <View style={styles.monthHeading}>
              <Text style={styles.monthTitle}>{formatMonthTitle(visibleMonth)}</Text>
              <Text style={styles.monthSubtitle}>{getMonthSubtitle(visibleMonth)}</Text>
            </View>

            <View style={styles.monthStepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show previous month"
                onPress={() => changeMonth(-1)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressedButton]}>
                <Feather color={palette.textPrimary} name="chevron-left" size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Show next month"
                onPress={() => changeMonth(1)}
                style={({ pressed }) => [styles.stepperButton, pressed && styles.pressedButton]}>
                <Feather color={palette.textPrimary} name="chevron-right" size={18} />
              </Pressable>
            </View>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((weekday) => (
              <Text key={weekday} style={styles.weekdayLabel}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.monthGrid}>
            {monthGrid.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map((day) => {
                  const dayDetails = getHinduDayDetails(day.date);

                  return (
                    <CalendarDayCell
                      key={day.key}
                      day={day}
                      isSelected={isSameDay(day.date, selectedDate)}
                      isToday={isSameDay(day.date, today)}
                      markers={dayDetails.markers}
                      onPress={selectDate}
                      secondaryLabel={`${dayDetails.pakshaDay}`}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.selectionSummary}>
            <Text style={styles.selectionLine}>
              {formatWeekdayDate(selectedDate)} · {describeRelativeDay(selectedDate, today)}
            </Text>
            <Text style={styles.selectionTitle}>
              {selectedDetails.observances[0] ?? selectedDetails.tithiLabel}
            </Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.cardEyebrow}>
              {selectedDetails.hinduMonthLabel} · {selectedDetails.samvatLabel}
            </Text>
            <Text style={styles.cardTitle}>{selectedDetails.tithiLabel}</Text>
            <Text style={styles.cardSubtitle}>
              {selectedDetails.observances.length > 0
                ? selectedDetails.observances.join(' • ')
                : 'Quiet day for darshan, study, or personal reminders.'}
            </Text>

            <View style={styles.metricsGrid}>
              <InfoTile label="Nakshatra" value={selectedDetails.nakshatra} />
              <InfoTile label="Yoga" value={selectedDetails.yoga} />
              <InfoTile label="Sunrise" value={selectedDetails.sunrise} />
              <InfoTile label="Sunset" value={selectedDetails.sunset} />
              <InfoTile label="Rahu Kaal" value={selectedDetails.rahuKaal} />
              <InfoTile label="Brahma Muhurat" value={selectedDetails.brahmaMuhurat} />
              <InfoTile label="Karana" value={selectedDetails.karana} />
              <InfoTile label="Focus" value={selectedDetails.observances[0] ?? 'Daily Panchang'} />
            </View>

            <View style={styles.upcomingSection}>
              <Text style={styles.upcomingHeading}>Upcoming highlights</Text>
              {upcomingHighlights.map((highlight) => (
                <View key={highlight.key} style={styles.highlightRow}>
                  <Text style={styles.highlightTitle}>{highlight.title}</Text>
                  <Text style={styles.highlightDate}>{highlight.dateLabel}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.cardFootnote}>
              This first build locks the UI and navigation flow; the exact city-based Panchang
              engine plugs into the same layout next.
            </Text>
          </View>

          <View style={styles.bottomActionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to today"
              onPress={jumpToToday}
              style={({ pressed }) => [styles.todayButton, pressed && styles.pressedButton]}>
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add reminder"
              style={({ pressed }) => [styles.addButton, pressed && styles.pressedButton]}>
              <Feather color={palette.textPrimary} name="plus" size={28} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
        statusBarTranslucent
        transparent
        visible={isMenuVisible}>
        <View style={styles.menuRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsMenuVisible(false)} />

          <View style={[styles.menuCard, { top: headerHeight + spacing.xs }]}>
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

type InfoTileProps = {
  label: string;
  value: string;
};

function InfoTile({ label, value }: InfoTileProps) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={styles.infoTileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  pageShell: {
    width: '100%',
    maxWidth: layout.maxWidth,
    gap: spacing.lg,
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
    alignItems: 'flex-end',
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
    lineHeight: 54,
    fontWeight: '700',
    letterSpacing: -1.6,
  },
  monthSubtitle: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  monthStepper: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pressedButton: {
    opacity: 0.78,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '500',
  },
  monthGrid: {
    borderRadius: radii.lg,
    backgroundColor: palette.background,
    gap: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
  },
  selectionSummary: {
    gap: spacing.xxs,
  },
  selectionLine: {
    color: palette.textSecondary,
    fontSize: typography.title,
    lineHeight: 28,
    fontWeight: '500',
  },
  selectionTitle: {
    color: palette.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  detailCard: {
    borderRadius: 30,
    backgroundColor: palette.surface,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows,
  },
  cardEyebrow: {
    color: palette.textSecondary,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '600',
  },
  cardTitle: {
    color: palette.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoTile: {
    width: '48%',
    borderRadius: radii.md,
    backgroundColor: palette.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  infoTileLabel: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  infoTileValue: {
    color: palette.textPrimary,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '600',
  },
  upcomingSection: {
    gap: spacing.sm,
  },
  upcomingHeading: {
    color: palette.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '700',
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  highlightTitle: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: '500',
    paddingRight: spacing.sm,
  },
  highlightDate: {
    color: palette.textSecondary,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '600',
  },
  cardFootnote: {
    color: palette.textMuted,
    fontSize: typography.caption,
    lineHeight: 16,
  },
  bottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  todayButton: {
    minWidth: 104,
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows,
  },
  todayButtonText: {
    color: palette.textPrimary,
    fontSize: typography.title,
    lineHeight: 26,
    fontWeight: '700',
  },
  addButton: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows,
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
