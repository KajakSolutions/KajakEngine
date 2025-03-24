<div align="center">

  <img src="placeholder.png" alt="KajakEngine Logo">

  <h1>🏎️ KajakRacing Engine 🏎️</h1>
  <em>"Poczuj prędkość, zmierz się z wyzwaniem!"</em>
</div>

---

## 📌 Spis Treści

1. [Opis Projektu](#-opis-projektu)
2. [Funkcjonalności](#-funkcjonalności)
3. [Technologie](#-technologie)
4. [Instalacja i Uruchomienie](#-instalacja-i-uruchomienie)
5. [Tryby Gry](#-tryby-gry)
6. [System Fizyki](#-system-fizyki)
7. [Roadmapa](#-roadmapa)
8. [Zespół](#-zespół)
9. [Licencja](#-licencja)
10. [Wsparcie i Kontakt](#-wsparcie-i-kontakt)

---

## 🚀 Opis Projektu

**KajakRacing Engine** to zaawansowany silnik gier wyścigowych 2D, zaprojektowany z myślą o graczach na każdym poziomie zaawansowania.  
Silnik oferuje:

✅ Realistyczną fizykę pojazdów  
✅ Zaawansowane algorytmy AI przeciwników  
✅ Elastyczny system torów wyścigowych  
✅ Różnorodne powierzchnie toru wpływające na prowadzenie pojazdu  
✅ System bonusów i przeszkód

KajakRacing Engine to idealne rozwiązanie dla deweloperów chcących tworzyć wciągające gry wyścigowe z widokiem z góry.

---

## 🎯 Funkcjonalności

| Funkcja                | Opis |
|------------------------|------|
| 🏎️ **Realistyczna fizyka** | Model prowadzenia pojazdu uwzględniający przyczepność, masę, hamowanie i przyspieszenie |
| 🤖 **Zaawansowana AI** | Cztery różne typy zachowań AI: STRAIGHT_LINE_MASTER, STEADY_MIDDLE, AGGRESSIVE_CHASER, TACTICAL_BLOCKER |
| 🏁 **System wyścigów** | Pełny system wyścigów z punktami kontrolnymi, liczeniem okrążeń i pomiarami czasów |
| 🛣️ **Edytor torów** | Elastyczna budowa torów poprzez system barier, punktów kontrolnych i powierzchni |
| 🎮 **Proste sterowanie** | Łatwy w implementacji system sterowania dla gier na różnych platformach |
| 🔊 **System dźwięku** | Dynamiczne dźwięki silnika, kolizji i efektów specjalnych |
| 🔋 **System nitro** | Mechanika przyspieszenia nitro z systemem zbierania doładowań |
| 🍌 **System przedmiotów** | Zbieranie i używanie przedmiotów (np. skórki od bananów) |
| 🌊 **Różne nawierzchnie** | Asfalt, trawa, żwir, lód i błoto - każda z innym wpływem na prowadzenie pojazdu |

---

## 🏗️ Technologie

Silnik został zbudowany w oparciu o nowoczesny stack technologiczny:

**Języki programowania i narzędzia:**
- TypeScript/JavaScript
- HTML5 Canvas
- Vite

**Główne moduły silnika:**
- System fizyki pojazdów
- Zaawansowany system kolizji (Quad Tree, AABB, Polygon Colliders)
- Generatory dźwięku w czasie rzeczywistym
- Menedżer wyścigu i czasu okrążeń
- System AI przeciwników
- Menedżer przedmiotów i przeszkód

---

## 🛠 Instalacja i Uruchomienie

1️⃣ **Klonowanie repozytorium:**
```bash
git clone https://github.com/kajaksolutions/kajakengine.git
```

2️⃣ **Instalacja zależności:**
```bash
npm i
```

3️⃣ **Uruchomienie aplikacji:**
```bash
npm run dev
```  

---

## 🏆 Tryby Gry

Silnik wspiera różne tryby gry, które można łatwo zaimplementować:

| Tryb                   | Opis |
|------------------------|------|
| 🏁 **Wyścig** | Klasyczny wyścig z określoną liczbą okrążeń |
| ⏱️ **Time Trial** | Próba pobicia najlepszego czasu okrążenia |
| 🏆 **Turniej** | Seria wyścigów z systemem punktacji |
| 🎮 **Multiplayer** | Możliwość rozbudowy o tryb dla wielu graczy |

---

## 🔧 System Fizyki

KajakRacing Engine oferuje zaawansowany system fizyki pojazdów, który uwzględnia:

- Przyczepność kół zależną od nawierzchni
- Realistyczny model hamowania i przyspieszania
- System kolizji między pojazdami i barierami
- Wpływ masy pojazdu na jego zachowanie
- Wpływ rozłożenia osi pojazdu na jego zachowanie
- Poślizgi i system driftu
- System nitro z ograniczonym czasem działania
- Dynamiczne przeszkody i ruchome bariery

---

## 🛣️ Roadmapa

✅ **Aktualne funkcje**  
🔄 **W toku**  
❌ **Planowane**

| Funkcja                                                          | Status |
|------------------------------------------------------------------|-------|
| System fizyki pojazdów                                           | ✅ |
| AI przeciwników                                                  | ✅ |
| System kolizji                                                   | ✅ |
| System powierzchni toru                                          | ✅ |
| System nitro                                                     | ✅ |
| System przedmiotów                                               | ✅ |
| System wczytywania map                                           | ✅ |
| [Edytor Map - ALFA](https://github.com/KajakSolutions/MapEditor) | ✅ |
| System pogody                                                    | 🔄 |   
| Tryb multiplayer                                                 | ❌ |

---

## 👥 Zespół

### Kajak Solutions

**Główni deweloperzy:**
- **granacik320** ( Paweł Kuźniak ) - Lead Developer
- **BetterJake** ( Krzysztof Rolka ) - Konfiguracja i główna strona projektu
- **panu** ( Jakub Panek ) - System dźwięku i efekty
- **D4rkxv** ( Patryk Malczyk ) - Grafika i interfejs użytkownika
- **M4kses0wicz** ( Maksymilian Klemensowicz ) - Frontend Developer

---

## 📜 Licencja

Projekt udostępniany jest na licencji MIT.  
Szczegóły w pliku [LICENSE](LICENSE).

---

## 📞 Wsparcie i Kontakt

📧 Email: [kajaksolutions@example.com](mailto:kajaksolutions@example.com)  
🐙 GitHub Issues: [KajakEngine Issues](https://github.com/kajaksolutions/kajakengine/issues)

---

## 🗂️ Szczegółowa struktura projektu

**Korzeń projektu:**
- `LICENSE` – plik licencji projektu 📜
- `README.md` – główny opis projektu, dokumentacja i instrukcje 📝
- `package.json` – główny plik konfiguracyjny npm (zależności, skrypty) 📦
- `tsconfig.json` – globalna konfiguracja TypeScript 📘
- `vite.config.ts` – konfiguracja narzędzia Vite do budowania projektu ⚙️
- `index.html` – główny plik HTML projektu 🌐

**📁 Katalog `src/` (kod źródłowy):**

### Główne pliki silnika:
- `index.ts` – główny punkt wejścia, eksportuje wszystkie komponenty silnika 🚪
- `KajakEngine.ts` – główna klasa silnika, zarządza cyklem gry i renderowaniem 🎮
- `Scene.ts` – klasa reprezentująca scenę gry z obiektami i fizyką 🏞️
- `MapLoader.ts` – narzędzie do ładowania map i poziomów z plików JSON 🗺️
- `SoundManager.ts` – system zarządzania dźwiękami w grze 🔊
- `main.ts` – plik inicjalizujący aplikację demo 🚀

### 📁 Katalog `objects/` (obiekty gry):
- `GameObject.ts` – bazowa klasa dla wszystkich obiektów w grze 📦
- `PhysicObject.ts` – klasa rozszerzająca GameObject o fizykę 🔨
- `CarObject.ts` – implementacja pojazdu z fizyką i sterowaniem 🏎️
- `CheckpointObject.ts` – punkty kontrolne i linia mety ⛳
- `MapObject.ts` – reprezentacja mapy/poziomu 🗺️
- `MovingBarrier.ts` – ruchome przeszkody na torze 🚧
- `NitroBonus.ts` – obiekty bonusu nitro do zebrania ⚡
- `BananaPeel.ts` – implementacja skórki od banana jako przeszkody 🍌
- `ItemPickup.ts` – system zbierania przedmiotów 🎁
- `Overlap.ts` – system wykrywania nachodzenia na siebie obiektów 🔍
- `OverlapManager.ts` – zarządzanie wszystkimi kolizjami w grze 🧩
- `QuadTree.ts` – optymalizacja wykrywania kolizji metodą Quad Tree 🌳
- `RaceManager.ts` – zarządzanie wyścigiem, okrążeniami i czasem ⏱️
- `SpriteManager.ts` – system zarządzania sprite'ami i animacjami 🎨

### 📁 Katalog `objects/Colliders/` (system kolizji):
- `Collider.ts` – bazowa klasa dla wszystkich typów kolizji 💥
- `AABBCollider.ts` – kolizje prostokątne (Axis-Aligned Bounding Box) 📏
- `PolygonCollider.ts` – kolizje wielokątne dla złożonych kształtów 🔷
- `LineCollider.ts` – kolizje liniowe dla barier 📏

### 📁 Katalog `objects/Sounds/` (system dźwięku):
- `CarSoundSystem.ts` – system dźwięków pojazdu 🔊
- `EngineSoundGenerator.ts` – generator dźwięku silnika w czasie rzeczywistym 🎵

### 📁 Katalog `objects/AI/` (sztuczna inteligencja):
- `CarAI.ts` – implementacja sztucznej inteligencji przeciwników 🤖

### 📁 Katalog `types/` (definicje typów):
- `math.d.ts` – definicje typów dla wektorów i innych obiektów matematycznych 📊

### 📁 Katalog `utils/` (narzędzia pomocnicze):
- `math.ts` – funkcje matematyczne (wektory, transformacje) 📐
- `gridPositionHelper.ts` – narzędzia do ustawiania pojazdów na starcie 🏁

### 📁 Katalog `__tests__/` (testy jednostkowe):
- Testy dla różnych komponentów silnika 🧪

---

<div align="center">
  <img src="placeholder2.png" alt="KajakEngine Footer" width="200">
  <p>© 2025 Kajak Solutions</p>
</div>
