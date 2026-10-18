// Starter word sets. One word per line:  word | part of speech | meaning | example | similar words | Uzbek
// (the Teacher desk uses the same format).
const parse = (text) => text.trim().split('\n').map((line) => {
  const [w, pos, def, ex, syn, uz] = line.split('|').map((x) => x.trim());
  return { w, pos, def, ex: ex || '', syn: (syn || '').split(',').map((x) => x.trim()).filter(Boolean), uz: uz || '' };
});
const S = (id, title, emoji, color, level, order, text) => ({ id, title, emoji, color, level, order, words: parse(text) });

export const SEED_VOCAB = [
  // ---------- A1 ----------
  S('a1-first', 'First words', '👋', '#2fd3b5', 'A1', 1, `
hello|interj|a word you say when you meet someone|Hello! My name is Ali.|hi|salom
goodbye|interj|a word you say when you leave|Goodbye, see you tomorrow!|bye|xayr, ko‘rishguncha
please|adv|a polite word when you ask for something|Can I have some water, please?||iltimos
thank you|phrase|words you say when someone helps you|Thank you for your help.|thanks|rahmat
yes|adv|a word you say to agree|Yes, I like tea.||ha
no|adv|a word you say to refuse or disagree|No, I do not have a pen.||yo‘q
sorry|adj|a word you say when you make a mistake|Sorry, I am late.||uzr, kechirasiz
friend|n|a person you like and know well|Ali is my best friend.|buddy|do‘st
name|n|the word people call you|What is your name?||ism
teacher|n|a person who helps you learn|My teacher is very kind.||o‘qituvchi
student|n|a person who studies at a school|She is a student.|pupil|talaba, o‘quvchi
help|v|to make something easier for someone|Can you help me, please?|assist|yordam bermoq
`),
  S('a1-family', 'Family & people', '👨‍👩‍👧', '#ff7a6b', 'A1', 2, `
mother|n|your female parent|My mother is a doctor.|mum|ona, oyi
father|n|your male parent|My father works in a bank.|dad|ota, dada
sister|n|a girl with the same parents as you|I have one sister.||opa, singil
brother|n|a boy with the same parents as you|My brother is ten years old.||aka, uka
grandmother|n|the mother of your mother or father|My grandmother makes great bread.|grandma|buvi
grandfather|n|the father of your mother or father|My grandfather tells good stories.|grandpa|bobo
baby|n|a very young child|The baby is sleeping.||chaqaloq
boy|n|a young male person|The boy plays football.||o‘g‘il bola
girl|n|a young female person|The girl reads a book.||qiz bola
man|n|an adult male person|The man is waiting for the bus.||erkak
woman|n|an adult female person|The woman is my teacher.||ayol
family|n|parents, children and other close relatives|I love my family.||oila
`),
  S('a1-food', 'Food & drink', '🍎', '#ffb84d', 'A1', 3, `
bread|n|a food made from flour and baked|We eat bread every morning.||non
rice|n|small white seeds that you cook and eat|I like rice with meat.||guruch
apple|n|a round fruit that is red or green|An apple a day is good for you.||olma
milk|n|a white drink from cows|I drink milk for breakfast.||sut
tea|n|a hot drink made with leaves|Would you like some tea?||choy
egg|n|an oval food from a hen|I have one egg for breakfast.||tuxum
meat|n|the soft part of an animal that people eat|She does not eat meat.||go‘sht
fish|n|an animal that lives in water; also a food|We have fish for dinner.||baliq
soup|n|a hot liquid food|The soup is very hot.||sho‘rva
cheese|n|a food made from milk|I put cheese on my sandwich.||pishloq
sugar|n|a sweet white food for tea and cakes|No sugar in my tea, please.||shakar
juice|n|a drink made from fruit|A glass of orange juice, please.||sharbat
`),
  S('a1-home', 'Home & things', '🏠', '#7b6cff', 'A1', 4, `
house|n|a building where people live|They live in a small house.||uy
room|n|a part of a house with walls and a door|My room is on the first floor.||xona
door|n|you open it to go in or out of a room|Please close the door.||eshik
window|n|a glass opening in a wall|Open the window, it is hot.||deraza
table|n|a piece of furniture with a flat top|The book is on the table.||stol
chair|n|a seat for one person|Sit on the chair.||stul
bed|n|a place where you sleep|I go to bed at ten.||karavot, to‘shak
kitchen|n|the room where you cook|Mum is in the kitchen.||oshxona
bag|n|a soft container you carry things in|My bag is very heavy.||sumka, xalta
phone|n|a device you use to call people|My phone is on the table.|mobile|telefon
key|n|a small metal thing that opens a door|I cannot find my key.||kalit
lamp|n|a light you can move|Turn on the lamp, please.||chiroq, lampa
`),
  S('a1-actions', 'Everyday actions', '🏃', '#4db8ff', 'A1', 5, `
eat|v|to put food in your mouth and swallow it|We eat dinner at seven.||yemoq
drink|v|to take liquid into your mouth and swallow it|I drink water every day.||ichmoq
go|v|to move from one place to another|I go to school by bus.||bormoq
come|v|to move towards the person speaking|Come here, please.||kelmoq
read|v|to look at words and understand them|She reads a book every week.||o‘qimoq
write|v|to make words with a pen or on a computer|Write your name here.||yozmoq
sleep|v|to rest with your eyes closed|The baby sleeps all night.||uxlamoq
walk|v|to move on your feet|I walk to work.||yurmoq, piyoda yurmoq
run|v|to move fast on your feet|He runs in the park.||yugurmoq
open|v|to move a door or lid so things can go in or out|Open your books.||ochmoq
close|v|to shut something|Please close the window.|shut|yopmoq
play|v|to do something for fun|The children play in the garden.||o‘ynamoq
`),
  S('a1-colors', 'Colours, numbers & sizes', '🎨', '#f06bd0', 'A1', 6, `
red|adj|the colour of blood|She has a red bag.||qizil
blue|adj|the colour of the sky|The sea is blue.||ko‘k
green|adj|the colour of grass|I like green tea.||yashil
yellow|adj|the colour of the sun|The banana is yellow.||sariq
black|adj|the darkest colour|He wears a black coat.||qora
white|adj|the colour of snow|The wall is white.||oq
one|n|the number 1|I have one brother.||bir
two|n|the number 2|There are two cats.||ikki
three|n|the number 3|She is three years old.||uch
ten|n|the number 10|We have ten minutes.||o‘n
big|adj|large in size|They have a big house.|large|katta
small|adj|not large|It is a small town.|little|kichik
`),
  S('a1-days', 'Days & time', '📅', '#8bd450', 'A1', 7, `
Monday|n|the first day of the working week|I have English on Monday.||dushanba
today|adv|on this day|Today is sunny.||bugun
tomorrow|adv|on the day after today|See you tomorrow!||ertaga
morning|n|the early part of the day|I drink tea in the morning.||ertalab, tong
evening|n|the time between afternoon and night|We watch TV in the evening.||kechqurun
night|n|the time when it is dark|The stars come out at night.||tun, kecha
week|n|seven days|There are seven days in a week.||hafta
month|n|about four weeks|My birthday is next month.||oy
year|n|twelve months|She has lived here for a year.||yil
hour|n|sixty minutes|The lesson is one hour long.||soat
now|adv|at this moment|I am eating now.||hozir
late|adj|after the usual or planned time|Sorry, I am late.||kech
`),

  // ---------- A2 ----------
  S('a2-town', 'Town & places', '🏙️', '#2fd3b5', 'A2', 10, `
bank|n|a place where you keep money|I need to go to the bank.||bank
hospital|n|a place where sick people get care|He was taken to the hospital.||kasalxona
library|n|a place where you can borrow books|The library closes at six.||kutubxona
market|n|a place where people buy and sell food|We buy fruit at the market.|bazaar|bozor
park|n|a green place in a town for walking and playing|We walk in the park on Sundays.||bog‘, istirohat bog‘i
station|n|a place where trains or buses stop|The station is near my house.||bekat, vokzal
bridge|n|a structure that crosses a river|Cross the bridge and turn left.||ko‘prik
street|n|a road in a town with buildings|Our street is very quiet.|road|ko‘cha
shop|n|a place where you buy things|The shop opens at nine.|store|do‘kon
museum|n|a building with old or interesting things to see|The museum is free on Sundays.||muzey
corner|n|the place where two streets meet|The café is on the corner.||burchak, ko‘cha burchagi
traffic|n|cars and other vehicles on a road|There is a lot of traffic today.||yo‘l harakati, tirbandlik
`),
  S('a2-clothes', 'Clothes & shopping', '👕', '#ff7a6b', 'A2', 11, `
jacket|n|a short coat|Take your jacket, it is cold.||kurtka
shoes|n|things you wear on your feet outside|I need new shoes.||poyabzal, tufli
dress|n|a piece of clothing for women with a top and a skirt|She wore a blue dress.||ko‘ylak
size|n|how big or small something is|What size are you?||o‘lcham
pocket|n|a small bag sewn into clothes|My phone is in my pocket.||cho‘ntak
cheap|adj|not expensive|This bag is very cheap.|inexpensive|arzon
expensive|adj|costing a lot of money|The watch is too expensive.|costly|qimmat
receipt|n|a paper that shows what you paid for|Keep the receipt in case you return it.||chek
discount|n|a lower price than usual|There is a 20% discount today.|reduction|chegirma
try on|v|to put on clothes to see if they fit|Can I try on this shirt?||kiyib ko‘rmoq
wear|v|to have clothes on your body|She always wears black.||kiymoq
customer|n|a person who buys things in a shop|The shop has many customers.|client|xaridor, mijoz
`),
  S('a2-health', 'Body & health', '🩺', '#ff7a6b', 'A2', 12, `
headache|n|a pain in your head|I have a headache.||bosh og‘rig‘i
fever|n|a high body temperature|She has a fever and a cough.||isitma, qizish
medicine|n|something you take to get better|Take this medicine twice a day.||dori
doctor|n|a person who treats sick people|I have an appointment with the doctor.||shifokor, doktor
cough|n|a noise you make when your throat hurts|He has a bad cough.||yo‘tal
tired|adj|needing to rest or sleep|I am tired after the long trip.|exhausted|charchagan
healthy|adj|well and strong; good for the body|Fruit is healthy.||sog‘lom
exercise|n|activity that keeps your body strong|Exercise is good for your heart.||mashq, jismoniy mashq
appointment|n|a planned time to meet someone|I have a dentist appointment at four.||qabul, uchrashuv vaqti
pain|n|the feeling when something hurts|I have a pain in my back.||og‘riq
stomach|n|the part of your body where food goes|My stomach hurts.||oshqozon, qorin
cold|n|a common illness with a runny nose|I caught a cold last week.||shamollash
`),
  S('a2-weather', 'Weather & seasons', '⛅', '#4db8ff', 'A2', 13, `
sunny|adj|with a lot of sun|It is a sunny day.||quyoshli
cloudy|adj|with many clouds in the sky|Tomorrow will be cloudy.||bulutli
windy|adj|with a lot of wind|It is too windy for a picnic.||shamolli
rainy|adj|with a lot of rain|It was a rainy weekend.||yomg‘irli
snow|n|soft white frozen rain|The children play in the snow.||qor
storm|n|very bad weather with strong wind and rain|The storm broke the tree.||bo‘ron, dovul
temperature|n|how hot or cold something is|The temperature is thirty degrees.||harorat
freezing|adj|extremely cold|It is freezing outside!||juda sovuq
forecast|n|a report about future weather|The forecast says rain tomorrow.||ob-havo bashorati
humid|adj|warm and wet in the air|Summer in the city is hot and humid.||nam, havosi nam
fog|n|thick cloud close to the ground|Fog made the roads dangerous.|mist|tuman
season|n|spring, summer, autumn or winter|Autumn is my favourite season.||fasl, mavsum
`),
  S('a2-hobbies', 'Hobbies & free time', '🎸', '#7b6cff', 'A2', 14, `
hobby|n|something you enjoy doing in your free time|My hobby is photography.||sevimli mashg‘ulot, xobbi
guitar|n|a musical instrument with strings|He plays the guitar very well.||gitara
painting|n|a picture made with paint|She sold a painting for a lot of money.||rasm, rangtasvir
swimming|n|moving through water using your body|Swimming is great exercise.||suzish
camera|n|a machine for taking photographs|I bought a new camera.||fotoapparat, kamera
chess|n|a board game for two players|My grandfather taught me chess.||shaxmat
cooking|n|making food|Cooking is relaxing for me.||ovqat pishirish
collect|v|to bring things together as a hobby|He collects old coins.||yig‘moq, to‘plamoq
join|v|to become a member of a group|I want to join the football club.||qo‘shilmoq, a’zo bo‘lmoq
team|n|a group of people who play or work together|Our team won the match.||jamoa
concert|n|a performance of music|We went to a concert last night.||konsert
free time|n|time when you do not have to work or study|What do you do in your free time?||bo‘sh vaqt
`),
  S('a2-people', 'Describing people', '🧑', '#f06bd0', 'A2', 15, `
kind|adj|friendly and helpful to others|She is kind to everyone.|caring|mehribon
funny|adj|making you laugh|My brother is very funny.|amusing|kulgili, quvnoq
polite|adj|having good manners|Be polite to your guests.|respectful|xushmuomala, odobli
shy|adj|nervous with other people|He is too shy to speak in class.||uyatchan
generous|adj|happy to give to others|A generous man gave us his coat.||saxiy
lazy|adj|not wanting to work|I felt lazy on Sunday.||dangasa
friendly|adj|nice and ready to be a friend|The neighbours are very friendly.|welcoming|samimiy, xushmuomala
honest|adj|always telling the truth|An honest person never lies.|truthful|halol, rostgo‘y
clever|adj|good at learning and understanding|She is a clever student.|smart, intelligent|aqlli, zehnli
serious|adj|not joking; thinking carefully|He looks serious today.||jiddiy
brave|adj|ready to do dangerous things without fear|The brave boy saved the cat.|courageous|jasur, botir
curly|adj|with hair that is not straight|She has long curly hair.||jingalak
`),

  // ---------- A2-B1 and up (the original five, now with Uzbek) ----------
  S('feelings', 'Feelings & moods', '🌦️', '#ff7a6b', 'A2-B1', 20, `
delighted|adj|very happy and pleased|She was delighted with her exam result.|thrilled, overjoyed|xursand, juda quvongan
nervous|adj|worried and a little afraid about something that will happen|I always feel nervous before a speaking test.|anxious, tense|asabiy, hayajonlangan
furious|adj|extremely angry|He was furious when the train was cancelled.|livid, enraged|g‘azabnok, qattiq jahli chiqqan
relieved|adj|happy because something bad did not happen|We were relieved to hear that everyone was safe.|comforted|yengil tortgan, xotirjam bo‘lgan
lonely|adj|sad because you have no one to talk to|Moving to a new city can feel lonely at first.|isolated|yolg‘iz, yolg‘izlik his qilgan
embarrassed|adj|feeling shy or ashamed in front of other people|I was embarrassed when I forgot his name.|ashamed, awkward|xijolat bo‘lgan
grateful|adj|feeling thankful for something|I am grateful for all your help.|thankful|minnatdor
overwhelmed|adj|feeling that there is too much to deal with|She felt overwhelmed by the amount of homework.|swamped|bosimi ketgan, ortiqcha yuk bosgan
curious|adj|wanting to know or learn about something|Children are naturally curious about the world.|inquisitive|qiziquvchan
homesick|adj|sad because you miss your home and family|After two weeks abroad, he started to feel homesick.||uyni sog‘ingan
thrilled|adj|extremely excited and happy|They were thrilled to win the competition.|delighted, ecstatic|behad xursand, hayajonda
annoyed|adj|slightly angry|I get annoyed when people talk during a film.|irritated|jahli chiqqan, bezovta
`),
  S('travel', 'Travel & journeys', '🧳', '#2fd3b5', 'A2-B1', 21, `
itinerary|n|a detailed plan of a journey|Our itinerary includes three cities in five days.|route, schedule|sayohat rejasi, marshrut
luggage|n|bags and suitcases that you take on a journey|Please keep your luggage with you at all times.|baggage|yuk, bagaj
departure|n|the act of leaving a place|Departure is at 7:40 from gate twelve.|leaving|jo‘nab ketish, jo‘natilish
souvenir|n|something you buy to remember a place you visited|I bought a small wooden camel as a souvenir.|keepsake|esdalik sovg‘a
delay|n|a situation when something happens later than planned|There is a two-hour delay because of fog.|hold-up|kechikish
border|n|the line between two countries|We crossed the border at midnight.|frontier|chegara
passport|n|an official document you need to travel to other countries|Do not forget your passport!||pasport
sightseeing|n|visiting interesting places as a tourist|We spent the morning sightseeing in Samarkand.||diqqatga sazovor joylarni ko‘rish
accommodation|n|a place to stay, such as a hotel|The price includes accommodation and breakfast.|lodging|turar joy
destination|n|the place where someone is going|Paris is a popular destination for students.||manzil, borar joy
commute|v|to travel regularly between home and work or school|She commutes to the city by train.||ish yoki o‘qishga qatnamoq
wander|v|to walk slowly around without a clear plan|We wandered through the old market for hours.|roam, stroll|kezmoq, sayr qilmoq
`),
  S('study', 'School & study', '📚', '#7b6cff', 'B1', 22, `
assignment|n|a piece of work given to a student|The assignment is due on Friday.|task, homework|topshiriq, vazifa
revise|v|to study again before a test|I need to revise the past tenses tonight.|review|takrorlamoq
deadline|n|the latest time by which something must be done|The deadline for the essay is next Monday.||oxirgi muddat
concentrate|v|to give all your attention to one thing|It is hard to concentrate with all this noise.|focus|diqqatni jamlamoq
improve|v|to become better or make something better|Reading every day will improve your vocabulary.|progress|yaxshilamoq, yaxshilanmoq
mistake|n|something that is wrong or not correct|Everyone makes mistakes when they learn a language.|error|xato
fluent|adj|able to speak a language easily and well|After two years, she became fluent in English.|articulate|ravon, erkin so‘zlay oladigan
memorise|v|to learn something so well that you can remember it exactly|Try to memorise five new words a day.|learn by heart|yodlamoq, yodlab olmoq
attend|v|to go to a class, meeting or event|Students must attend at least 80% of lessons.||qatnashmoq, borib turmoq
achieve|v|to succeed in doing something after effort|She achieved her goal of passing the IELTS exam.|accomplish|erishmoq
pronounce|v|to say a word in a particular way|How do you pronounce this word?||talaffuz qilmoq
guess|v|to give an answer without being sure it is right|Can you guess the meaning from the context?||taxmin qilmoq
`),
  S('work', 'Work & business', '💼', '#ffb84d', 'B1-B2', 23, `
colleague|n|a person you work with|My colleagues organised a surprise party.|co-worker|hamkasb
promotion|n|a move to a more important job|He got a promotion after one year.||lavozimda ko‘tarilish
negotiate|v|to discuss something to reach an agreement|We negotiated a better price with the supplier.|bargain|muzokara olib bormoq
workload|n|the amount of work a person has to do|Her workload has doubled since March.||ish hajmi
resign|v|to officially leave your job|He resigned to start his own company.|quit|ishdan ketmoq (iste’foga chiqmoq)
flexible|adj|able to change easily to suit new situations|We offer flexible working hours.|adaptable|moslashuvchan, egiluvchan
invoice|n|a document that shows how much money you must pay|Please send the invoice by email.|bill|hisob-faktura
applicant|n|a person who asks formally for a job|There were over fifty applicants for the position.|candidate|nomzod, ariza beruvchi
meeting|n|an event where people come together to talk about work|The meeting starts at ten.||yig‘ilish, uchrashuv
qualification|n|an exam passed or a course completed|A teaching qualification is required.|certificate|malaka, diplom
reliable|adj|able to be trusted to do what you expect|She is a reliable and honest worker.|dependable|ishonchli
draft|n|an early version of a piece of writing|Send me the first draft by noon.||qoralama
`),
  S('bigideas', 'Big ideas', '🔭', '#4db8ff', 'B2-C1', 24, `
serendipity|n|finding something good by chance|We found the little café by pure serendipity.|luck|tasodifan topilgan baxt
ambiguous|adj|having more than one possible meaning|The ending of the film is deliberately ambiguous.|unclear|ikki ma’noli, noaniq
resilient|adj|able to recover quickly after difficulty|Children are often more resilient than we think.|tough|chidamli, tez tiklanadigan
inevitable|adj|certain to happen and impossible to avoid|Change is inevitable.|unavoidable|muqarrar
perspective|n|a particular way of thinking about something|Travel gives you a new perspective on life.|viewpoint|nuqtai nazar
nuance|n|a very small difference in meaning or feeling|He explained the nuances of the two words.|subtlety|nozik farq
mitigate|v|to make something bad less serious|Trees help to mitigate the effects of heat.|reduce|yumshatmoq, kamaytirmoq
pragmatic|adj|dealing with problems in a practical, realistic way|She took a pragmatic approach to the budget.|practical|amaliy, real fikrlaydigan
elaborate|v|to give more details about something|Could you elaborate on that point?|expand|batafsil tushuntirmoq
coincide|v|to happen at the same time|My exam coincides with her birthday.||bir vaqtga to‘g‘ri kelmoq
profound|adj|very deep or strongly felt|The book had a profound effect on me.|deep|chuqur
thrive|v|to grow and be very successful or healthy|Plants thrive in this warm climate.|flourish|gullab-yashnamoq
`),

  // ---------- B1 / B2 / C1 additions ----------
  S('b1-tech', 'Technology', '💻', '#4db8ff', 'B1', 30, `
download|v|to copy a file from the internet to your device|I downloaded the app yesterday.||yuklab olmoq
password|n|a secret word that lets you into an account|Choose a strong password.||parol
screen|n|the flat part of a phone or computer that shows pictures|My phone screen is cracked.||ekran
device|n|a machine such as a phone or tablet|You can use any device to log in.|gadget|qurilma
charge|v|to put electricity into a battery|I need to charge my phone.||quvvatlamoq
online|adj|connected to the internet|The lesson is online today.||onlayn, internetdagi
software|n|programs that run on a computer|The software needs an update.||dasturiy ta’minot
update|v|to make something newer or more modern|Please update the app.|upgrade|yangilamoq
website|n|a place on the internet with pages about one subject|Visit our website for details.||veb-sayt
search|v|to look for information|I searched for the answer online.||qidirmoq
battery|n|a thing that stores electricity in a device|The battery is almost empty.||batareya
wireless|adj|working without cables|I use wireless headphones.||simsiz
`),
  S('b1-phrasal', 'Phrasal verbs', '🪄', '#9a6bff', 'B1', 31, `
give up|v|to stop trying|Do not give up, you are almost there!|quit|taslim bo‘lmoq, voz kechmoq
look after|v|to take care of someone or something|She looks after her little brother.|care for|qarab turmoq, g‘amxo‘rlik qilmoq
run out of|v|to have no more of something|We ran out of milk this morning.||tugab qolmoq
set up|v|to start or arrange something|They set up a small business.|establish|tashkil qilmoq, o‘rnatmoq
turn down|v|to say no to an offer|He turned down the job.|refuse, reject|rad etmoq
find out|v|to learn a fact|I found out the answer yesterday.|discover|bilib olmoq, aniqlamoq
carry on|v|to continue|Carry on reading, please.|continue|davom etmoq
put off|v|to move something to a later time|Do not put off your homework.|postpone|keyinga qoldirmoq
take off|v|to leave the ground; to remove clothes|The plane takes off at noon.||ko‘tarilmoq; yechmoq
get along|v|to have a good relationship with someone|I get along well with my cousins.||til topishmoq
break down|v|to stop working (a machine)|Our car broke down on the way.||buzilmoq, ishdan chiqmoq
come up with|v|to think of an idea|She came up with a clever plan.|invent|o‘ylab topmoq
`),
  S('b2-env', 'Environment', '🌍', '#8bd450', 'B2', 40, `
pollution|n|dirt and harmful things in the air, water or land|Air pollution is a problem in big cities.||ifloslanish
recycle|v|to use materials again instead of throwing them away|We recycle paper and glass.||qayta ishlamoq
climate|n|the usual weather of a place over a long time|The climate here is dry and hot.||iqlim
renewable|adj|able to be used again and again, like wind or sun|Renewable energy is growing fast.||qayta tiklanadigan
waste|n|things you throw away because you do not need them|We produce too much plastic waste.|rubbish|chiqindi
endangered|adj|at risk of disappearing completely|The snow leopard is an endangered animal.||yo‘qolib ketish xavfi ostidagi
sustainable|adj|able to continue without harming nature|Sustainable farming protects the soil.||barqaror
emissions|n|gases sent into the air by cars and factories|The city wants to cut carbon emissions.||chiqindi gazlar
drought|n|a long time with no rain|The drought destroyed the crops.||qurg‘oqchilik
habitat|n|the natural home of a plant or animal|Forests are the habitat of many species.||yashash muhiti
conserve|v|to protect and use carefully|We must conserve water in summer.|preserve|asramoq, muhofaza qilmoq
landfill|n|a place where rubbish is buried|Most of our rubbish goes to landfill.||chiqindixona, axlatxona
`),
  S('b2-media', 'Media & news', '📰', '#f06bd0', 'B2', 41, `
headline|n|the title of a newspaper story|The headline caught my attention.||sarlavha
journalist|n|a person who writes or reports the news|The journalist interviewed the mayor.|reporter|jurnalist
broadcast|v|to send out a programme on TV or radio|The match will be broadcast live.||efirga uzatmoq
viral|adj|spreading very quickly on the internet|The video went viral overnight.||tez tarqaluvchi, viral
rumour|n|a story that may not be true|There is a rumour that the school will close.|gossip|mish-mish
bias|n|an unfair preference for one side|The article shows a clear bias.|prejudice|xolislik yo‘qligi, tarafkashlik
audience|n|the people who watch or listen to something|The show has a huge audience.||tomoshabinlar, auditoriya
publish|v|to print or put something online for the public|The paper published her story.||nashr etmoq
interview|n|a meeting where someone asks questions|I watched an interview with the author.||intervyu
misleading|adj|giving a wrong idea|The advert was misleading.|deceptive|chalg‘ituvchi
source|n|a person or place where information comes from|Always check your source.||manba
coverage|n|the amount of attention the media gives an event|The coverage of the final lasted all day.||yoritilishi, ommaviy axborot yoritishi
`),
  S('c1-academic', 'Academic words', '🎓', '#7b6cff', 'C1', 50, `
analyse|v|to study something in detail to understand it|We analysed the data from the survey.|examine|tahlil qilmoq
hypothesis|n|an idea that you test to see if it is true|The experiment supports our hypothesis.|theory|gipoteza, farazlar
significant|adj|large or important enough to notice|There was a significant rise in prices.|major|sezilarli, muhim
substantial|adj|large in amount or importance|He made a substantial donation.|considerable|katta, salmoqli
controversial|adj|causing a lot of disagreement|It is a controversial decision.||munozarali, bahsli
comprehensive|adj|including everything that is needed|The report gives a comprehensive overview.|thorough|keng qamrovli, to‘liq
criteria|n|the standards used to judge something|The criteria for the prize are clear.||mezonlar
derive|v|to get something from a source|The word derives from Latin.||kelib chiqmoq
fundamental|adj|basic and very important|Honesty is fundamental to trust.|essential|asosiy, tub
imply|v|to suggest something without saying it directly|His silence implied that he disagreed.||nazarda tutmoq, ishora qilmoq
justify|v|to give a good reason for something|How can you justify this cost?||oqlamoq, asoslab bermoq
phenomenon|n|something that exists and can be seen, often unusual|Rainbows are a natural phenomenon.||hodisa
`),
];
