import type { HalfLevel } from "./questions";

export interface CourseOption {
  type: "grupni" | "video" | "individualni";
  label: string;
  subtitle: string;
  price: string;
  url: string;
}

export interface LevelRecommendation {
  level: HalfLevel | "C1+";
  title: string;
  description: string;
  courses: CourseOption[];
}

const recommendations: Record<string, LevelRecommendation> = {
  "A1.1": {
    level: "A1.1",
    title: "Krećeš od nule - sjajan početak!",
    description: "Naš A1 kurs te vodi korak po korak kroz osnove nemačkog jezika.",
    courses: [
      { type: "grupni", label: "Grupni kurs A1.1", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "168€", url: "/kursevi/grupni-kurs-nemackog-jezika-a1-1" },
      { type: "video", label: "Video kurs A1", subtitle: "Učiš sam/a, u svom tempu, sa snimljenim lekcijama.", price: "99€", url: "/kursevi/video-kurs-a1" },
      { type: "individualni", label: "Individualni A1.1", subtitle: "Privatni časovi 1 na 1 sa profesorom, prilagođen tvom tempu.", price: "od 197€", url: "/kursevi/individualni-kurs-nemackog-jezika-a11" },
    ],
  },
  "A1.2": {
    level: "A1.2",
    title: "Osnove su tu - treba ih učvrstiti!",
    description: "Imaš osnove nemačkog, ali treba ti čvrsta baza pre nego što nastaviš.",
    courses: [
      { type: "grupni", label: "Grupni kurs A1.2", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "168€", url: "/kursevi/grupni-kurs-nemackog-jezika-a1-2-2" },
      { type: "video", label: "Video kurs A1", subtitle: "Učiš sam/a, u svom tempu, sa snimljenim lekcijama.", price: "99€", url: "/kursevi/video-kurs-a1" },
      { type: "individualni", label: "Individualni A1.2", subtitle: "Privatni časovi 1 na 1 sa profesorom, prilagođen tvom tempu.", price: "od 197€", url: "/kursevi/individualni-kurs-nemackog-jezika-a1-2" },
    ],
  },
  "A2.1": {
    level: "A2.1",
    title: "Svaka čast, A1 je iza tebe!",
    description: "Spreman/na si za sledeći korak. A2 kurs proširuje tvoj vokabular i gramatiku.",
    courses: [
      { type: "grupni", label: "Grupni kurs A2.1", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "168€", url: "/kursevi/grupni-kurs-nemackog-jezika-a2" },
      { type: "video", label: "Video kurs A2", subtitle: "Učiš sam/a, u svom tempu, sa snimljenim lekcijama.", price: "99€", url: "/kursevi/video-kurs-a2" },
      { type: "individualni", label: "Individualni A2.1", subtitle: "Privatni časovi 1 na 1 sa profesorom, prilagođen tvom tempu.", price: "od 282€", url: "/kursevi/individualni-kurs-nemackog-jezika-a2" },
    ],
  },
  "A2.2": {
    level: "A2.2",
    title: "Na dobrom si putu kroz A2!",
    description: "Nastavi gde si stao/la - do kraja A2 nivoa je još malo.",
    courses: [
      { type: "grupni", label: "Grupni kurs A2.2", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "168€", url: "/kursevi/grupni-kurs-nemackog-jezika-a2-2" },
      { type: "video", label: "Video kurs A2", subtitle: "Učiš sam/a, u svom tempu, sa snimljenim lekcijama.", price: "99€", url: "/kursevi/video-kurs-a2" },
      { type: "individualni", label: "Individualni A2.2", subtitle: "Privatni časovi 1 na 1 sa profesorom, prilagođen tvom tempu.", price: "od 282€", url: "/kursevi/individualni-kurs-nemackog-jezika-a2-2" },
    ],
  },
  "B1.1": {
    level: "B1.1",
    title: "Solidno znanje! Vreme za B1.",
    description: "B1 kurs te vodi do prave samostalnosti u komunikaciji na nemačkom.",
    courses: [
      { type: "grupni", label: "Grupni kurs B1.1", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "168€", url: "/kursevi/grupni-kurs-nemackog-jezika-b1-1-2" },
      { type: "video", label: "Video kurs B1", subtitle: "Učiš sam/a, u svom tempu, sa snimljenim lekcijama.", price: "99€", url: "/kursevi/video-kurs-b1" },
      { type: "individualni", label: "Individualni B1.1", subtitle: "Privatni časovi 1 na 1 sa profesorom, prilagođen tvom tempu.", price: "od 299€", url: "/kursevi/individualni-kurs-nemackog-jezika-b11" },
    ],
  },
  "B1.2": {
    level: "B1.2",
    title: "Još malo do B1 cilja!",
    description: "Ovo je završni sprint - posle ovoga možeš slobodno da komuniciraš na nemačkom.",
    courses: [
      { type: "grupni", label: "Grupni kurs B1.2", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "168€", url: "/kursevi/grupni-kurs-nemackog-b1-2" },
      { type: "video", label: "Video kurs B1", subtitle: "Učiš sam/a, u svom tempu, sa snimljenim lekcijama.", price: "99€", url: "/kursevi/video-kurs-b1" },
      { type: "individualni", label: "Individualni B1.2", subtitle: "Privatni časovi 1 na 1 sa profesorom, prilagođen tvom tempu.", price: "od 299€", url: "/kursevi/individualni-kurs-nemackog-jezika-b1-2" },
    ],
  },
  "B2.1": {
    level: "B2.1",
    title: "Tvoj nemački je jak!",
    description: "B2 nivo znači da možeš da pratiš složenije teme i izražavaš se precizno.",
    courses: [
      { type: "grupni", label: "Grupni kurs B2.1", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "181€", url: "/kursevi/grupni-kurs-b2-1" },
      { type: "individualni", label: "Individualni B2.1", subtitle: "Privatni časovi 1 na 1 sa profesorom, prilagođen tvom tempu.", price: "od 316€", url: "/kursevi/individualni-kurs-nemackog-jezika-b2-1" },
    ],
  },
  "B2.2": {
    level: "B2.2",
    title: "Skoro na C1 nivou!",
    description: "Ostao ti je još samo B2.2 - posle toga si spreman/na za napredni nivo.",
    courses: [
      { type: "grupni", label: "Grupni kurs B2.2", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "181€", url: "/kursevi/grupni-kurs-b2-2" },
    ],
  },
  "C1+": {
    level: "C1+",
    title: "Bravo! Tvoj nemački je na visokom nivou.",
    description: "Imaš znanje iznad B2. Javi nam se za napredni ili individualni program.",
    courses: [
      { type: "grupni", label: "Grupni kurs C1.1", subtitle: "Učiš uživo sa profesorom i grupom od 4-6 polaznika.", price: "181€", url: "/kursevi/grupni-kurs-c1-1" },
    ],
  },
};

export function getRecommendation(level: HalfLevel | "C1+"): LevelRecommendation {
  return recommendations[level] ?? recommendations["A1.1"];
}
