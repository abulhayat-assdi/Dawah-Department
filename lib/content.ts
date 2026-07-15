import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Public-site content model. Every public page reads its section from here via
// getContent(key); the admin CMS edits and stores it in the site_content table.
// Defaults below mirror the client's reference design (Bengali), so the site
// looks complete out of the box and stays fully editable.
// ---------------------------------------------------------------------------

export interface StatItem { icon: string; value: string; label: string }
export interface FeatureItem {
  icon: string; title: string; text: string; linkLabel: string; href: string; accent: "green" | "gold";
}
export interface ValueItem { icon: string; title: string; text: string }
export interface QuranLevel { icon: string; title: string; text: string; note: string }
export interface Branch { name: string; address: string }
export interface CategoryBlock { tag: string; title: string; text: string; items: string[] }

export interface SiteContentMap {
  site: {
    instituteName: string;
    email: string;
    phone: string;
    brandTitle: string;
    brandSubtitle: string;
    footer: string;
    ctaLabel: string;
    ctaHref: string;
  };
  home: {
    heroEyebrow: string;
    heroTitlePre: string;
    heroTitleHighlight: string;
    heroTitlePost: string;
    heroQuote: string;
    heroCalligraphy: string;
    heroCtaLabel: string;
    heroCtaHref: string;
    sideTitle: string;
    sideText: string;
    stats: StatItem[];
    features: FeatureItem[];
    missionEyebrow: string;
    missionTitle: string;
    missionBody: string; // rich html
    missionChecklist: string[];
    missionImage: string;
    missionCtaLabel: string;
    missionCtaHref: string;
  };
  about: {
    heroEyebrow: string;
    heroTitle: string;
    heroHighlight: string;
    heroBody: string;
    image: string;
    visionTitle: string;
    visionText: string;
    missionTitle: string;
    missionText: string;
    planEyebrow: string;
    planTitle: string;
    cat1: CategoryBlock;
    cat2: CategoryBlock;
    valuesEyebrow: string;
    valuesTitle: string;
    valuesHighlight: string;
    valuesBody: string; // rich html
    valuesCtaLabel: string;
    valuesCtaHref: string;
    values: ValueItem[];
  };
  academic: {
    heroEyebrow: string;
    heroTitle: string;
    heroBody: string;
    quranHeading: string;
    quranLevels: QuranLevel[];
    programsHeading: string;
    dawahHeading: string;
    dawahIntro: string; // rich html
  };
  contact: {
    heroTitle: string;
    heroBody: string;
    branchesHeading: string;
    branches: Branch[];
    phone: string;
    email: string;
    hoursTitle: string;
    hoursDays: string;
    hoursTime: string;
    emergencyLabel: string;
    emergencyPhone: string;
    formTitle: string;
    formNote: string;
  };
  activities: {
    heroTitle: string;
    heroBody: string;
  };
  faculty: {
    heroEyebrow: string;
    heroTitle: string;
    heroBody: string;
  };
  notices: {
    heroTitle: string;
    heroBody: string;
  };
}

