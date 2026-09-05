-- Add 100 questions based on the supplied Polish football history facts (4 September 2026).
-- Mix recall, clue identification, completion, chronology, matching and score arithmetic
-- within the existing four-option, single-answer quiz format.
-- Correct answers are evenly distributed across a, b, c and d (25 each).
-- The supplied facts contain source labels but no URLs, so source_url is null.
insert into public.quiz_questions (
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_option,
  difficulty,
  topic,
  explanation,
  source_url
) values
  (
    'Kiedy założono Polski Związek Piłki Nożnej?',
    '1921', '1923', '1927', '1919', 'd', 'easy', 'historia polskiej piłki',
    'PZPN powstał w Warszawie 20–21 grudnia 1919 roku.', null
  ),
  (
    'Który klub został pierwszym uznanym mistrzem niepodległej Polski?',
    'Wisła Kraków', 'Polonia Warszawa', 'Górnik Zabrze', 'Cracovia', 'd', 'easy', 'historia polskiej piłki',
    'Cracovia wygrała pierwsze ukończone mistrzostwa Polski w 1921 roku.', null
  ),
  (
    'Uzupełnij zdanie: pierwszy mecz reprezentacji Polski w 1921 roku rozegrano przeciwko…',
    'Szwecji', 'Norwegii', 'Czechosłowacji', 'Węgrom', 'd', 'medium', 'historia polskiej piłki',
    'Polska zadebiutowała 18 grudnia 1921 roku w Budapeszcie, przegrywając z Węgrami 0:1.', null
  ),
  (
    'W jaki sposób Józef Klotz zdobył pierwszą bramkę w historii reprezentacji Polski?',
    'Z rzutu wolnego', 'Z rzutu karnego', 'Strzałem głową', 'Bezpośrednio z rzutu rożnego', 'b', 'medium', 'historia polskiej piłki',
    'Józef Klotz wykorzystał rzut karny w wygranym 2:1 meczu ze Szwecją 28 maja 1922 roku.', null
  ),
  (
    'Co wydarzyło się wcześniej niż rozpoczęcie rozgrywek ligowych w Polsce w 1927 roku?',
    'Debiut Polski na mundialu', 'Cztery gole Wilimowskiego z Brazylią', 'Przystąpienie PZPN do FIFA', 'Pięć kolejnych tytułów Górnika Zabrze', 'c', 'medium', 'historia polskiej piłki',
    'PZPN dołączył do FIFA w 1923 roku, cztery lata przed rozpoczęciem rozgrywek ligowych.', null
  ),
  (
    'W którym mieście Polska zadebiutowała w olimpijskim turnieju piłkarskim w 1924 roku?',
    'W Amsterdamie', 'W Paryżu', 'W Berlinie', 'W Londynie', 'b', 'medium', 'historia polskiej piłki',
    'Polski debiut olimpijski odbył się w Paryżu w 1924 roku; reprezentacja przegrała z Węgrami 0:5.', null
  ),
  (
    'Uzupełnij zdanie: regularne rozgrywki ligowe w Polsce rozpoczęły się w roku…',
    '1919', '1927', '1921', '1938', 'b', 'medium', 'historia polskiej piłki',
    'W 1927 roku rozpoczęto regularne rozgrywki ligowe, zastępujące wcześniejszy system turniejowy mistrzostw.', null
  ),
  (
    'Polska pokonała Jugosławię 4:0 i przegrała rewanż 0:1. Jaki był łączny wynik tego dwumeczu eliminacji MŚ 1938 dla Polski?',
    '4:0', '3:1', '5:1', '4:1', 'd', 'medium', 'historia polskiej piłki',
    'Wyniki 4:0 i 0:1 dały Polsce zwycięstwo 4:1 w dwumeczu oraz awans na pierwszy mundial.', null
  ),
  (
    'Rozpoznaj piłkarza: na mundialu w 1938 roku strzelił Brazylii cztery gole.',
    'Ernest Wilimowski', 'Ernest Pohl', 'Gerard Cieślik', 'Włodzimierz Lubański', 'a', 'easy', 'historia polskiej piłki',
    'Ernest Wilimowski zdobył cztery bramki w przegranym po dogrywce 5:6 meczu z Brazylią 5 czerwca 1938 roku.', null
  ),
  (
    'Z którym rywalem Polska zagrała w 1947 roku w swoim pierwszym powojennym meczu reprezentacji?',
    'Z Węgrami', 'Z Francją', 'Z Brazylią', 'Z Norwegią', 'd', 'hard', 'historia polskiej piłki',
    'Mecz z Norwegią w 1947 roku oznaczał powrót reprezentacji Polski do gry po drugiej wojnie światowej.', null
  ),
  (
    'Kto zdobył obie polskie bramki w zwycięstwie 2:1 nad ZSRR w Chorzowie w 1957 roku?',
    'Gerard Cieślik', 'Ernest Pohl', 'Kazimierz Deyna', 'Lucjan Brychczy', 'a', 'medium', 'historia polskiej piłki',
    'Gerard Cieślik strzelił dwa gole w meczu eliminacji mistrzostw świata z ZSRR 20 października 1957 roku.', null
  ),
  (
    'Polska wygrała z Tunezją 6:1 na igrzyskach w 1960 roku. Ile polskich goli zdobył Ernest Pohl?',
    'Trzy', 'Cztery', 'Pięć', 'Sześć', 'c', 'hard', 'historia polskiej piłki',
    'Ernest Pohl zdobył pięć z sześciu polskich bramek w olimpijskim meczu z Tunezją.', null
  ),
  (
    'Dopasuj klub do trofeum: kto wygrał Międzynarodowy Puchar Piłkarski w 1965 roku?',
    'Legia Warszawa', 'Polonia Bytom', 'Ruch Chorzów', 'Stal Mielec', 'b', 'hard', 'historia polskiej piłki',
    'Polonia Bytom zdobyła Międzynarodowy Puchar Piłkarski w 1965 roku, odnosząc jeden z pierwszych międzynarodowych sukcesów polskich klubów.', null
  ),
  (
    'Górnik Zabrze był mistrzem Polski w każdym roku od 1963 do 1967 włącznie. Ile kolejnych tytułów zdobył?',
    'Cztery', 'Pięć', 'Sześć', 'Siedem', 'b', 'easy', 'historia polskiej piłki',
    'Tytuły z lat 1963, 1964, 1965, 1966 i 1967 tworzą serię pięciu kolejnych mistrzostw Górnika.', null
  ),
  (
    'Którego rywala Górnik Zabrze wyeliminował z Pucharu Europy w 1967 roku po zwycięstwie 2:1 w Kijowie?',
    'Dynamo Kijów', 'Spartak Moskwa', 'Feyenoord', 'Atlético Madryt', 'a', 'hard', 'historia polskiej piłki',
    'Górnik wyeliminował Dynamo Kijów, a jednym z kluczowych wyników było wyjazdowe zwycięstwo 2:1.', null
  ),
  (
    'Które zdanie poprawnie opisuje mecz Górnika Zabrze z Manchesterem United 13 marca 1968 roku?',
    'Górnik wygrał 1:0, ale odpadł w dwumeczu', 'Górnik wygrał 1:0 i awansował do finału', 'Górnik przegrał 0:1 i odpadł w dwumeczu', 'Górnik zremisował 0:0 i awansował po karnych', 'a', 'hard', 'historia polskiej piłki',
    'Górnik pokonał Manchester United 1:0, lecz do kolejnej rundy awansował angielski klub, późniejszy zdobywca Pucharu Europy.', null
  ),
  (
    'Kto zatrzymał Legię Warszawa w półfinale Pucharu Europy w 1970 roku?',
    'Ajax', 'Manchester City', 'Feyenoord', 'Liverpool', 'c', 'hard', 'historia polskiej piłki',
    'Legia dotarła do półfinału Pucharu Europy w 1970 roku, gdzie odpadła z późniejszym triumfatorem, Feyenoordem.', null
  ),
  (
    'W których rozgrywkach Górnik Zabrze zagrał w finale przeciwko Manchesterowi City w 1970 roku?',
    'W Pucharze Europy', 'W Pucharze UEFA', 'W Pucharze Zdobywców Pucharów', 'W Pucharze Intertoto', 'c', 'medium', 'historia polskiej piłki',
    'Górnik przegrał 1:2 z Manchesterem City w finale Pucharu Zdobywców Pucharów w 1970 roku.', null
  ),
  (
    'Co ostatecznie rozstrzygnęło półfinał Górnika Zabrze z AS Romą w 1970 roku?',
    'Seria rzutów karnych', 'Rzut monetą', 'Złoty gol', 'Walkower za niestawienie się rywala', 'b', 'easy', 'historia polskiej piłki',
    'Po trzech remisowych spotkaniach awans Górnika do finału Pucharu Zdobywców Pucharów rozstrzygnął rzut monetą.', null
  ),
  (
    'Dlaczego Atlético Madryt awansowało kosztem Legii w ćwierćfinale Pucharu Europy w 1971 roku przy łącznym wyniku 2:2?',
    'Dzięki bramkom zdobytym na wyjeździe', 'Dzięki zwycięstwu w rzutach karnych', 'Dzięki losowaniu', 'Dzięki bramce w dogrywce trzeciego meczu', 'a', 'hard', 'historia polskiej piłki',
    'Przy remisie 2:2 w dwumeczu o awansie Atlético przesądziła obowiązująca wówczas zasada bramek wyjazdowych.', null
  ),
  (
    'Jaki medal zdobyła drużyna Kazimierza Górskiego na igrzyskach w Monachium w 1972 roku?',
    'Srebrny', 'Złoty', 'Brązowy', 'Nie zdobyła medalu', 'b', 'easy', 'historia polskiej piłki',
    'Polska zdobyła złoto po zwycięstwie 2:1 nad Węgrami w finale; obie bramki strzelił Kazimierz Deyna.', null
  ),
  (
    'Dopasuj zawodnika do osiągnięcia: kto został królem strzelców igrzysk w 1972 roku z dziewięcioma golami?',
    'Grzegorz Lato', 'Andrzej Szarmach', 'Andrzej Juskowiak', 'Kazimierz Deyna', 'd', 'medium', 'historia polskiej piłki',
    'Kazimierz Deyna zdobył dziewięć bramek w olimpijskim turnieju w Monachium i został jego królem strzelców.', null
  ),
  (
    'Która para zdobyła bramki w wygranym 2:0 meczu Polski z Anglią w Chorzowie w 1973 roku?',
    'Robert Gadocha i Włodzimierz Lubański', 'Jan Domarski i Grzegorz Lato', 'Kazimierz Deyna i Andrzej Szarmach', 'Gerard Cieślik i Ernest Pohl', 'a', 'hard', 'historia polskiej piłki',
    '6 czerwca 1973 roku gole strzelili Robert Gadocha i Włodzimierz Lubański; Lubański doznał też kontuzji, która wykluczyła go z mundialu w 1974 roku.', null
  ),
  (
    'Dlaczego remis 1:1 na Wembley w 1973 roku nazwano „zwycięskim remisem”?',
    'Zapewnił Polsce złoty medal olimpijski', 'Dał Polsce awans na mistrzostwa świata', 'Dał Polsce pierwszy tytuł mistrza Europy', 'Zapewnił Polsce trzecie miejsce na mundialu', 'b', 'easy', 'historia polskiej piłki',
    'Remis z Anglią 17 października 1973 roku zapewnił Polsce powrót na mundial po 36 latach.', null
  ),
  (
    'Uzupełnij nazwisko strzelca: polskiego gola w „zwycięskim remisie” na Wembley zdobył Jan…',
    'Tomaszewski', 'Furtok', 'Domarski', 'Urban', 'c', 'easy', 'historia polskiej piłki',
    'Jan Domarski pokonał Petera Shiltona w zremisowanym 1:1 meczu na Wembley w 1973 roku.', null
  ),
  (
    'Który polski bramkarz zasłynął obronami na Wembley w 1973 roku po tym, jak Brian Clough nazwał go „klaunem”?',
    'Józef Młynarczyk', 'Jerzy Dudek', 'Artur Boruc', 'Jan Tomaszewski', 'd', 'easy', 'historia polskiej piłki',
    'Jan Tomaszewski rozegrał znakomity mecz na Wembley, pomagając Polsce wywalczyć remis i awans na mundial.', null
  ),
  (
    'Jakim wynikiem Polska rozpoczęła mundial w 1974 roku w meczu z Argentyną?',
    'Zwycięstwem 2:0', 'Zwycięstwem 3:2', 'Remisem 1:1', 'Porażką 2:3', 'b', 'medium', 'historia polskiej piłki',
    '15 czerwca 1974 roku Polska pokonała Argentynę 3:2 w swoim pierwszym meczu mundialowym od 1938 roku.', null
  ),
  (
    'Który wynik był najwyższym zwycięstwem Polski na mundialu w 1974 roku?',
    '3:2 z Argentyną', '2:1 z Włochami', '7:0 z Haiti', '1:0 z Brazylią', 'c', 'easy', 'historia polskiej piłki',
    'Polska pokonała Haiti 7:0, a Andrzej Szarmach zdobył w tym meczu hat-tricka.', null
  ),
  (
    'Kogo Polska pokonała na zakończenie pierwszej fazy grupowej mundialu w 1974 roku, odnosząc trzecie zwycięstwo z rzędu?',
    'Szwecję', 'Jugosławię', 'Włochy', 'Brazylię', 'c', 'medium', 'historia polskiej piłki',
    'Wygrana 2:1 z Włochami po golach Szarmacha i Deyny zakończyła pierwszą fazę grupową z kompletem zwycięstw.', null
  ),
  (
    'Która para ról poprawnie opisuje mecz Polski ze Szwecją na mundialu w 1974 roku?',
    'Deyna strzelił gola, Młynarczyk obronił karnego', 'Szarmach strzelił gola, Dudek obronił karnego', 'Boniek strzelił gola, Boruc obronił karnego', 'Lato strzelił gola, Tomaszewski obronił karnego', 'd', 'medium', 'historia polskiej piłki',
    'Polska wygrała ze Szwecją 1:0 dzięki bramce Grzegorza Laty; Jan Tomaszewski obronił rzut karny.', null
  ),
  (
    'Uzupełnij parę strzelców z wygranego 2:1 meczu z Jugosławią na MŚ 1974: Kazimierz Deyna i…',
    'Jan Domarski', 'Zbigniew Boniek', 'Stefan Majewski', 'Grzegorz Lato', 'd', 'hard', 'historia polskiej piłki',
    'Deyna wykorzystał rzut karny, a Lato zdobył zwycięską bramkę w meczu z Jugosławią 30 czerwca 1974 roku.', null
  ),
  (
    'Skąd wzięło się określenie „mecz na wodzie” dotyczące spotkania Polski z RFN w 1974 roku?',
    'Z rozegrania meczu na pływającym stadionie', 'Z gry na mocno zalanym boisku', 'Z przerwy spowodowanej awarią wodociągu', 'Z rozegrania meczu w basenie treningowym', 'b', 'easy', 'historia polskiej piłki',
    'Spotkanie we Frankfurcie odbyło się na zalanym boisku; RFN wygrała 1:0 i awansowała do finału.', null
  ),
  (
    'Z kim Polska wygrała mecz o trzecie miejsce na mundialu w 1974 roku?',
    'Z Argentyną', 'Z Holandią', 'Z Francją', 'Z Brazylią', 'd', 'easy', 'historia polskiej piłki',
    'Polska pokonała Brazylię 1:0 po golu Grzegorza Laty i zajęła trzecie miejsce na mistrzostwach świata.', null
  ),
  (
    'Ile bramek dało Grzegorzowi Lacie tytuł króla strzelców mundialu w 1974 roku?',
    'Siedem', 'Pięć', 'Sześć', 'Dziewięć', 'a', 'medium', 'historia polskiej piłki',
    'Grzegorz Lato zakończył mundial w 1974 roku z siedmioma golami, największą liczbą w turnieju.', null
  ),
  (
    'Który Polak zajął trzecie miejsce w plebiscycie Złotej Piłki w 1974 roku?',
    'Grzegorz Lato', 'Kazimierz Deyna', 'Zbigniew Boniek', 'Włodzimierz Lubański', 'b', 'medium', 'historia polskiej piłki',
    'Kazimierz Deyna znalazł się na trzecim miejscu plebiscytu Złotej Piłki w 1974 roku.', null
  ),
  (
    'Polska pokonała Holandię 4:1 w Chorzowie w 1975 roku. Jaką przewagą bramek zakończył się ten mecz?',
    'Dwóch bramek', 'Trzech bramek', 'Czterech bramek', 'Pięciu bramek', 'b', 'easy', 'historia polskiej piłki',
    'Wynik 4:1 oznacza przewagę trzech bramek nad ówczesnymi wicemistrzami świata.', null
  ),
  (
    'Wskaż prawidłową kolejność polskich medali olimpijskich w piłce nożnej z lat 1972 i 1976.',
    'Srebro, potem złoto', 'Złoto, potem srebro', 'Złoto, potem brąz', 'Brąz, potem srebro', 'b', 'easy', 'historia polskiej piłki',
    'Polska zdobyła złoto w Monachium w 1972 roku i srebro w Montrealu w 1976 roku.', null
  ),
  (
    'Kto został królem strzelców olimpijskiego turnieju w Montrealu w 1976 roku?',
    'Kazimierz Deyna', 'Grzegorz Lato', 'Andrzej Szarmach', 'Andrzej Juskowiak', 'c', 'medium', 'historia polskiej piłki',
    'Andrzej Szarmach zdobył sześć bramek na igrzyskach w Montrealu i został królem strzelców turnieju.', null
  ),
  (
    'Dopasuj klub do roku: który polski zespół dotarł do ćwierćfinału Pucharu UEFA w 1974 roku?',
    'Ruch Chorzów', 'Stal Mielec', 'Śląsk Wrocław', 'Wisła Kraków', 'a', 'hard', 'historia polskiej piłki',
    'Ruch Chorzów dotarł do ćwierćfinału Pucharu UEFA w 1974 roku; Stal Mielec powtórzyła ten etap w 1976 roku.', null
  ),
  (
    'Który klub z Mielca dotarł do ćwierćfinału Pucharu UEFA w 1976 roku?',
    'Ruch', 'Stal', 'Górnik', 'Polonia', 'b', 'easy', 'historia polskiej piłki',
    'Stal Mielec dotarła do ćwierćfinału Pucharu UEFA w 1976 roku, odnosząc jeden z największych europejskich sukcesów klubu.', null
  ),
  (
    'W jakich rozgrywkach Śląsk Wrocław osiągnął ćwierćfinał w 1977 roku?',
    'W Pucharze Europy', 'W Pucharze UEFA', 'W Pucharze Intertoto', 'W Pucharze Zdobywców Pucharów', 'd', 'hard', 'historia polskiej piłki',
    'Śląsk Wrocław dotarł do ćwierćfinału Pucharu Zdobywców Pucharów w 1977 roku.', null
  ),
  (
    'Który zestaw wyników opisuje pierwszą fazę grupową Polski na mundialu w 1978 roku?',
    'Wygrana z RFN, remisy z Tunezją i Meksykiem', 'Remis z RFN, wygrane z Tunezją i Meksykiem', 'Porażka z RFN, wygrane z Tunezją i Meksykiem', 'Remisy z RFN, Tunezją i Meksykiem', 'b', 'hard', 'historia polskiej piłki',
    'Polska wygrała grupę po remisie z RFN oraz zwycięstwach nad Tunezją i Meksykiem.', null
  ),
  (
    'Który klub zakończył występy Wisły Kraków w ćwierćfinale Pucharu Europy w 1979 roku?',
    'Club Brugge', 'Zbrojovka Brno', 'Feyenoord', 'Malmö FF', 'd', 'hard', 'historia polskiej piłki',
    'Wisła wyeliminowała Club Brugge i Zbrojovkę Brno, a w ćwierćfinale odpadła z Malmö FF.', null
  ),
  (
    'Co pozwoliło Widzewowi wyeliminować Manchester United z Pucharu UEFA w 1980 roku mimo dwóch remisów?',
    'Wygrana w rzutach karnych', 'Zasada bramek wyjazdowych', 'Lepszy współczynnik klubowy', 'Rzut monetą', 'b', 'medium', 'historia polskiej piłki',
    'Widzew awansował po dwóch remisach dzięki większej liczbie bramek zdobytych na wyjeździe.', null
  ),
  (
    'Jak rozstrzygnięto dwumecz Widzewa z Juventusem w 1980 roku po dwóch zwycięstwach gospodarzy po 3:1?',
    'Rzutem monetą', 'Trzecim meczem', 'Klasyfikacją fair play', 'Rzutami karnymi', 'd', 'medium', 'historia polskiej piłki',
    'Po wynikach 3:1 i 1:3 Widzew wygrał serię rzutów karnych w Turynie i awansował.', null
  ),
  (
    'Z którym krajem kobieca reprezentacja Polski rozegrała swój pierwszy oficjalny mecz w 1981 roku?',
    'Z Danią', 'Z Niemcami', 'Ze Szwecją', 'Z Włochami', 'd', 'hard', 'historia polskiej piłki',
    'Pierwszy oficjalny mecz seniorskiej reprezentacji Polski kobiet odbył się w 1981 roku przeciwko Włochom.', null
  ),
  (
    'Uzupełnij wynik: po dwóch bezbramkowych remisach na mundialu w 1982 roku Polska pokonała Peru…',
    '3:0', '5:1', '2:1', '7:0', 'b', 'medium', 'historia polskiej piłki',
    'Zwycięstwo 5:1 nad Peru przełamało strzelecką niemoc Polski po dwóch remisach 0:0.', null
  ),
  (
    'Rozpoznaj piłkarza: zdobył wszystkie trzy gole Polski w meczu z Belgią na mundialu w 1982 roku.',
    'Grzegorz Lato', 'Andrzej Szarmach', 'Zbigniew Boniek', 'Janusz Kupcewicz', 'c', 'easy', 'historia polskiej piłki',
    'Zbigniew Boniek strzelił hat-tricka w wygranym 3:0 spotkaniu z Belgią 28 czerwca 1982 roku.', null
  ),
  (
    'Jaki wynik meczu z ZSRR zapewnił Polsce awans do półfinału mundialu w 1982 roku?',
    '1:0', '1:1', '0:0', '2:1', 'c', 'medium', 'historia polskiej piłki',
    'Bezbramkowy remis z ZSRR 4 lipca 1982 roku dał Polsce awans do półfinału mistrzostw świata.', null
  ),
  (
    'Która para rywali Polski w zwycięskich meczach o trzecie miejsce na MŚ jest poprawna?',
    'Brazylia w 1974, Francja w 1982', 'Francja w 1974, Brazylia w 1982', 'Włochy w 1974, Belgia w 1982', 'Argentyna w 1974, ZSRR w 1982', 'a', 'medium', 'historia polskiej piłki',
    'Polska wygrała z Brazylią 1:0 w 1974 roku oraz z Francją 3:2 w 1982 roku, dwukrotnie zajmując trzecie miejsce.', null
  ),
  (
    'Kto po Kazimierzu Deynie został drugim Polakiem na podium plebiscytu Złotej Piłki?',
    'Zbigniew Boniek', 'Grzegorz Lato', 'Józef Młynarczyk', 'Andrzej Szarmach', 'a', 'medium', 'historia polskiej piłki',
    'Zbigniew Boniek zajął trzecie miejsce w 1982 roku, osiem lat po trzecim miejscu Deyny.', null
  ),
  (
    'Jaką zaliczkę wypracował Widzew w pierwszym meczu z Liverpoolem w ćwierćfinale Pucharu Europy w 1983 roku?',
    'Zwycięstwo 2:0', 'Zwycięstwo 1:0', 'Remis 1:1', 'Zwycięstwo 3:0', 'a', 'hard', 'historia polskiej piłki',
    '2 marca 1983 roku Widzew pokonał Liverpool 2:0 przed rewanżem na Anfield.', null
  ),
  (
    'Widzew wygrał z Liverpoolem 2:0 i przegrał rewanż 2:3 w 1983 roku. Kto awansował i z jakim łącznym wynikiem?',
    'Liverpool, 4:3', 'Widzew, 3:2', 'Liverpool, 3:2', 'Widzew, 4:3', 'd', 'medium', 'historia polskiej piłki',
    'Po dodaniu bramek z obu spotkań Widzew wygrał dwumecz 4:3 i awansował do półfinału.', null
  ),
  (
    'Który zespół zatrzymał Widzew w półfinale Pucharu Europy w 1983 roku?',
    'Liverpool', 'Juventus', 'Manchester United', 'AS Roma', 'b', 'hard', 'historia polskiej piłki',
    'Widzew dotarł do półfinału Pucharu Europy, w którym został wyeliminowany przez Juventus.', null
  ),
  (
    'Z którym klubem Zbigniew Boniek zdobył Puchar Europy w 1985 roku?',
    'Z AS Romą', 'Z Juventusem', 'Z Widzewem Łódź', 'Z FC Porto', 'b', 'medium', 'historia polskiej piłki',
    'Boniek zdobył Puchar Europy z Juventusem w 1985 roku. Finał na Heysel poprzedziła tragedia, w której zginęło 39 kibiców.', null
  ),
  (
    'Dopasuj polskiego bramkarza do klubu, z którym wygrał Puchar Europy w 1987 roku.',
    'Jan Tomaszewski — Liverpool', 'Jerzy Dudek — Juventus', 'Artur Boruc — Bayern Monachium', 'Józef Młynarczyk — FC Porto', 'd', 'medium', 'historia polskiej piłki',
    'Józef Młynarczyk bronił w finale wygranym przez FC Porto 2:1 z Bayernem Monachium w 1987 roku.', null
  ),
  (
    'Co wyróżniało mistrzostwo Polski zdobyte przez Ruch Chorzów w 1989 roku?',
    'Było jego piątym tytułem z rzędu', 'Zdobył je przed swoim pierwszym awansem', 'Zdobył je jako beniaminek', 'Było pierwszym mistrzostwem w historii Polski', 'c', 'medium', 'historia polskiej piłki',
    'Ruch wrócił do najwyższej ligi po jednym sezonie i od razu zdobył mistrzostwo Polski.', null
  ),
  (
    'Który włoski klub Legia wyeliminowała w drodze do półfinału Pucharu Zdobywców Pucharów w 1991 roku?',
    'Sampdorię', 'Juventus', 'AC Milan', 'Parmę', 'a', 'hard', 'historia polskiej piłki',
    'Legia pokonała Sampdorię 1:0 w Warszawie i zremisowała 2:2 w Genui, awansując do półfinału.', null
  ),
  (
    'Kto zakończył występy Legii w półfinale Pucharu Zdobywców Pucharów w 1991 roku?',
    'Manchester City', 'Blackburn Rovers', 'Manchester United', 'Liverpool', 'c', 'hard', 'historia polskiej piłki',
    'W półfinale Pucharu Zdobywców Pucharów w 1991 roku Legia odpadła z Manchesterem United.', null
  ),
  (
    'Z kim Polska przegrała 2:3 w finale olimpijskim w Barcelonie w 1992 roku?',
    'Z Hiszpanią', 'Z Węgrami', 'Z Włochami', 'Z Brazylią', 'a', 'easy', 'historia polskiej piłki',
    'Polska zdobyła srebro po porażce 2:3 z gospodarzami, Hiszpanią, którzy strzelili decydującego gola w ostatniej minucie.', null
  ),
  (
    'Kto zdobył siedem goli i został królem strzelców igrzysk w Barcelonie w 1992 roku?',
    'Andrzej Szarmach', 'Andrzej Juskowiak', 'Wojciech Kowalczyk', 'Marek Citko', 'b', 'medium', 'historia polskiej piłki',
    'Andrzej Juskowiak zakończył olimpijski turniej w Barcelonie z siedmioma bramkami i tytułem króla strzelców.', null
  ),
  (
    'W której kategorii wiekowej Polska zdobyła mistrzostwo Europy w 1993 roku?',
    'Do lat 16', 'Do lat 19', 'Do lat 21', 'Wśród seniorów', 'a', 'medium', 'historia polskiej piłki',
    'Polska wygrała mistrzostwa Europy do lat 16 w 1993 roku, pokonując Włochy w finale.', null
  ),
  (
    'Dlaczego zwycięski gol Jana Furtoka przeciwko San Marino w 1993 roku wzbudził kontrowersje?',
    'Padł po końcowym gwizdku', 'Piłkarz zagrał piłkę ręką', 'Piłka trafiła do własnej bramki', 'Zdobył go zawodnik już usunięty z boiska', 'b', 'medium', 'historia polskiej piłki',
    'Gol Furtoka został uznany mimo zagrania ręką i dał Polsce zwycięstwo 1:0 nad San Marino.', null
  ),
  (
    'Który polski klub jako pierwszy awansował do fazy grupowej Ligi Mistrzów?',
    'Widzew Łódź', 'Wisła Kraków', 'Lech Poznań', 'Legia Warszawa', 'd', 'easy', 'historia polskiej piłki',
    'Legia awansowała do fazy grupowej Ligi Mistrzów w 1995 roku po wyeliminowaniu IFK Göteborg.', null
  ),
  (
    'Kto strzelił zwycięskiego gola dla Legii w meczu z Blackburn Rovers w Lidze Mistrzów w 1995 roku?',
    'Marek Citko', 'Janusz Gol', 'Robert Lewandowski', 'Jerzy Podbrożny', 'd', 'hard', 'historia polskiej piłki',
    'Jerzy Podbrożny zdobył jedyną bramkę w wygranym 1:0 meczu Legii z Blackburn 13 września 1995 roku.', null
  ),
  (
    'Na jakim etapie Legia zakończyła występy w Lidze Mistrzów w sezonie 1995/96?',
    'W fazie grupowej', 'W półfinale', 'W ćwierćfinale', 'W finale', 'c', 'medium', 'historia polskiej piłki',
    'Legia dotarła do ćwierćfinału, gdzie przegrała dwumecz z Panathinaikosem.', null
  ),
  (
    'Uzupełnij kolejność polskich debiutantów w fazie grupowej Ligi Mistrzów: Legia w 1995 roku, a w 1996 roku…',
    'Wisła Kraków', 'Górnik Zabrze', 'Widzew Łódź', 'Lech Poznań', 'c', 'medium', 'historia polskiej piłki',
    'Widzew został drugim polskim klubem w fazie grupowej Ligi Mistrzów po wyeliminowaniu Brøndby dzięki bramkom wyjazdowym.', null
  ),
  (
    'Z którym hiszpańskim klubem Widzew wygrał 1:0 po golu Marka Citki w 1996 roku?',
    'Z Atlético Madryt', 'Z Realem Madryt', 'Z Barceloną', 'Z Valencią', 'a', 'medium', 'historia polskiej piłki',
    '30 października 1996 roku gol Marka Citki dał Widzewowi zwycięstwo 1:0 nad Atlético Madryt.', null
  ),
  (
    'Rozpoznaj zawodnika: urodzony w Nigerii reprezentant Polski strzelił gola Ukrainie w wygranym 3:1 meczu eliminacji w 2000 roku.',
    'Euzebiusz Smolarek', 'Roger Guerreiro', 'Emmanuel Olisadebe', 'Paweł Kryszałowicz', 'c', 'easy', 'historia polskiej piłki',
    'Emmanuel Olisadebe zdobył bramkę w Kijowie 2 września 2000 roku w swoim debiucie w meczu reprezentacji Polski o punkty.', null
  ),
  (
    'Zwycięstwo 3:0 nad którym rywalem zapewniło Polsce awans na mundial w 2002 roku?',
    'Nad Ukrainą', 'Nad USA', 'Nad Norwegią', 'Nad Portugalią', 'c', 'medium', 'historia polskiej piłki',
    'Polska pokonała Norwegię 3:0 1 września 2001 roku i zapewniła sobie udział w mistrzostwach świata w 2002 roku.', null
  ),
  (
    'Którego rywala Polska pokonała 3:1 na zakończenie swojego udziału w mundialu w 2002 roku?',
    'Koreę Południową', 'Portugalię', 'Stany Zjednoczone', 'Japonię', 'c', 'easy', 'historia polskiej piłki',
    '14 czerwca 2002 roku Polska wygrała z USA 3:1, choć przed meczem była już wyeliminowana z turnieju.', null
  ),
  (
    'Który polski klub wygrał na wyjeździe z Schalke 4:1 w Pucharze UEFA w sezonie 2002/03?',
    'Legia Warszawa', 'Groclin Dyskobolia', 'Lech Poznań', 'Wisła Kraków', 'd', 'medium', 'historia polskiej piłki',
    'Wisła Kraków wyeliminowała Parmę i Schalke, z którym wygrała 4:1 na wyjeździe, a następnie odpadła z Lazio.', null
  ),
  (
    'Który klub wyeliminował Manchester City z Pucharu UEFA w 2003 roku dzięki bramkom wyjazdowym?',
    'Lech Poznań', 'Widzew Łódź', 'Górnik Zabrze', 'Groclin Dyskobolia', 'd', 'medium', 'historia polskiej piłki',
    'Groclin Dyskobolia wyeliminował Manchester City w 2003 roku na podstawie zasady bramek wyjazdowych.', null
  ),
  (
    'Ile bramek straty odrobił Liverpool przed serią karnych w finale Ligi Mistrzów z Milanem w 2005 roku?',
    'Dwie', 'Cztery', 'Trzy', 'Jedną', 'c', 'easy', 'historia polskiej piłki',
    'Liverpool przegrywał 0:3, doprowadził do remisu 3:3 i wygrał finał w Stambule w rzutach karnych z Jerzym Dudkiem w bramce.', null
  ),
  (
    'Czyje strzały Jerzy Dudek obronił w słynnej podwójnej interwencji w dogrywce finału Ligi Mistrzów w 2005 roku?',
    'Filippa Inzaghiego', 'Andrija Szewczenki', 'Hernána Crespo', 'Kaki', 'b', 'medium', 'historia polskiej piłki',
    'Podwójna obrona Dudka po strzałach Andrija Szewczenki pozwoliła Liverpoolowi utrzymać remis w dogrywce.', null
  ),
  (
    'Z którym bramkarzem kojarzy się taniec „spaghetti legs” podczas karnych w finale Ligi Mistrzów w 2005 roku?',
    'Z Jerzym Dudkiem', 'Z Józefem Młynarczykiem', 'Z Arturem Borucem', 'Z Wojciechem Szczęsnym', 'a', 'easy', 'historia polskiej piłki',
    'Jerzy Dudek wykonywał charakterystyczne ruchy na linii bramkowej, inspirując się Bruce’em Grobbelaarem.', null
  ),
  (
    'Kto strzelił oba gole przeciwko Belgii w meczu, który zapewnił Polsce pierwszy awans na EURO w 2007 roku?',
    'Euzebiusz Smolarek', 'Robert Lewandowski', 'Jakub Błaszczykowski', 'Maciej Żurawski', 'a', 'medium', 'historia polskiej piłki',
    '17 listopada 2007 roku Euzebiusz Smolarek zdobył dwie bramki przeciwko Belgii, zapewniając Polsce awans na EURO 2008.', null
  ),
  (
    'Który polski bramkarz wyróżnił się interwencjami w meczu z Austrią na EURO 2008?',
    'Jerzy Dudek', 'Wojciech Szczęsny', 'Łukasz Fabiański', 'Artur Boruc', 'd', 'medium', 'historia polskiej piłki',
    'Artur Boruc wielokrotnie ratował Polskę w meczu z Austrią 12 czerwca 2008 roku, zakończonym remisem po późnym rzucie karnym dla rywali.', null
  ),
  (
    'Wskaż poprawną kolejność wydarzeń z 2007 roku.',
    'Awans Polski na EURO 2008, potem przyznanie EURO 2012', 'Debiut Polski na EURO, potem przyznanie EURO 2012', 'Przyznanie EURO 2012, potem awans Polski na EURO 2008', 'Awans Polski na mundial, potem debiut na EURO', 'c', 'hard', 'historia polskiej piłki',
    'Polska i Ukraina otrzymały organizację EURO 2012 w kwietniu 2007 roku; Polska zapewniła sobie pierwszy awans na EURO w listopadzie 2007 roku.', null
  ),
  (
    'Który klub wygrał z Manchesterem City 3:1 w listopadzie 2010 roku i kojarzy się z kibicowską celebracją „Poznań”?',
    'Legia Warszawa', 'Lech Poznań', 'Groclin Dyskobolia', 'Wisła Kraków', 'b', 'easy', 'historia polskiej piłki',
    'Lech Poznań pokonał Manchester City 3:1 4 listopada 2010 roku; charakterystyczna celebracja jego kibiców zyskała popularność za granicą.', null
  ),
  (
    'Legia przegrywała ze Spartakiem Moskwa 0:2 w 2011 roku. Jak zakończył się mecz po jej powrocie do gry?',
    'Remisem 2:2', 'Zwycięstwem Legii 3:2', 'Zwycięstwem Legii 4:2', 'Porażką Legii 2:3', 'b', 'medium', 'historia polskiej piłki',
    'Legia wygrała w Moskwie 3:2, a decydującego gola głową zdobył Janusz Gol w doliczonym czasie gry.', null
  ),
  (
    'Kto zdobył pierwszą bramkę całego turnieju EURO 2012?',
    'Jakub Błaszczykowski', 'Arkadiusz Milik', 'Robert Lewandowski', 'Euzebiusz Smolarek', 'c', 'easy', 'historia polskiej piłki',
    'Robert Lewandowski otworzył wynik meczu Polski z Grecją w Warszawie 8 czerwca 2012 roku i zarazem strzelanie w turnieju.', null
  ),
  (
    'Uzupełnij zdanie: efektowny wyrównujący gol Jakuba Błaszczykowskiego przeciwko Rosji na EURO 2012 padł po strzale…',
    'Głową', 'Lewą nogą', 'Z rzutu karnego', 'Bezpośrednio z rzutu rożnego', 'b', 'medium', 'historia polskiej piłki',
    'Błaszczykowski wyrównał lewą nogą w meczu z Rosją 12 czerwca 2012 roku.', null
  ),
  (
    'Dlaczego mecz Polski z Anglią w październiku 2012 roku przełożono na kolejny dzień?',
    'Ulewa zalała boisko przy niezamkniętym wcześniej dachu', 'Mgła uniemożliwiła widoczność', 'Awaria oświetlenia przerwała dogrywkę', 'Śnieg zasypał boisko', 'a', 'easy', 'historia polskiej piłki',
    'Ulewa i niezamknięty przed nią dach doprowadziły do zalania boiska, a stadion żartobliwie nazwano „Basenem Narodowym”.', null
  ),
  (
    'W barwach którego klubu Lewandowski strzelił cztery gole Realowi Madryt w półfinale Ligi Mistrzów w 2013 roku?',
    'Borussii Dortmund', 'Bayernu Monachium', 'Barcelony', 'Lecha Poznań', 'a', 'easy', 'historia polskiej piłki',
    'Lewandowski zdobył cztery bramki dla Borussii Dortmund w półfinale Ligi Mistrzów przeciwko Realowi Madryt w 2013 roku.', null
  ),
  (
    'Dlaczego Legia odpadła w eliminacjach Ligi Mistrzów w 2014 roku mimo wygranej z Celtikiem 6:1 na boisku w dwumeczu?',
    'Wystawiła nieuprawnionego zawodnika', 'Nie stawiła się na pierwszy mecz', 'Zrezygnowała z udziału w rozgrywkach', 'Przegrała dodatkową serię karnych', 'a', 'medium', 'historia polskiej piłki',
    'Występ nieuprawnionego Bartosza Bereszyńskiego skutkował walkowerem w rewanżu i odpadnięciem Legii.', null
  ),
  (
    'Która para strzeliła gole w pierwszym zwycięstwie Polski nad Niemcami w 2014 roku?',
    'Arkadiusz Milik i Sebastian Mila', 'Robert Lewandowski i Jakub Błaszczykowski', 'Euzebiusz Smolarek i Jacek Krzynówek', 'Kamil Glik i Grzegorz Krychowiak', 'a', 'easy', 'historia polskiej piłki',
    'Milik i Mila zdobyli bramki w wygranym 2:0 meczu z ówczesnymi mistrzami świata 11 października 2014 roku.', null
  ),
  (
    'Uzupełnij rekordowy wyczyn Lewandowskiego przeciwko Wolfsburgowi w 2015 roku: pięć goli w…',
    'Pięć minut', 'Piętnaście minut', 'Dziewięć minut', 'Trzydzieści minut', 'c', 'easy', 'historia polskiej piłki',
    '22 września 2015 roku Lewandowski wszedł z ławki Bayernu i strzelił Wolfsburgowi pięć goli w dziewięć minut.', null
  ),
  (
    'Z którym rywalem Polska odniosła swoje pierwsze zwycięstwo w finałach mistrzostw Europy?',
    'Ze Szwajcarią', 'Z Ukrainą', 'Z Grecją', 'Z Irlandią Północną', 'd', 'medium', 'historia polskiej piłki',
    'Gol Arkadiusza Milika dał Polsce wygraną 1:0 z Irlandią Północną na EURO 2016, pierwszą w finałach tych rozgrywek.', null
  ),
  (
    'Kto wykorzystał decydujący rzut karny przeciwko Szwajcarii w 1/8 finału EURO 2016?',
    'Robert Lewandowski', 'Jakub Błaszczykowski', 'Arkadiusz Milik', 'Grzegorz Krychowiak', 'd', 'medium', 'historia polskiej piłki',
    'Grzegorz Krychowiak zamknął zwycięską serię karnych 25 czerwca 2016 roku, zapewniając Polsce ćwierćfinał.', null
  ),
  (
    'Na którym etapie zakończyła się przygoda Polski z EURO 2016?',
    'W fazie grupowej', 'W 1/8 finału', 'W ćwierćfinale', 'W półfinale', 'c', 'easy', 'historia polskiej piłki',
    'Polska dotarła do ćwierćfinału i odpadła po rzutach karnych z Portugalią, późniejszym mistrzem Europy.', null
  ),
  (
    'Ile goli strzelił Robert Lewandowski w eliminacjach do mundialu w 2018 roku?',
    '16', '12', '14', '18', 'a', 'medium', 'historia polskiej piłki',
    'Lewandowski zdobył 16 bramek w zakończonych w 2017 roku eliminacjach, najwięcej w europejskiej strefie.', null
  ),
  (
    'Dlaczego Japonii opłacało się utrzymywać porażkę 0:1 z Polską w końcówce meczu na MŚ 2018 przy ówczesnym wyniku drugiego spotkania?',
    'Awansowała dzięki lepszej klasyfikacji fair play', 'Każda porażka dawała jej trzy punkty', 'Miała zapewnione pierwsze miejsce w grupie', 'Wynik meczu nie liczył się do tabeli', 'a', 'hard', 'historia polskiej piłki',
    'Przy ówczesnych wynikach Japonia wyprzedzała Senegal dzięki klasyfikacji fair play, co wyjaśniało jej ostrożną grę mimo straty gola.', null
  ),
  (
    'Którego reprezentanta koledzy pożegnali szpalerem podczas jego ostatniego meczu w kadrze w listopadzie 2019 roku?',
    'Jakuba Błaszczykowskiego', 'Jerzego Dudka', 'Łukasza Piszczka', 'Grzegorza Krychowiaka', 'c', 'medium', 'historia polskiej piłki',
    'Łukasz Piszczek zakończył reprezentacyjną karierę 19 listopada 2019 roku; koledzy utworzyli szpaler, gdy opuszczał boisko.', null
  ),
  (
    'Który klub Jakub Błaszczykowski pomagał ratować w 2019 roku, wracając na symbolicznym kontrakcie?',
    'Borussię Dortmund', 'Raków Częstochowa', 'VfL Wolfsburg', 'Wisłę Kraków', 'd', 'easy', 'historia polskiej piłki',
    'Błaszczykowski wrócił do Wisły Kraków na symbolicznym kontrakcie i zaangażował się w finansową pomoc klubowi.', null
  ),
  (
    'Którą nagrodę Robert Lewandowski zdobył w 2020 roku po sezonie zakończonym potrójną koroną Bayernu?',
    'Złotą Piłkę za 2020 rok', 'Złoty But mundialu', 'The Best FIFA dla najlepszego piłkarza', 'Nagrodę dla króla strzelców EURO', 'c', 'easy', 'historia polskiej piłki',
    'Lewandowski został laureatem The Best FIFA Men’s Player za 2020 rok po zdobyciu z Bayernem potrójnej korony.', null
  ),
  (
    'Ile goli strzelił Lewandowski w sezonie Bundesligi 2020/21, bijąc rekord Gerda Müllera?',
    '40', '42', '41', '39', 'c', 'easy', 'historia polskiej piłki',
    'Lewandowski zakończył sezon z 41 bramkami; rekordowy gol padł w ostatniej minucie ostatniego meczu.', null
  ),
  (
    'Wskaż dwa kolejne lata, za które Lewandowski otrzymał nagrodę The Best FIFA dla najlepszego piłkarza.',
    '2020 i 2021', '2018 i 2019', '2019 i 2020', '2021 i 2022', 'a', 'medium', 'historia polskiej piłki',
    'Lewandowski zdobył nagrodę The Best FIFA zarówno za 2020, jak i za 2021 rok.', null
  ),
  (
    'Którą parę wykonawców rzutów karnych zatrzymał Wojciech Szczęsny na mundialu w Katarze w 2022 roku?',
    'Salem Al-Dawsari i Lionel Messi', 'Kylian Mbappé i Olivier Giroud', 'Lionel Messi i Cristiano Ronaldo', 'Salem Al-Dawsari i Neymar', 'a', 'medium', 'historia polskiej piłki',
    'Szczęsny obronił karne Salema Al-Dawsariego oraz Lionela Messiego, pomagając Polsce awansować do fazy pucharowej.', null
  ),
  (
    'Z kim Polki wygrały 3:2, odnosząc pierwsze zwycięstwo w finałach mistrzostw Europy kobiet w 2025 roku?',
    'Z Niemcami', 'Ze Szwecją', 'Z Włochami', 'Z Danią', 'd', 'medium', 'historia polskiej piłki',
    'Podopieczne Niny Patalon zakończyły swój debiutancki turniej EURO 2025 historycznym zwycięstwem 3:2 nad Danią.', null
  );
