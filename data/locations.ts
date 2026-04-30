/**
 * مكاتب تطعيم المسافرين المعتمدة — محافظة القاهرة 2026 (حجاج ومعتمرين ومسافرين).
 * الأعمدة ثابتة لاستيراد Excel / JSON أو ربط API لاحقاً.
 */
export type VaccinationCenterRow = {
  id: string;
  centerNameAr: string;
  centerNameEn: string;
  administrationAr: string;
  administrationEn: string;
  governorateAr: string;
  governorateEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  mapsUrl?: string;
};

export const VACCINATION_CENTERS: VaccinationCenterRow[] = [
  {
    id: "1",
    centerNameAr: "مكتب التطعيم الدولي بالمطار",
    centerNameEn: "International vaccination office — airport",
    administrationAr: "التطعيم الدولي بالمطار",
    administrationEn: "Airport international vaccination",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "صالة ١، المطار القديم",
    addressEn: "Hall 1, Old Airport",
    phone: "0222653543",
    mapsUrl: "https://maps.app.goo.gl/KSx61yoEbbnwdrTd7",
  },
  {
    id: "2",
    centerNameAr: "شريف",
    centerNameEn: "Sharif office",
    administrationAr: "الساحل",
    administrationEn: "El Sahel",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr:
      "٣٧ شارع محمد الهواري، الخلفاوي، بجوار محطة المترو",
    addressEn:
      "37 Mohamed El-Hawary St., Khalfaoui, near the metro station",
    phone: "—",
    mapsUrl: "https://maps.app.goo.gl/gFKGWHPihw1adSdt5",
  },
  {
    id: "3",
    centerNameAr: "التجمع الأول",
    centerNameEn: "First Settlement",
    administrationAr: "القاهرة الجديدة",
    administrationEn: "New Cairo",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "الحي العاشر، أمام إدارة حي القاهرة الجديدة",
    addressEn: "10th District, facing New Cairo district administration",
    phone: "022461906",
    mapsUrl: "https://maps.app.goo.gl/K3npMoGB2pfMJ1T79",
  },
  {
    id: "4",
    centerNameAr: "المعادي",
    centerNameEn: "Maadi",
    administrationAr: "المعادي",
    administrationEn: "Maadi",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "٧١ ميدان التعاون، المعادي",
    addressEn: "71 El Taawoun Sq., Maadi",
    phone: "023583381",
    mapsUrl: "https://maps.app.goo.gl/EF3p4MZdqRPTmBgd7",
  },
  {
    id: "5",
    centerNameAr: "الأسمرات",
    centerNameEn: "El-Asmarat",
    administrationAr: "المقطم",
    administrationEn: "Mokattam",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "مدينة الأسمرات، المقطم، عمارة ٣١، الجوهرة",
    addressEn: "El-Asmarat city, Mokattam, Building 31, Al Jawhara",
    phone: "—",
    mapsUrl: "https://maps.app.goo.gl/ZpzhHY9uyafBYJSE8",
  },
  {
    id: "6",
    centerNameAr: "المحكمة",
    centerNameEn: "Court (Heliopolis)",
    administrationAr: "النزهة",
    administrationEn: "Nozha",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "٣٢ شارع الحجاز، أمام محكمة مصر الجديدة",
    addressEn: "32 Hegaz St., opposite New Cairo Court",
    phone: "026339444",
    mapsUrl: "https://maps.app.goo.gl/hx65ccwcSccVcTV68",
  },
  {
    id: "7",
    centerNameAr: "الست خضرة",
    centerNameEn: "Set Khadra",
    administrationAr: "حلوان",
    administrationEn: "Helwan",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "شارع راغب من شارع برهان، حلوان",
    addressEn: "Ragheb St. from Burhan St., Helwan",
    phone: "025567079",
    mapsUrl: "https://maps.app.goo.gl/GsBViG3R4jWCEnEC8",
  },
  {
    id: "8",
    centerNameAr: "عابدين",
    centerNameEn: "Abdeen",
    administrationAr: "عابدين",
    administrationEn: "Abdeen",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "١٩٧ شارع التحرير — باب اللوق",
    addressEn: "197 Tahrir St. — Bab El Louq",
    phone: "022794650",
    mapsUrl: "https://maps.app.goo.gl/fxWPJKWTWStbT9TVA",
  },
  {
    id: "9",
    centerNameAr: "قصر النيل",
    centerNameEn: "Qasr El Nil",
    administrationAr: "غرب",
    administrationEn: "West",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr:
      "٧ شارع رضا من شارع المبتديان، السيدة زينب، أمام مستشفى المنيرة",
    addressEn:
      "7 Reda St. from El Mobtadian St., Sayeda Zeinab, opposite El Moniera Hospital",
    phone: "023656432",
    mapsUrl: "https://maps.app.goo.gl/9cFZ8Q9NdT7UM5Dz8",
  },
  {
    id: "10",
    centerNameAr: "وحدة صحة مدينة نصر الأولى",
    centerNameEn: "Nasr City 1 health unit",
    administrationAr: "شرق مدينة نصر",
    administrationEn: "East Nasr City",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "١٤ شارع عمارات رابية، طريق النصر",
    addressEn: "14 Rabie Buildings St., El Nasr Road",
    phone: "022613676",
    mapsUrl: "https://maps.app.goo.gl/wjudWLkKY9Gh1uTk6",
  },
  {
    id: "11",
    centerNameAr: "وحدة صحة مدينة نصر الثانية",
    centerNameEn: "Nasr City 2 health unit",
    administrationAr: "غرب مدينة نصر",
    administrationEn: "West Nasr City",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "الحي السادس، بجوار مستشفى الجراحات اليومية",
    addressEn: "6th District, next to one-day surgery hospital",
    phone: "022620816",
    mapsUrl: "https://maps.app.goo.gl/1e3zKprpU7t41vf49",
  },
  {
    id: "12",
    centerNameAr: "مصر الجديدة (هيليوبوليس)",
    centerNameEn: "Heliopolis (Masr El Gedida)",
    administrationAr: "مصر الجديدة",
    administrationEn: "Heliopolis",
    governorateAr: "القاهرة",
    governorateEn: "Cairo",
    addressAr: "٥٤ شارع الخليفة المأمون، روكسي، مصر الجديدة",
    addressEn: "54 Khalifa El Maamoun St., Roxy, Heliopolis",
    phone: "—",
    mapsUrl: "https://maps.app.goo.gl/4uMn35iKdE3jnTmA8",
  },
];
