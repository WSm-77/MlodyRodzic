/**
 * Persony demo (issue #11): fikcyjne osoby, których „dane z ZUS” zwraca symulowany eZUS po logowaniu
 * mObywatelem. Każda pokazuje inną ścieżkę z zadania i spraw przykładowych (docs/research/sprawy-testowe.md).
 * Wszystkie imiona, PESEL-e, NIP-y i adresy są zmyślone.
 */

import { PARAMETRY_2026, type MiesiacNiepracownika, type MiesiacPracownika } from '@/silnik';
import { dodajMiesiaceDoMiesiaca } from '@/silnik/wspolne/daty';
import type { PlanRodzica, Sytuacja } from './sytuacja';

export interface Persona {
  id: string;
  /** Jednozdaniowy opis do ekranu wyboru konta. */
  opis: string;
  /** Odpowiednik w sprawach przykładowych albo w zadaniu. */
  przypadek: string;
  sytuacja: Sytuacja;
  plan?: Partial<PlanRodzica>;
}

const miesiace = (od: string, ile: number) => Array.from({ length: ile }, (_, i) => dodajMiesiaceDoMiesiaca(od, i));
const pensje = (od: string, ile: number, brutto: number): MiesiacPracownika[] => miesiace(od, ile).map((miesiac) => ({ miesiac, brutto }));
const skladki = (od: string, ile: number, podstawa: number): MiesiacNiepracownika[] =>
  miesiace(od, ile).map((miesiac) => ({ miesiac, podstawaSkladkiChorobowej: podstawa, najnizszaPodstawa: NAJNIZSZA }));

const NAJNIZSZA = PARAMETRY_2026.najnizszaPodstawaDzialalnosci.wartosc;

