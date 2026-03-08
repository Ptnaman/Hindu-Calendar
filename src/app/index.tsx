import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo, startTransition, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarDayCell } from '@/components/calendar-day-cell';
import {
  calendarTheme,
  festivalTheme,
  layout,
  palette,
  radii,
  shadows,
  spacing,
  typography,
} from '@/constants/theme';
import {
  addDays,
  addMonths,
  describeRelativeDay,
  formatMonthTitle,
  formatWeekdayDate,
  isSameDay,
  startOfDay,
  startOfMonth,
  WEEKDAY_LABELS,
} from '@/lib/calendar';
import {
  MonthCellDetails,
  MonthRenderData,
  getHinduDayDetails,
  getMonthRenderData,
  primeMonthRenderData,
} from '@/lib/panchang';

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

const VIEW_MODE_ITEMS = [
  {
    key: 'month',
    label: 'Month view',
    description: 'Show the full month',
    icon: 'calendar',
  },
  {
    key: 'week',
    label: 'Week view',
    description: 'Show one focused week',
    icon: 'columns',
  },
] as const;

const MONTH_SWIPE_DISTANCE = 48;
const MONTH_SWIPE_VELOCITY = 420;
const CALENDAR_VIEW_SWIPE_DISTANCE = 48;
const CALENDAR_VIEW_SWIPE_VELOCITY = 360;
const CALENDAR_ROW_HEIGHT = 58;
const MONTH_SNAP_DURATION = 260;
const VIEW_MENU_RIGHT_OFFSET = spacing.md + 48;
const CALENDAR_VIEW_SPRING = {
  damping: 28,
  stiffness: 280,
  mass: 0.9,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
} as const;

type CalendarViewMode = 'month' | 'week';

type MonthGridPanelProps = {
  monthData: MonthRenderData;
  width: number;
  today: Date;
  selectedDate: Date | null;
  anchorWeekIndex: number;
  showOutsideMonthDays: boolean;
  collapseProgress: SharedValue<number>;
  onDatePress: (date: Date) => void;
};

type MonthWindow = {
  left: MonthRenderData;
  center: MonthRenderData;
  right: MonthRenderData;
};

type WeekWindow = {
  left: Date;
  center: Date;
  right: Date;
};

function isDateInMonth(date: Date, month: Date) {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

function getDisplayedWeeks(
  monthData: MonthRenderData,
  selectedDate: Date | null,
  today: Date,
  collapseToSelectedWeek: boolean
) {
  const monthGrid = monthData.weeks;

  if (!collapseToSelectedWeek) {
    return monthGrid;
  }

  const anchorDate =
    (selectedDate && isDateInMonth(selectedDate, monthData.month) ? selectedDate : null) ??
    (isDateInMonth(today, monthData.month) ? today : monthData.month);
  const selectedWeekIndex = monthGrid.findIndex((week) =>
    week.some((cell) => isSameDay(cell.day.date, anchorDate))
  );

  return selectedWeekIndex >= 0 ? [monthGrid[selectedWeekIndex]] : monthGrid;
}

function getMonthGridHeight(weekCount: number) {
  return weekCount * CALENDAR_ROW_HEIGHT + Math.max(0, weekCount - 1) * spacing.xs;
}

function clampValue(value: number, minimum: number, maximum: number) {
  'worklet';

  return Math.min(maximum, Math.max(minimum, value));
}

function areDatesEqual(left: Date | null, right: Date | null) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return isSameDay(left, right);
}

function buildMonthWindow(centerMonth: Date): MonthWindow {
  return {
    left: getMonthRenderData(addMonths(centerMonth, -1)),
    center: getMonthRenderData(centerMonth),
    right: getMonthRenderData(addMonths(centerMonth, 1)),
  };
}

function buildWeekWindow(centerDate: Date): WeekWindow {
  const safeDate = startOfDay(centerDate);

  return {
    left: addDays(safeDate, -7),
    center: safeDate,
    right: addDays(safeDate, 7),
  };
}

function getDefaultSummaryDate(month: Date, today: Date) {
  return month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth()
    ? today
    : month;
}

function getAnchorWeekIndex(monthData: MonthRenderData, selectedDate: Date | null, today: Date) {
  const week = getDisplayedWeeks(monthData, selectedDate, today, true)[0];

  if (!week) {
    return 0;
  }

  return monthData.weeks.findIndex((currentWeek) => currentWeek[0]?.day.key === week[0]?.day.key);
}

