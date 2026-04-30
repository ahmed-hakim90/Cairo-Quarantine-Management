/**
 * مكاتب تطعيم المسافرين المعتمدة — محافظة القاهرة 2026 (حجاج ومعتمرين ومسافرين).
 * الأعمدة ثابتة لاستيراد Excel / JSON أو ربط API لاحقاً.
 */
export type VaccinationCenterRow = {
  id: string;
  centerNameAr: string;
  administrationAr: string;
  governorateAr: string;
  addressAr: string;
  phone: string;
  mapsUrl?: string;
};

export const VACCINATION_CENTERS: VaccinationCenterRow[] = [
  {
    id: "1",
    centerNameAr: "مكتب التطعيم الدولي بالمطار",
    administrationAr: "التطعيم الدولي بالمطار",
    governorateAr: "القاهرة",
    addressAr: "صالة ١، المطار القديم",
    phone: "0222653543",
    mapsUrl: "https://maps.app.goo.gl/KSx61yoEbbnwdrTd7",
  },
  {
    id: "2",
    centerNameAr: "شريف",
    administrationAr: "الساحل",
    governorateAr: "القاهرة",
    addressAr:
      "٣٧ شارع محمد الهواري، الخلفاوي، بجوار محطة المترو",
    phone: "—",
    mapsUrl: "https://maps.app.goo.gl/gFKGWHPihw1adSdt5",
  },
  {
    id: "3",
    centerNameAr: "التجمع الأول",
    administrationAr: "القاهرة الجديدة",
    governorateAr: "القاهرة",
    addressAr: "الحي العاشر، أمام إدارة حي القاهرة الجديدة",
    phone: "022461906",
    mapsUrl: "https://maps.app.goo.gl/K3npMoGB2pfMJ1T79",
  },
  {
    id: "4",
    centerNameAr: "المعادي",
    administrationAr: "المعادي",
    governorateAr: "القاهرة",
    addressAr: "٧١ ميدان التعاون، المعادي",
    phone: "023583381",
    mapsUrl: "https://maps.app.goo.gl/EF3p4MZdqRPTmBgd7",
  },
  {
    id: "5",
    centerNameAr: "الأسمرات",
    administrationAr: "المقطم",
    governorateAr: "القاهرة",
    addressAr: "مدينة الأسمرات، المقطم، عمارة ٣١، الجوهرة",
    phone: "—",
    mapsUrl: "https://maps.app.goo.gl/ZpzhHY9uyafBYJSE8",
  },
  {
    id: "6",
    centerNameAr: "المحكمة",
    administrationAr: "النزهة",
    governorateAr: "القاهرة",
    addressAr: "٣٢ شارع الحجاز، أمام محكمة مصر الجديدة",
    phone: "026339444",
    mapsUrl: "https://maps.app.goo.gl/hx65ccwcSccVcTV68",
  },
  {
    id: "7",
    centerNameAr: "الست خضرة",
    administrationAr: "حلوان",
    governorateAr: "القاهرة",
    addressAr: "شارع راغب من شارع برهان، حلوان",
    phone: "025567079",
    mapsUrl: "https://maps.app.goo.gl/GsBViG3R4jWCEnEC8",
  },
  {
    id: "8",
    centerNameAr: "عابدين",
    administrationAr: "عابدين",
    governorateAr: "القاهرة",
    addressAr: "١٩٧ شارع التحرير — باب اللوق",
    phone: "022794650",
    mapsUrl: "https://maps.app.goo.gl/fxWPJKWTWStbT9TVA",
  },
  {
    id: "9",
    centerNameAr: "قصر النيل",
    administrationAr: "غرب",
    governorateAr: "القاهرة",
    addressAr:
      "٧ شارع رضا من شارع المبتديان، السيدة زينب، أمام مستشفى المنيرة",
    phone: "023656432",
    mapsUrl: "https://maps.app.goo.gl/9cFZ8Q9NdT7UM5Dz8",
  },
  {
    id: "10",
    centerNameAr: "وحدة صحة مدينة نصر الأولى",
    administrationAr: "شرق مدينة نصر",
    governorateAr: "القاهرة",
    addressAr: "١٤ شارع عمارات رابية، طريق النصر",
    phone: "022613676",
    mapsUrl: "https://maps.app.goo.gl/wjudWLkKY9Gh1uTk6",
  },
  {
    id: "11",
    centerNameAr: "وحدة صحة مدينة نصر الثانية",
    administrationAr: "غرب مدينة نصر",
    governorateAr: "القاهرة",
    addressAr: "الحي السادس، بجوار مستشفى الجراحات اليومية",
    phone: "022620816",
    mapsUrl: "https://maps.app.goo.gl/1e3zKprpU7t41vf49",
  },
  {
    id: "12",
    centerNameAr: "مصر الجديدة (هيليوبوليس)",
    administrationAr: "مصر الجديدة",
    governorateAr: "القاهرة",
    addressAr: "٥٤ شارع الخليفة المأمون، روكسي، مصر الجديدة",
    phone: "—",
    mapsUrl: "https://maps.app.goo.gl/4uMn35iKdE3jnTmA8",
  },
];
