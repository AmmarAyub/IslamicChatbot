const CATEGORY_RULES = [
  {
    category: 'Quran',
    keywords: ['quran', 'surah', 'ayah', 'verse', 'tafsir', 'translation'],
  },
  {
    category: 'Hadith and Sunnah',
    keywords: ['hadith', 'sunnah', 'seerah', 'prophet muhammad', 'rasulullah'],
  },
  {
    category: 'Fiqah and Worship',
    keywords: [
      'fiqh', 'fiqah', 'madhhab', 'madhab', 'salah', 'prayer', 'wudu', 'ablution',
      'sawm', 'fasting', 'ramadan', 'zakat', 'zakah', 'hajj', 'umrah', 'halal', 'haram',
    ],
  },
  {
    category: 'Beliefs',
    keywords: ['aqeedah', 'aqidah', 'tawhid', 'allah', 'islam', 'muslim', 'iman', 'faith'],
  },
  {
    category: 'Islamic Ethics and Family',
    keywords: [
      'nikah', 'marriage', 'divorce', 'inheritance', 'family', 'ethics', 'charity',
      'sadaqah', 'modesty', 'backbiting', 'forgiveness',
    ],
  },
];

const RELIGIOUS_TERMS = CATEGORY_RULES.flatMap(rule => rule.keywords);

export function classifyReligiousContent(text) {
  const normalizedText = text.toLowerCase();
  const matchingRule = CATEGORY_RULES.find(rule =>
    rule.keywords.some(keyword => normalizedText.includes(keyword))
  );

  return {
    isReligious: RELIGIOUS_TERMS.some(term => normalizedText.includes(term)),
    category: matchingRule?.category || 'Islamic Guidance',
  };
}

export function getReligiousContentMessage() {
  return 'Please ask a question about Islam, the Quran, Hadith, Fiqah, worship, beliefs, or Islamic ethics.';
}
