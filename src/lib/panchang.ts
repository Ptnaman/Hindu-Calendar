import { addDays, buildDateKey, differenceInCalendarDays, formatShortDate } from '@/lib/calendar';

export type MarkerKind = 'festival' | 'vrat' | 'devotion';

export type HinduDayDetails = {
  hinduMonthLabel: string;
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
  observances: string[];
  markers: MarkerKind[];
};

export type UpcomingHighlight = {
  key: string;
  title: string;
  dateLabel: string;
};

const ANCHOR_DATE = new Date(2026, 2, 28);

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

const KARANA_NAMES = [
  'Bava',
  'Balava',
  'Kaulava',
  'Taitila',
  'Garaja',
  'Vanija',
  'Vishti',
  'Shakuni',
  'Chatushpada',
  'Naga',
  'Kimstughna',
];

const MONTH_PAIRS = [
  ['Pausha', 'Magha'],
  ['Magha', 'Phalguna'],
  ['Phalguna', 'Chaitra'],
  ['Chaitra', 'Vaishakha'],
  ['Vaishakha', 'Jyeshtha'],
  ['Jyeshtha', 'Ashadha'],
  ['Ashadha', 'Shravana'],
  ['Shravana', 'Bhadrapada'],
  ['Bhadrapada', 'Ashwin'],
  ['Ashwin', 'Kartika'],
  ['Kartika', 'Margashirsha'],
  ['Margashirsha', 'Pausha'],
] as const;

const RAHU_PART_BY_WEEKDAY = [8, 2, 7, 5, 6, 4, 3];

function mod(value: number, length: number) {
  return ((value % length) + length) % length;
}

function formatMinutes(totalMinutes: number) {
  const safeMinutes = mod(totalMinutes, 24 * 60);
  const hours24 = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  const hours12 = hours24 % 12 || 12;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';

  return `${hours12}:${`${minutes}`.padStart(2, '0')} ${suffix}`;
}

function formatRange(startMinutes: number, endMinutes: number) {
  return `${formatMinutes(startMinutes)} - ${formatMinutes(endMinutes)}`;
}

function getApproxSamvat(date: Date) {
  return date.getMonth() >= 3 ? date.getFullYear() + 57 : date.getFullYear() + 56;
}

function getDayOfYear(date: Date) {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  return differenceInCalendarDays(date, startOfYear);
}

function getDaylightWindow(date: Date) {
  const dayOfYear = getDayOfYear(date);
  const seasonalWave = Math.sin(((dayOfYear - 80) / 365) * Math.PI * 2);
  const sunriseMinutes = 6 * 60 + 20 - Math.round(seasonalWave * 28);
  const sunsetMinutes = 18 * 60 + 12 + Math.round(seasonalWave * 32);

  return {
    sunriseMinutes,
    sunsetMinutes,
  };
}

function getApproxMonthLabel(date: Date) {
  const [earlierMonth, laterMonth] = MONTH_PAIRS[date.getMonth()];
  return date.getDate() >= 15 ? laterMonth : earlierMonth;
}

export function getMonthSubtitle(date: Date) {
  const [earlierMonth, laterMonth] = MONTH_PAIRS[date.getMonth()];
  return `${earlierMonth} / ${laterMonth} · Vikram Samvat ${getApproxSamvat(date)}`;
}

export function getHinduDayDetails(date: Date): HinduDayDetails {
  const daysFromAnchor = differenceInCalendarDays(date, ANCHOR_DATE);
  const tithiNumber = mod(6 + daysFromAnchor, 30) + 1;
  const paksha = tithiNumber <= 15 ? 'Shukla' : 'Krishna';
  const pakshaDay = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;
  const tithiName =
    pakshaDay === 15 ? (paksha === 'Shukla' ? 'Purnima' : 'Amavasya') : TITHI_NAMES[pakshaDay];
  const nakshatra = NAKSHATRA_NAMES[mod(11 + daysFromAnchor, NAKSHATRA_NAMES.length)];
  const yoga = YOGA_NAMES[mod(15 + daysFromAnchor, YOGA_NAMES.length)];
  const karana = KARANA_NAMES[mod(4 + daysFromAnchor * 2, KARANA_NAMES.length)];
  const { sunriseMinutes, sunsetMinutes } = getDaylightWindow(date);
  const dayLength = sunsetMinutes - sunriseMinutes;
  const rahuPart = RAHU_PART_BY_WEEKDAY[date.getDay()] - 1;
  const rahuStart = sunriseMinutes + (dayLength / 8) * rahuPart;
  const rahuEnd = rahuStart + dayLength / 8;
  const brahmaStart = sunriseMinutes - 96;
  const brahmaEnd = sunriseMinutes - 48;
  const observances: string[] = [];
  const markers: MarkerKind[] = [];

  if (pakshaDay === 4) {
    observances.push(paksha === 'Shukla' ? 'Vinayaka Chaturthi' : 'Sankashti Chaturthi');
    markers.push('vrat');
  }

  if (pakshaDay === 8) {
    observances.push('Durga Ashtami Sadhana');
    markers.push('vrat');
  }

  if (pakshaDay === 11) {
    observances.push('Ekadashi Vrat');
    markers.push('festival');
  }

  if (pakshaDay === 13) {
    observances.push('Pradosh Vrat');
    markers.push('festival');
  }

  if (pakshaDay === 15) {
    observances.push(paksha === 'Shukla' ? 'Purnima' : 'Amavasya');
    markers.push('festival');
  }

  if (date.getDay() === 1) {
    observances.push('Somvar Shiva Puja');
    markers.push('devotion');
  }

  if (date.getDay() === 4) {
    observances.push('Guruvar Vishnu Puja');
    markers.push('devotion');
  }

  return {
    hinduMonthLabel: getApproxMonthLabel(date),
    samvatLabel: `Vikram Samvat ${getApproxSamvat(date)}`,
    tithiLabel: `${paksha} ${tithiName}`,
    pakshaDay,
    nakshatra,
    yoga,
    karana,
    sunrise: formatMinutes(sunriseMinutes),
    sunset: formatMinutes(sunsetMinutes),
    rahuKaal: formatRange(Math.round(rahuStart), Math.round(rahuEnd)),
    brahmaMuhurat: formatRange(brahmaStart, brahmaEnd),
    observances,
    markers: markers.slice(0, 2),
  };
}

export function getUpcomingHighlights(fromDate: Date, count = 3) {
  const highlights: UpcomingHighlight[] = [];

  for (let offset = 1; offset <= 30 && highlights.length < count; offset += 1) {
    const currentDate = addDays(fromDate, offset);
    const details = getHinduDayDetails(currentDate);

    if (details.observances.length === 0) {
      continue;
    }

    highlights.push({
      key: buildDateKey(currentDate),
      title: details.observances[0],
      dateLabel: formatShortDate(currentDate),
    });
  }

  return highlights;
}