const MonthGridPanel = memo(function MonthGridPanel({
  monthData,
  width,
  today,
  selectedDate,
  anchorWeekIndex,
  showOutsideMonthDays,
  collapseProgress,
  onDatePress,
}: MonthGridPanelProps) {
  const panelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          -anchorWeekIndex * (CALENDAR_ROW_HEIGHT + spacing.xs) * collapseProgress.value,
      },
    ],
  }));

  return (
    <Animated.View
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={[styles.monthGridPanel, { width }, panelAnimatedStyle]}>
      <View style={styles.monthGrid}>
        {monthData.weeks.map((week, weekIndex) => (
          <View key={`${monthData.monthKey}-week-${weekIndex}`} style={styles.weekRow}>
            {week.map((cell: MonthCellDetails) => {
              return (
                <CalendarDayCell
                  key={cell.day.key}
                  day={cell.day}
                  isSelected={selectedDate ? isSameDay(cell.day.date, selectedDate) : false}
                  isToday={isSameDay(cell.day.date, today)}
                  markers={cell.details.markers}
                  onPress={onDatePress}
                  secondaryLabel={`${cell.details.hinduMonthDay}`}
                  showOutsideMonthDays={showOutsideMonthDays}
                />
              );
            })}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}, (previousProps, nextProps) => {
  return (
    previousProps.width === nextProps.width &&
    previousProps.anchorWeekIndex === nextProps.anchorWeekIndex &&
    previousProps.monthData.monthKey === nextProps.monthData.monthKey &&
    areDatesEqual(previousProps.selectedDate, nextProps.selectedDate) &&
    previousProps.showOutsideMonthDays === nextProps.showOutsideMonthDays &&
    isSameDay(previousProps.today, nextProps.today) &&
    previousProps.collapseProgress === nextProps.collapseProgress
  );
});

export default function Index() {
  const today = startOfDay(new Date());
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [monthWindow, setMonthWindow] = useState(() => buildMonthWindow(startOfMonth(today)));
  const [weekWindow, setWeekWindow] = useState(() => buildWeekWindow(today));
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [displayedDate, setDisplayedDate] = useState(today);
  const [isViewMenuVisible, setIsViewMenuVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const monthPagerWidth = Math.min(layout.maxWidth, windowWidth - spacing.md * 2);
  const headerHeight = insets.top + spacing.xs + 40 + spacing.xs;
  const menuTopOffset = headerHeight + spacing.xs;
  const visibleMonth = monthWindow.center.month;
  const previousMonthData = monthWindow.left;
  const visibleMonthData = monthWindow.center;
  const nextMonthData = monthWindow.right;
  const isWeekView = calendarViewMode === 'week';
  const summaryDate = displayedDate;
  const headerMonth = isWeekView ? startOfMonth(displayedDate) : visibleMonth;
  const headerMonthData = isWeekView ? getMonthRenderData(headerMonth) : visibleMonthData;
  const monthSubtitle = headerMonthData.subtitle;
  const summaryDetails = getHinduDayDetails(summaryDate);
  const summaryText = `${formatWeekdayDate(summaryDate)}, ${describeRelativeDay(summaryDate, today).toLowerCase()}`;
  const weekCenterDate = weekWindow.center;
  const previousPanelMonthData = isWeekView
    ? getMonthRenderData(startOfMonth(weekWindow.left))
    : previousMonthData;
  const currentPanelMonthData = isWeekView
    ? getMonthRenderData(startOfMonth(weekCenterDate))
    : visibleMonthData;
  const nextPanelMonthData = isWeekView
    ? getMonthRenderData(startOfMonth(weekWindow.right))
    : nextMonthData;
  const previousPanelSelectedDate = isWeekView ? weekWindow.left : selectedDate;
  const currentPanelSelectedDate = isWeekView ? weekCenterDate : selectedDate;
  const nextPanelSelectedDate = isWeekView ? weekWindow.right : selectedDate;
  const shouldExpandFestivalSection =
    isWeekView || (Boolean(selectedDate) && summaryDetails.festivalEntries.length > 0);
  const currentAnchorWeekIndex = isWeekView
    ? getAnchorWeekIndex(currentPanelMonthData, weekCenterDate, weekCenterDate)
    : getAnchorWeekIndex(visibleMonthData, selectedDate, today);
  const previousAnchorWeekIndex = isWeekView
    ? getAnchorWeekIndex(previousPanelMonthData, weekWindow.left, weekWindow.left)
    : getAnchorWeekIndex(previousMonthData, selectedDate, today);
  const nextAnchorWeekIndex = isWeekView
    ? getAnchorWeekIndex(nextPanelMonthData, weekWindow.right, weekWindow.right)
    : getAnchorWeekIndex(nextMonthData, selectedDate, today);
  const currentGridHeight = getMonthGridHeight(currentPanelMonthData.weeks.length);
  const previousGridHeight = getMonthGridHeight(previousPanelMonthData.weeks.length);
  const nextGridHeight = getMonthGridHeight(nextPanelMonthData.weeks.length);
  const monthPagerTranslateX = useSharedValue(0);
  const collapseProgress = useSharedValue(isWeekView ? 1 : 0);
  const collapseStartProgress = useSharedValue(isWeekView ? 1 : 0);
  const pendingSwipeModeRef = useRef<'month' | 'week' | null>(null);
  const pendingFinalWindowRef = useRef<MonthWindow | null>(null);
  const pendingFinalWeekWindowRef = useRef<WeekWindow | null>(null);
  const pendingDisplayedDateRef = useRef<Date | null>(null);
  const pendingSelectedDateRef = useRef<Date | null | undefined>(undefined);

  function selectDate(date: Date) {
    startTransition(() => {
      setSelectedDate(date);
      setDisplayedDate(date);
      setMonthWindow(buildMonthWindow(startOfMonth(date)));
      setWeekWindow(buildWeekWindow(date));
    });
  }

  function handleDatePress(date: Date) {
    selectDate(date);
  }

  function handleViewModeChange(nextMode: CalendarViewMode) {
    setCalendarViewMode(nextMode);
    setIsViewMenuVisible(false);

    if (nextMode === 'week' && !selectedDate) {
      setSelectedDate(summaryDate);
      setDisplayedDate(summaryDate);
      setWeekWindow(buildWeekWindow(summaryDate));
    }
  }

  function applyGestureViewMode(nextMode: CalendarViewMode) {
    startTransition(() => {
      if (calendarViewMode !== nextMode) {
        setCalendarViewMode(nextMode);
      }

      if (nextMode === 'week' && !selectedDate) {
        setSelectedDate(summaryDate);
        setDisplayedDate(summaryDate);
        setWeekWindow(buildWeekWindow(summaryDate));
      }
    });
  }

  function finalizeMonthSwipe(direction: number) {
    const outerMonth = addMonths(visibleMonth, direction * 2);
    const targetMonth = direction === 1 ? monthWindow.right.month : monthWindow.left.month;
    primeMonthRenderData(outerMonth);
    pendingDisplayedDateRef.current = getDefaultSummaryDate(targetMonth, today);
    pendingSelectedDateRef.current = null;

    if (direction === 1) {
      const finalWindow: MonthWindow = {
        left: monthWindow.center,
        center: monthWindow.right,
        right: getMonthRenderData(addMonths(monthWindow.right.month, 1)),
      };

      pendingSwipeModeRef.current = 'month';
      pendingFinalWindowRef.current = finalWindow;
      startTransition(() => {
        setMonthWindow({
          left: monthWindow.center,
          center: monthWindow.right,
          right: monthWindow.right,
        });
      });
      return;
    }

    const finalWindow: MonthWindow = {
      left: getMonthRenderData(addMonths(monthWindow.left.month, -1)),
      center: monthWindow.left,
      right: monthWindow.center,
    };

    pendingSwipeModeRef.current = 'month';
    pendingFinalWindowRef.current = finalWindow;
    startTransition(() => {
      setMonthWindow({
        left: monthWindow.left,
        center: monthWindow.left,
        right: monthWindow.center,
      });
    });
  }

  function finalizeWeekSwipe(direction: number) {
    const targetDate = direction === 1 ? weekWindow.right : weekWindow.left;
    const futureDate = addDays(targetDate, direction * 7);
    primeMonthRenderData(startOfMonth(futureDate));
    pendingDisplayedDateRef.current = targetDate;
    pendingSelectedDateRef.current = targetDate;

    const finalWeekWindow =
      direction === 1
        ? buildWeekWindow(weekWindow.right)
        : buildWeekWindow(weekWindow.left);
    const finalMonthWindow = buildMonthWindow(startOfMonth(targetDate));

    pendingSwipeModeRef.current = 'week';
    pendingFinalWindowRef.current = finalMonthWindow;
    pendingFinalWeekWindowRef.current = finalWeekWindow;
    startTransition(() => {
      setWeekWindow(
        direction === 1
          ? {
              left: weekWindow.center,
              center: weekWindow.right,
              right: weekWindow.right,
            }
          : {
              left: weekWindow.left,
              center: weekWindow.left,
              right: weekWindow.center,
            }
      );
    });
  }

  useEffect(() => {
    primeMonthRenderData(addMonths(visibleMonth, -2));
    primeMonthRenderData(addMonths(visibleMonth, 2));
  }, [visibleMonth]);

  useEffect(() => {
    const targetProgress = isWeekView ? 1 : 0;

    if (collapseProgress.value === targetProgress) {
      return;
    }

    collapseProgress.value = withSpring(targetProgress, CALENDAR_VIEW_SPRING);
  }, [collapseProgress, isWeekView]);

  useLayoutEffect(() => {
    if (!pendingSwipeModeRef.current) {
      return;
    }

    monthPagerTranslateX.value = 0;
    const finalWindow = pendingFinalWindowRef.current;
    const finalWeekWindow = pendingFinalWeekWindowRef.current;
    const nextSelectedDate = pendingSelectedDateRef.current;
    pendingSwipeModeRef.current = null;
    pendingFinalWindowRef.current = null;
    pendingFinalWeekWindowRef.current = null;
    pendingSelectedDateRef.current = undefined;

    if (!finalWindow && !finalWeekWindow) {
      return;
    }

    const nextDisplayedDate = pendingDisplayedDateRef.current;
    pendingDisplayedDateRef.current = null;

    requestAnimationFrame(() => {
      startTransition(() => {
        if (finalWindow) {
          setMonthWindow(finalWindow);
        }

        if (finalWeekWindow) {
          setWeekWindow(finalWeekWindow);
        }

        if (nextDisplayedDate) {
          setDisplayedDate(nextDisplayedDate);
        }

        if (nextSelectedDate !== undefined) {
          setSelectedDate(nextSelectedDate);
        }
      });
    });
  }, [monthPagerTranslateX, monthWindow, weekWindow]);

  const viewModePanGesture = Gesture.Pan()
    .enabled(!isMenuVisible && !isViewMenuVisible && monthPagerWidth > 0)
    .activeOffsetY([-16, 16])
    .failOffsetX([-18, 18])
    .onBegin(() => {
      cancelAnimation(collapseProgress);
      collapseStartProgress.value = collapseProgress.value;
    })
    .onUpdate((event) => {
      const collapseRange = Math.max(currentGridHeight - CALENDAR_ROW_HEIGHT, 1);
      const nextProgress = collapseStartProgress.value - event.translationY / collapseRange;
      collapseProgress.value = clampValue(nextProgress, 0, 1);
    })
    .onEnd((event) => {
      const collapseRange = Math.max(currentGridHeight - CALENDAR_ROW_HEIGHT, 1);
      const targetMode =
        event.translationY <= -CALENDAR_VIEW_SWIPE_DISTANCE ||
        event.velocityY <= -CALENDAR_VIEW_SWIPE_VELOCITY
          ? 'week'
          : event.translationY >= CALENDAR_VIEW_SWIPE_DISTANCE ||
              event.velocityY >= CALENDAR_VIEW_SWIPE_VELOCITY
            ? 'month'
            : collapseProgress.value >= 0.5
              ? 'week'
              : 'month';
      const targetProgress = targetMode === 'week' ? 1 : 0;
      const springVelocity = clampValue(-event.velocityY / collapseRange, -4, 4);

      collapseProgress.value = withSpring(
        targetProgress,
        {
          ...CALENDAR_VIEW_SPRING,
          velocity: springVelocity,
        },
        (finished) => {
          if (finished) {
            runOnJS(applyGestureViewMode)(targetMode);
          }
        }
      );
    });

  const monthSwipeGesture = Gesture.Pan()
    .enabled(!isMenuVisible && !isViewMenuVisible && monthPagerWidth > 0)
    .activeOffsetX([-16, 16])
    .failOffsetY([-18, 18])
    .onBegin(() => {
      cancelAnimation(monthPagerTranslateX);
    })
    .onUpdate((event) => {
      monthPagerTranslateX.value = clampValue(event.translationX, -monthPagerWidth, monthPagerWidth);
    })
    .onEnd((event) => {
      const isNextMonth =
        event.translationX <= -MONTH_SWIPE_DISTANCE || event.velocityX <= -MONTH_SWIPE_VELOCITY;
      const isPreviousMonth =
        event.translationX >= MONTH_SWIPE_DISTANCE || event.velocityX >= MONTH_SWIPE_VELOCITY;
      const direction = isNextMonth ? 1 : isPreviousMonth ? -1 : 0;

      if (direction === 0) {
        monthPagerTranslateX.value = withTiming(0, {
          duration: MONTH_SNAP_DURATION,
          easing: Easing.out(Easing.cubic),
        });
        return;
      }

      monthPagerTranslateX.value = withTiming(direction === 1 ? -monthPagerWidth : monthPagerWidth, {
        duration: MONTH_SNAP_DURATION,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      }, (finished) => {
        if (finished) {
          runOnJS(isWeekView ? finalizeWeekSwipe : finalizeMonthSwipe)(direction);
        }
      });
    });

  const monthPagerTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: monthPagerTranslateX.value - monthPagerWidth }],
  }));

  const monthGridViewportStyle = useAnimatedStyle(() => {
    if (monthPagerWidth <= 0) {
      return { height: currentGridHeight };
    }

    const swipeProgress = monthPagerTranslateX.value / monthPagerWidth;
    const targetHeight =
      swipeProgress < 0
        ? interpolate(-swipeProgress, [0, 1], [currentGridHeight, nextGridHeight])
        : interpolate(swipeProgress, [0, 1], [currentGridHeight, previousGridHeight]);

    return {
      height: interpolate(collapseProgress.value, [0, 1], [targetHeight, CALENDAR_ROW_HEIGHT]),
    };
  });

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <View style={[styles.headerShell, { paddingTop: insets.top }]}>
        <View style={styles.appHeader}>
          <Text numberOfLines={1} style={styles.appHeaderTitle}>
            Hindu Calendar
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isViewMenuVisible ? 'Close calendar view options' : 'Open calendar view options'}
              onPress={() => {
                setIsMenuVisible(false);
                setIsViewMenuVisible((currentValue) => !currentValue);
              }}
              style={({ pressed }) => [
                styles.headerMenuButton,
                pressed && styles.pressedButton,
              ]}>
              <Feather color={palette.textPrimary} name="calendar" size={18} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isMenuVisible ? 'Close menu' : 'Open menu'}
              onPress={() => {
                setIsViewMenuVisible(false);
                setIsMenuVisible((currentValue) => !currentValue);
              }}
              style={({ pressed }) => [
                styles.headerMenuButton,
                pressed && styles.pressedButton,
              ]}>
              <Feather color={palette.textPrimary} name="more-vertical" size={18} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View
          style={[
            styles.calendarArea,
            {
              paddingTop: headerHeight,
              paddingBottom: Math.max(insets.bottom, spacing.sm),
            },
          ]}>
            <View style={styles.screenContent}>
              <View style={styles.calendarSection}>
                <GestureDetector gesture={viewModePanGesture}>
                  <View style={styles.pageShell}>
                <View
                  renderToHardwareTextureAndroid
                  shouldRasterizeIOS
                  style={styles.calendarBlock}>
                  <View style={styles.monthHeaderRow}>
                    <View style={styles.monthHeading}>
                      <Text style={styles.monthTitle}>{formatMonthTitle(headerMonth)}</Text>
                      <ScrollView
                        bounces={false}
                        horizontal
                        nestedScrollEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.monthSubtitleScroll}
                        contentContainerStyle={styles.monthSubtitleScrollContent}>
                        <Text numberOfLines={1} style={styles.monthSubtitle}>
                          {monthSubtitle}
                        </Text>
                      </ScrollView>
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

                  <GestureDetector gesture={monthSwipeGesture}>
                    <Animated.View style={[styles.monthGridViewport, monthGridViewportStyle]}>
                      <Animated.View
                        style={[
                          styles.monthPagerTrack,
                          { width: monthPagerWidth * 3 },
                          monthPagerTrackStyle,
                        ]}>
                        <MonthGridPanel
                          anchorWeekIndex={previousAnchorWeekIndex}
                          collapseProgress={collapseProgress}
                          monthData={previousPanelMonthData}
                          onDatePress={handleDatePress}
                          selectedDate={previousPanelSelectedDate}
                          showOutsideMonthDays={isWeekView}
                          today={today}
                          width={monthPagerWidth}
                        />
                        <MonthGridPanel
                          anchorWeekIndex={currentAnchorWeekIndex}
                          collapseProgress={collapseProgress}
                          monthData={currentPanelMonthData}
                          onDatePress={handleDatePress}
                          selectedDate={currentPanelSelectedDate}
                          showOutsideMonthDays={isWeekView}
                          today={today}
                          width={monthPagerWidth}
                        />
                        <MonthGridPanel
                          anchorWeekIndex={nextAnchorWeekIndex}
                          collapseProgress={collapseProgress}
                          monthData={nextPanelMonthData}
                          onDatePress={handleDatePress}
                          selectedDate={nextPanelSelectedDate}
                          showOutsideMonthDays={isWeekView}
                          today={today}
                          width={monthPagerWidth}
                        />
                      </Animated.View>
                    </Animated.View>
                  </GestureDetector>

                  <Text style={styles.calendarSummary}>{summaryText}</Text>
                </View>

                <View
                  style={[
                    styles.festivalSection,
                    !shouldExpandFestivalSection && styles.compactFestivalSection,
                    shouldExpandFestivalSection && styles.expandedFestivalSection,
                  ]}>
                  <ScrollView
                      contentContainerStyle={
                        summaryDetails.festivalEntries.length > 0
                          ? styles.festivalScrollContent
                          : styles.emptyFestivalScrollContent
                      }
                      nestedScrollEnabled
                      scrollEventThrottle={16}
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
                </GestureDetector>
            </View>
          </View>
        </View>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsViewMenuVisible(false)}
        statusBarTranslucent
        transparent
        visible={isViewMenuVisible}>
        <View style={styles.menuRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsViewMenuVisible(false)} />

          <View style={[styles.viewMenuCard, { top: menuTopOffset, right: VIEW_MENU_RIGHT_OFFSET }]}>
            {VIEW_MODE_ITEMS.map((item, index) => {
              const isActive = calendarViewMode === item.key;

              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  onPress={() => handleViewModeChange(item.key)}
                  style={({ pressed }) => [
                    styles.viewModeItem,
                    index < VIEW_MODE_ITEMS.length - 1 && styles.menuItemBorder,
                    isActive && styles.activeViewModeItem,
                    pressed && styles.pressedButton,
                  ]}>
                  <View style={[styles.menuItemIcon, isActive && styles.activeViewModeIcon]}>
                    <Feather
                      color={isActive ? palette.selectedText : palette.textPrimary}
                      name={item.icon}
                      size={16}
                    />
                  </View>
                  <View style={styles.menuItemCopy}>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    <Text style={styles.menuItemDescription}>{item.description}</Text>
                  </View>
                  {isActive ? <Feather color={palette.accent} name="check" size={16} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
    fontSize: calendarTheme.monthSubtitleSize,
    lineHeight: calendarTheme.monthSubtitleLineHeight,
    letterSpacing: calendarTheme.monthSubtitleLetterSpacing,
  },
  monthSubtitleScroll: {
    flexGrow: 0,
  },
  monthSubtitleScrollContent: {
    paddingRight: spacing.lg,
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
  monthGridViewport: {
    width: '100%',
    overflow: 'hidden',
  },
  monthPagerTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  monthGridPanel: {
    width: '100%',
  },
  calendarSummary: {
    color: palette.textSecondary,
    fontSize: typography.body,
    lineHeight: 26,
    fontWeight: '500',
    paddingTop: spacing.sm,
  },
  festivalSection: {
    minHeight: 0,
    overflow: 'hidden',
  },
  compactFestivalSection: {
    height: festivalTheme.containerHeight,
  },
  expandedFestivalSection: {
    flex: 1,
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
  viewMenuCard: {
    position: 'absolute',
    width: 220,
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
  viewModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
  },
  activeViewModeItem: {
    backgroundColor: 'rgba(197, 95, 45, 0.06)',
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
  activeViewModeIcon: {
    backgroundColor: palette.accent,
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
