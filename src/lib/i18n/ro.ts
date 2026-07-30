// Romanian dictionary. Filled for the Portal in Phase 3; the two Romanian-regardless
// artifacts (proces-verbal PDF, public page copy) are content, not i18n (§0 of spec).
// Diacritics: comma-below ș/ț only, never cedilla ş/ţ.

export const ro = {
  portal: {
    login: {
      title: "Scara — Portal",
      phone: "Număr de telefon",
      pin: "Cod PIN (4 cifre)",
      submit: "Intră",
      wrong: "Telefon sau PIN greșit. Mai încearcă o dată.",
    },
    today: {
      title: "Ziua mea",
      empty: "Nicio vizită programată pe azi. Zi liberă!",
      start: "Începe",
      finish: "Am terminat",
      morning: "dimineața",
      afternoon: "după-amiaza",
      hours: "h",
      checklist: "De făcut",
      photos: "Fotografii",
      addPhoto: "Adaugă fotografie",
      before: "Înainte",
      after: "După",
      issue: "Problemă",
      notes: "Observații",
      allDone: "Bravo, ai terminat tot pe azi.",
      syncing: "se sincronizează…",
      synced: "sincronizat",
      inProgress: "în lucru",
      done: "gata",
    },
    jobs: {
      title: "Joburi libere",
      empty: "Niciun job liber momentan.",
      claim: "Vreau eu",
      claimed: "în așteptare de confirmare",
      bonus: "bonus",
    },
    hours: {
      title: "Orele mele",
      visitsDone: "Vizite făcute",
      hoursWorked: "Ore lucrate",
      estimatedNet: "Estimare net luna asta",
      disclaimer: "estimativ, conform contract — cifra finală e pe fluturaș",
    },
    contract: {
      title: "Contractul meu",
      type: "Tip contract",
      hoursPerDay: "Ore pe zi",
      studentReminder: "Adu adeverința de student nouă până la {date}",
      types: {
        fulltime_min: "Normă întreagă",
        parttime_standard: "Timp parțial",
        parttime_student: "Timp parțial — student",
        parttime_pensioner: "Timp parțial — pensionar",
      },
    },
    nav: {
      today: "Azi",
      jobs: "Joburi",
      hours: "Ore",
      contract: "Contract",
      logout: "Ieși",
    },
  },
} as const;
