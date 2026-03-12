const placesData = [
  {
    id: 1,
    nameHe: "גן העצמאות",
    country: "ישראל",
    city: "תל אביב",
    category: "popular",
    descriptionHe: "פארק עירוני מוכר עם תצפית לים ונקודות ישיבה נעימות.",
    lat: 32.0894,
    lng: 34.7701,
    sourceUrl: "https://www.tel-aviv.gov.il"
  },
  {
    id: 2,
    nameHe: "שוק הפשפשים",
    country: "ישראל",
    city: "יפו",
    category: "popular",
    descriptionHe: "אזור היסטורי עם חנויות, אוכל ואווירה מקומית.",
    lat: 32.0544,
    lng: 34.7562,
    sourceUrl: "https://www.visit-tel-aviv.com"
  },
  {
    id: 3,
    nameHe: "גן סאקר",
    country: "ישראל",
    city: "ירושלים",
    category: "recommended",
    descriptionHe: "פארק פתוח ונעים במרכז העיר.",
    lat: 31.7784,
    lng: 35.2057,
    sourceUrl: "https://www.itraveljerusalem.com"
  },
  {
    id: 4,
    nameHe: "טיילת לואי",
    country: "ישראל",
    city: "חיפה",
    category: "popular",
    descriptionHe: "טיילת עם נוף פנורמי מרשים של מפרץ חיפה.",
    lat: 32.8183,
    lng: 34.9817,
    sourceUrl: "https://www.visit-haifa.org"
  },
  {
    id: 5,
    nameHe: "סנטרל פארק",
    country: "ארצות הברית",
    city: "ניו יורק",
    state: "ניו יורק",
    category: "popular",
    descriptionHe: "אחד הפארקים המפורסמים בעולם בלב מנהטן.",
    lat: 40.7829,
    lng: -73.9654,
    sourceUrl: "https://www.centralparknyc.org"
  },
  {
    id: 6,
    nameHe: "היי ליין",
    country: "ארצות הברית",
    city: "ניו יורק",
    state: "ניו יורק",
    category: "recommended",
    descriptionHe: "פארק מוגבה ומיוחד על תשתית מסילת רכבת ישנה.",
    lat: 40.7480,
    lng: -74.0048,
    sourceUrl: "https://www.thehighline.org"
  },
  {
    id: 7,
    nameHe: "גריפית' אובזרבטורי",
    country: "ארצות הברית",
    city: "לוס אנג'לס",
    state: "קליפורניה",
    category: "popular",
    descriptionHe: "תצפית מפורסמת על לוס אנג'לס והשלט של הוליווד.",
    lat: 34.1184,
    lng: -118.3004,
    sourceUrl: "https://griffithobservatory.org"
  },
  {
    id: 8,
    nameHe: "דה גטי",
    country: "ארצות הברית",
    city: "לוס אנג'לס",
    state: "קליפורניה",
    category: "recommended",
    descriptionHe: "מוזיאון, גנים ותצפיות נהדרות.",
    lat: 34.0780,
    lng: -118.4741,
    sourceUrl: "https://www.getty.edu"
  },
  {
    id: 9,
    nameHe: "מילניום פארק",
    country: "ארצות הברית",
    city: "שיקגו",
    state: "אילינוי",
    category: "popular",
    descriptionHe: "פארק מפורסם עם Cloud Gate בלב העיר.",
    lat: 41.8826,
    lng: -87.6226,
    sourceUrl: "https://www.chicago.gov"
  },
  {
    id: 10,
    nameHe: "גן התה היפני",
    country: "ארצות הברית",
    city: "סן פרנסיסקו",
    state: "קליפורניה",
    category: "recommended",
    descriptionHe: "פינה שקטה ומיוחדת בגולדן גייט פארק.",
    lat: 37.7701,
    lng: -122.4702,
    sourceUrl: "https://gggp.org"
  }
];

const israelCities = [
  "אילת", "אשדוד", "אשקלון", "באר שבע", "בת ים", "גבעתיים", "הרצליה", "חדרה",
  "חולון", "חיפה", "טבריה", "ירושלים", "כפר סבא", "מודיעין", "נהריה", "נתניה",
  "עכו", "פתח תקווה", "צפת", "קריית גת", "קריית מוצקין", "ראשון לציון", "רחובות",
  "רמת גן", "רעננה", "תל אביב", "יפו"
];

const usStates = [
  "אלבמה","אלסקה","אריזונה","ארקנסו","קליפורניה","קולורדו","קונטיקט","דלאוור",
  "פלורידה","ג'ורג'יה","הוואי","איידהו","אילינוי","אינדיאנה","איווה","קנזס",
  "קנטקי","לואיזיאנה","מיין","מרילנד","מסצ'וסטס","מישיגן","מינסוטה","מיסיסיפי",
  "מיזורי","מונטנה","נברסקה","נבדה","ניו המפשייר","ניו ג'רזי","ניו מקסיקו",
  "ניו יורק","קרוליינה הצפונית","דקוטה הצפונית","אוהיו","אוקלהומה","אורגון",
  "פנסילבניה","רוד איילנד","קרוליינה הדרומית","דקוטה הדרומית","טנסי","טקסס",
  "יוטה","ורמונט","וירג'יניה","וושינגטון","וירג'יניה המערבית","ויסקונסין","ויומינג"
];

const usCitiesSample = [
  "ניו יורק","לוס אנג'לס","שיקגו","יוסטון","פיניקס","פילדלפיה","סן אנטוניו","סן דייגו",
  "דאלאס","סן חוזה","אוסטין","ג'קסונוויל","סן פרנסיסקו","קולומבוס","שארלוט","אינדיאנפוליס",
  "סיאטל","דנוור","וושינגטון","בוסטון","נאשוויל","דטרויט","פורטלנד","לאס וגאס","מיאמי"
];
