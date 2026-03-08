import { getDaysInMonth } from '@/lib/calendar';

export type MarkerKind = 'festival' | 'vrat' | 'devotion';

export type FestivalEntry = {
  title: string;
  category: string;
  marker: MarkerKind;
};

export type HinduDayDetails = {
  hinduMonthLabel: string;
  hinduMonthDay: number;
  samvatLabel: string;
  tithiLabel: string;
  pakshaDay: number;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  rahuKaal: string;
  brahmaMuhurat: string;
  festivalEntries: FestivalEntry[];
  observances: string[];
  markers: MarkerKind[];
};

type HinduDayCore = Omit<HinduDayDetails, 'samvatLabel'>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LATITUDE = 28.6139;

const TITHI_NAMES = [
  '',
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima',
];

const NAKSHATRA_NAMES = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashirsha',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
];

const YOGA_NAMES = [
  'Vishkambha',
  'Priti',
  'Ayushman',
  'Saubhagya',
  'Shobhana',
  'Atiganda',
  'Sukarma',
  'Dhriti',
  'Shoola',
  'Ganda',
  'Vriddhi',
  'Dhruva',
  'Vyaghata',
  'Harshana',
  'Vajra',
  'Siddhi',
  'Vyatipata',
  'Variyana',
  'Parigha',
  'Shiva',
  'Siddha',
  'Sadhya',
  'Shubha',
  'Shukla',
  'Brahma',
  'Indra',
  'Vaidhriti',
];

const HINDU_MONTH_START_TEMPLATE = [
  { monthIndex: 0, day: 14, monthLabel: 'Magha' },
  { monthIndex: 1, day: 12, monthLabel: 'Phalguna' },
  { monthIndex: 2, day: 15, monthLabel: 'Chaitra' },
  { monthIndex: 3, day: 14, monthLabel: 'Vaishakha' },
  { monthIndex: 4, day: 15, monthLabel: 'Jyeshtha' },
  { monthIndex: 5, day: 15, monthLabel: 'Ashadha' },
  { monthIndex: 6, day: 16, monthLabel: 'Shravana' },
  { monthIndex: 7, day: 16, monthLabel: 'Bhadrapada' },
  { monthIndex: 8, day: 17, monthLabel: 'Ashwin' },
  { monthIndex: 9, day: 17, monthLabel: 'Kartika' },
  { monthIndex: 10, day: 16, monthLabel: 'Margashirsha' },
  { monthIndex: 11, day: 16, monthLabel: 'Pausha' },
] as const;

const VIKRAM_SAMVAT_STARTS = [
  { gregorianYear: 2026, monthIndex: 2, day: 19 },
] as const;

