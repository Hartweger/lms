export type Lang = "sr" | "en";

export interface ProductStrings {
  categoryLabel: string;
  featuresTitle: string;
  ratingText: string;
  oneOnOneInEnglish: string;
  chooseProfessorLine: string | null;
  bookYourTimeLine: string;
  noVideoCertLine: string;
  ctaBuy: string;
  pricePrefixFrom: string;
  priceCurrency: "RSD" | "EUR";
  bottomTitle: string;
  bottomSubtitle: string;
  freeTestLink: string;
  relatedTitle: string;
  breadcrumbHome: string;
  breadcrumbCourses: string;
  faqTitle: string;
}

const SR_PRODUCT: ProductStrings = {
  categoryLabel: "Mesečni paket",
  featuresTitle: "Šta uključuje paket?",
  ratingText: "5.0 - 300+ Google recenzija",
  oneOnOneInEnglish: "",
  chooseProfessorLine: "Profesorku biraš u sledećem koraku",
  bookYourTimeLine: "Ti biraš termin - dobijaš Google Calendar link i zakazuješ",
  noVideoCertLine: "Mesečni paket ne uključuje video lekcije ni sertifikat",
  ctaBuy: "Kupi",
  pricePrefixFrom: "od ",
  priceCurrency: "RSD",
  bottomTitle: "Spremi se da progovoriš nemački",
  bottomSubtitle: "Pridruži se grupi od 3000+ polaznika koji su već krenuli sa učenjem.",
  freeTestLink: "Ili uradi besplatno testiranje →",
  relatedTitle: "Možda će te zanimati",
  breadcrumbHome: "Početna",
  breadcrumbCourses: "Kursevi",
  faqTitle: "Česta pitanja",
};

const EN_PRODUCT: ProductStrings = {
  categoryLabel: "Monthly package",
  featuresTitle: "What's included",
  ratingText: "5.0 - 300+ Google reviews",
  oneOnOneInEnglish: "1-on-1 - you practice German, with explanations in English",
  chooseProfessorLine: "You choose your tutor in the next step",
  bookYourTimeLine: "You pick your times - you get a Google Calendar link and book yourself",
  noVideoCertLine: "Monthly packages don't include video lessons or a certificate",
  ctaBuy: "Buy",
  pricePrefixFrom: "from ",
  priceCurrency: "EUR",
  bottomTitle: "Start speaking German with confidence",
  bottomSubtitle: "Join 3000+ students who are already learning with us.",
  freeTestLink: "Or take a free placement test →",
  relatedTitle: "You might also like",
  breadcrumbHome: "Home",
  breadcrumbCourses: "Courses",
  faqTitle: "Frequently asked questions",
};

export interface CheckoutStrings {
  title: string;
  fullNameLabel: string;
  emailLabel: string;
  countryLabel: string;
  packageLabels: Record<string, string>;
  methodCard: string;
  methodBank: string;
  methodPaypal: string;
  couponToggle: string;
  couponApply: string;
  payButton: string;
  totalLabel: string;
  orderSummaryTitle: string;
}

const SR_CHECKOUT: CheckoutStrings = {
  title: "Kupovina",
  fullNameLabel: "Ime i prezime",
  emailLabel: "Email",
  countryLabel: "Zemlja",
  packageLabels: { paket4: "4 termina", paket8: "8 termina", paket12: "12 termina" },
  methodCard: "Kartica",
  methodBank: "Uplatnica",
  methodPaypal: "PayPal",
  couponToggle: "Imaš kupon?",
  couponApply: "Primeni",
  payButton: "Plati",
  totalLabel: "Ukupno",
  orderSummaryTitle: "Tvoja porudžbina",
};

const EN_CHECKOUT: CheckoutStrings = {
  title: "Checkout",
  fullNameLabel: "Full name",
  emailLabel: "Email",
  countryLabel: "Country",
  packageLabels: { paket4: "4 sessions", paket8: "8 sessions", paket12: "12 sessions" },
  methodCard: "Card",
  methodBank: "Bank transfer",
  methodPaypal: "PayPal",
  couponToggle: "Have a coupon?",
  couponApply: "Apply",
  payButton: "Pay",
  totalLabel: "Total",
  orderSummaryTitle: "Your order",
};

export function productStrings(lang: Lang): ProductStrings {
  return lang === "en" ? EN_PRODUCT : SR_PRODUCT;
}

export function checkoutStrings(lang: Lang): CheckoutStrings {
  return lang === "en" ? EN_CHECKOUT : SR_CHECKOUT;
}

export function formatMoney(amount: number, currency: "RSD" | "EUR"): string {
  const n = amount.toLocaleString("de-DE");
  return currency === "EUR" ? `${n} €` : `${n} din`;
}
