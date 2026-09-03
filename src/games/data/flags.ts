import type { QuizQuestion } from "../quiz-engine.js";

// Flag emoji (regional indicator pairs) don't render in a lot of terminals —
// notably macOS Terminal.app shows blank/tofu instead of a flag. That's a
// font limitation no app code can force past, so flags here are drawn as
// three stacked color bands using real terminal background colors (always
// supported everywhere) rather than relying on an emoji glyph existing.
// Colors are simplified to the 8 standard ANSI names — not pixel-accurate,
// just recognizably "that flag's palette."

interface Country {
  iso: string;
  name: string;
  capital: string;
  bands: [string, string, string];
}

const COUNTRIES: Country[] = [
  { iso: "US", name: "United States", capital: "Washington, D.C.", bands: ["red", "white", "blue"] },
  { iso: "GB", name: "United Kingdom", capital: "London", bands: ["blue", "white", "red"] },
  { iso: "FR", name: "France", capital: "Paris", bands: ["blue", "white", "red"] },
  { iso: "DE", name: "Germany", capital: "Berlin", bands: ["black", "red", "yellow"] },
  { iso: "IT", name: "Italy", capital: "Rome", bands: ["green", "white", "red"] },
  { iso: "ES", name: "Spain", capital: "Madrid", bands: ["red", "yellow", "red"] },
  { iso: "PT", name: "Portugal", capital: "Lisbon", bands: ["green", "red", "red"] },
  { iso: "NL", name: "Netherlands", capital: "Amsterdam", bands: ["red", "white", "blue"] },
  { iso: "BE", name: "Belgium", capital: "Brussels", bands: ["black", "yellow", "red"] },
  { iso: "CH", name: "Switzerland", capital: "Bern", bands: ["red", "white", "red"] },
  { iso: "AT", name: "Austria", capital: "Vienna", bands: ["red", "white", "red"] },
  { iso: "SE", name: "Sweden", capital: "Stockholm", bands: ["blue", "yellow", "blue"] },
  { iso: "NO", name: "Norway", capital: "Oslo", bands: ["red", "white", "blue"] },
  { iso: "DK", name: "Denmark", capital: "Copenhagen", bands: ["red", "white", "red"] },
  { iso: "FI", name: "Finland", capital: "Helsinki", bands: ["white", "blue", "white"] },
  { iso: "IS", name: "Iceland", capital: "Reykjavik", bands: ["blue", "white", "red"] },
  { iso: "PL", name: "Poland", capital: "Warsaw", bands: ["white", "white", "red"] },
  { iso: "CZ", name: "Czech Republic", capital: "Prague", bands: ["white", "red", "blue"] },
  { iso: "GR", name: "Greece", capital: "Athens", bands: ["blue", "white", "blue"] },
  { iso: "TR", name: "Turkey", capital: "Ankara", bands: ["red", "red", "red"] },
  { iso: "RU", name: "Russia", capital: "Moscow", bands: ["white", "blue", "red"] },
  { iso: "UA", name: "Ukraine", capital: "Kyiv", bands: ["blue", "yellow", "yellow"] },
  { iso: "CN", name: "China", capital: "Beijing", bands: ["red", "red", "yellow"] },
  { iso: "JP", name: "Japan", capital: "Tokyo", bands: ["white", "red", "white"] },
  { iso: "KR", name: "South Korea", capital: "Seoul", bands: ["white", "blue", "red"] },
  { iso: "IN", name: "India", capital: "New Delhi", bands: ["yellow", "white", "green"] },
  { iso: "PK", name: "Pakistan", capital: "Islamabad", bands: ["green", "white", "green"] },
  { iso: "ID", name: "Indonesia", capital: "Jakarta", bands: ["red", "white", "white"] },
  { iso: "TH", name: "Thailand", capital: "Bangkok", bands: ["red", "white", "blue"] },
  { iso: "VN", name: "Vietnam", capital: "Hanoi", bands: ["red", "yellow", "red"] },
  { iso: "PH", name: "Philippines", capital: "Manila", bands: ["blue", "red", "white"] },
  { iso: "MY", name: "Malaysia", capital: "Kuala Lumpur", bands: ["blue", "white", "red"] },
  { iso: "SG", name: "Singapore", capital: "Singapore", bands: ["red", "white", "white"] },
  { iso: "AU", name: "Australia", capital: "Canberra", bands: ["blue", "white", "red"] },
  { iso: "NZ", name: "New Zealand", capital: "Wellington", bands: ["blue", "white", "red"] },
  { iso: "CA", name: "Canada", capital: "Ottawa", bands: ["red", "white", "red"] },
  { iso: "MX", name: "Mexico", capital: "Mexico City", bands: ["green", "white", "red"] },
  { iso: "BR", name: "Brazil", capital: "Brasília", bands: ["green", "yellow", "green"] },
  { iso: "AR", name: "Argentina", capital: "Buenos Aires", bands: ["blue", "white", "blue"] },
  { iso: "CL", name: "Chile", capital: "Santiago", bands: ["white", "red", "blue"] },
  { iso: "CO", name: "Colombia", capital: "Bogotá", bands: ["yellow", "blue", "red"] },
  { iso: "PE", name: "Peru", capital: "Lima", bands: ["red", "white", "red"] },
  { iso: "EG", name: "Egypt", capital: "Cairo", bands: ["red", "white", "black"] },
  { iso: "ZA", name: "South Africa", capital: "Pretoria", bands: ["green", "yellow", "black"] },
  { iso: "NG", name: "Nigeria", capital: "Abuja", bands: ["green", "white", "green"] },
  { iso: "KE", name: "Kenya", capital: "Nairobi", bands: ["black", "red", "green"] },
  { iso: "MA", name: "Morocco", capital: "Rabat", bands: ["red", "green", "red"] },
  { iso: "SA", name: "Saudi Arabia", capital: "Riyadh", bands: ["green", "green", "green"] },
  { iso: "AE", name: "United Arab Emirates", capital: "Abu Dhabi", bands: ["red", "green", "white"] },
  { iso: "IL", name: "Israel", capital: "Jerusalem", bands: ["white", "blue", "white"] },
  { iso: "UZ", name: "Uzbekistan", capital: "Tashkent", bands: ["blue", "white", "green"] },
];

const BAND_WIDTH = 18;

export function renderFlagBands(bands: [string, string, string]): string {
  return bands.map((color) => `{${color}-bg}${" ".repeat(BAND_WIDTH)}{/${color}-bg}`).join("\n");
}

function buildQuestions(kind: "flag-to-country" | "country-to-capital"): QuizQuestion[] {
  if (kind === "flag-to-country") {
    return COUNTRIES.map((c) => ({
      prompt: `Which country's flag is this?`,
      visual: renderFlagBands(c.bands),
      choices: COUNTRIES.map((x) => x.name),
      correctIndex: COUNTRIES.indexOf(c),
    }));
  }
  return COUNTRIES.map((c) => ({
    prompt: `What is the capital of ${c.name}?`,
    choices: COUNTRIES.map((x) => x.capital),
    correctIndex: COUNTRIES.indexOf(c),
  }));
}

export const flagQuestions: QuizQuestion[] = [
  ...buildQuestions("flag-to-country"),
  ...buildQuestions("country-to-capital"),
];
