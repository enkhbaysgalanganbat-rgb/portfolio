/*
 * ХЭРЭГ № 001, all site content lives here, in two languages.
 * MN is the original; EN is the same content in English. Edit both when something changes.
 * index.html / data.js / app.js render everything from window.CONTENT (picked by window.LANG, see i18n.js).
 *
 * skills[].level = self-assessed level in % (0-100), shown as progress bars. Keep it honest: it is what HR reads.
 */
(function () {
  var MN = {
    person: {
      name: "Ганбатын Энхбаясгалан",
      caseNo: "001",
      role: "Мэдээллийн системийн менежмент, 3-р курс, СЭЗИС",
      line: "Санаагаа ажилладаг систем болгон хувиргаж, багаа хамт авч явдаг мэдээллийн системийн төслийн менежер болох зорилготой.",
      photo: "assets/photo/mugshot_front.jpg",   // the face used on the board, the ID card and CASE 001
      photoFull: "assets/photo/mugshot.jpg",     // front + profile, shown when the photo is opened
      monogram: "ГЭ",
      born: "Дундговь, Сайнцагаан",
      school: "СЭЗИС, МСМТ, 3-р курс",
    },

    // the "CV" button downloads this file
    cv: { src: "assets/docs/cv.pdf", name: "Enkhbaysgalan_Ganbat_CV.pdf" },

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
        { org: "Оюутны холбоо ТББ", role: "Тэргүүн", when: "2026.09 -", note: "Нийт ~6000 оюутныг төлөөлнө." },
        { org: "Whitehats клуб", role: "Тэргүүн", when: "2025-26", note: "«Итгэмжлэгдсэн клуб» болсон. UFE CS2 Tournament (22 баг), KPMG Mongolia-тай Password Day, M Bank-ны оффис аялал, долоо хоног бүрийн төгсөгчдийн яриа." },
        { org: "Оюутны холбоо", role: "Хүний нөөцийн албан хаагч", when: "2025-26", note: "UFE Networking, Job Fair, Volunteer Fair, Өв соёлын өдөрлөг, төгсөх курсийн урлагийн наадам." },
        { org: "Whitehats клуб", role: "Нарийн бичгийн дарга", when: "2024-25", note: "Кибер аюулгүй байдлын клубийн үйл ажиллагаа." },
        { org: "Deep Learning UB 2025", role: "Сайн дурын ажилтан", when: "2025.06.23-28", note: "LLM ба post-training сэдэвтэй, 100 оролцогчтой арга хэмжээ." },
      ],
    },

    skillGroups: { dev: "Програмчлал, хөгжүүлэлт", data: "Өгөгдөл, шинжилгээ", soft: "Удирдлага, харилцаа" },
    // level: self-assessed %, 0-100
    skills: [
      { id: "html", label: "HTML, CSS, JS", level: 80, group: "dev" },
      { id: "react", label: "React", level: 70, group: "dev" },
      { id: "nextjs", label: "Next.js", level: 60, group: "dev" },
      { id: "rn", label: "React Native, Expo", level: 60, group: "dev" },
      { id: "ts", label: "TypeScript", level: 55, group: "dev" },
      { id: "supabase", label: "Supabase", level: 65, group: "dev" },
      { id: "langs", label: "Java, C#, C++", level: 50, group: "dev" },
      { id: "mssql", label: "MSSQL", level: 60, group: "data" },
      { id: "bigquery", label: "BigQuery", level: 40, group: "data" },
      { id: "eviews", label: "EViews", level: 60, group: "data" },
      { id: "excel", label: "Excel", level: 80, group: "data" },
      { id: "analysis", label: "As-is / To-be шинжилгээ", level: 75, group: "soft" },
      { id: "lead", label: "Баг удирдах", level: 85, group: "soft" },
      { id: "speak", label: "Илтгэл тавих", level: 80, group: "soft" },
    ],

    // `skills` array = the red strings (project <-> skill connections); images = carousel pictures (first one is the cover)
    projects: [
      {
        id: "kadrlink", title: "KadrLink", year: "2026", type: "Вэб + апп", hue: 4, rot: -2,
        desc: "Арга хэмжээний зураг/бичлэгийн зурагчныг захиалах платформ. ДАН / e-Mongolia-аар баталгаажуулалт, цахим гэрээ, 30%/70% төлбөрийн урсгал, AI-аар царай хайх.",
        tech: ["Next.js", "React", "Expo", "Supabase"],
        skills: ["nextjs", "react", "rn", "supabase", "analysis"],
        link: "https://kadr-link.vercel.app",
        repo: "https://github.com/enkhbaysgalanganbat-rgb/KadrLink",
        image: "assets/photo/kadrlink.jpg",
        images: ["assets/photo/kadrlink.jpg", "assets/photo/kadrlink/kl-2.jpg", "assets/photo/kadrlink/kl-3.jpg", "assets/photo/kadrlink/kl-4.jpg", "assets/photo/kadrlink/kl-5.jpg", "assets/photo/kadrlink/kl-6.jpg", "assets/photo/kadrlink/kl-7.jpg", "assets/photo/kadrlink/kl-8.jpg"],
      },
      {
        id: "ism", title: "ISM Digital Museum", year: "2026", type: "Вэб", hue: 200, rot: -1,
        desc: "Мэдээллийн системийн менежментийн дижитал музей: Time Machine, Time Capsule, Technology Evolution хэсгүүдтэй.",
        tech: ["React", "Supabase"],
        skills: ["react", "html", "supabase"],
        link: "https://ism-digital-museum-sooty.vercel.app/",
        repo: "",
        image: "assets/photo/ism.jpg",
        images: ["assets/photo/ism.jpg"],
      },
      {
        id: "econ", title: "Ажилгүйдлийн эконометрик судалгаа", year: "2026", type: "Судалгаа, ЭШБХ-д илтгэсэн", hue: 150, rot: 2,
        desc: "СЭЗИС-ийн «Статистик-2026» оюутны эрдэм шинжилгээний бага хуралд (2026.11.12) 4 хүний багаар илтгэсэн. 2015-2021 оны 28 улирлын өгөгдлөөр ДНБ, инфляц ажилгүйдэлд үзүүлэх нөлөөг 4 регрессийн загвараар үнэлсэн. Гадны цочрол, улирлын дамми хувьсагч нэмснээр R² 0.12-оос 0.59 болж сайжирч, 2026 оны I улирлын ажилгүйдлийг 6.38% гэж таамагласан.",
        tech: ["Excel", "EViews"],
        skills: ["eviews", "excel", "analysis"],
        link: "assets/docs/eshbh-2026.pdf", linkLabel: "Илтгэл (PDF)",
        repo: "",
        image: "assets/photo/econ.jpg",
        images: ["assets/photo/econ.jpg"],
      },
      {
        id: "chatquest", title: "ChatQuest AI", year: "2026", type: "Хакатон төсөл (хувиараа)", hue: 280, rot: 1,
        desc: "Twitch-ийн шууд дамжуулалтын чатаар удирдуулдаг, хиймэл оюунтай адал явдалт тоглоом. AI «Dungeon Master» бүлэг бүрийг бичиж, үзэгчид чатад !1, !2, !3 гэж санал өгнө; хамгийн олон санал авсан сонголтоор түүх үргэлжилнэ. «Codex x TwitchCon Hackathon 2026» (Devpost, 2026.10.31-11.02) олон улсын онлайн хакатонд хувиараа хийж илгээсэн; Devpost-оос 4 тэмдэг авсан.",
        tech: ["Python", "Twitch IRC", "OpenAI API", "FastAPI", "OBS Studio", "Streamlit", "Codex"],
        skills: [],
        link: "",            // Devpost project link (add when you have it)
        repo: "https://github.com/Enku-ai/chatquest-ai",
        image: "assets/photo/chatquest/cq-1.jpg",
        images: ["assets/photo/chatquest/cq-1.jpg", "assets/photo/chatquest/cq-2.jpg", "assets/photo/chatquest/cq-3.jpg", "assets/photo/chatquest/cq-4.jpg", "assets/photo/chatquest/cq-5.jpg", "assets/photo/chatquest/cq-6.jpg"],
      },
      {
        id: "studymate", title: "StudyMate AI", year: "2026", type: "Мобайл апп", hue: 38, rot: 1.5,
        desc: "Суралцахад туслах хиймэл оюунтай Android апп. Хичээлийн төлөвлөгөө, сурах явцаа хянах боломжтой.",
        tech: ["React Native", "Expo", "TypeScript", "Supabase"],
        skills: ["rn", "ts", "supabase"],
        link: "",
        repo: "",
        image: "",
        images: [],
      },
    ],

    awards: [
      { stamp: "1-Р БАЙР", title: "СЭЗИС-ийн аварга шалгаруулах волейболын тэмцээн", when: "2026.03.29", note: "2024-25 оны улиралд мөн аварга болсон." },
      { stamp: "1-Р БАЙР", title: "СЭЗИС-ийн клубүүдийн аварга шалгаруулах волейболын тэмцээн", when: "2026.03.29", note: "29 клуб оролцсон." },
      { stamp: "ТУСГАЙ БАЙР", title: "Student Led 2026, «Evergreen» баг, «Био сав» төсөл", when: "2026.04.03", note: "147 баг, 20 сургуулийн дунд." },
      { stamp: "ИЛТГЭСЭН", title: "«Статистик-2026» эрдэм шинжилгээний бага хурал, СЭЗИС", when: "2026.11.12", note: "Ажилгүйдлийн эконометрик шинжилгээ, багийн төрөл." },
      { stamp: "ОРОЛЦСОН", title: "Codex x TwitchCon Hackathon 2026 (Devpost), «ChatQuest AI»", when: "2026.10.31-11.02", note: "Олон улсын онлайн хакатон, хувийн төрөл. Devpost-ийн тэмдэг: First online hackathon, X Hackathons Level 1, Generalist." },
      { stamp: "ОРОЛЦСОН", title: "СЭЗИС-ийн МСМ тэнхимийн программчлалын олимпиад", when: "2025.04.24", note: "" },
      { stamp: "АЛТ", title: "Элсэгчдийн волейболын тэмцээн", when: "2024", note: "Алтан медаль." },
      { stamp: "2-Р БАЙР", title: "Элсэгчдийн урлагийн наадам", when: "2024", note: "" },
    ],

    // contribution to the school and society, volunteer work
    community: [
      { title: "СЭЗИС-ийн «Оюутны холбоо ТББ»-ын тэргүүн", when: "2026.09.01 -", note: "~6000 оюутныг төлөөлнө." },
      { title: "24 цагийн сайн дурын ажил", when: "2026.11.16-21", note: "СЭЗИС-ийн Эдийн засаг, санхүүгийн албатай хамтран, өөрийн санаачилгаар." },
      { title: "МСМ тэнхимийн «Whitehats» клубийн тэргүүн", when: "2025-2026", note: "Клуб «итгэмжлэгдсэн клуб» болсон." },
      { title: "Оюутны холбооны хүний нөөцийн албан хаагч", when: "2025-2026", note: "UFE Networking, Өв соёлын өдөрлөг, Volunteer Fair, Job Fair, төгсөх курсийн урлагийн наадам." },
      { title: "«Deep Learning UB 2025» сайн дурын ажилтан", when: "2025.06.23-28", note: "LLM, post-training сэдэвтэй, 100 оролцогч." },
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
     * Interview notes inside the folders. [question, answer]; an empty answer is not shown.
     * `note` = the detective's handwritten line on the inside cover. data.js decides which folder shows which block.
     */
    interview: {
      who: { note: "Ажил хийвэл дуустал, давс хийвэл уустал.", qa: [
        ["Өөрийгөө хэдэн үгээр тодорхойлбол?", "Хичээнгүй, олон талт, сониуч. Ажил хийвэл дуустал, давс хийвэл уустал."],
        ["Хүмүүс таныг юугаар нь санадаг вэ?", "Даруу төлөв байдал, үлдээсэн анхны сэтгэгдлээр минь санадаг."] ] },
      edu: { note: "Санхүү, бизнес, технологи нэг дор.", qa: [
        ["Яагаад Мэдээллийн системийн менежмент мэргэжлийг сонгосон бэ?", "Санхүү, бизнес, технологийн мэдлэгийг нэг дор, сайн эзэмших боломжтой гэж бодсон учраас сонгосон."],
        ["Хичээлдээ хэрхэн ханддаг вэ? Энэ семестрт аль нь хамгийн сонирхолтой байна?", "Бүх хичээлдээ сонирхолтой, бүгдэд нь маш их ач холбогдол өгч хийхийг хичээдэг. Энэ семестрийн хичээлүүдээс Интернэт программчлал, Business Intelligence, Мэдээллийн системийн дэд бүтэц хамгийн сонирхолтой байна."],
        ["Ерөнхий боловсролын сургуульд юугаараа ялгардаг байсан бэ?", "Олимпиадуудад их ордог байсан. Улсын болон бүсийн математик, физикийн олимпиадуудад олон удаа оролцсон. Сүүлийн 2 жил математик, физикийн төрөлжсөн олимпиадад түрүүлж, улсад оролцох эрх авч, улсын тэмцээнүүдэд амжилттай оролцсон."] ] },
      learn: { note: "Сураад сураад ханашгүй.", qa: [
        ["Шинэ программчлалын хэлийг хэрхэн сурдаг вэ?", "Ерөнхий логик, синтаксийн ялгааг ойлгоход л цаг зарцуулчихвал бүх хэлийг маш хурдан сурч болно гэж боддог."],
        ["Бусад технологийн хувьд?", "Сониуч зан минь байгаа цагт сурах хүсэл эрмэлзэл дотроос оргилж байдаг. Тиймээс бүгдийг сонирхож судалдаг. Технологи тасралтгүй хөгжиж байгаа учраас бид бүгд сураад сураад ханашгүй."] ] },
      proj: { note: "Амьдрал дээр хэрэгжвэл яаж ажиллах вэ?", qa: [
        ["KadrLink-ийн санаа хаанаас төрсөн бэ?", "Зураг дарах хүсэл минь, мөн арга хэмжээ (event) үүсгэх нэгдсэн платформ хэрэгжих боломжтой юм байна гэж бодсоноос гарсан."],
        ["Төсөлд таны үүрэг юу байсан бэ?", "Төслийн менежер."],
        ["Төслүүдээсээ юу сурсан бэ?", "Аюулгүй байдал болон үндсэн логик маш чухал. Амьдрал дээр хэрэгжүүлэхэд ямар байх вэ гэдэг дээр маш их анхаарах хэрэгтэй гэдгийг ойлгосон."] ] },
      sport: { note: "Баг бол итгэлцэл.", qa: [
        ["Волейболыг хэзээнээс тоглож байна вэ?", "9-р ангиасаа хойш тоглож байна. Аймаг, нийслэл, бүс, улсын чанартай тэмцээнүүдэд амжилттай оролцож байсан."],
        ["Волейболоос юу сурсан бэ?", "Баг хамт олны уур амьсгал, итгэлцэл чухал гэдгийг ойлгосон."] ] },
      future: { note: "Монголд 5 жил ажиллаад гадаадад магистр.", qa: [
        ["Ирээдүйн төлөвлөгөө тань юу вэ?", "Сургуулиа төгсөөд Монголдоо 5 жил ажиллаж туршлага хуримтлуулна. Дараа нь гадаад улсад магистраар суралцах төлөвлөгөөтэй."] ] },
    },
  };

  var EN = {
    person: {
      name: "Enkhbaysgalan Ganbat",
      caseNo: "001",
      role: "Information Systems Management, 3rd year, UFE",
      line: "Aiming to become an information systems project manager who turns ideas into working systems and brings the team along.",
      photo: MN.person.photo,
      photoFull: MN.person.photoFull,
      monogram: "EG",
      born: "Dundgovi, Saintsagaan",
      school: "UFE, ISM, 3rd year",
    },

    cv: MN.cv,

    about: {
      text: [
        "Born in Saintsagaan soum, Dundgovi province. Graduated from Tsegtsbilig school (mathematics track) in 2024; now studying Information Systems Management at the University of Finance and Economics (UFE).",
        "Goal: to become an information systems project manager. So besides writing code I also train systems analysis (As-is / To-be), team organisation and public speaking.",
        "In my free time I play volleyball (1st-grade sports ranking).",
      ],
      facts: [
        ["School", "UFE, ISM, 2024-2028"],
        ["Born in", "Saintsagaan, Dundgovi"],
        ["Goal", "Information systems project manager"],
        ["Hobby", "Volleyball"],
        ["English", "B1"],
      ],
      stats: [
        { n: 43, prefix: "", label: "Whitehats club members" },
        { n: 130, prefix: "", label: "UFE CS2 Tournament players (22 teams)" },
        { n: 6000, prefix: "~", label: "students represented by the Student Union" },
        { n: 28, prefix: "", label: "observations in the econometrics study" },
      ],
      leadership: [
        { org: "UFE Student Union NGO", role: "President", when: "2026.09 -", note: "Represents about 6,000 students." },
        { org: "Whitehats club", role: "President", when: "2025-26", note: "Became an accredited club. UFE CS2 Tournament (22 teams), Password Day with KPMG Mongolia, office visit to M Bank, weekly alumni talks." },
        { org: "Student Union", role: "HR officer", when: "2025-26", note: "UFE Networking, Job Fair, Volunteer Fair, Heritage Day, graduates’ art festival." },
        { org: "Whitehats club", role: "Secretary", when: "2024-25", note: "Activities of the cyber security club." },
        { org: "Deep Learning UB 2025", role: "Volunteer", when: "2025.06.23-28", note: "Summer school on LLMs and post-training, 100 participants." },
      ],
    },

    skillGroups: { dev: "Programming, development", data: "Data, analysis", soft: "Leadership, communication" },
    skills: MN.skills.map(function (s) {
      var en = { analysis: "As-is / To-be analysis", lead: "Team leadership", speak: "Public speaking" };
      return { id: s.id, label: en[s.id] || s.label, level: s.level, group: s.group };
    }),

    projects: [
      {
        id: "kadrlink", title: "KadrLink", year: "2026", type: "Web + app", hue: 4, rot: -2,
        desc: "A platform for booking event photographers and videographers: identity check with DAN / e-Mongolia, e-contracts, a 30% / 70% payment flow and AI face search.",
        tech: ["Next.js", "React", "Expo", "Supabase"], skills: ["nextjs", "react", "rn", "supabase", "analysis"],
        link: "https://kadr-link.vercel.app", repo: "https://github.com/enkhbaysgalanganbat-rgb/KadrLink",
        image: "assets/photo/kadrlink.jpg", images: MN.projects[0].images,
      },
      {
        id: "ism", title: "ISM Digital Museum", year: "2026", type: "Web", hue: 200, rot: -1,
        desc: "A digital museum of Information Systems Management with Time Machine, Time Capsule and Technology Evolution sections.",
        tech: ["React", "Supabase"], skills: ["react", "html", "supabase"],
        link: "https://ism-digital-museum-sooty.vercel.app/", repo: "",
        image: "assets/photo/ism.jpg", images: ["assets/photo/ism.jpg"],
      },
      {
        id: "econ", title: "Econometrics of unemployment", year: "2026", type: "Research, conference talk", hue: 150, rot: 2,
        desc: "Presented by our team of four at UFE’s “Statistics-2026” student research conference (2026.11.12). Using 28 quarterly observations (2015-2021) we estimated the effect of GDP and inflation on unemployment with 4 regression models. Adding external-shock and seasonal dummies raised R² from 0.12 to 0.59; the model forecasts 6.38% unemployment for 2026 Q1.",
        tech: ["Excel", "EViews"], skills: ["eviews", "excel", "analysis"],
        link: "assets/docs/eshbh-2026.pdf", linkLabel: "Slides (PDF, in Mongolian)", repo: "",
        image: "assets/photo/econ.jpg", images: ["assets/photo/econ.jpg"],
      },
      {
        id: "chatquest", title: "ChatQuest AI", year: "2026", type: "Hackathon project (solo)", hue: 280, rot: 1,
        desc: "An AI adventure game played through a Twitch live-stream chat. An AI “Dungeon Master” writes each chapter and viewers vote in chat with !1, !2 or !3; the winning choice drives the story. Built solo for the international online “Codex x TwitchCon Hackathon 2026” (Devpost, 2026.10.31-11.02); earned 4 Devpost badges.",
        tech: MN.projects[3].tech, skills: MN.projects[3].skills, link: MN.projects[3].link, repo: MN.projects[3].repo, image: MN.projects[3].image, images: MN.projects[3].images,
      },
      {
        id: "studymate", title: "StudyMate AI", year: "2026", type: "Mobile app", hue: 38, rot: 1.5,
        desc: "An Android study helper with AI: plan your lessons and track your learning progress.",
        tech: ["React Native", "Expo", "TypeScript", "Supabase"], skills: ["rn", "ts", "supabase"],
        link: MN.projects[4].link, repo: MN.projects[4].repo, image: MN.projects[4].image, images: MN.projects[4].images,
      },
    ],

    awards: [
      { stamp: "1ST PLACE", title: "UFE volleyball championship", when: "2026.03.29", note: "Also champion in the 2024-25 season." },
      { stamp: "1ST PLACE", title: "UFE inter-club volleyball championship", when: "2026.03.29", note: "29 clubs took part." },
      { stamp: "SPECIAL PRIZE", title: "Student Led 2026, team “Evergreen”, project “Bio Sav”", when: "2026.04.03", note: "Among 147 teams from 20 schools." },
      { stamp: "PRESENTED", title: "“Statistics-2026” research conference, UFE", when: "2026.11.12", note: "Econometric analysis of unemployment, team entry." },
      { stamp: "TOOK PART", title: "Codex x TwitchCon Hackathon 2026 (Devpost), “ChatQuest AI”", when: "2026.10.31-11.02", note: "International online hackathon, solo entry. Devpost badges: First online hackathon, X Hackathons Level 1, Generalist." },
      { stamp: "TOOK PART", title: "UFE ISM department programming olympiad", when: "2025.04.24", note: "" },
      { stamp: "GOLD", title: "Freshmen volleyball tournament", when: "2024", note: "Gold medal." },
      { stamp: "2ND PLACE", title: "Freshmen art festival", when: "2024", note: "" },
    ],

    community: [
      { title: "President, UFE Student Union NGO", when: "2026.09.01 -", note: "Represents about 6,000 students." },
      { title: "24 hours of volunteer work", when: "2026.11.16-21", note: "With UFE’s Economics and Finance Office, on my own initiative." },
      { title: "President, “Whitehats” club of the ISM department", when: "2025-2026", note: "The club became accredited." },
      { title: "HR officer, Student Union", when: "2025-2026", note: "UFE Networking, Heritage Day, Volunteer Fair, Job Fair, graduates’ art festival." },
      { title: "Volunteer, “Deep Learning UB 2025”", when: "2025.06.23-28", note: "AI summer school on LLMs and post-training, 100 participants." },
    ],

    timeline: [
      { when: "2012-2024", title: "Tsegtsbilig school", note: "Dundgovi. Mathematics track." },
      { when: "2024", title: "UFE, ISM", note: "Started Information Systems Management." },
      { when: "2024-25", title: "Whitehats secretary", note: "Also a barista at Barley Bites." },
      { when: "2025", title: "Deep Learning UB", note: "Volunteer, 100 participants." },
      { when: "2025-26", title: "Whitehats club president", note: "Student Union HR officer." },
      { when: "2026", title: "Student Union NGO president", note: "Special prize at Student Led with “Bio Sav”." },
    ],

    video: MN.video,
    song: MN.song,
    contact: MN.contact,

    interview: {
      who: { note: "Finish what you start.", qa: [
        ["Describe yourself in a few words.", "Diligent, versatile, curious. If I start something, I finish it."],
        ["What do people remember you by?", "My calm, modest manner and the first impression I leave."] ] },
      edu: { note: "Finance, business and technology in one.", qa: [
        ["Why did you choose Information Systems Management?", "Because it lets me learn finance, business and technology together, and learn them well."],
        ["How do you approach your studies? Which course is the most interesting this semester?", "I find all my courses interesting and try to give each one real attention. This semester the most interesting are Internet Programming, Business Intelligence and Information Systems Infrastructure."],
        ["What made you stand out at school?", "Olympiads. I took part many times in national and regional mathematics and physics olympiads; in my last two years I won the specialised maths and physics olympiads, qualified for the national round and competed there successfully."] ] },
      learn: { note: "There is always more to learn.", qa: [
        ["How do you learn a new programming language?", "Once you spend the time to understand the general logic and the syntax differences, any language can be learned quickly."],
        ["And other technologies?", "As long as I stay curious, the wish to learn comes from inside, so I look into everything. Technology keeps moving, so none of us ever finishes learning."] ] },
      proj: { note: "How would it work in real life?", qa: [
        ["Where did the idea for KadrLink come from?", "From my love of taking photos, and from seeing that a single platform for creating events could really work."],
        ["What was your role in the project?", "Project manager."],
        ["What did your projects teach you?", "Security and the core logic matter most. You have to think hard about how it will work once it is used in real life."] ] },
      sport: { note: "A team is trust.", qa: [
        ["Since when have you played volleyball?", "Since 9th grade. I have played in provincial, city, regional and national tournaments."],
        ["What did volleyball teach you?", "That the team spirit and trust between people matter."] ] },
      future: { note: "5 years in Mongolia, then a master’s abroad.", qa: [
        ["What are your plans?", "After graduating I will work in Mongolia for 5 years to gain experience, then study for a master’s degree abroad."] ] },
    },
  };

  window.CONTENT_MN = MN;
  window.CONTENT_EN = EN;
  window.CONTENT = window.LANG === "en" ? EN : MN;
})();