export const PERSONY: Persona[] = [
  {
    id: 'anna',
    opis: 'Etat w małej firmie (zasiłek wypłaca ZUS), 11 dni po porodzie, jeszcze nie wybrała wariantu 81,5%.',
    przypadek: 'zadanie b), d), g); sprawa T01',
    sytuacja: {
      zrodlo: 'zus',
      personaId: 'anna',
      rola: 'matka',
      osoba: {
        imie: 'Anna',
        nazwisko: 'Kowalczyk',
        pesel: '93041512346',
        adres: { ulica: 'Lipowa', nrDomu: '12', nrLokalu: '4', kod: '30-001', poczta: 'Kraków' },
        telefon: '600 100 200',
      },
      zdarzenie: 'urodzenie',
      etap: 'poZdarzeniu',
      dataZdarzenia: '2026-11-10',
      dzieci: [{ imie: 'Zofia', miejsceUrodzenia: 'Kraków' }],
      zaZyciem: false,
      martweUrodzenie: false,
      tytul: 'umowa_o_prace',
      pelnyEtat: true,
      poczatekUbezpieczenia: '2019-03-01',
      platnik: { nazwa: 'Pracownia Projektowa Linia sp. z o.o.', nip: '6762451122', ponad20: false },
      bruttoMiesiecznie: 680_000,
      miesiacePracownika: pensje('2025-11', 12, 680_000),
      zwolnienia: [{ od: '2026-09-01', do: '2026-09-21', kodB: true, tytul: 'umowa_o_prace' }],
      zadluzenie: null,
      drugiRodzic: { imie: 'Tomasz', nazwisko: 'Kowalczyk', pesel: '91120309876', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 820_000 },
    },
    plan: { wariant: '81_5', ojcowskiPoDniach: 28 },
  },
  {
    id: 'kasia',
    opis: 'Bliźnięta w drodze, zaświadczenie „Za życiem”, umowa na czas określony kończy się w ciąży, e-ZLA z kodem B.',
    przypadek: 'zadanie a), b), h); sprawa T12',
    sytuacja: {
      zrodlo: 'zus',
      personaId: 'kasia',
      rola: 'matka',
      osoba: {
        imie: 'Katarzyna',
        nazwisko: 'Lewandowska',
        pesel: '95082208765',
        adres: { ulica: 'Słoneczna', nrDomu: '3', kod: '60-101', poczta: 'Poznań' },
        telefon: '601 222 333',
      },
      zdarzenie: 'urodzenie',
      etap: 'ciaza',
      dataZdarzenia: '2027-01-20',
      dataPoczatkuCiazy: '2026-05-15',
      dzieci: [{ imie: '' }, { imie: '' }],
      zaZyciem: true,
      martweUrodzenie: false,
      tytul: 'umowa_o_prace',
      pelnyEtat: true,
      poczatekUbezpieczenia: '2025-01-01',
      platnik: { nazwa: 'Biuro Rachunkowe Bilans S.A.', nip: '7792233445', ponad20: true },
      bruttoMiesiecznie: 720_000,
      miesiacePracownika: pensje('2026-01', 12, 720_000),
      umowaTerminowa: { rodzaj: 'czas_okreslony', naZastepstwo: false, planowanyKoniec: '2026-12-31' },
      zwolnienia: [{ od: '2026-11-03', do: '2026-12-01', kodB: true, tytul: 'umowa_o_prace' }],
      zadluzenie: null,
      drugiRodzic: { imie: 'Adam', nazwisko: 'Lewandowski', pesel: '93010112345', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 650_000 },
    },
    plan: { tygodnieDrugiegoRodzica: 12 },
  },
  {
    id: 'ola',
    opis: 'Własna działalność, ciąża, zwolnienie z kodem B, zaległość w składkach i podwyższona podstawa w ciąży.',
    przypadek: 'zadanie a), h), zadłużenie; sprawy T04, T09',
    sytuacja: {
      zrodlo: 'zus',
      personaId: 'ola',
      rola: 'matka',
      osoba: {
        imie: 'Aleksandra',
        nazwisko: 'Kamińska',
        pesel: '90061407654',
        adres: { ulica: 'Ogrodowa', nrDomu: '27', nrLokalu: '15', kod: '00-876', poczta: 'Warszawa' },
        telefon: '602 444 555',
      },
      zdarzenie: 'urodzenie',
      etap: 'ciaza',
      dataZdarzenia: '2027-03-10',
      dataPoczatkuCiazy: '2026-06-03',
      dzieci: [{ imie: '' }],
      zaZyciem: false,
      martweUrodzenie: false,
      tytul: 'dzialalnosc',
      pelnyEtat: true,
      poczatekUbezpieczenia: '2022-03-01',
      platnik: { nazwa: 'Aleksandra Kamińska Studio Grafiki', nip: '5213344556', ponad20: false },
      bruttoMiesiecznie: 900_000,
      miesiaceNiepracownika: [...skladki('2026-02', 4, NAJNIZSZA), ...skladki('2026-06', 9, 900_000)],
      zwolnienia: [{ od: '2026-11-12', do: '2026-12-10', kodB: true, tytul: 'dzialalnosc' }],
      zadluzenie: 12_850,
      sygnalyRyzyka: { podwyzkaPodstawyWCiazy: true },
      drugiRodzic: { imie: 'Bartosz', nazwisko: 'Kamiński', pesel: '89030304567', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 800_000 },
    },
  },
  {
    id: 'pawel',
    opis: 'Tata na działalności chce wziąć ojcowski i część rodzicielskiego, ale ma zaległość w składkach.',
    przypadek: 'zadanie d), h); sprawa T04',
    sytuacja: {
      zrodlo: 'zus',
      personaId: 'pawel',
      rola: 'ojciec',
      osoba: {
        imie: 'Paweł',
        nazwisko: 'Zieliński',
        pesel: '88110506789',
        adres: { ulica: 'Kwiatowa', nrDomu: '8', kod: '80-180', poczta: 'Gdańsk' },
        telefon: '603 666 777',
      },
      zdarzenie: 'urodzenie',
      etap: 'poZdarzeniu',
      dataZdarzenia: '2026-11-01',
      dzieci: [{ imie: 'Jan', miejsceUrodzenia: 'Gdańsk' }],
      zaZyciem: false,
      martweUrodzenie: false,
      tytul: 'dzialalnosc',
      pelnyEtat: true,
      poczatekUbezpieczenia: '2021-05-01',
      platnik: { nazwa: 'Paweł Zieliński Usługi Elektryczne', nip: '5842233114', ponad20: false },
      bruttoMiesiecznie: NAJNIZSZA,
      zwolnienia: [],
      zadluzenie: 31_240,
      drugiRodzic: { imie: 'Monika', nazwisko: 'Zielińska', pesel: '90020203456', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 750_000 },
    },
    plan: { tygodnieDrugiegoRodzica: 9, ojcowskiPoDniach: 35 },
  },
  {
    id: 'marta',
    opis: 'Adopcja dwulatka, umowa zlecenia z dobrowolnym chorobowym, mąż na etacie.',
    przypadek: 'zadanie e), j)',
    sytuacja: {
      zrodlo: 'zus',
      personaId: 'marta',
      rola: 'matka',
      osoba: {
        imie: 'Marta',
        nazwisko: 'Dąbrowska',
        pesel: '87092409871',
        adres: { ulica: 'Polna', nrDomu: '41', kod: '50-001', poczta: 'Wrocław' },
        telefon: '604 888 999',
      },
      zdarzenie: 'przysposobienie',
      etap: 'poZdarzeniu',
      dataZdarzenia: '2026-11-14',
      dzieci: [{ imie: 'Kuba', dataUrodzenia: '2024-06-10', miejsceUrodzenia: 'Wrocław' }],
      zaZyciem: false,
      martweUrodzenie: false,
      tytul: 'umowa_zlecenia',
      pelnyEtat: true,
      poczatekUbezpieczenia: '2023-02-01',
      platnik: { nazwa: 'Agencja Tłumaczeń Lingwista sp. z o.o.', nip: '8992211334', ponad20: true },
      bruttoMiesiecznie: 580_000,
      zwolnienia: [],
      zadluzenie: null,
      drugiRodzic: { imie: 'Jan', nazwisko: 'Dąbrowski', pesel: '85050505432', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 900_000 },
    },
  },
  {
    id: 'ewa',
    opis: 'Martwe urodzenie: krótszy zasiłek, zasiłek pogrzebowy i kontakty do organizacji wsparcia.',
    przypadek: 'zadanie i); sprawa T02',
    sytuacja: {
      zrodlo: 'zus',
      personaId: 'ewa',
      rola: 'matka',
      osoba: {
        imie: 'Ewa',
        nazwisko: 'Wiśniewska',
        pesel: '91031801234',
        adres: { ulica: 'Leśna', nrDomu: '5', kod: '90-001', poczta: 'Łódź' },
      },
      zdarzenie: 'urodzenie',
      etap: 'poZdarzeniu',
      dataZdarzenia: '2026-11-05',
      dzieci: [{ imie: '' }],
      zaZyciem: false,
      martweUrodzenie: true,
      tytul: 'umowa_o_prace',
      pelnyEtat: true,
      poczatekUbezpieczenia: '2018-09-01',
      platnik: { nazwa: 'Hurtownia Farmaceutyczna Medica S.A.', nip: '7251122334', ponad20: true },
      bruttoMiesiecznie: 520_000,
      miesiacePracownika: pensje('2025-11', 12, 520_000),
      zwolnienia: [],
      zadluzenie: null,
      drugiRodzic: { imie: 'Michał', nazwisko: 'Wiśniewski', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 610_000 },
    },
  },
  {
    id: 'zofia',
    opis: 'ZUS wydał decyzję o niepodleganiu ubezpieczeniu: brak prawa do zasiłku, co dalej i co z partnerem.',
    przypadek: 'zadanie a), h); sprawy T07, T08',
    sytuacja: {
      zrodlo: 'zus',
      personaId: 'zofia',
      rola: 'matka',
      osoba: {
        imie: 'Zofia',
        nazwisko: 'Mazur',
        pesel: '96121205678',
        adres: { ulica: 'Długa', nrDomu: '19', kod: '20-001', poczta: 'Lublin' },
      },
      zdarzenie: 'urodzenie',
      etap: 'poZdarzeniu',
      dataZdarzenia: '2026-10-20',
      dataPoczatkuCiazy: '2026-01-13',
      dzieci: [{ imie: 'Hanna', miejsceUrodzenia: 'Lublin' }],
      zaZyciem: false,
      martweUrodzenie: false,
      tytul: 'umowa_o_prace',
      pelnyEtat: true,
      poczatekUbezpieczenia: '2026-02-02',
      okresyUbezpieczenia: [{ tytul: 'umowa_o_prace', od: '2026-02-02', do: '2026-02-01', przyczynaUstania: 'decyzja_zus_o_niepodleganiu' }],
      platnik: { nazwa: 'Firma Handlowa Polmark', nip: '9462233445', ponad20: false },
      bruttoMiesiecznie: 1_200_000,
      zwolnienia: [],
      zadluzenie: null,
      sygnalyRyzyka: { umowaZawartaWCiazy: true, dataZawarciaUmowy: '2026-02-02', wynagrodzenieZnaczniePowyzejRynkowego: true },
      drugiRodzic: { imie: 'Krzysztof', nazwisko: 'Mazur', ubezpieczony: true, tytul: 'umowa_o_prace', bruttoMiesiecznie: 640_000 },
    },
  },
];

export const persona = (id: string): Persona | undefined => PERSONY.find((p) => p.id === id);
