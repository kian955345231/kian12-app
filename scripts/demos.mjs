/**
 * scripts/demos.mjs  DEV DATA (not part of the sold package)
 *
 * Single source of truth for demo metadata. Consumed by:
 *   - scripts/gen-art.mjs   (generates each demo's in-palette SVG artwork)
 *   - scripts/shots.mjs     (screenshot capture)
 *   - scripts/build-showcase.mjs (the sales page)
 *   - docs/style-guide.md   (kept in sync by hand)
 *
 * Palette keys mirror the CSS token contract in core/css/core.css.
 *
 * mood   which mode the demo is designed in  drives the showcase filter
 * icon   symbol id from core/assets/icons/sprite.svg (the package's own set)
 * chips  three signature traits, shown on the showcase card
 */

export const demos = [
  {
    slug: '01-web-developer',
    mood: 'dark',
    icon: 'terminal',
    chips: ['تیره‌محور', 'پنل کد زنده', 'شبکه فعالیت'],
    fa: 'توسعه‌دهنده وب',
    en: 'Web Developer',
    person: 'آرش رستمی',
    role: 'توسعه‌دهنده فول‌استک',
    archetype: 'A  هیروی دوستونه با ناوبری چسبان',
    style: 'تیره‌محور، فنی، با المان‌های کدمحور',
    desc: 'تم تیره‌محور با پنل کد زنده، شبکه فعالیت و استک فناوری  برای برنامه‌نویسانی که کارشان را با زبان خودشان نشان می‌دهند.',
    palette: {
      primary: '#3ddc84',
      strong: '#2bc46f',
      accent: '#22d3ee',
      ink: '#070a12',
      surface: '#10141f',
      light: '#f4f7fb'
    }
  },
  {
    slug: '02-app-developer',
    mood: 'light',
    icon: 'smartphone',
    chips: ['موبایل‌فرست', 'ماک‌آپ گوشی', 'بج استور'],
    fa: 'توسعه‌دهنده اپلیکیشن',
    en: 'App Developer',
    person: 'سارا کیانی',
    role: 'توسعه‌دهنده موبایل',
    archetype: 'D  پوسته اپلیکیشن، کارت‌محور',
    style: 'تمیز و مینیمال با حس رابط موبایل',
    desc: 'چیدمان موبایل‌فرست با گالری اسکرین اپ، فهرست قابلیت‌ها و دکمه‌های فروشگاه  مینیمال و روشن.',
    palette: {
      primary: '#5b5bd6',
      strong: '#4a48c4',
      accent: '#f472b6',
      ink: '#141329',
      surface: '#f6f6fd',
      light: '#ffffff'
    }
  },
  {
    slug: '03-ui-ux-designer',
    mood: 'light',
    icon: 'palette',
    chips: ['بنتوی نامتقارن', 'تایپ درشت', 'مطالعه موردی'],
    fa: 'طراح رابط و تجربه کاربری',
    en: 'UI/UX Designer',
    person: 'نیلوفر عابدی',
    role: 'طراح محصول',
    archetype: 'E  شبکه بنتوی نامتقارن',
    style: 'خلاق و رنگی با فضای سفید زیاد',
    desc: 'شبکه بنتوی نامتقارن، کارت‌های مطالعه موردی و ریل فرایند طراحی  تایپوگرافی درشت و فضای نفس‌کشیدن.',
    palette: {
      primary: '#7c3aed',
      strong: '#6828db',
      accent: '#2dd4bf',
      ink: '#1a1030',
      surface: '#faf7ff',
      light: '#ffffff'
    }
  },
  {
    slug: '04-lawyer',
    mood: 'light',
    icon: 'scale',
    chips: ['تحریریه‌ای', 'سرمه‌ای و طلایی', 'تایم‌لاین سوابق'],
    fa: 'وکیل دادگستری',
    en: 'Lawyer',
    person: 'دکتر مهدی صادقی',
    role: 'وکیل پایه یک دادگستری',
    archetype: 'B  تحریریه‌ای و متقارن',
    style: 'کلاسیک، معتبر، سرمه‌ای و طلایی',
    desc: 'طراحی کلاسیک و متقارن با حوزه‌های تخصص، سوابق پرونده و مدارک  لحن رسمی و قابل اعتماد.',
    palette: {
      primary: '#c9a227',
      strong: '#ad8a1a',
      accent: '#8fa6c4',
      ink: '#0e1a2b',
      surface: '#f6f4ee',
      light: '#fffdf8'
    }
  },
  {
    slug: '05-doctor',
    mood: 'light',
    icon: 'stethoscope',
    chips: ['هیروی تمام‌عرض', 'فرم نوبت‌دهی', 'ساعات کلینیک'],
    fa: 'پزشک متخصص',
    en: 'Doctor',
    person: 'دکتر شیوا نادری',
    role: 'متخصص قلب و عروق',
    archetype: 'C  هیروی تمام‌عرض',
    style: 'آرام و پاک، آبی ملایم و مینت',
    desc: 'هیروی تمام‌عرض با نوبت‌دهی، ساعات کلینیک و تخصص‌ها  رنگ‌های آرام برای انتقال حس اعتماد و سلامت.',
    palette: {
      primary: '#0ea5a5',
      strong: '#0b8a8a',
      accent: '#4ade80',
      ink: '#082f38',
      surface: '#eef8f8',
      light: '#ffffff'
    }
  },
  {
    slug: '06-consultant',
    mood: 'light',
    icon: 'chart',
    chips: ['داده‌محور', 'نوار شاخص‌ها', 'فرایند همکاری'],
    fa: 'مشاور کسب‌وکار',
    en: 'Consultant',
    person: 'کامران فرهادی',
    role: 'مشاور استراتژی',
    archetype: 'A  هیروی دوستونه، داده‌محور',
    style: 'سنگین و حرفه‌ای، گرافیت و کهربایی',
    desc: 'نوار شاخص‌های کلیدی، فرایند همکاری و مطالعات موردی عددی  طراحی جدی و نتیجه‌محور.',
    palette: {
      primary: '#f59e0b',
      strong: '#d97f06',
      accent: '#38bdf8',
      ink: '#171a1f',
      surface: '#f4f5f7',
      light: '#ffffff'
    }
  },
  {
    slug: '07-entrepreneur',
    mood: 'light',
    icon: 'rocket',
    chips: ['بنتوی جسور', 'خط زمانی', 'خبرنامه'],
    fa: 'کارآفرین',
    en: 'Entrepreneur',
    person: 'رها موسوی',
    role: 'بنیان‌گذار و سرمایه‌گذار',
    archetype: 'E  بنتوی جسورانه',
    style: 'پرانرژی و جسور، نارنجی و بنفش',
    desc: 'شبکه بنتوی پرانرژی با کسب‌وکارها، خط زمانی نقاط عطف و آمار رشد  رنگ‌های گرم و جسور.',
    palette: {
      primary: '#f2632a',
      strong: '#d9501a',
      accent: '#7c3aed',
      ink: '#1c1024',
      surface: '#fdf4ef',
      light: '#ffffff'
    }
  },
  {
    slug: '08-content-writer',
    mood: 'light',
    icon: 'pen',
    chips: ['تایپوگرافیک', 'ستون خوانا', 'منتشرشده در'],
    fa: 'نویسنده محتوا',
    en: 'Content Writer',
    person: 'یاسمن رحیمی',
    role: 'نویسنده و ویراستار',
    archetype: 'B  تایپوگرافیک، خوانایی حداکثری',
    style: 'کرم گرم و آجری، تمرکز بر تایپوگرافی',
    desc: 'چیدمان تایپوگرافیک با ستون خوانا، نوار «منتشرشده در» و نمونه مقالات  آرام و کتاب‌مانند.',
    palette: {
      primary: '#b4471f',
      strong: '#963813',
      accent: '#3f6f5f',
      ink: '#2a1d15',
      surface: '#faf5ec',
      light: '#fffdf9'
    }
  },
  {
    slug: '09-freelancer',
    mood: 'light',
    icon: 'user',
    chips: ['صمیمی', 'بسته‌های قیمت', 'مراحل همکاری'],
    fa: 'فریلنسر',
    en: 'Freelancer',
    person: 'پویا صمدی',
    role: 'فریلنسر چندتخصصی',
    archetype: 'D  صمیمی و شخصی',
    style: 'مرجانی و شنی، دوستانه و روایت‌محور',
    desc: 'روایت شخصی، بسته‌های قیمت‌گذاری و مراحل همکاری  لحن صمیمی و رنگ‌های گرم و در دسترس.',
    palette: {
      primary: '#ff6b5b',
      strong: '#e8503f',
      accent: '#2c9c8f',
      ink: '#241a18',
      surface: '#fdf3ee',
      light: '#ffffff'
    }
  },
  {
    slug: '10-actor',
    mood: 'dark',
    icon: 'film',
    chips: ['سینمایی', 'نماهنگ معرفی', 'گالری موزاییکی'],
    fa: 'بازیگر',
    en: 'Actor',
    person: 'دنیا آرام',
    role: 'بازیگر سینما و تئاتر',
    archetype: 'C  تمام‌عرض دراماتیک',
    style: 'تقریباً مشکی و قرمز خونی، سینمایی',
    desc: 'هیروی سینمایی تمام‌صفحه با نماهنگ معرفی، کارنامه آثار و گالری تصاویر  تیره، دراماتیک و تصویرمحور.',
    palette: {
      primary: '#e11d48',
      strong: '#be1239',
      accent: '#d4b483',
      ink: '#08070a',
      surface: '#121016',
      light: '#f7f4f2'
    }
  },
  {
    slug: '11-software-engineer',
    mood: 'light',
    icon: 'layers',
    chips: ['سندمحور', 'نمودار معماری', 'مخازن متن‌باز'],
    fa: 'مهندس نرم‌افزار',
    en: 'Software Engineer',
    person: 'بهنام آذری',
    role: 'مهندس نرم‌افزار ارشد',
    archetype: 'B  تحریریه‌ای و سندمحور',
    style: 'روشن و مهندسی، آبی فولادی با تاکید بنفش',
    desc: 'چیدمانی که مثل یک سند مهندسی خوانده می‌شود: برگه مشخصات، نمودار معماری سیستم، پرونده‌های فنی و مخازن متن‌باز.',
    palette: {
      primary: '#2563eb',
      strong: '#1d4ed8',
      accent: '#a855f7',
      ink: '#0b1220',
      surface: '#f1f5f9',
      light: '#ffffff'
    }
  },
  {
    slug: '12-digital-marketing-specialist',
    mood: 'light',
    icon: 'trending',
    chips: ['هیروی تمام‌عرض', 'قیف تبدیل', 'کمپین‌های فیلترشونده'],
    fa: 'متخصص بازاریابی دیجیتال',
    en: 'Digital Marketing Specialist',
    person: 'مهسا کریمی',
    role: 'استراتژیست بازاریابی دیجیتال',
    archetype: 'C  هیروی تمام‌عرض، کمپین‌محور',
    style: 'پرانرژی و رنگی، سرخابی با تاکید زرد',
    desc: 'هیروی تمام‌عرض با نوار نتایج، قیف تبدیل، کمپین‌های قابل فیلتر و پرسش‌های متداول  گرم، رنگی و عددمحور.',
    palette: {
      primary: '#c026d3',
      strong: '#a21caf',
      accent: '#facc15',
      ink: '#241033',
      surface: '#fdf4ff',
      light: '#ffffff'
    }
  },
  {
    slug: '13-photographer',
    mood: 'light',
    icon: 'camera',
    chips: ['تک‌رنگ و تصویرمحور', 'گالری نامنظم', 'بسته‌های عکاسی'],
    fa: 'عکاس',
    en: 'Photographer',
    person: 'نگار سلطانی',
    role: 'عکاس پرتره و تبلیغاتی',
    archetype: 'E  بنتوی تصویرمحور',
    style: 'تک‌رنگ و کم‌حرف، سپیا و خاکستری گرم',
    desc: 'چیدمان تصویرمحور با گالری نامنظم، بسته‌های عکاسی و نوار مشخصات دوربین  رابط عمداً کم‌رنگ است تا رنگ فقط از خود عکس‌ها بیاید.',
    palette: {
      primary: '#8c6239',
      strong: '#6f4c2a',
      accent: '#a8a29e',
      ink: '#171310',
      surface: '#f5f2ed',
      light: '#ffffff'
    }
  },
  {
    slug: '14-architect',
    mood: 'light',
    icon: 'grid',
    chips: ['نقشه‌ی تمام‌CSS', 'فهرست پروژه‌ها', 'پالت متریال'],
    fa: 'معمار و طراح داخلی',
    en: 'Architect',
    person: 'آرمان دهقان',
    role: 'معمار و طراح داخلی',
    archetype: 'A  دوستونه، نقشه‌محور',
    style: 'آرام و ساختارمند، سبز کاج و خاک رس',
    desc: 'هیروی دوستونه با نقشه‌ی پلان تمام‌CSS، فهرست جدولی پروژه‌ها و پالت متریال  دقیق و ساختارمند، مثل یک دفترچه‌ی فنی.',
    palette: {
      primary: '#2f7f66',
      strong: '#25654f',
      accent: '#c49a72',
      ink: '#14201c',
      surface: '#f2f1ec',
      light: '#fffefb'
    }
  },
  {
    slug: '15-fitness-coach',
    mood: 'dark',
    icon: 'activity',
    chips: ['تیره و پرانرژی', 'برنامه‌ی هفتگی', 'دوره‌های تمرینی'],
    fa: 'مربی تناسب اندام',
    en: 'Fitness Coach',
    person: 'حسام نیک‌پور',
    role: 'مربی تناسب اندام و تغذیه ورزشی',
    archetype: 'D  کارت‌محور و تیره',
    style: 'تیره و پرانرژی، لایم و نارنجی',
    desc: 'تیره و پرانرژی با کارت دوره‌های تمرینی، جدول برنامه‌ی هفتگی و بسته‌های مربیگری  همه‌چیز حول اجرا و پیگیری نتیجه.',
    palette: {
      primary: '#a3e635',
      strong: '#84cc16',
      accent: '#fb923c',
      ink: '#0c1008',
      surface: '#141a0f',
      light: '#f7fbf0'
    }
  }
];

export const bySlug = Object.fromEntries(demos.map((d) => [d.slug, d]));
