// Starter lessons. Each note line: heading | explanation | example | Uzbek explanation
const notes = (text) => text.trim().split('\n').map((line) => {
  const [h, t, ex, uz] = line.split('|').map((x) => x.trim());
  return { h, t, ex: ex || '', uz: uz || '' };
});
const L = (id, title, kind, level, emoji, order, summary, summaryUz, text) =>
  ({ id, title, kind, level, emoji, order, access: 'open', summary, summaryUz, notes: notes(text) });

export const SEED_LESSONS = [
  // ---------- A1 ----------
  L('to-be', 'To be: am, is, are', 'grammar', 'A1', '🙋', 1, 'The most important verb in English.', 'Inglizchadagi eng muhim fe’l.', `
Form|I am, you are, he/she/it is, we are, they are.|I am a student. She is a teacher.|“Bo‘lmoq” fe’li: I am, you are, he/she/it is, we/they are.
Short forms|I’m, you’re, he’s, she’s, it’s, we’re, they’re.|They’re at home.|Og‘zaki nutqda qisqartirib aytiladi: I’m, you’re, he’s...
Negative|Add not after am/is/are.|He is not (isn’t) tired.|Inkor uchun am/is/are dan keyin not qo‘yiladi.
Question|Put am/is/are before the person.|Are you ready? Yes, I am.|Savolda am/is/are gapning boshiga chiqadi.
`),
  L('greetings', 'Greetings & introductions', 'vocab', 'A1', '👋', 2, 'Say hello and introduce yourself.', 'Salomlashish va o‘zingizni tanishtirish.', `
Hello and goodbye|Hello / Hi, Good morning, Good evening, Goodbye / Bye.|Good morning, Mr Karimov!|Salom / Xayr: Hello, Hi, Good morning, Goodbye.
Asking about someone|What’s your name? Where are you from? How are you?|I’m from Tashkent. I’m fine, thanks.|Ism, yashash joyi va holni so‘rash.
Introducing|My name is… / I’m… Nice to meet you.|My name is Dilnoza. Nice to meet you!|Tanishtirish: “Mening ismim…”. Javob: Nice to meet you.
`),
  L('this-that', 'This, that, these, those', 'grammar', 'A1', '👉', 3, 'Point at things near and far.', 'Yaqin va uzoqdagi narsalarni ko‘rsatish.', `
Near|this (one thing), these (many things) are close to you.|This is my bag. These are my books.|this/these yaqindagi narsalar uchun.
Far|that (one thing), those (many things) are far from you.|That is a bus. Those are my friends.|that/those uzoqdagi narsalar uchun.
With nouns|Use this/that + singular, these/those + plural.|I like this song. I like these songs.|Birlik bilan this/that, ko‘plik bilan these/those.
`),
  L('plurals', 'Singular and plural nouns', 'grammar', 'A1', '🍎', 4, 'One apple, two apples.', 'Birlik va ko‘plik.', `
Regular|Add -s to most nouns.|one book, two books|Ko‘pchilik otlarga -s qo‘shiladi.
-es endings|After s, x, ch, sh add -es. After consonant + y, change to -ies.|bus – buses, city – cities|s, x, ch, sh dan keyin -es; undosh + y bo‘lsa -ies.
Irregular|Some nouns change completely.|man – men, child – children, foot – feet|Ba’zi so‘zlar qoidasiz o‘zgaradi: man – men.
`),
  L('possessives', 'my, your, his, her', 'grammar', 'A1', '🎒', 5, 'Show who something belongs to.', 'Narsa kimga tegishli ekanini ko‘rsatish.', `
Possessive adjectives|my, your, his, her, its, our, their go before a noun.|This is my phone. Her name is Aziza.|my, your, his... otdan oldin keladi.
’s for owners|Add ’s to a person’s name.|Ali’s bag is blue.|Egalik uchun ismga ’s qo‘shiladi.
Not “a my”|Do not use a/the with my/your.|my house (not: the my house)|my/your bilan a yoki the ishlatilmaydi.
`),
  L('there-is', 'There is / There are', 'grammar', 'A1', '📍', 6, 'Say what exists in a place.', 'Biror joyda nima borligini aytish.', `
Singular|There is + one thing.|There is a park near my house.|Bitta narsa uchun: There is.
Plural|There are + many things.|There are three chairs in the room.|Bir nechta narsa uchun: There are.
Negative & question|There isn’t / aren’t. Is there…? Are there…?|Is there a bank here? No, there isn’t.|Inkor: isn’t/aren’t. Savol: Is there…? Are there…?
`),
  L('prepositions-place', 'in, on, under, next to', 'grammar', 'A1', '📦', 7, 'Say where things are.', 'Narsalar qayerda ekanini aytish.', `
in / on / under|in = inside, on = touching the top, under = below.|The cat is in the box, on the table, under the chair.|in – ichida, on – ustida, under – ostida.
Near other things|next to, behind, in front of, between.|The bank is next to the school.|next to – yonida, behind – orqasida, in front of – oldida, between – orasida.
Places|at home, at school, at work.|I am at school now.|“at” bilan: at home, at school, at work.
`),
  L('question-words', 'Question words', 'grammar', 'A1', '❓', 8, 'What, where, when, who, why, how.', 'Nima, qayerda, qachon, kim, nega, qanday.', `
The words|what (thing), where (place), when (time), who (person), why (reason), how (way).|Where do you live?|what – nima, where – qayerda, when – qachon, who – kim, why – nega, how – qanday.
Order|Question word + do/does/is/are + person.|What do you like? Where is he?|Tartib: so‘roq so‘z + yordamchi fe’l + ega.
Answers|Why? → Because…|Why are you late? Because the bus was slow.|Why? savoliga Because… bilan javob beriladi.
`),
  L('numbers-time', 'Numbers, dates & time', 'vocab', 'A1', '🔢', 9, 'Count, tell the time and say the date.', 'Sanash, soatni va sanani aytish.', `
Numbers|1 one, 2 two… 10 ten, 20 twenty, 100 one hundred.|I am twenty years old.|Sonlar: one, two, three… ten, twenty, one hundred.
Telling the time|It’s + hour. Half past = :30, quarter past = :15.|It’s half past three (3:30).|Soat: It’s three o’clock. Half past – yarim, quarter past – o‘n besh daqiqa.
Days and dates|on Monday, in July, on 5th May.|My lesson is on Friday.|Kun uchun on, oy uchun in: on Monday, in July.
`),
  L('present-simple', 'Present Simple', 'grammar', 'A1', '🔁', 10, 'Habits, facts and routines.', 'Odatlar, haqiqatlar va kundalik ishlar.', `
Form|I/you/we/they + verb. He/she/it + verb + s.|She works in a bank.|I/you/we/they + fe’l. He/she/it bilan fe’lga -s qo‘shiladi.
Use|Habits, routines, facts and timetables.|The sun rises in the east.|Odatlar, kundalik ishlar va umumiy haqiqatlar uchun.
Negatives & questions|Use do/does. After does, the verb has no -s.|Does he like tea? He doesn’t like tea.|Inkor va savolda do/does ishlatiladi; does dan keyin fe’lga -s qo‘shilmaydi.
Time words|always, usually, often, sometimes, never, every day.|I never drink coffee at night.|always – doim, usually – odatda, often – tez-tez, sometimes – ba’zan, never – hech qachon.
`),
  L('present-continuous', 'Present Continuous', 'grammar', 'A1', '🎬', 11, 'Actions happening now and temporary plans.', 'Hozir bo‘layotgan ishlar va vaqtinchalik rejalar.', `
Form|am/is/are + verb-ing.|They are playing football.|am/is/are + fe’l-ing.
Use|Actions at the moment of speaking, temporary situations, arranged future plans.|I’m meeting Ali at six.|Hozir bo‘layotgan ish, vaqtinchalik holat va kelishilgan reja uchun.
Not with state verbs|know, like, want, need, believe usually stay in the simple form.|I know the answer. (not: I am knowing)|know, like, want, need kabi fe’llar odatda -ing shaklida ishlatilmaydi.
`),
  L('articles', 'Articles: a, an, the', 'grammar', 'A1', '🔤', 12, 'When to use a, an, the, or nothing.', 'a, an, the qachon ishlatiladi.', `
a / an|First mention, or one of many. Use an before a vowel sound.|I saw an eagle and a fox.|Birinchi marta aytilgan yoki bitta narsa uchun. Unli tovushdan oldin an.
the|Specific things both people know about; unique things.|The eagle was huge. The sun is hot.|Ikkala tomon biladigan aniq narsa uchun the.
No article|General plural and uncountable nouns.|Children love games. Water is life.|Umumiy ko‘plik va sanalmaydigan otlar bilan artikl kerak emas.
`),
  L('daily-routine', 'Daily routine words', 'vocab', 'A1', '⏰', 13, 'Talk about your day.', 'Kundalik tartibingiz haqida gapirish.', `
Morning|wake up, get up, wash, have breakfast, go to school.|I wake up at six and have breakfast.|Ertalab: uyg‘onmoq, turmoq, yuvinmoq, nonushta qilmoq.
Afternoon and evening|have lunch, do homework, watch TV, have dinner.|I do my homework after school.|Tushdan keyin va kechqurun: tushlik qilmoq, uy vazifasi, televizor ko‘rmoq.
Night|brush your teeth, go to bed, fall asleep.|I go to bed at ten.|Kechasi: tish yuvmoq, yotmoq, uxlab qolmoq.
`),

  // ---------- A2 ----------
  L('past-simple', 'Past Simple', 'grammar', 'A2', '⏮️', 20, 'Finished actions in the past.', 'O‘tmishda tugagan ishlar.', `
Regular verbs|verb + ed (play → played, study → studied).|We visited Bukhara last year.|Qoidali fe’llarga -ed qo‘shiladi: play → played.
Irregular verbs|Learn them in groups: go → went, see → saw, buy → bought.|She went home early.|Qoidasiz fe’llarni guruhlab yodlang: go → went, see → saw.
Negatives & questions|did + base verb. The main verb does not change.|Did you see the film? I didn’t see it.|Savol va inkorda did + fe’lning asl shakli ishlatiladi.
`),
  L('future-forms', 'Talking about the future', 'grammar', 'A2', '🚀', 21, 'will, going to and present continuous.', 'will, going to va hozirgi davom etuvchi zamon.', `
will|Instant decisions, predictions, promises.|I’ll help you with that bag.|Darhol qaror, bashorat va va’da uchun will.
going to|Plans and intentions; predictions with evidence.|Look at those clouds. It’s going to rain.|Reja va niyat uchun going to; dalilga asoslangan bashorat uchun ham.
Present continuous|Fixed arrangements with a time.|We’re flying to Dubai on Friday.|Vaqti belgilangan kelishuvlar uchun hozirgi davom etuvchi zamon.
`),
  L('modals', 'Modal verbs', 'grammar', 'A2', '🎚️', 22, 'can, must, should, might and friends.', 'can, must, should, might va boshqalar.', `
Ability & permission|can / could.|Can I open the window?|Qobiliyat va ruxsat: can / could.
Advice & obligation|should (advice), must / have to (necessity).|You should drink more water.|Maslahat uchun should, majburiyat uchun must / have to.
Possibility|may / might / could + base verb.|It might snow tonight.|Ehtimol: may / might / could + fe’lning asl shakli.
`),
  L('comparatives', 'Comparatives & superlatives', 'grammar', 'A2', '📏', 23, 'bigger, the biggest, more interesting.', 'Taqqoslash: bigger, the biggest, more interesting.', `
Short adjectives|Add -er / the -est: big → bigger → the biggest.|Tashkent is bigger than Samarkand.|Qisqa sifatlarga -er / -est qo‘shiladi.
Long adjectives|Use more / the most.|This film is more interesting than that one.|Uzun sifatlar bilan more / the most ishlatiladi.
Irregular|good → better → the best, bad → worse → the worst.|My English is better than last year.|Qoidasiz: good – better – best, bad – worse – worst.
`),
  L('quantifiers', 'some, any, much, many', 'grammar', 'A2', '🧮', 24, 'Talk about amounts.', 'Miqdor haqida gapirish.', `
some / any|some in positive sentences, any in negatives and questions.|I have some money. Do you have any?|some – darak gapda, any – inkor va savolda.
Countable|many (not many), a few.|There aren’t many chairs. I have a few friends.|Sanaladigan otlar bilan many, a few.
Uncountable|much (not much), a little.|We don’t have much time. Add a little sugar.|Sanalmaydigan otlar bilan much, a little.
`),
  L('past-continuous', 'Past Continuous', 'grammar', 'A2', '🎞️', 25, 'What was happening at a moment in the past.', 'O‘tmishdagi biror payt davom etayotgan ish.', `
Form|was / were + verb-ing.|I was reading at nine o’clock.|was / were + fe’l-ing.
With Past Simple|Long action (past continuous) + short action (past simple).|I was walking when it started to rain.|Uzoq davom etgan ish + qisqa ish: while / when bilan.
Two actions|Two long actions at the same time use while.|She cooked while he was watching TV.|Bir vaqtda davom etgan ikki ish uchun while.
`),
  L('shopping-phrases', 'Shopping & ordering phrases', 'vocab', 'A2', '🛍️', 26, 'Useful sentences for shops and cafés.', 'Do‘kon va kafe uchun foydali jumlalar.', `
In a shop|How much is this? Can I try it on? Do you have a bigger size?|How much is this jacket?|Do‘konda: Bu qancha? Kiyib ko‘rsam bo‘ladimi? Kattaroq o‘lchami bormi?
In a café|Can I have…? I’d like… The bill, please.|I’d like a tea and a sandwich, please.|Kafede: Menga … bering. Hisobni olib keling.
Politeness|Could you…? Would you mind…? Thanks a lot.|Could you help me, please?|Xushmuomalalik: Could you…? Would you mind…?
`),

  // ---------- B1 ----------
  L('present-perfect', 'Present Perfect', 'grammar', 'B1', '🧩', 40, 'Past actions with a link to now.', 'Hozirga aloqador o‘tmish ishlar.', `
Form|have/has + past participle.|I have lost my keys.|have/has + fe’lning uchinchi shakli.
Experience|Life experience, no time given: ever, never, before.|Have you ever been to London?|Hayotiy tajriba: ever, never, before.
Unfinished time|for + period, since + starting point.|She has lived here since 2019.|for – davomiylik, since – boshlanish nuqtasi.
Result now|A past action with a present result: just, already, yet.|They have already left.|Natijasi hozir ko‘rinadigan ish: just, already, yet.
`),
  L('conditionals', 'Conditionals 0, 1 & 2', 'grammar', 'B1', '🔀', 41, 'If-sentences for facts, possibilities and imaginary situations.', 'Shart gaplar: haqiqat, ehtimol va xayoliy holatlar.', `
Zero|if + present, present: things that are always true.|If you heat ice, it melts.|Doim to‘g‘ri bo‘lgan narsalar: if + hozirgi, hozirgi.
First|if + present, will + verb: real future possibilities.|If it rains, we will stay home.|Kelajakdagi real ehtimol: if + hozirgi, will + fe’l.
Second|if + past, would + verb: unreal or unlikely situations.|If I had more time, I would learn Italian.|Xayoliy holat: if + o‘tgan zamon, would + fe’l.
`),
  L('passive', 'Passive voice', 'grammar', 'B1', '🔄', 42, 'Focus on the action, not who did it.', 'Ish-harakatga e’tibor, kim qilgani muhim emas.', `
Form|be + past participle.|The bridge was built in 1998.|be + fe’lning uchinchi shakli.
When we use it|When the doer is unknown or not important.|My bike was stolen.|Ishni kim qilgani noma’lum yoki muhim bo‘lmaganda.
With by|Add by + person only if it is important.|The book was written by Orwell.|Agar kim qilgani muhim bo‘lsa, by + shaxs qo‘shiladi.
`),
  L('reported-speech', 'Reported speech', 'grammar', 'B1', '🗨️', 43, 'Tell other people what someone said.', 'Boshqaning gapini yetkazish.', `
Step back|Present → past: “I am tired” → She said she was tired.|She said that she was tired.|Hozirgi zamon o‘tgan zamonga o‘tadi.
Questions|Use normal word order: “Where do you live?” → He asked where I lived.|He asked where I lived.|Savolni yetkazishda odatiy so‘z tartibi ishlatiladi.
Time words|today → that day, tomorrow → the next day.|He said he would come the next day.|today – that day, tomorrow – the next day.
`),
  L('relative-clauses', 'Relative clauses', 'grammar', 'B1', '🧷', 44, 'who, which, that and where.', 'who, which, that va where.', `
People|Use who or that.|The man who lives next door is a doctor.|Odamlar uchun who yoki that.
Things|Use which or that.|This is the book that I told you about.|Narsalar uchun which yoki that.
Places|Use where.|That is the café where we met.|Joy uchun where.
`),
  L('gerund-infinitive', 'Gerunds and infinitives', 'grammar', 'B1', '🔗', 45, '-ing or to + verb?', '-ing yoki to + fe’l?', `
Verb + -ing|enjoy, finish, avoid, mind, keep.|I enjoy reading.|enjoy, finish, avoid, mind fe’llaridan keyin -ing keladi.
Verb + to|want, hope, decide, plan, need.|She decided to study abroad.|want, hope, decide, plan, need dan keyin to + fe’l.
Both|like, love, start, begin can take both.|I like swimming / to swim.|like, love, start ikkala shaklni ham oladi.
`),
  L('used-to', 'used to & would', 'grammar', 'B1', '📼', 46, 'Past habits and states that have changed.', 'O‘tmishdagi odat va holatlar.', `
used to|used to + verb for past habits and states.|I used to live in Namangan.|Avval bo‘lgan, endi yo‘q odat yoki holat uchun used to.
Negative & question|didn’t use to, Did you use to…?|Did you use to play chess?|Inkor va savolda use to (d siz).
would|Only for repeated actions, not states.|We would visit our grandparents every summer.|would faqat takrorlanuvchi ishlar uchun.
`),
  L('collocations', 'Collocations that sound natural', 'vocab', 'B1', '🧲', 47, 'Words that love to go together.', 'Birga ishlatiladigan so‘zlar.', `
make vs do|make a mistake, make progress; do homework, do your best.|I made a mistake while doing my homework.|make a mistake – xato qilmoq; do homework – uy vazifasini bajarmoq.
Strong adjectives|heavy rain, strong coffee, deep sleep.|We had heavy rain all weekend.|heavy rain – kuchli yomg‘ir, strong coffee – quyuq qahva.
`),
  L('phrasal-verbs', 'Phrasal verbs for daily life', 'vocab', 'B1', '🪄', 48, 'Small words that change the meaning.', 'Ma’noni o‘zgartiruvchi kichik so‘zlar.', `
Morning routine|wake up, get up, turn on, put on, look for.|I get up at six and put on my shoes.|Ertalabki ishlar: uyg‘onmoq, turmoq, yoqmoq, kiymoq, qidirmoq.
Learning|look up (a word), find out, pick up (a language), carry on.|Look up the word in a dictionary.|look up – lug‘atdan qidirmoq, find out – bilib olmoq.
`),

  // ---------- B2 ----------
  L('third-conditional', 'Third conditional & wish', 'grammar', 'B2', '⏪', 60, 'Imagine a different past.', 'O‘tmish boshqacha bo‘lganida nima bo‘lardi.', `
Third conditional|if + past perfect, would have + past participle.|If I had left earlier, I would have caught the train.|if + had + 3-shakl, would have + 3-shakl.
Mixed|Past condition, present result.|If she had studied medicine, she would be a doctor now.|O‘tmishdagi shart, hozirgi natija.
wish|wish + past perfect for regrets about the past.|I wish I had studied harder.|O‘tmishdagi afsus: wish + had + 3-shakl.
`),
  L('future-perfect', 'Future perfect & continuous', 'grammar', 'B2', '🛰️', 61, 'What will be finished or in progress later.', 'Kelajakda tugagan yoki davom etayotgan ishlar.', `
Future perfect|will have + past participle: finished before a time.|By June I will have finished the course.|Kelajakdagi muddatgacha tugagan ish: will have + 3-shakl.
Future continuous|will be + verb-ing: in progress at a time.|At nine tomorrow I will be flying to Dubai.|Kelajakdagi paytda davom etayotgan ish: will be + -ing.
Time words|by, by the time, this time next week.|By the time you arrive, we will have eaten.|by, by the time, this time next week.
`),
  L('linking-words', 'Linking words', 'grammar', 'B2', '🪢', 62, 'however, although, despite, so that.', 'however, although, despite, so that.', `
Contrast|although + clause; despite / in spite of + noun or -ing; however starts a new sentence.|Although it was cold, we went out. Despite the cold, we went out.|Qarama-qarshilik: although + gap; despite + ot yoki -ing.
Reason & result|because, since, so, therefore, as a result.|It rained, so we stayed in.|Sabab va natija: because, so, therefore.
Purpose|to + verb, so that + clause.|I study hard so that I can pass the exam.|Maqsad: to + fe’l yoki so that + gap.
`),
  L('word-formation', 'Word formation', 'vocab', 'B2', '🧬', 63, 'Build new words from one word.', 'Bitta so‘zdan yangi so‘zlar yasash.', `
Suffixes for nouns|-tion, -ment, -ness, -ity.|decide → decision, happy → happiness|Ot yasovchi qo‘shimchalar: -tion, -ment, -ness, -ity.
Suffixes for adjectives|-ful, -less, -able, -ous.|care → careful / careless|Sifat yasovchi qo‘shimchalar: -ful, -less, -able, -ous.
Prefixes|un-, dis-, re-, im-, mis-.|happy → unhappy, agree → disagree|Old qo‘shimchalar ma’noni teskari yoki yangi qiladi: un-, dis-, re-.
`),

  // ---------- C1 ----------
  L('inversion', 'Inversion for emphasis', 'grammar', 'C1', '🎭', 80, 'Never have I seen… Rarely do we…', 'Ta’kid uchun teskari so‘z tartibi.', `
Negative adverbs|Never, rarely, seldom, hardly + auxiliary + subject.|Never have I seen such a beautiful view.|Never, rarely, seldom dan keyin yordamchi fe’l ega oldidan keladi.
Only after|Only then / Only when + auxiliary + subject.|Only then did I understand the problem.|Only then / Only when dan keyin ham teskari tartib.
Conditionals|Had I known… = If I had known…|Had I known, I would have called you.|Had I known… = If I had known…
`),
  L('cleft-sentences', 'Cleft sentences', 'grammar', 'C1', '🎯', 81, 'It was Ali who… What I need is…', 'Muhim qismni ajratib ko‘rsatish.', `
It-cleft|It + be + focus + who / that.|It was Ali who broke the window.|Muhim qismni ajratish: It was … who/that.
What-cleft|What + clause + be + focus.|What I need is a long holiday.|What bilan boshlanadigan ta’kidli gap.
Why use them|To put the important information first or last.|The thing that surprised me was the price.|Muhim ma’lumotni boshiga yoki oxiriga chiqarish uchun.
`),
];