export const CONTENT_DEFAULTS: SiteContentMap = {
  site: {
    instituteName: "আস সুন্নাহ স্কিল ডেভেলপমেন্ট ইনস্টিটিউট - দাওয়াহ বিভাগ",
    email: "info@assunnah-dawah.edu",
    phone: "+৮৮০ ২-৯৮৭৬৫৪৩",
    brandTitle: "দাওয়াহ বিভাগ",
    brandSubtitle: "AS SUNNAH SKILL DEVELOPMENT INSTITUTE",
    footer:
      "© দাওয়াহ বিভাগ, আস সুন্নাহ স্কিল ডেভেলপমেন্ট ইনস্টিটিউট। সর্বস্বত্ব সংরক্ষিত।",
    ctaLabel: "Login as Teacher",
    ctaHref: "/login",
  },
  home: {
    heroEyebrow: "আমাদের মিশন",
    heroTitlePre: "দক্ষ এবং ইসলামি জ্ঞানে",
    heroTitleHighlight: "সমৃদ্ধ জনশক্তি তৈরি করাই",
    heroTitlePost: "আমাদের লক্ষ্য",
    heroQuote: "“আধুনিক বিশ্বে ইসলামের সঠিক বার্তা পৌঁছে দেওয়ার প্রত্যয়।”",
    heroCalligraphy: "اقْرَأْ",
    heroCtaLabel: "ভর্তি কার্যক্রম দেখুন",
    heroCtaHref: "/academic",
    sideTitle: "KNOWLEDGE IS LIGHT",
    sideText: "“পড় তোমার প্রভুর নামে”",
    stats: [
      { icon: "👥", value: "৫৫০+", label: "মোট শিক্ষার্থী" },
      { icon: "📖", value: "১৫+", label: "একাডেমিক কোর্স" },
      { icon: "🎓", value: "৭ জন", label: "বিশেষজ্ঞ শিক্ষক" },
    ],
    features: [
      {
        icon: "📖",
        title: "একাডেমিক কোর্স",
        text:
          "আমাদের রয়েছে ৩ মাস ও ৬ মাস মেয়াদী বিশেষায়িত দাওয়াহ কোর্স যা শিক্ষার্থীদের যোগ্য করে গড়ে তোলে।",
        linkLabel: "বিস্তারিত দেখুন",
        href: "/academic",
        accent: "green",
      },
      {
        icon: "👥",
        title: "দক্ষ শিক্ষক মন্ডলী",
        text:
          "দেশ-বিদেশের স্বনামধন্য ইসলামী বিদ্যাপীঠ থেকে উচ্চতর ডিগ্রিধারী ওলামায়ে কেরামগণ পাঠদান করেন।",
        linkLabel: "পরিচিতি দেখুন",
        href: "/faculty",
        accent: "gold",
      },
      {
        icon: "🌐",
        title: "দাওয়াহ কার্যক্রম",
        text:
          "মাঠ পর্যায়ে দাওয়াহ কাজ পরিচালনার জন্য আমরা নিয়মিত কর্মশালা ও সেমিনারের আয়োজন করে থাকি।",
        linkLabel: "কার্যক্রম দেখুন",
        href: "/activities",
        accent: "green",
      },
    ],
    missionEyebrow: "আমাদের লক্ষ্য",
    missionTitle: "সহীহ জ্ঞান এবং আধুনিক দক্ষতার এক অপূর্ব সমন্বয়",
    missionBody:
      "<p>আস-সুন্নাহ স্কিল ডেভেলপমেন্ট ইনস্টিটিউট দাওয়াহ বিভাগ এমন একটি প্ল্যাটফর্ম যেখানে শিক্ষার্থীরা কুরআন ও সুন্নাহর মৌলিক শিক্ষার পাশাপাশি দাওয়াহর আধুনিক কৌশল ও জীবনমুখী দক্ষতা অর্জন করতে পারে। আমাদের লক্ষ্য হলো ইসলামের প্রকৃত সৌন্দর্য বিশ্বদরবারে সহজ ও সাবলীলভাবে তুলে ধরা।</p>",
    missionChecklist: [
      "অভিজ্ঞ আলেম ও মেন্টরদের তত্ত্বাবধান",
      "আধুনিক সিলেবাস ও পাঠদান পদ্ধতি",
      "ব্যবহারিক দাওয়াহ কার্যক্রম",
      "সার্টিফাইড স্কিল ডেভেলপমেন্ট",
    ],
    missionImage: "",
    missionCtaLabel: "আরও পড়ুন",
    missionCtaHref: "/about",
  },
  about: {
    heroEyebrow: "পরিচিতি ও আদর্শ",
    heroTitle: "আমাদের স্বপ্ন ও",
    heroHighlight: "লক্ষ্য",
    heroBody:
      "আমরা এমন এক প্রজন্ম গড়তে চাই যারা জ্ঞানে ঋদ্ধ এবং কর্মে মুখর হবে। আমাদের লক্ষ্য হলো ইসলামের সেবায় এক দক্ষ ও আমলদার জনশক্তি তৈরি করা।",
    image: "",
    visionTitle: "আমাদের ভিশন (Vision)",
    visionText:
      "“একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবেলায় সক্ষম এবং ইসলামের সুমহান বার্তার সঠিক উপস্থাপক একদল বিশ্বমানের দক্ষ দাঈ ও বিশেষজ্ঞ তৈরি করা।”",
    missionTitle: "আমাদের মিশন (Mission)",
    missionText:
      "বেকারত্ব দূরীকরণ এবং ইসলামের বৈশ্বিক প্রসারে আমরা আলেম শিক্ষার্থী (Alim Student) এবং সাধারণ (General) উভয় গ্রুপকে নিজ নিজ স্তর অনুযায়ী মানসম্মত শিক্ষায় শিক্ষিত করে তুলছি।",
    planEyebrow: "আমাদের কর্মপরিকল্পনা",
    planTitle: "শিক্ষা ও দক্ষতার সমন্বয়",
    cat1: {
      tag: "ক্যাটাগরি-১",
      title: "আলেম শিক্ষার্থী (Alim Student)",
      text:
        "মাদরাসার ছাত্র ও আলেমদের আধুনিক দাওয়াহ কৌশল, ভাষা এবং প্রযুক্তিতে দক্ষ করে গড়ে তোলা হয় যেন তারা বৈশ্বিক প্রেক্ষাপটে স্বাবলম্বী হয়ে দ্বীনের খেদমত করতে পারেন।",
      items: ["উচ্চতর দাওয়াহ কোর্স", "পেশাগত দক্ষতা উন্নয়ন", "বেকারত্ব দূরীকরণ প্রজেক্ট"],
    },
    cat2: {
      tag: "ক্যাটাগরি-২",
      title: "সাধারণ শিক্ষার্থী (General)",
      text:
        "স্কুল, কলেজ ও বিশ্ববিদ্যালয়ের শিক্ষার্থীদের ইসলামের মৌলিক শিক্ষা এবং নৈতিক মূল্যবোধে শিক্ষিত করে আদর্শ ও সচেতন মুসলিম নাগরিক হিসেবে গড়ে তোলা হয়।",
      items: ["ফরযে আইন ইলম (Farze Ain Ilm)", "কুরআন তিলাওয়াত ও তাজবীদ", "নৈতিক চরিত্র গঠন"],
    },
    valuesEyebrow: "আমাদের আদর্শ",
    valuesTitle: "আমাদের",
    valuesHighlight: "মূল্যবোধ",
    valuesBody:
      "<p>শিক্ষা আমাদের কাছে কেবল জ্ঞানার্জন নয়, বরং এটি সমাজ গঠনের এক শক্তিশালী হাতিয়ার। আমরা প্রতিটি পদক্ষেপে আল্লাহর দয়া ও সাহায্যকে ধারণ করি।</p>",
    valuesCtaLabel: "Login as Teacher",
    valuesCtaHref: "/login",
    values: [
      { icon: "🛡️", title: "বিশুদ্ধ আকিদা ও দলীলের ভিত্তি", text: "কুরআন ও সুন্নাহর বিশুদ্ধ দলীলের ভিত্তিতে নির্ভরযোগ্য তথ্য ও বিশ্বাস গড়ে তোলা।" },
      { icon: "❤️", title: "সেবা ও দানশীলতা (Charity)", text: "অসহায় ও দুঃস্থদের পাশে দাঁড়ানো এবং সমাজের কল্যাণে অকাতরে দান করার মানসিকতা তৈরি।" },
      { icon: "💼", title: "পেশাগত শ্রেষ্ঠত্ব অর্জন", text: "অর্জিত জ্ঞানের সঠিক প্রয়োগের মাধ্যমে নিজেদের দক্ষ ও স্বাবলম্বী হিসেবে গড়ে তোলা।" },
      { icon: "🌐", title: "বৈশ্বিক প্রতিনিধিত্ব", text: "আধুনিক বিশ্বের প্রেক্ষাপটে ইসলামের সঠিক ও সুন্দর বার্তা সারাবিশ্বে পৌঁছে দেওয়া।" },
      { icon: "🎯", title: "বেকারত্ব দূরীকরণ", text: "ছাত্রদের এমনভাবে গড়ে তোলা যেন তারা নিজেরা স্বাবলম্বী হতে পারে।" },
      { icon: "🤝", title: "নিষ্ঠা ও আন্তরিকতা (Ikhlas)", text: "প্রতিটি কাজে আল্লাহর সন্তুষ্টি অর্জন এবং নিষ্ঠার সাথে দায়িত্ব পালন।" },
    ],
  },
  academic: {
    heroEyebrow: "একাডেমিক কারিকুলাম",
    heroTitle: "জ্ঞানার্জনের পথে এক নতুন দিগন্ত",
    heroBody:
      "আধুনিক ও ইসলামি শিক্ষার এক অপূর্ব সমন্বয়ে আমরা এমন এক সিলেবাস প্রণয়ন করেছি যা বর্তমান বিশ্বের চ্যালেঞ্জ মোকাবেলায় সক্ষম।",
    quranHeading: "কুরআন একাডেমি: লেভেল ও লক্ষ্যমাত্রা",
    quranLevels: [
      { icon: "⭐", title: "প্রারম্ভিক লেভেল (Beginner)", text: "কায়দা থেকে ৩০তম পারা (জুয আম্মা) সম্পন্ন করা।", note: "যারা ৩০তম পারা থেকে শুরু করবেন তারা এটি শেষ করে এক জন ক্বারী সাহেবের নিকট আরও ১টি পারা সম্পন্ন করবেন।" },
      { icon: "🏅", title: "হাফেজ/শিক্ষার্থী লেভেল", text: "৩ মাসে অতিরিক্ত ৫টি পারা (২৬ থেকে ৩০) মুখস্থ করা এবং ৪ খতম তিলাওয়াত সম্পন্ন করা।", note: "" },
      { icon: "🎓", title: "শিক্ষার্থী লেভেল (হাফেজ নন)", text: "৩ মাসে ৩০তম পারা মুখস্থ করা এবং ২ খতম তিলাওয়াত সম্পন্ন করা।", note: "" },
    ],
    programsHeading: "একাডেমিক প্রোগ্রামসমূহ",
    dawahHeading: "দাওয়াহ ক্লাস: ওলামা ও সাধারণ শিক্ষার্থী",
    dawahIntro:
      "<p>আমাদের দাওয়াহ ক্লাসগুলো ওলামা ও সাধারণ উভয় শিক্ষার্থীর উপযোগী করে সাজানো — মৌলিক তত্ত্ব থেকে সমকালীন মতবাদ ও বুদ্ধিবৃত্তিক চ্যালেঞ্জ পর্যন্ত।</p>",
  },
  contact: {
    heroTitle: "রিপোর্ট ও যোগাযোগ",
    heroBody:
      "যেকোনো প্রয়োজনে আমাদের বার্তা বা রিপোর্ট পাঠান, আমরা দ্রুত আপনার সাথে যোগাযোগ করব।",
    branchesHeading: "আমাদের শাখাসমূহ",
    branches: [
      { name: "উত্তরা শাখা (প্রধান)", address: "হাউস-০১, রোড-০১, সেক্টর-১৫ (জে-ব্লক), উত্তরা, ঢাকা-১২৩০।" },
      { name: "সাতারকুল শাখা", address: "সাতারকুল, বাড্ডা, ঢাকা।" },
      { name: "সিলেট শাখা", address: "শাহী ঈদগাহ, সিলেট।" },
    ],
    phone: "+৮৮০ ১৩১৩ ০১০০৫০",
    email: "info@madrasatussunnah.org",
    hoursTitle: "অফিসিয়াল সময়",
    hoursDays: "শনিবার - বৃহস্পতিবার",
    hoursTime: "সকাল ১০:০০ - রাত ০৮:০০",
    emergencyLabel: "জরুরী সরবরাহ",
    emergencyPhone: "+৮৮০ ১২৩৪ ৫৬৭৮৯০",
    formTitle: "যোগাযোগের ফর্ম",
    formNote: "",
  },
  activities: {
    heroTitle: "ক্যাম্পাস ও দাওয়াহ কার্যক্রম",
    heroBody:
      "আমাদের বিভিন্ন ক্যাম্পাসে চলমান দ্বীনি ও দাওয়াহ কার্যক্রমের বিস্তারিত বিবরণ এখানে পাওয়া যাবে।",
  },
  faculty: {
    heroEyebrow: "আমাদের কারিগররা",
    heroTitle: "স্বনামধন্য শিক্ষক মন্ডলী",
    heroBody:
      "আমাদের অভিজ্ঞ ও প্রজ্ঞাবান শিক্ষকদের একটি তালিকা যারা নিরলসভাবে জ্ঞানের মশাল বয়ে নিয়ে চলেছেন।",
  },
  notices: {
    heroTitle: "নোটিশ বোর্ড",
    heroBody: "দাওয়াহ বিভাগের সকল ঘোষণা ও নোটিশ এখানে প্রকাশ করা হয়।",
  },
};

/** Read one content section, merged over its defaults (anon-readable). */
export async function getContent<K extends keyof SiteContentMap>(
  key: K,
): Promise<SiteContentMap[K]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return {
    ...CONTENT_DEFAULTS[key],
    ...((data?.value as Partial<SiteContentMap[K]>) ?? {}),
  };
}
