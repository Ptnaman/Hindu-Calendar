import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { palette, radii, spacing, typography } from '@/constants/theme';
import { CalendarDay } from '@/lib/calendar';
import { MarkerKind } from '@/lib/panchang';

type CalendarDayCellProps = {
  day: CalendarDay;
  secondaryLabel: string;
  markers: MarkerKind[];
  isSelected: boolean;
  isToday: boolean;
  todayFocusToken?: number;
  showOutsideMonthDays?: boolean;
  onPress: (date: Date) => void;
};

const markerColorMap: Record<MarkerKind, string> = {
  festival: palette.accent,
  vrat: palette.accentSoft,
  devotion: palette.textMuted,
};

function areMarkerListsEqual(left: MarkerKind[], right: MarkerKind[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((marker, index) => marker === right[index]);
}

function CalendarDayCellComponent({
  day,
  secondaryLabel,
  markers,
  isSelected,
  isToday,
  todayFocusToken = 0,
  showOutsideMonthDays = false,
  onPress,
}: CalendarDayCellProps) {
  const isOutsideMonthDay = !day.inCurrentMonth;
  const selectionScale = useSharedValue(1);

  useEffect(() => {
    if (!isSelected || !isToday) {
      return;
    }

    selectionScale.value = withSequence(
      withTiming(0.84, { duration: 80 }),
      withSpring(1.08, { damping: 11, stiffness: 300 }),
      withSpring(1, { damping: 16, stiffness: 240 })
    );
  }, [isSelected, isToday, selectionScale, todayFocusToken]);

  const selectionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectionScale.value }],
  }));

  if (isOutsideMonthDay && !showOutsideMonthDays) {
    return <View style={styles.emptyCell} />;
  }

  const weekendColor = day.date.getDay() === 0 ? palette.accent : palette.textPrimary;

  return (
    <View style={styles.slot}>
      <Animated.View style={selectionAnimatedStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${day.date.toDateString()}`}
          onPress={() => onPress(day.date)}
        style={({ pressed }) => [
          styles.dayButton,
          isOutsideMonthDay && !isSelected && styles.outsideMonthButton,
          isSelected && styles.selectedButton,
          isToday && isSelected && styles.todaySelectedButton,
          isToday && !isSelected && styles.todayButton,
          pressed && styles.pressed,
        ]}>
          <Text
            style={[
              styles.dayNumber,
              {
                color: isOutsideMonthDay
                  ? palette.textMuted
                  : day.isWeekend
                    ? weekendColor
                    : palette.textPrimary,
            },
            isOutsideMonthDay && !isSelected && styles.outsideMonthDayNumber,
            isToday && !isSelected && styles.todayDayNumber,
            isSelected && styles.selectedDayNumber,
          ]}>
            {day.dayNumber}
          </Text>
          {secondaryLabel ? (
            <Text
              style={[
              styles.secondaryLabel,
              isOutsideMonthDay && !isSelected && styles.outsideMonthSecondaryLabel,
              isToday && !isSelected && styles.todaySecondaryLabel,
              isSelected && styles.selectedSecondaryLabel,
            ]}>
              {secondaryLabel}
            </Text>
          ) : (
            <View style={styles.secondarySpacer} />
          )}
        </Pressable>
      </Animated.View>

      {!isSelected && markers.length > 0 ? (
        <View style={[styles.markersRow, isOutsideMonthDay && !isSelected && styles.outsideMonthMarkersRow]}>
          {markers.map((marker, index) => (
            <View
              key={`${marker}-${index}`}
              style={[styles.marker, { backgroundColor: markerColorMap[marker] }]}
            />
          ))}
        </View>
      ) : (
        <View style={styles.markersSpacer} />
      )}
    </View>
  );
}

export const CalendarDayCell = memo(
  CalendarDayCellComponent,
  (previousProps, nextProps) =>
    previousProps.day.key === nextProps.day.key &&
    previousProps.secondaryLabel === nextProps.secondaryLabel &&
    previousProps.isSelected === nextProps.isSelected &&
    previousProps.isToday === nextProps.isToday &&
    (!(previousProps.isToday || nextProps.isToday) ||
      previousProps.todayFocusToken === nextProps.todayFocusToken) &&
    previousProps.showOutsideMonthDays === nextProps.showOutsideMonthDays &&
    areMarkerListsEqual(previousProps.markers, nextProps.markers)
);

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
  },
  emptyCell: {
    flex: 1,
    minHeight: 58,
  },
  dayButton: {
    width: 40,
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  outsideMonthButton: {
    opacity: 0.72,
  },
  selectedButton: {
    backgroundColor: palette.selected,
  },
  todaySelectedButton: {
    backgroundColor: palette.accent,
  },
  todayButton: {
    borderWidth: 1,
    borderColor: palette.accent,
    backgroundColor: palette.accent,
  },
  pressed: {
    opacity: 0.82,
  },
  dayNumber: {
    fontSize: typography.body,
    lineHeight: 18,
    fontWeight: '600',
  },
  selectedDayNumber: {
    color: palette.selectedText,
  },
  todayDayNumber: {
    color: palette.selectedText,
  },
  outsideMonthDayNumber: {
    color: palette.textSecondary,
  },
  secondaryLabel: {
    fontSize: typography.caption,
    lineHeight: 11,
    color: palette.textMuted,
    fontWeight: '500',
  },
  selectedSecondaryLabel: {
    color: 'rgba(255,255,255,0.72)',
  },
  todaySecondaryLabel: {
    color: 'rgba(255,255,255,0.72)',
  },
  outsideMonthSecondaryLabel: {
    color: palette.textMuted,
  },
  secondarySpacer: {
    minHeight: 11,
  },
  markersRow: {
    minHeight: spacing.xs,
    paddingTop: 2,
    flexDirection: 'row',
    gap: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outsideMonthMarkersRow: {
    opacity: 0.5,
  },
  markersSpacer: {
    minHeight: spacing.xs,
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: radii.lg,
  },
});
