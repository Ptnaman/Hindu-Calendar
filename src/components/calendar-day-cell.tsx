import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette, radii, spacing, typography } from '@/constants/theme';
import { CalendarDay } from '@/lib/calendar';
import { MarkerKind } from '@/lib/panchang';

type CalendarDayCellProps = {
  day: CalendarDay;
  secondaryLabel: string;
  markers: MarkerKind[];
  isSelected: boolean;
  isToday: boolean;
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
  onPress,
}: CalendarDayCellProps) {
  if (!day.inCurrentMonth) {
    return <View style={styles.emptyCell} />;
  }

  const weekendColor = day.date.getDay() === 0 ? palette.accent : palette.textPrimary;

  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${day.date.toDateString()}`}
        onPress={() => onPress(day.date)}
        style={({ pressed }) => [
          styles.dayButton,
          isSelected && styles.selectedButton,
          isToday && !isSelected && styles.todayButton,
          pressed && styles.pressed,
        ]}>
        <Text
          style={[
            styles.dayNumber,
            { color: day.isWeekend ? weekendColor : palette.textPrimary },
            isSelected && styles.selectedDayNumber,
          ]}>
          {day.dayNumber}
        </Text>
        {secondaryLabel ? (
          <Text style={[styles.secondaryLabel, isSelected && styles.selectedSecondaryLabel]}>
            {secondaryLabel}
          </Text>
        ) : (
          <View style={styles.secondarySpacer} />
        )}
      </Pressable>

      {!isSelected && markers.length > 0 ? (
        <View style={styles.markersRow}>
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
  selectedButton: {
    backgroundColor: palette.selected,
  },
  todayButton: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
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
  secondaryLabel: {
    fontSize: typography.caption,
    lineHeight: 11,
    color: palette.textMuted,
    fontWeight: '500',
  },
  selectedSecondaryLabel: {
    color: 'rgba(255,255,255,0.72)',
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
  markersSpacer: {
    minHeight: spacing.xs,
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: radii.lg,
  },
});
