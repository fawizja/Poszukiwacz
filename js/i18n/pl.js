// Polski plik językowy. Aby dodać nowy język, skopiuj ten plik (np. en.js)
// i zarejestruj go w i18n.js. Rodzaj gramatyczny: m, f, n, pl.
export default {
  nav: { hero: 'Bohater', combat: 'Walka', backpack: 'Plecak', crafting: 'Crafting', settlement: 'Osada' },
  common: {
    level: 'Poziom {n}', levelShort: 'Poz. {n}', gold: 'Złoto', xp: 'PD', close: 'Zamknij', confirm: 'Potwierdź',
    cancel: 'Anuluj', ok: 'OK', cannot: 'Nie można wykonać tej akcji.'
  },
  time: { hm: '{h} godz. {m} min', ms: '{m} min {s} s', s: '{s} s' },
  intro: {
    title: 'Witaj, Poszukiwaczu!',
    text1: 'Twój bohater walczy samodzielnie — nawet gdy zamkniesz grę, wciąż przemierza krainy (do 8 godzin).',
    text2: 'Rozdawaj punkty statystyk, zakładaj lepszy ekwipunek, rozbudowuj osadę i ucz się magii żywiołów, by dotrzeć do Tronu Pustki.',
    start: 'Ruszam w drogę'
  },
  ending: {
    title: 'Pustka pokonana!',
    text: 'Władca Pustki upadł, a krainy odetchnęły z ulgą. Możesz dalej polować na legendarne łupy i rozwijać bohatera.'
  },
  hero: {
    name: 'Poszukiwacz',
    tab: { stats: 'Statystyki', skills: 'Umiejętności' },
    attributes: 'Atrybuty', points: 'Punkty: {n}', derived: 'Statystyki bojowe', buffs: 'Aktywne wzmocnienia',
    noBuffs: 'Brak aktywnych wzmocnień.', statistics: 'Kronika',
    resetStats: 'Reset atrybutów ({gold} zł.)', resetStatsTitle: 'Reset atrybutów',
    resetStatsConfirm: 'Odzyskasz wszystkie rozdane punkty za {gold} złota. Kontynuować?',
    attrDesc: {
      str: 'Zwiększa atak (+2 za punkt).',
      dex: 'Szansa na trafienie krytyczne, siła krytyka i unik.',
      int: 'Moc magii — siła umiejętności i efektów żywiołów.',
      end: 'Zdrowie (+10), obrona i regeneracja.'
    },
    stat: { kills: 'Pokonani wrogowie', bossKills: 'Pokonani bossowie', deaths: 'Porażki', goldEarned: 'Zdobyte złoto',
      itemsFound: 'Znalezione przedmioty', crafted: 'Wytworzone rzeczy', playTime: 'Czas gry' }
  },
  stat: {
    str: 'Siła', dex: 'Zręczność', int: 'Intelekt', end: 'Wytrzymałość', hp: 'Zdrowie', maxHp: 'Maks. zdrowie',
    atk: 'Atak', def: 'Obrona', magic: 'Moc magii', crit: 'Szansa na krytyk', critMult: 'Mnożnik krytyka',
    dodge: 'Unik', regen: 'Regeneracja / runda', lifesteal: 'Kradzież życia', thorns: 'Odbicie obrażeń',
    poisonChance: 'Szansa na zatrucie', fireDmg: 'Obrażenia od ognia', iceDmg: 'Obrażenia od lodu',
    earthDmg: 'Obrażenia od ziemi', goldFind: 'Znajdowanie złota', magicFind: 'Szczęście (łupy)', xpBonus: 'Bonus PD',
    atkPct: 'Atak', defPct: 'Obrona', hpPct: 'Zdrowie', magicPct: 'Moc magii', allPct: 'Wszystkie atrybuty'
  },
  rarity: { 0: 'Zwykły', 1: 'Niezwykły', 2: 'Rzadki', 3: 'Epicki', 4: 'Legendarny' },
  slot: { head: 'Głowa', chest: 'Tors', legs: 'Nogi', boots: 'Buty', weapon: 'Broń', offhand: 'Tarcza / druga ręka',
    amulet: 'Amulet', ring: 'Pierścień', ring1: 'Pierścień I', ring2: 'Pierścień II' },
  resource: { wood: 'Drewno', stone: 'Kamień', iron: 'Żelazo', herbs: 'Zioła', crystals: 'Kryształy', leather: 'Skóra', essence: 'Esencja' },
  effect: { burn: 'Podpalenie', poison: 'Trucizna', bleed: 'Krwawienie', stun: 'Ogłuszenie', freeze: 'Zamrożenie', chill: 'Wychłodzenie' },
  element: { fire: 'Ogień', ice: 'Lód', earth: 'Ziemia' },
  profession: { smithing: 'Kowalstwo', alchemy: 'Alchemia', cooking: 'Kuchnia' },

  combat: {
    locked: 'Zablokowane', levels: 'Poz. {a}–{b}', bossProgress: 'Postęp do bossa', bossReady: 'Boss gotowy!',
    challengeBoss: 'Wyzwij bossa: {name}', consumables: 'Mikstury i jedzenie', noConsumables: 'Brak przedmiotów — wytwórz je w zakładce Crafting.',
    autoPotion: 'Automatyczne mikstury (poniżej {n}% HP)', autoAdvance: 'Automatyczne przejście do nowej lokacji',
    log: 'Dziennik walki', boss: 'BOSS', respawning: 'Odpoczynek… powrót za {s} s', searching: 'Szukanie przeciwnika…', round: 'Runda {n}'
  },
  log: {
    enemyAppears: 'Pojawia się {name} (poz. {level}).',
    bossAppears: '⚔ BOSS: {name} (poz. {level}) staje do walki!',
    travel: 'Wyruszasz do: {name}.',
    heroHit: 'Zadajesz {dmg} obrażeń ({name}).',
    heroCrit: 'TRAFIENIE KRYTYCZNE! {dmg} obrażeń ({name}).',
    skill: '{skill}: {dmg} obrażeń.',
    skillCrit: '{skill}: KRYTYK! {dmg} obrażeń.',
    enemyDodge: '{name} unika ciosu.',
    heroDodge: 'Unikasz ataku ({name}).',
    enemyHit: '{name} zadaje ci {dmg} obrażeń.',
    enemyStunned: '{name} nie może się ruszyć.',
    heroStunned: 'Jesteś ogłuszony i tracisz turę.',
    thorns: 'Kolce odbijają {dmg} obrażeń.',
    effect: { burn: '{name} płonie!', poison: '{name} zostaje zatruty.', bleed: '{name} krwawi.', stun: '{name} zostaje ogłuszony!',
      freeze: '{name} zamarza!', chill: '{name} zostaje wychłodzony.' },
    heroEffect: { burn: 'Płoniesz!', poison: 'Zostajesz zatruty!', bleed: 'Krwawisz!', stun: 'Zostajesz ogłuszony!' },
    dot: { burn: 'Ogień pali: {dmg} ({name}).', poison: 'Trucizna: {dmg} ({name}).', bleed: 'Krwawienie: {dmg} ({name}).' },
    heroDot: { burn: 'Ogień parzy cię: {dmg}.', poison: 'Trucizna: tracisz {dmg} HP.', bleed: 'Krwawienie: tracisz {dmg} HP.' },
    potion: 'Używasz: {name}.',
    victory: 'Pokonano: {name}! +{xp} PD, +{gold} złota.',
    loot: 'Łup: {name} [{rarity}].',
    lootSold: 'Plecak pełny — łup sprzedany za {gold} złota.',
    resource: 'Zebrano: {n}× {name}.',
    unlocked: 'Odblokowano nową lokację: {name}!',
    bossReady: 'Strażnik tej krainy czeka na wyzwanie!',
    defeat: 'Przegrywasz z: {name}. Musisz odpocząć.',
    defeatBoss: '{name} okazał się zbyt silny. Wzmocnij się i wyzwij go ponownie.',
    respawn: 'Wracasz do sił i ruszasz dalej.'
  },
  location: {
    forest: { name: 'Szepczący Las', desc: 'Stare drzewa szumią o tych, którzy zabłądzili.' },
    swamp: { name: 'Mgliste Bagna', desc: 'Gęsta mgła skrywa jadowite stwory i zdradliwe topiele.' },
    hills: { name: 'Kamienne Wzgórza', desc: 'Wietrzne zbocza pełne goblinów i ożywionych skał.' },
    catacombs: { name: 'Zapomniane Katakumby', desc: 'Pod ziemią śpią ci, którzy nie powinni się budzić.' },
    ashlands: { name: 'Popielne Pustkowia', desc: 'Spalona ziemia, na której nawet wiatr parzy.' },
    pass: { name: 'Lodowa Przełęcz', desc: 'Szlak skuty wiecznym lodem, strzeżony przez mroźne bestie.' },
    depths: { name: 'Kryształowe Głębiny', desc: 'Jaskinie lśniące kryształami, które śpiewają w ciemności.' },
    void: { name: 'Tron Pustki', desc: 'Miejsce, gdzie kończy się świat i zaczyna nicość.' }
  },
  enemy: {
    f_wolf: 'Szary wilk', f_boar: 'Rozjuszony dzik', f_sprite: 'Leśny chochlik', f_spider: 'Pająk mchowy',
    f_bandit: 'Leśny zbój', f_shroom: 'Wędrujący grzyb', f_boss: 'Stary Korzeniec',
    s_toad: 'Jadowita ropucha', s_leech: 'Olbrzymia pijawka', s_wisp: 'Błędny ognik', s_croc: 'Bagienny gad',
    s_hag: 'Wiedźma trzcin', s_drowned: 'Topielec', s_boss: 'Matka Mgieł',
    h_slinger: 'Gobliński procarz', h_golem: 'Mały golem', h_harpy: 'Harpia', h_troll: 'Troll wzgórz',
    h_ram: 'Pancerny baran', h_shaman: 'Gobliński szaman', h_boss: 'Król Skały Grumm',
    c_skeleton: 'Szkielet strażnik', c_ghoul: 'Ghul', c_bat: 'Krwawy nietoperz', c_cultist: 'Kultysta cienia',
    c_wraith: 'Upiór', c_rats: 'Szczurzy rój', c_boss: 'Kapłan Bez Twarzy',
    a_salamander: 'Salamandra', a_imp: 'Ognisty bies', a_scorpion: 'Skorpion żaru', a_nomad: 'Popielny koczownik',
    a_magma: 'Żywiołak magmy', a_vulture: 'Sęp popiołu', a_boss: 'Pożeracz Słońca',
    i_giant: 'Śnieżny olbrzym', i_wolf: 'Wilk szronu', i_witch: 'Lodowa wiedźma', i_knight: 'Zamarznięty rycerz',
    i_owl: 'Sowa zamieci', i_golem: 'Golem lodu', i_boss: 'Strażniczka Wiecznej Zimy',
    d_crawler: 'Kryształowy pełzacz', d_mimic: 'Mimik', d_lurker: 'Ślepy czyhacz', d_mage: 'Mag rezonansu',
    d_worm: 'Czerw głębin', d_sentinel: 'Kryształowy wartownik', d_boss: 'Serce Głębin',
    v_shade: 'Cień pustki', v_knight: 'Rycerz otchłani', v_eye: 'Oko bezkresu', v_devourer: 'Pożeracz gwiazd',
    v_herald: 'Zwiastun końca', v_twin: 'Bliźniak zmierzchu', v_boss: 'Władca Pustki'
  },
  // Nazwy typów bazowych wg poziomu (tier 0–4) z rodzajem gramatycznym
  base: {
    sword: [{ n: 'Krótki miecz', g: 'm' }, { n: 'Miecz najemnika', g: 'm' }, { n: 'Miecz rycerski', g: 'm' }, { n: 'Miecz runiczny', g: 'm' }, { n: 'Miecz gwiazd', g: 'm' }],
    axe: [{ n: 'Siekiera drwala', g: 'f' }, { n: 'Topór bojowy', g: 'm' }, { n: 'Topór berserkera', g: 'm' }, { n: 'Topór runiczny', g: 'm' }, { n: 'Topór burzy', g: 'm' }],
    dagger: [{ n: 'Nóż myśliwski', g: 'm' }, { n: 'Sztylet', g: 'm' }, { n: 'Sztylet skrytobójcy', g: 'm' }, { n: 'Sztylet cienia', g: 'm' }, { n: 'Kieł zmierzchu', g: 'm' }],
    staff: [{ n: 'Kij wędrowca', g: 'm' }, { n: 'Kostur ucznia', g: 'm' }, { n: 'Kostur maga', g: 'm' }, { n: 'Kostur arcymaga', g: 'm' }, { n: 'Kostur gwiezdny', g: 'm' }],
    shield: [{ n: 'Drewniana tarcza', g: 'f' }, { n: 'Okuta tarcza', g: 'f' }, { n: 'Tarcza rycerska', g: 'f' }, { n: 'Tarcza runiczna', g: 'f' }, { n: 'Tarcza bastionu', g: 'f' }],
    tome: [{ n: 'Notatnik zielarza', g: 'm' }, { n: 'Księga zaklęć', g: 'f' }, { n: 'Księga mędrca', g: 'f' }, { n: 'Księga runiczna', g: 'f' }, { n: 'Księga gwiazd', g: 'f' }],
    helm: [{ n: 'Skórzany kaptur', g: 'm' }, { n: 'Hełm żołnierski', g: 'm' }, { n: 'Hełm rycerski', g: 'm' }, { n: 'Hełm runiczny', g: 'm' }, { n: 'Korona gwiazd', g: 'f' }],
    armor: [{ n: 'Pikowany kaftan', g: 'm' }, { n: 'Kolczuga', g: 'f' }, { n: 'Zbroja płytowa', g: 'f' }, { n: 'Zbroja runiczna', g: 'f' }, { n: 'Zbroja gwiazd', g: 'f' }],
    greaves: [{ n: 'Skórzane spodnie', g: 'pl' }, { n: 'Nogawice kolcze', g: 'pl' }, { n: 'Nagolenniki płytowe', g: 'pl' }, { n: 'Nagolenniki runiczne', g: 'pl' }, { n: 'Nagolenniki gwiazd', g: 'pl' }],
    boots: [{ n: 'Łapcie', g: 'pl' }, { n: 'Buty podróżne', g: 'pl' }, { n: 'Buty kawalerzysty', g: 'pl' }, { n: 'Buty runiczne', g: 'pl' }, { n: 'Buty gwiazd', g: 'pl' }],
    amulet: [{ n: 'Kościany amulet', g: 'm' }, { n: 'Srebrny amulet', g: 'm' }, { n: 'Złoty amulet', g: 'm' }, { n: 'Amulet runiczny', g: 'm' }, { n: 'Amulet gwiazd', g: 'm' }],
    ring: [{ n: 'Miedziany pierścień', g: 'm' }, { n: 'Srebrny pierścień', g: 'm' }, { n: 'Złoty pierścień', g: 'm' }, { n: 'Pierścień runiczny', g: 'm' }, { n: 'Pierścień gwiazd', g: 'm' }]
  },
  prefix: {
    sharp: { m: 'Ostry', f: 'Ostra', n: 'Ostre', pl: 'Ostre' },
    sturdy: { m: 'Solidny', f: 'Solidna', n: 'Solidne', pl: 'Solidne' },
    vital: { m: 'Żywotny', f: 'Żywotna', n: 'Żywotne', pl: 'Żywotne' },
    precise: { m: 'Precyzyjny', f: 'Precyzyjna', n: 'Precyzyjne', pl: 'Precyzyjne' },
    swift: { m: 'Zwinny', f: 'Zwinna', n: 'Zwinne', pl: 'Zwinne' },
    arcane: { m: 'Tajemny', f: 'Tajemna', n: 'Tajemne', pl: 'Tajemne' },
    venomous: { m: 'Jadowity', f: 'Jadowita', n: 'Jadowite', pl: 'Jadowite' },
    blazing: { m: 'Płonący', f: 'Płonąca', n: 'Płonące', pl: 'Płonące' },
    frozen: { m: 'Mroźny', f: 'Mroźna', n: 'Mroźne', pl: 'Mroźne' },
    earthen: { m: 'Kamienny', f: 'Kamienna', n: 'Kamienne', pl: 'Kamienne' },
    vampiric: { m: 'Wampirzy', f: 'Wampirza', n: 'Wampirze', pl: 'Wampirze' }
  },
  suffix: {
    bear: 'Niedźwiedzia', fox: 'Lisa', owl: 'Sowy', ox: 'Tura', fortune: 'Fortuny', seeker: 'Poszukiwacza',
    sage: 'Mędrca', troll: 'Trolla', thorns: 'Cierni'
  },
  consumable: {
    hp_small: { name: 'Mała mikstura leczenia', desc: 'Przywraca 30% maks. zdrowia.' },
    hp_medium: { name: 'Mikstura leczenia', desc: 'Przywraca 50% maks. zdrowia.' },
    hp_large: { name: 'Wielka mikstura leczenia', desc: 'Przywraca 80% maks. zdrowia.' },
    elixir_str: { name: 'Eliksir siły', desc: '+15% ataku przez 10 minut.' },
    elixir_stone: { name: 'Eliksir kamiennej skóry', desc: '+20% obrony przez 10 minut.' },
    elixir_mind: { name: 'Eliksir jasnego umysłu', desc: '+25% mocy magii przez 10 minut.' },
    elixir_fortune: { name: 'Eliksir fortuny', desc: '+25% złota i szczęścia przez 15 minut.' },
    food_stew: { name: 'Gulasz myśliwego', desc: '+10% PD przez 15 minut.' },
    food_fish: { name: 'Pstrąg z ziołami', desc: '+6 regeneracji na rundę przez 15 minut.' },
    food_pie: { name: 'Placek z dziczyzną', desc: '+15% zdrowia przez 20 minut.' },
    food_feast: { name: 'Uczta bohatera', desc: '+10% wszystkich atrybutów i +10% PD przez 30 minut.' }
  },
  recipe: {
    smith_weapon: { name: 'Wykuj broń', desc: 'Broń na twoim poziomie, co najmniej Niezwykła.' },
    smith_armor: { name: 'Wykuj pancerz', desc: 'Losowa część zbroi, co najmniej Niezwykła.' },
    smith_offhand: { name: 'Wykuj drugą rękę', desc: 'Tarcza lub księga, co najmniej Niezwykła.' },
    smith_jewel: { name: 'Oprawa klejnotu', desc: 'Amulet lub pierścień, co najmniej Rzadki.' },
    smith_essence: { name: 'Destylacja esencji', desc: 'Przetapia żelazo i kamień na 3 esencje.' },
    smith_masterwork: { name: 'Arcydzieło kowala', desc: 'Dowolny przedmiot, co najmniej Epicki.' },
    alch_hp_small: { name: 'Mała mikstura leczenia', desc: 'Tworzy 2 sztuki.' },
    alch_hp_medium: { name: 'Mikstura leczenia', desc: 'Tworzy 2 sztuki.' },
    alch_elixir_str: { name: 'Eliksir siły', desc: '+15% ataku na 10 minut.' },
    alch_elixir_stone: { name: 'Eliksir kamiennej skóry', desc: '+20% obrony na 10 minut.' },
    alch_hp_large: { name: 'Wielka mikstura leczenia', desc: 'Tworzy 2 sztuki.' },
    alch_elixir_mind: { name: 'Eliksir jasnego umysłu', desc: '+25% mocy magii na 10 minut.' },
    alch_elixir_fortune: { name: 'Eliksir fortuny', desc: '+25% złota i szczęścia na 15 minut.' },
    cook_stew: { name: 'Gulasz myśliwego', desc: '+10% PD na 15 minut.' },
    cook_fish: { name: 'Pstrąg z ziołami', desc: '+6 regeneracji na 15 minut.' },
    cook_pie: { name: 'Placek z dziczyzną', desc: '+15% zdrowia na 20 minut.' },
    cook_feast: { name: 'Uczta bohatera', desc: '+10% atrybutów i PD na 30 minut.' }
  },
  building: {
    townhall: { name: 'Ratusz', desc: 'Serce osady. Ogranicza poziom pozostałych budynków (maks. poziom Ratusza + 1).',
      bonus: '+{xpPct}% PD, +{goldPct}% złota, AFK {afk}%' },
    forge: { name: 'Kuźnia', desc: 'Odblokowuje kowalstwo i ulepszanie przedmiotów.', bonus: 'ulepszenia do +{maxUpgrade}' },
    lab: { name: 'Laboratorium', desc: 'Odblokowuje alchemię. Wzmacnia mikstury leczenia.', bonus: '+{potionPct}% siły leczenia' },
    kitchen: { name: 'Kuchnia', desc: 'Odblokowuje gotowanie. Wydłuża działanie wzmocnień.', bonus: '+{buffDurPct}% czasu wzmocnień' },
    warehouse: { name: 'Magazyn', desc: 'Powiększa plecak bohatera.', bonus: '+{backpack} miejsc w plecaku' },
    market: { name: 'Targ', desc: 'Lepsze ceny sprzedaży i zakup surowców za złoto.', bonus: '+{sellPct}% ceny sprzedaży' }
  },
  skill: {
    fire_spark: { name: 'Iskra', desc: 'Zadaje {magic}% mocy magii, {chance}% szans na podpalenie ({power}% magii/rundę). Odnowienie: {cd} rund.' },
    fire_ember: { name: 'Wewnętrzny żar', desc: '+{v1}% obrażeń od ognia i +{v2}% mocy magii.' },
    fire_ball: { name: 'Kula ognia', desc: 'Zadaje {magic}% magii + {atk}% ataku i zawsze podpala. Odnowienie: {cd} rund.' },
    fire_rage: { name: 'Wrzący gniew', desc: '+{v1}% szansy na krytyk; krytyki podpalają wroga ({flag}% magii/rundę).' },
    fire_meteor: { name: 'Deszcz meteorów', desc: 'Zadaje {magic}% magii + {atk}% ataku, silnie podpala i może ogłuszyć. Odnowienie: {cd} rund.' },
    ice_shard: { name: 'Lodowy odłamek', desc: 'Zadaje {magic}% magii; {chance}% szans na wychłodzenie (wróg zadaje -{power}% obrażeń). Odnowienie: {cd} rund.' },
    ice_armor: { name: 'Mroźny pancerz', desc: '+{v1}% obrony i +{v2}% obrażeń od lodu.' },
    ice_freeze: { name: 'Zamrożenie', desc: 'Zadaje {magic}% magii; {chance}% szans na zamrożenie wroga. Odnowienie: {cd} rund.' },
    ice_heart: { name: 'Kryształowe serce', desc: '+{v1}% zdrowia i +{v2} regeneracji na rundę.' },
    ice_winter: { name: 'Wieczna zima', desc: 'Zadaje {magic}% magii, zamraża na {turns} rundy i wychładza wroga. Odnowienie: {cd} rund.' },
    earth_fist: { name: 'Kamienna pięść', desc: 'Zadaje {magic}% magii + {atk}% ataku; {chance}% szans na ogłuszenie. Odnowienie: {cd} rund.' },
    earth_skin: { name: 'Skóra głazu', desc: '+{v1} obrony, +{v2}% obrony i +{v3}% obrażeń od ziemi.' },
    earth_quake: { name: 'Wstrząs', desc: 'Zadaje {magic}% magii + {atk}% ataku; może ogłuszyć i wywołać krwawienie. Odnowienie: {cd} rund.' },
    earth_roots: { name: 'Pradawne korzenie', desc: '+{v1}% kradzieży życia i +{v2}% odbicia obrażeń.' },
    earth_wrath: { name: 'Gniew gór', desc: 'Zadaje {magic}% magii + {def}% obrony i ogłusza na {turns} rundy. Odnowienie: {cd} rund.' }
  },
  synergy: {
    steam: { name: 'Para', desc: '+15% mocy magii.' },
    magma: { name: 'Magma', desc: 'Podpaleni wrogowie mają -15% obrony; +5% obrony.' },
    permafrost: { name: 'Wieczna zmarzlina', desc: 'Ogłuszenia i zamrożenia trwają o 1 rundę dłużej; +5% zdrowia.' },
    harmony: { name: 'Harmonia żywiołów', desc: '+10% wszystkich atrybutów.' }
  },
  skills: {
    title: 'Magia żywiołów', points: 'Punkty: {n}', learn: 'Naucz',
    hint: 'Punkt umiejętności otrzymujesz co {n} poziomy. Umiejętności aktywne są używane automatycznie w walce.',
    reset: 'Zapomnij umiejętności ({gold} zł.)', resetTitle: 'Reset umiejętności',
    resetConfirm: 'Odzyskasz wszystkie punkty umiejętności za {gold} złota. Kontynuować?',
    synergies: 'Synergie', synergyReq: 'Wymaga: {n} pkt. w: {list}', learned: 'Poznano: {name}',
    type: { active: 'aktywna', passive: 'pasywna' },
    reason: { level: 'Wymaga poziomu {n}.', prev: 'Wymaga poprzedniej umiejętności.', points: 'Brak punktów umiejętności.', unknown: '' }
  },
  inventory: {
    equipment: 'Ekwipunek', resources: 'Surowce', consumables: 'Mikstury i jedzenie', backpack: 'Plecak',
    sort: 'Sortowanie', sortBy: { rarity: 'Wg rzadkości', level: 'Wg poziomu', slot: 'Wg rodzaju', power: 'Wg siły' },
    sellCommon: 'Sprzedaj zwykłe', sellUncommon: 'Sprzedaj do niezwykłych', use: 'Użyj',
    hint: 'Dotknij przedmiotu, aby zobaczyć szczegóły i porównanie. Zablokowane przedmioty nie są sprzedawane hurtowo.',
    full: 'Plecak jest pełny!', used: 'Użyto: {name}', sellAllTitle: 'Sprzedaż hurtowa',
    sellAllConfirm0: 'Sprzedać wszystkie niezablokowane zwykłe przedmioty?',
    sellAllConfirm1: 'Sprzedać wszystkie niezablokowane zwykłe i niezwykłe przedmioty?',
    soldAll: 'Sprzedano {n} przedm. za {gold} złota.'
  },
  item: {
    equip: 'Załóż', equipTo: 'Załóż ({slot})', unequip: 'Zdejmij', lock: 'Zablokuj', unlock: 'Odblokuj',
    sell: 'Sprzedaj ({gold} zł.)', salvage: 'Rozbierz (+{essence} esencji)', crafted: 'wykuty',
    power: 'Siła przedmiotu', vsEquipped: 'względem założonego', emptySlot: 'Pusty slot — warto założyć!',
    compareWith: 'Porównaj z', upgrade: 'Ulepszenie', upgradeBtn: 'Ulepsz (+{pct}% statystyk bazowych)',
    needForge: 'Zbuduj Kuźnię w Osadzie, aby ulepszać przedmioty.', maxUpgrade: 'Osiągnięto limit ulepszeń — rozbuduj Kuźnię.',
    upgraded: 'Przedmiot ulepszony!', sold: 'Sprzedano za {gold} złota.', salvaged: 'Odzyskano {essence} esencji.',
    sellConfirmTitle: 'Cenny przedmiot', salvageConfirmTitle: 'Cenny przedmiot',
    sellConfirm: 'To rzadki łup. Na pewno chcesz się go pozbyć?'
  },
  crafting: {
    queue: 'Kolejka (maks. 3)', recipes: 'Receptury', craft: 'Wytwórz', cancel: 'Anuluj', emptySlot: 'Wolne miejsce',
    waiting: 'Oczekuje…', maxLevel: 'Maksymalny poziom', needBuilding: 'Wymaga: {name} poz. {n}',
    profHint: 'Każdy poziom profesji skraca czas pracy o {pct}%.', buildFirst: 'Najpierw zbuduj: {name}.',
    started: 'Rozpoczęto: {name}'
  },
  settlement: {
    title: 'Osada', hint: 'Budynki dają stałe bonusy i odblokowują rzemiosło. Surowce zdobywasz w walce.',
    level: 'Poz. {n}/{max}', current: 'Obecnie', next: 'Następny poziom', notBuilt: 'nie zbudowano', maxed: 'Maksymalny poziom!',
    needTownhall: 'Najpierw rozbuduj Ratusz (wymagany poz. {n}).', build: 'Zbuduj', upgrade: 'Rozbuduj',
    built: '{name}: poziom {n}!', marketTitle: 'Targ — zakup surowców', marketHint: 'Każdy poziom Targu powyżej pierwszego obniża ceny o 5%.',
    pricePer: '{gold} zł./szt.', marketLocked: 'Zbuduj Targ, aby kupować surowce za złoto.'
  },
  settings: {
    title: 'Ustawienia', volume: 'Głośność', batterySaver: 'Oszczędzanie baterii',
    batterySaverDesc: 'Wyłącza animacje i rzadziej odświeża ekran.', saveTitle: 'Zapis gry', saveNow: 'Zapisz teraz',
    export: 'Eksportuj zapis', copy: 'Kopiuj', import: 'Importuj zapis', importPlaceholder: 'Tu pojawi się kod zapisu lub wklej własny…',
    dangerTitle: 'Strefa niebezpieczna', reset: 'Zresetuj grę',
    about: 'Poszukiwacz — gra offline. Postęp zapisywany automatycznie co 30 sekund w pamięci przeglądarki.',
    saved: 'Gra zapisana.', copied: 'Skopiowano do schowka.', nothingToCopy: 'Najpierw wyeksportuj lub wklej zapis.',
    importConfirmTitle: 'Import zapisu', importConfirm: 'Obecny postęp zostanie zastąpiony. Kontynuować?',
    imported: 'Zapis wczytany!', importError: 'Nieprawidłowy kod zapisu.',
    resetTitle: 'Reset gry', resetConfirm1: 'Cały postęp zostanie usunięty. Czy na pewno?',
    resetConfirm2: 'To ostatnie ostrzeżenie — tej operacji nie można cofnąć!', resetFinal: 'Usuń wszystko',
    resetDone: 'Rozpoczęto nową grę.', restoredBackup: 'Główny zapis był uszkodzony — przywrócono kopię zapasową.'
  },
  afk: {
    title: 'Raport z wyprawy', away: 'Nie było cię przez {time}.', capped: '(nagrody naliczono za maks. 8 godzin)',
    kills: 'Pokonani wrogowie', xp: 'Zdobyte PD', levels: 'Nowe poziomy', gold: 'Zdobyte złoto', items: 'Znalezione przedmioty',
    converted: '{n} przedm. nie zmieściło się w plecaku i zamieniono je na esencję.', crafted: 'Ukończone rzemiosło',
    bossReady: 'Boss lokacji czeka na wyzwanie!', nothing: 'Twój bohater nie zdołał nikogo pokonać.',
    collect: 'Odbierz', clockWarning: 'Wykryto cofnięcie zegara systemowego. Nagrody offline nie zostały przyznane.'
  },
  toast: {
    levelUp: 'Awans! Poziom {n}', unlocked: 'Nowa lokacja: {name}', rareLoot: 'Cenny łup: {name}',
    crafted: 'Gotowe: {name}', profLevel: '{name}: poziom {n}', saveError: 'Nie udało się zapisać gry!'
  }
};