const FIXED_FESTIVAL_ENTRIES: Record<string, FestivalEntry[]> = {
  '2026-01-14': [{ title: 'Makar Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-02-12': [{ title: 'Kumbh Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-03-15': [{ title: 'Meen Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-03-19': [
    { title: 'Chaitra Navratri Begins', category: 'Navratri', marker: 'festival' },
    { title: 'Gudi Padwa', category: 'Holidays in India', marker: 'festival' },
    { title: 'Gudi Padwa', category: 'Hindu Holidays', marker: 'festival' },
    { title: 'Ugadi', category: 'Holidays in India', marker: 'festival' },
    { title: 'Ugadi', category: 'Hindu Holidays', marker: 'festival' },
    { title: 'Vikram Samvat 2083 Begins', category: 'New Year', marker: 'festival' },
  ],
  '2026-04-14': [
    { title: 'Mesha Sankranti', category: 'Sankranti', marker: 'festival' },
    { title: 'Baisakhi', category: 'Holidays in India', marker: 'festival' },
  ],
  '2026-05-15': [{ title: 'Vrishabha Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-06-15': [{ title: 'Mithuna Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-07-16': [{ title: 'Karka Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-08-16': [{ title: 'Simha Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-09-17': [{ title: 'Kanya Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-10-17': [{ title: 'Tula Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-11-16': [{ title: 'Vrischika Sankranti', category: 'Sankranti', marker: 'festival' }],
  '2026-12-16': [{ title: 'Dhanu Sankranti', category: 'Sankranti', marker: 'festival' }],
};

const KARANA_SEQUENCE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Vishti'];
const RAHU_PART_BY_WEEKDAY = [8, 2, 7, 5, 6, 4, 3];

const coreCache = new Map<string, HinduDayCore>();
const detailsCache = new Map<string, HinduDayDetails>();
const samvatStartCache = new Map<number, Date>();

function buildDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizeAngle(value: number) {
  return ((value % 360) + 360) % 360;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function julianDay(date: Date) {
  return date.getTime() / DAY_IN_MS + 2440587.5;
}

function startOfDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceInCalendarDays(left: Date, right: Date) {
  return Math.round((startOfDate(left).getTime() - startOfDate(right).getTime()) / DAY_IN_MS);
}

function getObservationDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0, 0);
}

function getSunLongitude(jd: number) {
  const T = (jd - 2451545.0) / 36525;
  const meanLongitude = normalizeAngle(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const meanAnomaly = normalizeAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const equationOfCenter =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(toRadians(meanAnomaly)) +
    (0.019993 - 0.000101 * T) * Math.sin(toRadians(2 * meanAnomaly)) +
    0.000289 * Math.sin(toRadians(3 * meanAnomaly));

  return normalizeAngle(meanLongitude + equationOfCenter);
}

function getMoonLongitude(jd: number) {
  const T = (jd - 2451545.0) / 36525;
  const meanLongitude = normalizeAngle(
    218.3164477 +
      481267.88123421 * T -
      0.0015786 * T * T +
      (T * T * T) / 538841 -
      (T * T * T * T) / 65194000
  );
  const elongation = normalizeAngle(
    297.8501921 +
      445267.1114034 * T -
      0.0018819 * T * T +
      (T * T * T) / 545868 -
      (T * T * T * T) / 113065000
  );
  const solarAnomaly = normalizeAngle(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const lunarAnomaly = normalizeAngle(
    134.9633964 +
      477198.8675055 * T +
      0.0087414 * T * T +
      (T * T * T) / 69699 -
      (T * T * T * T) / 14712000
  );
  const latitudeArgument = normalizeAngle(
    93.272095 + 483202.0175233 * T - 0.0036539 * T * T - (T * T * T) / 3526000
  );

  const longitude =
    meanLongitude +
    6.289 * Math.sin(toRadians(lunarAnomaly)) +
    1.274 * Math.sin(toRadians(2 * elongation - lunarAnomaly)) +
    0.658 * Math.sin(toRadians(2 * elongation)) +
    0.214 * Math.sin(toRadians(2 * lunarAnomaly)) -
    0.186 * Math.sin(toRadians(solarAnomaly)) -
    0.114 * Math.sin(toRadians(2 * latitudeArgument));

  return normalizeAngle(longitude);
}

function getLahiriAyanamsa(jd: number) {
  const yearsFromJ2000 = (jd - 2451545.0) / 365.2425;
  return 23.85675 + (50.29 / 3600) * yearsFromJ2000;
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  const hours12 = hours24 % 12 || 12;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';

  return `${hours12}:${`${minutes}`.padStart(2, '0')} ${suffix}`;
}

function formatRange(startMinutes: number, endMinutes: number) {
  return `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`;
}

function getDayOfYear(date: Date) {
  const yearStart = new Date(date.getFullYear(), 0, 0);
  return Math.round((date.getTime() - yearStart.getTime()) / DAY_IN_MS);
}

function getDaylightWindow(date: Date) {
  const dayOfYear = getDayOfYear(date);
  const solarDeclination = -23.44 * Math.cos(toRadians(((360 / 365) * (dayOfYear + 10)) % 360));
  const latitude = toRadians(DEFAULT_LATITUDE);
  const declination = toRadians(solarDeclination);
  const solarDisk = toRadians(-0.833);
  const cosineHourAngle =
    (Math.sin(solarDisk) - Math.sin(latitude) * Math.sin(declination)) /
    (Math.cos(latitude) * Math.cos(declination));
  const clampedHourAngle = Math.min(1, Math.max(-1, cosineHourAngle));
  const daylightHours = (2 * toDegrees(Math.acos(clampedHourAngle))) / 15;
  const sunriseMinutes = 12 * 60 - (daylightHours / 2) * 60;
  const sunsetMinutes = 12 * 60 + (daylightHours / 2) * 60;

  return {
    sunriseMinutes,
    sunsetMinutes,
  };
}

function getKarana(elongation: number) {
  const karanaIndex = Math.floor(elongation / 6) + 1;

  if (karanaIndex <= 1) {
    return 'Kimstughna';
  }

  if (karanaIndex === 58) {
    return 'Shakuni';
  }

  if (karanaIndex === 59) {
    return 'Chatushpada';
  }

  if (karanaIndex >= 60) {
    return 'Naga';
  }

  return KARANA_SEQUENCE[(karanaIndex - 2) % KARANA_SEQUENCE.length];
}

function getHinduMonthWindow(date: Date) {
  const safeDate = startOfDate(date);
  const boundaries = [safeDate.getFullYear() - 1, safeDate.getFullYear(), safeDate.getFullYear() + 1]
    .flatMap((year) =>
      HINDU_MONTH_START_TEMPLATE.map((entry) => ({
        startDate: new Date(year, entry.monthIndex, entry.day),
        monthLabel: entry.monthLabel,
      }))
    )
    .sort((left, right) => left.startDate.getTime() - right.startDate.getTime());

  let activeBoundary = boundaries[0];

  for (const boundary of boundaries) {
    if (boundary.startDate.getTime() <= safeDate.getTime()) {
      activeBoundary = boundary;
      continue;
    }

    break;
  }

  return {
    hinduMonthLabel: activeBoundary.monthLabel,
    hinduMonthDay: differenceInCalendarDays(safeDate, activeBoundary.startDate) + 1,
  };
}

function buildFestivalEntries(date: Date, pakshaDay: number, paksha: string, weekday: number) {
  const festivalEntries: FestivalEntry[] = [...(FIXED_FESTIVAL_ENTRIES[buildDateKey(date)] ?? [])];

  if (pakshaDay === 4) {
    festivalEntries.push({
      title: paksha === 'Shukla' ? 'Vinayaka Chaturthi' : 'Sankashti Chaturthi',
      category: 'Vrat',
      marker: 'vrat',
    });
  }

  if (pakshaDay === 8) {
    festivalEntries.push({
      title: 'Durga Ashtami Sadhana',
      category: 'Sadhana',
      marker: 'vrat',
    });
  }

  if (pakshaDay === 11) {
    festivalEntries.push({
      title: 'Ekadashi Vrat',
      category: 'Vrat',
      marker: 'festival',
    });
  }

  if (pakshaDay === 13) {
    festivalEntries.push({
      title: 'Pradosh Vrat',
      category: 'Vrat',
      marker: 'festival',
    });
  }

  if (pakshaDay === 15) {
    festivalEntries.push({
      title: paksha === 'Shukla' ? 'Purnima' : 'Amavasya',
      category: 'Tithi',
      marker: 'festival',
    });
  }

  if (weekday === 1) {
    festivalEntries.push({
      title: 'Somvar Shiva Puja',
      category: 'Weekly Devotion',
      marker: 'devotion',
    });
  }

  if (weekday === 4) {
    festivalEntries.push({
      title: 'Guruvar Vishnu Puja',
      category: 'Weekly Devotion',
      marker: 'devotion',
    });
  }

  return festivalEntries;
}

function getUniqueObservances(festivalEntries: FestivalEntry[]) {
  return Array.from(new Set(festivalEntries.map((entry) => entry.title)));
}

function getMarkerSummary(festivalEntries: FestivalEntry[]) {
  const markerOrder: MarkerKind[] = [];

  festivalEntries.forEach((entry) => {
    if (!markerOrder.includes(entry.marker)) {
      markerOrder.push(entry.marker);
    }
  });

  return {
    observances: getUniqueObservances(festivalEntries),
    markers: markerOrder.slice(0, 2),
  };
}

function calculateHinduDayCore(date: Date): HinduDayCore {
  const dateKey = buildDateKey(date);
  const cachedValue = coreCache.get(dateKey);

  if (cachedValue) {
    return cachedValue;
  }

  const observationDate = getObservationDate(date);
  const jd = julianDay(observationDate);
  const sunLongitude = getSunLongitude(jd);
  const moonLongitude = getMoonLongitude(jd);
  const ayanamsa = getLahiriAyanamsa(jd);
  const siderealSun = normalizeAngle(sunLongitude - ayanamsa);
  const siderealMoon = normalizeAngle(moonLongitude - ayanamsa);
  const elongation = normalizeAngle(moonLongitude - sunLongitude);
  const tithiNumber = Math.floor(elongation / 12) + 1;
  const paksha = tithiNumber <= 15 ? 'Shukla' : 'Krishna';
  const pakshaDay = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;
  const tithiName =
    pakshaDay === 15 ? (paksha === 'Shukla' ? 'Purnima' : 'Amavasya') : TITHI_NAMES[pakshaDay];
  const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
  const yogaIndex = Math.floor(normalizeAngle(siderealSun + siderealMoon) / (360 / 27));
  const { hinduMonthLabel, hinduMonthDay } = getHinduMonthWindow(date);
  const { sunriseMinutes, sunsetMinutes } = getDaylightWindow(date);
  const dayLength = sunsetMinutes - sunriseMinutes;
  const rahuPart = RAHU_PART_BY_WEEKDAY[date.getDay()] - 1;
  const rahuStart = sunriseMinutes + (dayLength / 8) * rahuPart;
  const rahuEnd = rahuStart + dayLength / 8;
  const brahmaStart = sunriseMinutes - 96;
  const brahmaEnd = sunriseMinutes - 48;
  const festivalEntries = buildFestivalEntries(date, pakshaDay, paksha, date.getDay());
  const { observances, markers } = getMarkerSummary(festivalEntries);

  const details: HinduDayCore = {
    hinduMonthLabel,
    hinduMonthDay,
    tithiLabel: `${paksha} ${tithiName}`,
    pakshaDay,
    nakshatra: NAKSHATRA_NAMES[nakshatraIndex],
    yoga: YOGA_NAMES[yogaIndex],
    karana: getKarana(elongation),
    sunrise: formatMinutes(sunriseMinutes),
    sunset: formatMinutes(sunsetMinutes),
    rahuKaal: formatRange(rahuStart, rahuEnd),
    brahmaMuhurat: formatRange(brahmaStart, brahmaEnd),
    festivalEntries,
    observances,
    markers,
  };

  coreCache.set(dateKey, details);
  return details;
}

function getSamvatStartDate(year: number) {
  const cachedValue = samvatStartCache.get(year);

  if (cachedValue) {
    return cachedValue;
  }

  const configuredStart =
    VIKRAM_SAMVAT_STARTS.find((entry) => entry.gregorianYear === year) ?? {
      gregorianYear: year,
      monthIndex: 2,
      day: 19,
    };
  const samvatStartDate = new Date(
    configuredStart.gregorianYear,
    configuredStart.monthIndex,
    configuredStart.day
  );
  samvatStartCache.set(year, samvatStartDate);
  return samvatStartDate;
}

function getSamvatYear(date: Date) {
  const samvatStartDate = getSamvatStartDate(date.getFullYear());
  return date >= samvatStartDate ? date.getFullYear() + 57 : date.getFullYear() + 56;
}

export function getHinduDayDetails(date: Date): HinduDayDetails {
  const dateKey = buildDateKey(date);
  const cachedValue = detailsCache.get(dateKey);

  if (cachedValue) {
    return cachedValue;
  }

  const core = calculateHinduDayCore(date);
  const details: HinduDayDetails = {
    ...core,
    samvatLabel: `Vikram Samvat ${getSamvatYear(date)}`,
  };

  detailsCache.set(dateKey, details);
  return details;
}

export function getMonthSubtitle(date: Date) {
  const uniqueMonths = new Set<string>();
  const uniqueSamvatLabels = new Set<string>();
  const daysInMonth = getDaysInMonth(date);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
    const details = getHinduDayDetails(currentDate);
    uniqueMonths.add(details.hinduMonthLabel);
    uniqueSamvatLabels.add(details.samvatLabel);
  }

  return [Array.from(uniqueMonths).join(' / '), Array.from(uniqueSamvatLabels).join(' / ')]
    .filter(Boolean)
    .join(' · ');
}
