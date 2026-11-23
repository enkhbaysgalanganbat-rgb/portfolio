/*
 * ХЭРЭГ № 001, all site content lives here.
 * Edit this file only; index.html / app.js render everything from it.
 */
window.CONTENT = {
  person: {
    name: "Ганбатын Энхбаясгалан",
    caseNo: "001",
    role: "Мэдээллийн системийн менежмент, 3-р курс, СЭЗИС",
    line: "Санаагаа ажилладаг систем болгон хувиргаж, багаа хамт авч явдаг мэдээллийн системийн төслийн менежер болох зорилготой.",
    photo: "assets/photo/mugshot_front.jpg",   // the face used on the board, the ID card and CASE 001
    photoFull: "assets/photo/mugshot.jpg",     // front + profile, shown when the photo is opened
    monogram: "ГЭ",
  },

  about: {
    text: [
      "Дундговь аймгийн Сайнцагаан суманд төрсөн. «Цэгцбилиг» сургуулийн математикийн чиглэлээр 2024 онд төгсөж, СЭЗИС-д Мэдээллийн системийн менежментээр суралцаж байна.",
      "Зорилго, мэдээллийн системийн төслийн менежер болох. Тиймээс код бичихээс гадна системийн шинжилгээ (As-is / To-be), багийн зохион байгуулалт, илтгэл тавихыг хамт хөгжүүлдэг.",
      "Чөлөөт цагаараа волейбол тоглодог (спортын 1-р зэрэгтэй).",
    ],
    facts: [
      ["Сургууль", "СЭЗИС, МСМТ, 2024-2028"],
      ["Төрсөн газар", "Дундговь, Сайнцагаан сум"],
      ["Зорилго", "Мэдээллийн системийн төслийн менежер"],
      ["Хобби", "Волейбол"],
      ["Англи хэл", "B1"],
    ],
    stats: [
      { n: 43, prefix: "", label: "Whitehats клубийн гишүүн" },
      { n: 130, prefix: "", label: "UFE CS2 Tournament-ын тамирчин (22 баг)" },
      { n: 6000, prefix: "~", label: "Оюутны холбооны төлөөлөх оюутан" },
      { n: 28, prefix: "", label: "Эконометрик судалгааны ажиглалт" },
    ],
    leadership: [
      { org: "Оюутны холбоо ТББ", role: "Тэргүүн", when: "2026 -", note: "Нийт ~6000 оюутныг төлөөлнө." },
      { org: "Whitehats клуб", role: "Тэргүүн", when: "2025-26", note: "«Итгэмжлэгдсэн клуб» болсон. UFE CS2 Tournament (22 баг), KPMG Mongolia-тай Password Day, M Bank-ны оффис аялал, долоо хоног бүрийн төгсөгчдийн яриа." },
      { org: "Оюутны холбоо", role: "Хүний нөөцийн албан хаагч", when: "2025-26", note: "UFE Networking, Job Fair, Volunteer Fair, Өв соёлын өдөрлөг, төгсөх ангийн урлагийн наадам." },
      { org: "Whitehats клуб", role: "Нарийн бичгийн дарга", when: "2024-25", note: "Кибер аюулгүй байдлын клубийн үйл ажиллагаа." },
      { org: "Deep Learning UB 2025", role: "Сайн дурын ажилтан", when: "2025.06.23-28", note: "LLM ба post-training сэдэвтэй, 100 оролцогчтой арга хэмжээ." },
    ],
  },

  skills: [
    { id: "html", label: "HTML, CSS, JS" },
    { id: "react", label: "React" },
    { id: "nextjs", label: "Next.js" },
    { id: "rn", label: "React Native, Expo" },
    { id: "ts", label: "TypeScript" },
    { id: "supabase", label: "Supabase" },
    { id: "mssql", label: "MSSQL" },
    { id: "bigquery", label: "BigQuery" },
    { id: "eviews", label: "EViews" },
    { id: "excel", label: "Excel" },
    { id: "langs", label: "Java, C#, C++" },
    { id: "analysis", label: "As-is / To-be шинжилгээ" },
    { id: "lead", label: "Баг удирдах" },
    { id: "speak", label: "Илтгэл тавих" },
  ],

  // `skills` array = the red strings (project <-> skill connections)
  projects: [
    {
      id: "kadrlink", title: "KadrLink", year: "2026", type: "Вэб + апп", hue: 4, rot: -2,
      desc: "Арга хэмжээний зураг/бичлэгийн зурагчныг захиалах платформ. ДАН / e-Mongolia-аар баталгаажуулалт, цахим гэрээ, 30%/70% төлбөрийн урсгал, AI-аар царай хайх.",
      tech: ["Next.js", "React", "Expo", "Supabase"],
      skills: ["nextjs", "react", "rn", "supabase", "analysis"],
      link: "https://kadr-link.vercel.app",
      repo: "https://github.com/enkhbaysgalanganbat-rgb/KadrLink",
      image: "assets/photo/kadrlink.jpg",
    },
    {
      id: "studymate", title: "StudyMate AI", year: "2026", type: "Мобайл апп", hue: 38, rot: 1.5,
      desc: "Суралцахад туслах хиймэл оюунтай Android апп. Хичээлийн төлөвлөгөө, сурах явцаа хянах боломжтой.",
      tech: ["React Native", "Expo", "TypeScript", "Supabase"],
      skills: ["rn", "ts", "supabase"],
      link: "",
      repo: "",
      image: "",
    },
    {
      id: "ism", title: "ISM Digital Museum", year: "2026", type: "Вэб", hue: 200, rot: -1,
      desc: "Мэдээллийн системийн менежментийн дижитал музей: Time Machine, Time Capsule, Technology Evolution хэсгүүдтэй.",
      tech: ["React", "Supabase"],
      skills: ["react", "html", "supabase"],
      link: "https://ism-digital-museum-sooty.vercel.app/",
      repo: "",
      image: "assets/photo/ism.jpg", // screenshot; hidden automatically until the file exists
    },
    {
      id: "econ", title: "Ажилгүйдлийн эконометрик судалгаа", year: "2026", type: "Судалгаа, ЭШБХ-д илтгэсэн", hue: 150, rot: 2,
      desc: "СЭЗИС-ийн «Статистик-2026» оюутны эрдэм шинжилгээний бага хуралд (2026.11.12) 4 хүний багаар илтгэсэн. 2015-2021 оны 28 улирлын өгөгдлөөр ДНБ, инфляц ажилгүйдэлд үзүүлэх нөлөөг 4 регрессийн загвараар үнэлсэн. Гадны цочрол, улирлын дамми хувьсагч нэмснээр R² 0.12-оос 0.59 болж сайжирч, 2026 оны I улирлын ажилгүйдлийг 6.38% гэж таамагласан.",
      tech: ["Excel", "EViews"],
      skills: ["eviews", "excel", "analysis"],
      link: "assets/docs/eshbh-2026.pdf", linkLabel: "Илтгэл (PDF)",
      repo: "",
      image: "assets/photo/econ.jpg",
    },
  ],

  awards: [
    { stamp: "1-Р БАЙР", title: "СЭЗИС-ийн волейболын аварга", when: "2024-25, 2025-26", note: "Хоёр улирал дараалан." },
    { stamp: "1-Р БАЙР", title: "29 клубийн волейболын тэмцээн", when: "2026", note: "Клубүүдийн хоорондын тэмцээн." },
    { stamp: "АЛТ", title: "Элсэгчдийн волейболын тэмцээн", when: "2024", note: "Алтан медаль." },
    { stamp: "2-Р БАЙР", title: "Элсэгчдийн урлагийн наадам", when: "2024", note: "" },
    { stamp: "ТУСГАЙ БАЙР", title: "Student Led 2026, «Био сав»", when: "2026", note: "147 баг, 20 сургуулийн дунд." },
    { stamp: "ИЛТГЭСЭН", title: "«Статистик-2026» оюутны ЭШБХ, СЭЗИС", when: "2026.11", note: "Ажилгүйдлийн эконометрик судалгаа, 4 хүний баг." },
    { stamp: "ОРОЛЦСОН", title: "СЭЗИС-ийн программчлалын олимпиад", when: "2025", note: "" },
  ],

  timeline: [
    { when: "2012-2024", title: "«Цэгцбилиг» сургууль", note: "Дундговь. Математикийн чиглэл." },
    { when: "2024", title: "СЭЗИС, МСМТ", note: "Мэдээллийн системийн менежментээр суралцаж эхэлсэн." },
    { when: "2024-25", title: "Whitehats нарийн бичгийн дарга", note: "Мөн Barley Bites-д бариста." },
    { when: "2025", title: "Deep Learning UB", note: "Сайн дурын ажилтан, 100 оролцогч." },
    { when: "2025-26", title: "Whitehats клубийн тэргүүн", note: "Оюутны холбооны HR албан хаагч." },
    { when: "2026", title: "Оюутны холбоо ТББ-ын тэргүүн", note: "Student Led-д «Био сав» төслөөр тусгай байр эзэлсэн." },
  ],

  // the tape on the desk plays this on the old TV. Replace the file (same name) with your own video, or change the path.
  video: "assets/video/me.mp4",
  // the second tape: Bach, Toccata and Fugue in D minor (BWV 565, public domain), opening synthesized as an organ clip in code
  song: { src: "assets/audio/song.mp3", start: 0, length: 8.5, artist: "J. S. Bach", title: "Toccata d-moll" },

  contact: {
    // Empty value = card is hidden. Do NOT put a home address here.
    email: "enkhbaysgalanganbat@gmail.com",
    phone: "",
    github: "https://github.com/enkhbaysgalanganbat-rgb",
    linkedin: "",
    facebook: "",
  },

  /*
   * CASE folders (байцаалтын тэмдэглэл) are written ONLY from these answers.
   * [question, answer], an empty answer is not shown. `note` = the detective's handwritten line on the inside cover.
   */
  interview: {
    c1: { note: "Ажил хийвэл дуустал, давс хийвэл уустал.", qa: [
      ["Өөрийгөө хэдэн үгээр тодорхойлбол?", "Хичээнгүй, олон талт, сониуч. Ажил хийвэл дуустал, давс хийвэл уустал."],
      ["Хүмүүс таныг юугаар нь санадаг вэ?", "Даруу төлөв байдал, үлдээсэн анхны сэтгэгдлээр минь санадаг."] ] },
    c2: { note: "Санхүү, бизнес, технологи нэг дор.", qa: [
      ["Яагаад Мэдээллийн системийн менежмент мэргэжлийг сонгосон бэ?", "Санхүү, бизнес, технологийн мэдлэгийг нэг дор, сайн эзэмших боломжтой гэж бодсон учраас сонгосон."],
      ["Хичээлдээ хэрхэн ханддаг вэ? Энэ семестрт аль нь хамгийн сонирхолтой байна?", "Бүх хичээлдээ сонирхолтой, бүгдэд нь маш их ач холбогдол өгч хийхийг хичээдэг. Энэ семестрийн хичээлүүдээс Интернэт программчлал, Business Intelligence, Мэдээллийн системийн дэд бүтэц хамгийн сонирхолтой байна."],
      ["Ерөнхий боловсролын сургуульд юугаараа ялгардаг байсан бэ?", "Олимпиадуудад их ордог байсан. Улсын болон бүсийн математик, физикийн олимпиадуудад олон удаа оролцсон. Сүүлийн 2 жил математик, физикийн төрөлжсөн олимпиадад түрүүлж, улсад оролцох эрх авч, улсын тэмцээнүүдэд амжилттай оролцсон."] ] },
    c3: { note: "Сураад сураад ханашгүй.", qa: [
      ["Шинэ программчлалын хэлийг хэрхэн сурдаг вэ?", "Ерөнхий логик, синтаксийн ялгааг ойлгоход л цаг зарцуулчихвал бүх хэлийг маш хурдан сурч болно гэж боддог."],
      ["Бусад технологийн хувьд?", "Сониуч зан минь байгаа цагт сурах хүсэл эрмэлзэл дотроос оргилж байдаг. Тиймээс бүгдийг сонирхож судалдаг. Технологи тасралтгүй хөгжиж байгаа учраас бид бүгд сураад сураад ханашгүй."] ] },
    c4: { note: "Амьдрал дээр хэрэгжвэл яаж ажиллах вэ?", qa: [
      ["KadrLink-ийн санаа хаанаас төрсөн бэ?", "Зураг дарах хүсэл минь, мөн арга хэмжээ (event) үүсгэх нэгдсэн платформ хэрэгжих боломжтой юм байна гэж бодсоноос гарсан."],
      ["Төсөлд таны үүрэг юу байсан бэ?", "Төслийн менежер."],
      ["Төслүүдээсээ юу сурсан бэ?", "Аюулгүй байдал болон үндсэн логик маш чухал. Амьдрал дээр хэрэгжүүлэхэд ямар байх вэ гэдэг дээр маш их анхаарах хэрэгтэй гэдгийг ойлгосон."] ] },
    c5: { note: "Баг бол итгэлцэл.", qa: [
      ["Волейболыг хэзээнээс тоглож байна вэ?", "9-р ангиасаа хойш тоглож байна. Аймаг, нийслэл, бүс, улсын чанартай тэмцээнүүдэд амжилттай оролцож байсан."],
      ["Волейболоос юу сурсан бэ?", "Баг хамт олны уур амьсгал, итгэлцэл чухал гэдгийг ойлгосон."] ] },
    c6: { note: "Монголд 5 жил ажиллаад гадаадад магистр.", qa: [
      ["Ирээдүйн төлөвлөгөө тань юу вэ?", "Сургуулиа төгсөөд Монголдоо 5 жил ажиллаж туршлага хуримтлуулна. Дараа нь гадаад улсад магистраар суралцах төлөвлөгөөтэй."] ] },
  },
};
