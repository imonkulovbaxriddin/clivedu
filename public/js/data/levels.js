// English levels (CEFR) with plain descriptions in English and Uzbek, so a student can pick honestly.
export const LEVELS = [
  {
    id: 'A1', name: 'Beginner', uz: 'Boshlang‘ich', emoji: '🌱',
    en: 'I know only a few words, like “hello”, “water” and “book”. I can say my name.',
    uzText: 'Men faqat bir nechta so‘zni bilaman: “hello”, “water”, “book”. O‘z ismimni ayta olaman.',
    words: [['hello', 'salom'], ['water', 'suv'], ['book', 'kitob'], ['mother', 'ona']],
    say: 'My name is Ali. I am from Uzbekistan.',
  },
  {
    id: 'A2', name: 'Elementary', uz: 'Elementar', emoji: '🌿',
    en: 'I can talk about my day, my family and shopping in short, simple sentences.',
    uzText: 'Men kunim, oilam va xarid haqida qisqa, oddiy gaplar bilan gapira olaman.',
    words: [['yesterday', 'kecha'], ['because', 'chunki'], ['cheap', 'arzon'], ['weekend', 'dam olish kunlari']],
    say: 'Yesterday I went to the market with my mother.',
  },
  {
    id: 'B1', name: 'Intermediate', uz: 'O‘rta', emoji: '🌳',
    en: 'I can talk about experiences, plans and opinions, and understand the main points of a conversation.',
    uzText: 'Men tajriba, reja va fikrlar haqida gapira olaman va suhbatning asosiy fikrini tushunaman.',
    words: [['experience', 'tajriba'], ['opinion', 'fikr'], ['although', 'garchi'], ['manage', 'uddalamoq']],
    say: 'I have never been to London, but I would love to go.',
  },
  {
    id: 'B2', name: 'Upper-intermediate', uz: 'O‘rta-yuqori', emoji: '🌲',
    en: 'I can discuss many topics fairly fluently and understand long texts and films.',
    uzText: 'Men ko‘p mavzularda ravon gaplasha olaman, uzun matn va filmlarni tushunaman.',
    words: [['achieve', 'erishmoq'], ['environment', 'atrof-muhit'], ['argue', 'bahslashmoq'], ['reliable', 'ishonchli']],
    say: 'If I had studied harder, I would have passed the exam.',
  },
  {
    id: 'C1', name: 'Advanced', uz: 'Ilg‘or', emoji: '🏔️',
    en: 'I can express complex ideas smoothly and understand demanding, detailed texts.',
    uzText: 'Men murakkab fikrlarni ravon ifodalay olaman va murakkab matnlarni tushunaman.',
    words: [['nuance', 'nozik farq'], ['inevitable', 'muqarrar'], ['mitigate', 'yumshatmoq'], ['profound', 'chuqur']],
    say: 'Had I known, I would have acted differently.',
  },
];
export const levelInfo = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];

// "A2-B1" style ranges: does a lesson or word set suit a student at this level?
const RANK = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
export function fitsLevel(range, userLevel) {
  const ids = String(range || '').toUpperCase().match(/[ABC][12]/g) || [];
  const ranks = ids.map((x) => RANK[x]).filter(Boolean);
  const me = RANK[userLevel] || 1;
  if (!ranks.length) return true;
  return me >= Math.min(...ranks) && me <= Math.max(...ranks);
}
