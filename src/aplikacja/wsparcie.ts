/**
 * Organizacje wsparcia o charakterze wyłącznie charytatywnym (docs/research/organizacje-wsparcia.md, issue #8,
 * weryfikacja 2026-11-21) i oficjalne źródła informacji z treści zadania.
 */

export type SytuacjaSzczegolna = 'smierc_dziecka' | 'poronienie' | 'wczesniactwo' | 'choroba_dziecka';

export const NAZWY_SYTUACJI: Record<SytuacjaSzczegolna, string> = {
  smierc_dziecka: 'Śmierć dziecka',
  poronienie: 'Poronienie, utrata ciąży',
  wczesniactwo: 'Wcześniactwo',
  choroba_dziecka: 'Ciężka choroba dziecka',
};

export interface Organizacja {
  nazwa: string;
  sytuacje: SytuacjaSzczegolna[];
  pomoc: string;
  strona: string;
  telefon?: string;
  uwaga?: string;
}

export const ORGANIZACJE: Organizacja[] = [
  {
    nazwa: 'Fundacja Wcześniak Rodzice-Rodzicom',
    sytuacje: ['wczesniactwo', 'smierc_dziecka'],
    pomoc: 'Niezbędnik rodzica wcześniaka, wypożyczalnia sprzętu (np. monitory oddechu), program „Mentor”, grupy wsparcia, informacje o urlopach i zasiłkach.',
    strona: 'https://wczesniak.pl/',
    telefon: '+48 22 121 80 55',
  },
  {
    nazwa: 'Fundacja Nagle Sami',
    sytuacje: ['smierc_dziecka', 'poronienie'],
    pomoc: 'Bezpłatny Telefon Wsparcia (pn–pt 14:00–20:00), konsultacje i terapia psychologiczna, grupy wsparcia, poradnik dla osób po stracie.',
    strona: 'https://naglesami.org.pl/',
    telefon: '800 108 108',
  },
  {
    nazwa: 'Fundacja Warszawskie Hospicjum dla Dzieci',
    sytuacje: ['choroba_dziecka', 'smierc_dziecka'],
    pomoc: 'Domowe hospicjum dla dzieci, hospicjum perinatalne (ciąża z wadą letalną), wsparcie w żałobie dla rodziców i rodzeństwa.',
    strona: 'https://www.hospicjum.waw.pl/',
    telefon: '+48 509 797 324',
  },
  {
    nazwa: 'Fundacja Gajusz (Łódź)',
    sytuacje: ['choroba_dziecka', 'smierc_dziecka'],
    pomoc: 'Hospicjum stacjonarne i domowe dla dzieci, bezpłatne hospicjum perinatalne, sala pożegnań, wsparcie psychologiczne.',
    strona: 'https://gajusz.org.pl/',
    telefon: '722 003 003 (dyżur hospicjum perinatalnego)',
  },
  {
    nazwa: 'Fundacja Ernesta (Fundacja Medycyny Prenatalnej)',
    sytuacje: ['poronienie', 'smierc_dziecka', 'wczesniactwo'],
    pomoc: 'Bezpłatna pomoc psychologiczna i prawna po stracie ciąży, diagnostyka prenatalna.',
    strona: 'https://fundacjaernesta.pl/',
    telefon: '22 350 00 50 (wew. 1)',
    uwaga: 'Ostatnie aktualności z maja 2025 r.: warto potwierdzić telefonicznie.',
  },
  {
    nazwa: 'Fundacja Rodzić po Ludzku',
    sytuacje: ['poronienie', 'smierc_dziecka', 'choroba_dziecka'],
    pomoc: 'Prawa pacjentki po stracie ciąży (w tym zaświadczenie do ZUS), porady prawne, interwencje w szpitalach.',
    strona: 'https://rodzicpoludzku.pl/',
    uwaga: 'Kontakt e-mailowy: kontakt@rodzicpoludzku.pl',
  },
  {
    nazwa: 'Centrum Wsparcia dla Osób Dorosłych w Kryzysie Psychicznym',
    sytuacje: ['smierc_dziecka', 'poronienie', 'wczesniactwo', 'choroba_dziecka'],
    pomoc: 'Telefon całodobowy 7 dni w tygodniu, czat, e-mail, dyżury psychiatry, prawnika i pracownika socjalnego.',
    strona: 'https://centrumwsparcia.pl/',
    telefon: '800 70 2222',
  },
  {
    nazwa: 'Fundacja Hospicyjna (Gdańsk)',
    sytuacje: ['choroba_dziecka', 'smierc_dziecka'],
    pomoc: 'Hospicjum dla dzieci i dorosłych, konsultacje psychologiczne w żałobie, fundusz „Tumbo Pomaga” dla dzieci osieroconych.',
    strona: 'https://fundacjahospicyjna.pl/',
    telefon: '58 345 90 60',
  },
  {
    nazwa: 'Fundacja Herosi',
    sytuacje: ['choroba_dziecka'],
    pomoc: 'Finansowanie nierefundowanego leczenia, sprzęt i rehabilitacja dzieci z chorobą nowotworową.',
    strona: 'https://www.herosi.eu/',
    uwaga: 'Kontakt e-mailowy: fundacja@herosi.eu',
  },
  {
    nazwa: 'Fundacja Mam Marzenie',
    sytuacje: ['choroba_dziecka'],
    pomoc: 'Spełnianie marzeń dzieci ciężko i przewlekle chorych; zgłoszenia przyjmuje od rodziców.',
    strona: 'https://www.mammarzenie.org/',
    telefon: '+48 12 426 31 11',
  },
  {
    nazwa: 'Fundacja Dom Ronalda McDonalda',
    sytuacje: ['choroba_dziecka', 'wczesniactwo'],
    pomoc: 'Bezpłatne zakwaterowanie rodziców blisko dziecka w szpitalu, Pokoje Rodzinne, „Łóżka dla rodziców”.',
    strona: 'https://domronaldamcdonalda.org/',
  },
];

export const ZRODLA_OFICJALNE = [
  { nazwa: 'ZUS: zasiłki i wzory formularzy', url: 'https://www.zus.pl' },
  { nazwa: 'MRPiPS: urlop rodzicielski', url: 'https://www.gov.pl/web/rodzina/urlop-rodzicielski' },
  { nazwa: 'PIP: porady prawne – rodzicielstwo', url: 'https://www.pip.gov.pl/dla-pracodawcow/poradyprawne/rodzicielstwo' },
  { nazwa: 'MRPiPS: zmiany dla rodziców, którzy stracili dziecko', url: 'https://www.gov.pl/web/rodzina/wazne-zmiany-dla-rodzicow-ktorzy-stracili-dziecko' },
];

export const dlaSytuacji = (s: SytuacjaSzczegolna) => ORGANIZACJE.filter((o) => o.sytuacje.includes(s));
