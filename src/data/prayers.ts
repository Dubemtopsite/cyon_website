export interface BirthdayPrayer {
  id: string;
  title: string;
  tag: string;
  text: string;
}

export const BIRTHDAY_PRAYERS: BirthdayPrayer[] = [
  {
    id: 'wisdom-grace',
    title: 'Divine Wisdom & Grace',
    tag: 'Popular',
    text: 'May the Almighty God grant you divine wisdom, sound health, and boundless joy in this new age. May His grace continue to abide with you as you serve Him in youth and in truth. Amen!',
  },
  {
    id: 'marian-mantle',
    title: "Mother Mary's Mantle",
    tag: 'Marian',
    text: 'Happy Birthday! May Our Blessed Mother Mary cover you with her mantle of love and protection, and may Christ fill your life with peace, joy, and unending favors.',
  },
  {
    id: 'jeremiah-29',
    title: 'Jeremiah 29:11 (Prosperity & Hope)',
    tag: 'Scripture',
    text: "Jeremiah 29:11 — 'For I know the plans I have for you,' declares the Lord, 'plans to prosper you and not to harm you, to give you hope and a future.' Happy Glorious Birthday!",
  },
  {
    id: 'psalm-91',
    title: 'Psalm 91:16 (Long Life & Honor)',
    tag: 'Scripture',
    text: "Psalm 91:16 — 'With long life I will satisfy him and show him my salvation.' Wishing you heaven’s choicest blessings, continuous elevation, and divine protection. Keep shining!",
  },
  {
    id: 'zeal-christ',
    title: 'For God & For Youth',
    tag: 'CYON Spirit',
    text: 'Cheers to a new year of extraordinary favor, divine breakthroughs, and radiant happiness! Keep burning with zeal for God and for Youth through Christ. Happy celebration!',
  },
  {
    id: 'new-doors',
    title: 'Doors of Elevation',
    tag: 'Blessing',
    text: 'On this special day, we thank God for the gift of your life to our parish family. May this new year open doors of great achievements, fulfillment, and happiness. Congratulations!',
  },
];

export const MINISTRY_ROLES: string[] = [
  'Member, CYON',
  'CYON PRO',
  'CYON President',
  'Vice President',
  'General Secretary',
  'Financial Secretary',
  'Choir Member',
  'Choir Leader',
  'Altar Server',
  'Lector / Reader',
  'Usher / Protocol',
  'Youth Ambassador',
  'Youth Executive',
  'Youth Coordinator',
];

export const AGE_BADGES: string[] = [
  '+1 Today 🎂',
  'Celebrating 21 🎉',
  'Cheers to a New Age ✨',
  'Golden Jubilee 🌟',
  'Silver Jubilee ✨',
  'Grace & Favor 🙏',
  'Happy Birthday 🎈',
];
