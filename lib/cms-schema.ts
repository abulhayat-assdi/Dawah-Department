// Field schemas that drive the generic CMS editor (components/cms/section-form.tsx).
// Keys match the shapes in lib/content.ts (SiteContentMap).

export type CmsLeaf = { key: string; label: string; type: "text" | "textarea" };
export type CmsGroupChild = CmsLeaf | { key: string; label: string; type: "list-text" };

export type CmsField =
  | { key: string; label: string; type: "text" | "textarea" | "rich" | "image" }
  | { key: string; label: string; type: "list-text" }
  | { key: string; label: string; type: "list-object"; fields: CmsLeaf[] }
  | { key: string; label: string; type: "group"; fields: CmsGroupChild[] };

const statFields: CmsLeaf[] = [
  { key: "icon", label: "Icon (emoji)", type: "text" },
  { key: "value", label: "Value", type: "text" },
  { key: "label", label: "Label", type: "text" },
];

const featureFields: CmsLeaf[] = [
  { key: "icon", label: "Icon", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "text", label: "Text", type: "textarea" },
  { key: "linkLabel", label: "Link label", type: "text" },
  { key: "href", label: "Link href", type: "text" },
  { key: "accent", label: "Accent (green/gold)", type: "text" },
];

const valueFields: CmsLeaf[] = [
  { key: "icon", label: "Icon", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "text", label: "Text", type: "textarea" },
];

const quranLevelFields: CmsLeaf[] = [
  { key: "icon", label: "Icon", type: "text" },
  { key: "title", label: "Title", type: "text" },
  { key: "text", label: "Text", type: "textarea" },
  { key: "note", label: "Note (optional)", type: "textarea" },
];

const branchFields: CmsLeaf[] = [
  { key: "name", label: "Branch name", type: "text" },
  { key: "address", label: "Address", type: "textarea" },
];

const categoryGroup = (key: string, label: string): CmsField => ({
  key,
  label,
  type: "group",
  fields: [
    { key: "tag", label: "Tag", type: "text" },
    { key: "title", label: "Title", type: "text" },
    { key: "text", label: "Text", type: "textarea" },
    { key: "items", label: "Items", type: "list-text" },
  ],
});

export const CMS_TABS: { key: string; label: string; fields: CmsField[] }[] = [
  {
    key: "site",
    label: "Site",
    fields: [
      { key: "instituteName", label: "Top bar — Institute name", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "brandTitle", label: "Brand title", type: "text" },
      { key: "brandSubtitle", label: "Brand subtitle", type: "text" },
      { key: "footer", label: "Footer text", type: "text" },
      { key: "ctaLabel", label: "Header button label", type: "text" },
      { key: "ctaHref", label: "Header button link", type: "text" },
    ],
  },
  {
    key: "home",
    label: "Home",
    fields: [
      { key: "heroEyebrow", label: "Hero eyebrow", type: "text" },
      { key: "heroTitlePre", label: "Hero title (start)", type: "text" },
      { key: "heroTitleHighlight", label: "Hero title (gold part)", type: "text" },
      { key: "heroTitlePost", label: "Hero title (end)", type: "text" },
      { key: "heroQuote", label: "Hero quote", type: "textarea" },
      { key: "heroCalligraphy", label: "Calligraphy (Arabic)", type: "text" },
      { key: "heroCtaLabel", label: "Hero button label", type: "text" },
      { key: "heroCtaHref", label: "Hero button link", type: "text" },
      { key: "sideTitle", label: "Side card title", type: "text" },
      { key: "sideText", label: "Side card text", type: "text" },
      { key: "stats", label: "Stats", type: "list-object", fields: statFields },
      { key: "features", label: "Feature cards", type: "list-object", fields: featureFields },
      { key: "missionEyebrow", label: "Mission eyebrow", type: "text" },
      { key: "missionTitle", label: "Mission title", type: "text" },
      { key: "missionBody", label: "Mission body", type: "rich" },
      { key: "missionChecklist", label: "Mission checklist", type: "list-text" },
      { key: "missionImage", label: "Mission image", type: "image" },
      { key: "missionCtaLabel", label: "Mission button label", type: "text" },
      { key: "missionCtaHref", label: "Mission button link", type: "text" },
    ],
  },
  {
    key: "about",
    label: "About",
    fields: [
      { key: "heroEyebrow", label: "Hero eyebrow", type: "text" },
      { key: "heroTitle", label: "Hero title", type: "text" },
      { key: "heroHighlight", label: "Hero title (gold part)", type: "text" },
      { key: "heroBody", label: "Hero body", type: "textarea" },
      { key: "image", label: "Side image", type: "image" },
      { key: "visionTitle", label: "Vision title", type: "text" },
      { key: "visionText", label: "Vision text", type: "textarea" },
      { key: "missionTitle", label: "Mission title", type: "text" },
      { key: "missionText", label: "Mission text", type: "textarea" },
      { key: "planEyebrow", label: "Plan eyebrow", type: "text" },
      { key: "planTitle", label: "Plan title", type: "text" },
      categoryGroup("cat1", "Category 1"),
      categoryGroup("cat2", "Category 2"),
      { key: "valuesEyebrow", label: "Values eyebrow", type: "text" },
      { key: "valuesTitle", label: "Values title", type: "text" },
      { key: "valuesHighlight", label: "Values title (gold part)", type: "text" },
      { key: "valuesBody", label: "Values body", type: "rich" },
      { key: "valuesCtaLabel", label: "Values button label", type: "text" },
      { key: "valuesCtaHref", label: "Values button link", type: "text" },
      { key: "values", label: "Value cards", type: "list-object", fields: valueFields },
    ],
  },
  {
    key: "academic",
    label: "Academic",
    fields: [
      { key: "heroEyebrow", label: "Hero eyebrow", type: "text" },
      { key: "heroTitle", label: "Hero title", type: "text" },
      { key: "heroBody", label: "Hero body", type: "textarea" },
      { key: "quranHeading", label: "Quran section heading", type: "text" },
      { key: "quranLevels", label: "Quran levels", type: "list-object", fields: quranLevelFields },
      { key: "programsHeading", label: "Programs heading", type: "text" },
      { key: "dawahHeading", label: "Dawah section heading", type: "text" },
      { key: "dawahIntro", label: "Dawah intro", type: "rich" },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    fields: [
      { key: "heroTitle", label: "Hero title", type: "text" },
      { key: "heroBody", label: "Hero body", type: "textarea" },
      { key: "branchesHeading", label: "Branches heading", type: "text" },
      { key: "branches", label: "Branches", type: "list-object", fields: branchFields },
      { key: "phone", label: "Phone", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "hoursTitle", label: "Office hours title", type: "text" },
      { key: "hoursDays", label: "Office days", type: "text" },
      { key: "hoursTime", label: "Office time", type: "text" },
      { key: "emergencyLabel", label: "Emergency label", type: "text" },
      { key: "emergencyPhone", label: "Emergency phone", type: "text" },
      { key: "formTitle", label: "Form title", type: "text" },
      { key: "formNote", label: "Form note", type: "text" },
    ],
  },
  {
    key: "faculty",
    label: "Faculty page",
    fields: [
      { key: "heroEyebrow", label: "Hero eyebrow", type: "text" },
      { key: "heroTitle", label: "Hero title", type: "text" },
      { key: "heroBody", label: "Hero body", type: "textarea" },
    ],
  },
  {
    key: "activities",
    label: "Activities page",
    fields: [
      { key: "heroTitle", label: "Hero title", type: "text" },
      { key: "heroBody", label: "Hero body", type: "textarea" },
    ],
  },
];
