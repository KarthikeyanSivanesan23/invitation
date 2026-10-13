export type Language = 'en' | 'ta'
export type Localized = { en: string; ta: string }
export const text = (en: string, ta: string): Localized => ({ en, ta })

export interface Person {
  name: Localized
  initial: string
  parents: Localized
  introduction: Localized
  portrait: string
  instagram: string
}

export interface WeddingEvent {
  id: string
  enabled: boolean
  title: Localized
  subtitle: Localized
  date: Localized
  time: Localized
  /** ISO 8601 with an explicit offset. Leave empty until the date is confirmed. */
  startISO: string
  endISO: string
  venue: Localized
  dressCode: Localized
  description: Localized
  mapsUrl: string
  motif: 'rings' | 'leaf' | 'sun' | 'sparkles' | 'flame' | 'meal'
}

const venue = text('[Temple or Marriage Hall Name]', '[கோயில் அல்லது திருமண மண்டபத்தின் பெயர்]')
const weddingDate = text('[Wedding Date]', '[திருமண நாள்]')
const mapsUrl = '[Maps Link]'

/** All personal invitation content lives here. UI translations are in translations.ts. */
export const wedding = {
  siteUrl: 'https://your-wedding.vercel.app',
  title: text('A lifetime of us', 'நம் வாழ்நாள் பயணம்'),
  description: text(
    "With full hearts and our families’ blessings, we invite you to celebrate the wedding of Karthikeyan and [Bride Name]. A little tradition. A little magic. A lifetime of love.",
    'எங்கள் குடும்பத்தினரின் ஆசிகளுடன், கார்த்திகேயன் மற்றும் [மணமகள் பெயர்] திருமண விழாவிற்கு உங்களை அன்புடன் அழைக்கிறோம்.',
  ),
  groom: {
    name: text('Karthikeyan', 'கார்த்திகேயன்'),
    initial: 'K',
    parents: text('Son of [Parent Names]', '[பெற்றோர் பெயர்கள்] அவர்களின் மகன்'),
    introduction: text('A kind heart, an old soul, and a believer in the little things. Ready for his favourite adventure yet.', 'அன்பான இதயமும் அழகிய கனவுகளும் கொண்டவர். வாழ்வின் இனிய பயணத்தைத் தொடங்கக் காத்திருக்கிறார்.'),
    portrait: '/images/groom.jpg',
    instagram: '',
  } satisfies Person,
  bride: {
    name: text('[Bride Name]', '[மணமகள் பெயர்]'),
    initial: 'B',
    parents: text('Daughter of [Parent Names]', '[பெற்றோர் பெயர்கள்] அவர்களின் மகள்'),
    introduction: text('A warm smile, a little sunshine, and a heart full of dreams. The beautiful beginning to their forever.', 'புன்னகையும் பாசமும் நிறைந்தவர். இரு இதயங்களின் அழகான புதிய தொடக்கம்.'),
    portrait: '/images/bride.jpg',
    instagram: '',
  } satisfies Person,
  date: weddingDate,
  // Example: '2027-02-14T09:00:00+05:30'. Never enter a date without a time-zone offset.
  dateISO: '',
  endISO: '',
  timeZone: 'Asia/Kolkata',
  muhurtham: text('[Muhurtham Time]', '[முகூர்த்த நேரம்]'),
  reception: text('[Reception Date and Time]', '[வரவேற்பு நாள் மற்றும் நேரம்]'),
  venue: {
    name: venue,
    address: text('[Complete Address]', '[முழு முகவரி]'),
    landmark: text('[Nearby Landmark]', '[அருகிலுள்ள அடையாளம்]'),
    image: '/images/venue.jpg',
    mapsUrl,
  },
  hostedBy: text('[Family Names]', '[குடும்பத்தினர் பெயர்கள்]'),
  contacts: [{ name: text('Our family', 'எங்கள் குடும்பம்'), phone: '[Contact Numbers]' }],
  // Set to the recipient's international number, e.g. '919876543210'.
  whatsappNumber: '',
  liveStreamUrl: '',
  hashtag: '#KarthiWedsBride',
  audio: '/audio/wedding-instrumental.mp3',
  ogImage: '/images/og-wedding.jpg',
  invitationImageName: 'karthi-wedding-invitation.png',
  templeModel: '/models/temple.glb',
  mandapamModel: '/models/mandapam.glb',
  // Optional models should face +Z, be centred on X/Z, and have their floor at Y=0.
  templeModelScale: 1,
  mandapamModelScale: 1,
  artwork: {
    templeDay: '/images/temple-day.jpg',
    templeNight: '/images/temple-night.jpg',
    mandapam: '/images/mandapam-scene.jpg',
  },
  intro: {
    eyebrow: text('AN INVITATION, FROM OUR HEARTS', 'இதயத்திலிருந்து ஓர் அன்பு அழைப்பு'),
    headline: text('A lifetime begins', 'வாழ்நாள் பயணம்'),
    headlineAccent: text('with a little magic.', 'அன்புடன் தொடங்குகிறது.'),
    note: text('A little tradition. A little magic. A lifetime of love.', 'கொஞ்சம் பாரம்பரியம். கொஞ்சம் மாயம். வாழ்நாள் முழுவதும் அன்பு.'),
    tamilBlessing: 'அன்பும் அறனும் உடைத்தாயின் இல்வாழ்க்கை\nபண்பும் பயனும் அது.',
    blessingTranslation: text('When love and virtue grace a home,\nthere lies its beauty and its purpose.', 'அன்பும் அறமும் நிறைந்த இல்லறமே\nபண்பும் பயனும் கொண்டது.'),
    blessingSource: text('THIRUKKURAL · 45', 'திருக்குறள் · 45'),
  },
  story: [
    { id: 'meeting', date: text('[Our first meeting]', '[முதல் சந்திப்பு நாள்]'), title: text('A serendipitous hello', 'எதிர்பாராத ஓர் அறிமுகம்'), category: text('First Meeting', 'முதல் சந்திப்பு'), description: text('Of all the moments, in all the places, life brought us to the same one. And something quietly began.', 'பல தருணங்களுக்கு இடையே, வாழ்க்கை எங்களை ஒரே இடத்தில் சந்திக்க வைத்தது. அங்கே ஓர் அழகான கதை தொடங்கியது.'), image: '', location: text('', ''), motif: 'flower' },
    { id: 'friendship', date: text('[A little while later]', '[சில நாட்களுக்குப் பிறகு]'), title: text('Our favourite person', 'மனதிற்கு இனிய நட்பு'), category: text('The Friendship', 'நட்பு'), description: text('Conversations grew longer. Laughter came easier. Somewhere along the way, a stranger became home.', 'உரையாடல்கள் நீண்டன. சிரிப்புகள் மலர்ந்தன. அறிமுகமானவர் மனதிற்கு நெருக்கமானவரானார்.'), image: '', location: text('', ''), motif: 'leaf' },
    { id: 'proposal', date: text('[The day we said yes]', '[சம்மதம் சொன்ன நாள்]'), title: text('One question. Always yes.', 'ஒரு கேள்வி. ஆயிரம் கனவுகள்.'), category: text('The Proposal', 'காதல் வெளிப்பாடு'), description: text('Not a grand script, just a moment that was entirely ours. A promise to choose each other, every single day.', 'எங்களுக்கே உரிய ஓர் இனிய தருணம். ஒவ்வொரு நாளும் ஒருவரை ஒருவர் தேர்ந்தெடுப்போம் என்ற வாக்குறுதி.'), image: '', location: text('', ''), motif: 'rings' },
    { id: 'engagement', date: text('[Engagement Date]', '[நிச்சயதார்த்த நாள்]'), title: text('Two families. One joy.', 'இரு குடும்பங்கள். ஓர் ஆனந்தம்.'), category: text('Engagement', 'நிச்சயதார்த்தம்'), description: text('With the blessings of those who raised us and the smiles of those who know us, our forever became a little more real.', 'பெற்றோரின் ஆசிகளும் உறவுகளின் மகிழ்ச்சியும் எங்கள் பந்தத்தை மேலும் அழகாக்கின.'), image: '', location: text('', ''), motif: 'flower' },
    { id: 'wedding', date: weddingDate, title: text('And so, our forever begins', 'இனி நம் இனிய இல்லறம்'), category: text('Wedding Day', 'திருமண நாள்'), description: text('A sacred fire. Seven promises. A lifetime to keep them. The most beautiful chapter is the one we write together—with you beside us.', 'அக்னி சாட்சியாக, அன்பின் உறுதிமொழிகளுடன், நீங்கள் உடனிருக்க எங்கள் புதிய அத்தியாயம் தொடங்குகிறது.'), image: '', location: venue, motif: 'flame' },
  ],
  events: [
    { id: 'engagement', enabled: true, title: text('Engagement', 'நிச்சயதார்த்தம்'), subtitle: text('THE FIRST PROMISE', 'முதல் உறுதிமொழி'), date: text('[Engagement Date]', '[நிச்சயதார்த்த நாள்]'), time: text('[Engagement Time]', '[நிச்சயதார்த்த நேரம்]'), startISO: '', endISO: '', venue, dressCode: text('Festive ethnic', 'பாரம்பரிய விழா உடை'), description: text('A promise of forever, surrounded by the people who mean the most.', 'அன்பான உறவுகள் சூழ, வாழ்நாள் பந்தத்திற்கான இனிய தொடக்கம்.'), mapsUrl, motif: 'rings' },
    { id: 'mehendi', enabled: true, title: text('Mehendi', 'மெஹந்தி'), subtitle: text('A LITTLE COLOUR, A LOT OF JOY', 'வண்ணங்களும் மகிழ்ச்சியும்'), date: text('[Mehendi Date]', '[மெஹந்தி நாள்]'), time: text('[Mehendi Time]', '[மெஹந்தி நேரம்]'), startISO: '', endISO: '', venue, dressCode: text('Shades of green', 'பச்சை நிற உடை'), description: text('Henna-stained hands, happy hearts, and stories that last a lifetime.', 'மருதாணிக் கைகளும் மகிழ்ச்சியான இதயங்களும் இணையும் இனிய விழா.'), mapsUrl, motif: 'leaf' },
    { id: 'haldi', enabled: true, title: text('Haldi', 'மஞ்சள் நீராட்டு'), subtitle: text('DIPPED IN SUNSHINE', 'மஞ்சள் நிற மகிழ்ச்சி'), date: text('[Haldi Date]', '[மஞ்சள் நீராட்டு நாள்]'), time: text('[Haldi Time]', '[மஞ்சள் நீராட்டு நேரம்]'), startISO: '', endISO: '', venue, dressCode: text('Sunshine yellow', 'மஞ்சள் நிற உடை'), description: text('A golden morning of blessings, laughter, and a little playful mischief.', 'ஆசிகளும் சிரிப்பும் குறும்பும் நிறைந்த பொன்னான காலை.'), mapsUrl, motif: 'sun' },
    { id: 'reception', enabled: true, title: text('Reception', 'திருமண வரவேற்பு'), subtitle: text('AN EVENING TO REMEMBER', 'நினைவில் நிற்கும் மாலை'), date: text('[Reception Date]', '[வரவேற்பு நாள்]'), time: text('[Reception Time]', '[வரவேற்பு நேரம்]'), startISO: '', endISO: '', venue, dressCode: text('Silks & celebration', 'பட்டு மற்றும் விழா உடை'), description: text('Come for the celebration. Stay for the dancing, dinner, and memories.', 'உணவும் இசையும் மறக்க முடியாத நினைவுகளும் நிறைந்த அன்பான மாலை.'), mapsUrl, motif: 'sparkles' },
    { id: 'muhurtham', enabled: true, title: text('Muhurtham', 'திருமண முகூர்த்தம்'), subtitle: text('THE SACRED BEGINNING', 'புனிதமான தொடக்கம்'), date: weddingDate, time: text('[Muhurtham Time]', '[முகூர்த்த நேரம்]'), startISO: '', endISO: '', venue, dressCode: text('Traditional South Indian', 'தென்னிந்திய பாரம்பரிய உடை'), description: text('As the nadaswaram plays and the sacred fire glows, two lives become one.', 'நாதஸ்வரம் ஒலிக்க, அக்னி சாட்சியாக, இரு வாழ்க்கைகள் ஒன்றாகின்றன.'), mapsUrl, motif: 'flame' },
    { id: 'lunch', enabled: true, title: text('Wedding Lunch', 'திருமண விருந்து'), subtitle: text('SERVED WITH LOVE', 'அன்புடன் பரிமாறுகிறோம்'), date: weddingDate, time: text('[Lunch Time]', '[விருந்து நேரம்]'), startISO: '', endISO: '', venue, dressCode: text('Come as you celebrate', 'விழா உடையில் வாருங்கள்'), description: text('A traditional banana-leaf feast. Good food, warm company, full hearts.', 'வாழை இலையில் பாரம்பரிய விருந்து. அன்பான உறவுகளுடன் இனிய உணவு.'), mapsUrl, motif: 'meal' },
  ] satisfies WeddingEvent[],
  gallery: [
    { id: '01', src: '/images/gallery-01.jpg', caption: text('The beginning of everything', 'எல்லாவற்றிற்கும் ஓர் அழகிய தொடக்கம்'), motif: 'lotus', color: 'rose' },
    { id: '02', src: '/images/gallery-02.jpg', caption: text('Our kind of forever', 'எங்களின் என்றென்றும்'), motif: 'arch', color: 'sand' },
    { id: '03', src: '/images/gallery-03.jpg', caption: text('In the little moments', 'சின்னச் சின்ன தருணங்களில்'), motif: 'leaf', color: 'sage' },
    { id: '04', src: '/images/gallery-04.jpg', caption: text('Wrapped in tradition', 'பாரம்பரியத்தின் அழகில்'), motif: 'kolam', color: 'wine' },
    { id: '05', src: '/images/gallery-05.jpg', caption: text('Together is a beautiful place', 'ஒன்றாக இருப்பதே அழகு'), motif: 'rings', color: 'clay' },
  ],
  rsvp: { maxGuests: 10, deadline: text('Kindly let us know you’re coming.', 'உங்கள் வருகையை அன்புடன் உறுதிப்படுத்துங்கள்.') },
  blessings: {
    maxLength: 280,
    introduction: text('A little wish. A lasting memory. Leave a few words for our new beginning.', 'ஓர் இனிய வாழ்த்து. ஓர் அழகிய நினைவு. எங்கள் புதிய தொடக்கத்திற்கு உங்கள் அன்பான வார்த்தைகள்.'),
  },
  closing: text('We look forward to celebrating with you', 'உங்களுடன் கொண்டாட ஆவலுடன் காத்திருக்கிறோம்'),
}
