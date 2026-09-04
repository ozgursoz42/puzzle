// High-resolution 3D animated cartoon illustrations (1024x768)
// Animals (12)
import animals1 from "@/assets/pz-animals-1.jpg";
import animals2 from "@/assets/pz-animals-2.jpg";
import animals3 from "@/assets/pz-animals-3.jpg";
import animals4 from "@/assets/pz-animals-4.jpg";
import animals5 from "@/assets/pz-animals-5.jpg";
import animals6 from "@/assets/pz-animals-6.jpg";
import animals7 from "@/assets/pz-animals-7.jpg";
import animals8 from "@/assets/pz-animals-8.jpg";
import animals9 from "@/assets/pz-animals-9.jpg";
import animals10 from "@/assets/pz-animals-10.jpg";
import animals11 from "@/assets/pz-animals-11.jpg";
import animals12 from "@/assets/pz-animals-12.jpg";

// Nature (12) - Pure landscapes, no animals
import nature1 from "@/assets/pz-nature-1.jpg";
import nature2 from "@/assets/pz-nature-2.jpg";
import nature3 from "@/assets/pz-nature-3.jpg";
import nature4 from "@/assets/pz-nature-4.jpg";
import nature5 from "@/assets/puzzles/nature-5.jpg";
import nature6 from "@/assets/puzzles/nature-6.jpg";
import nature7 from "@/assets/puzzles/nature-7.jpg";
import nature8 from "@/assets/puzzles/nature-8.jpg";
import nature9 from "@/assets/puzzles/nature-9.jpg";
import nature10 from "@/assets/puzzles/nature-10.jpg";
import nature11 from "@/assets/puzzles/nature-11.jpg";
import nature12 from "@/assets/puzzles/nature-12.jpg";

// Home (12) - Pure cozy rooms & houses, no animals
import home1 from "@/assets/pz-home-1.jpg";
import home2 from "@/assets/pz-home-2.jpg";
import home3 from "@/assets/pz-home-3.jpg";
import home4 from "@/assets/pz-home-4.jpg";
import home5 from "@/assets/puzzles/home-5.jpg";
import home6 from "@/assets/puzzles/home-6.jpg";
import home7 from "@/assets/puzzles/home-7.jpg";
import home8 from "@/assets/puzzles/home-8.jpg";
import home9 from "@/assets/puzzles/home-9.jpg";
import home10 from "@/assets/puzzles/home-10.jpg";
import home11 from "@/assets/puzzles/home-11.jpg";
import home12 from "@/assets/puzzles/home-12.jpg";

// School (12) - School & classrooms, no animals
import school1 from "@/assets/pz-school-1.jpg";
import school2 from "@/assets/pz-school-2.jpg";
import school3 from "@/assets/pz-school-3.jpg";
import school4 from "@/assets/puzzles/school-4.jpg";
import school5 from "@/assets/puzzles/school-5.jpg";
import school6 from "@/assets/puzzles/school-6.jpg";
import school7 from "@/assets/puzzles/school-7.jpg";
import school8 from "@/assets/puzzles/school-8.jpg";
import school9 from "@/assets/puzzles/school-9.jpg";
import school10 from "@/assets/puzzles/school-10.jpg";
import school11 from "@/assets/puzzles/school-11.jpg";
import school12 from "@/assets/puzzles/school-12.jpg";

// Park (12) - Playgrounds & park rides, no animals
import park1 from "@/assets/pz-park-1.jpg";
import park2 from "@/assets/pz-park-2.jpg";
import park3 from "@/assets/pz-park-3.jpg";
import park4 from "@/assets/puzzles/park-4.jpg";
import park5 from "@/assets/puzzles/park-5.jpg";
import park6 from "@/assets/puzzles/park-6.jpg";
import park7 from "@/assets/puzzles/park-7.jpg";
import park8 from "@/assets/puzzles/park-8.jpg";
import park9 from "@/assets/puzzles/park-9.jpg";
import park10 from "@/assets/puzzles/park-10.jpg";
import park11 from "@/assets/puzzles/park-11.jpg";
import park12 from "@/assets/puzzles/park-12.jpg";

// Garden (12) - Botanical gardens & flowers, no animals
import garden1 from "@/assets/pz-garden-1.jpg";
import garden2 from "@/assets/pz-garden-2.jpg";
import garden3 from "@/assets/pz-garden-3.jpg";
import garden4 from "@/assets/puzzles/garden-4.jpg";
import garden5 from "@/assets/puzzles/garden-5.jpg";
import garden6 from "@/assets/puzzles/garden-6.jpg";
import garden7 from "@/assets/puzzles/garden-7.jpg";
import garden8 from "@/assets/puzzles/garden-8.jpg";
import garden9 from "@/assets/puzzles/garden-9.jpg";
import garden10 from "@/assets/puzzles/garden-10.jpg";
import garden11 from "@/assets/puzzles/garden-11.jpg";
import garden12 from "@/assets/puzzles/garden-12.jpg";

export type Difficulty = "easy" | "normal" | "hard";

export type Puzzle = {
  id: string;
  title: string;
  image: string;
  grid: [number, number];
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  cover: string;
  puzzles: Puzzle[];
};

/**
 * Grid calculation according to difficulty:
 * - Kolay (easy): 2 parçalı [2, 1]
 * - Normal (normal): 4, 6, 9, 12 parçalı
 * - Zor (hard): 16, 20, 25 parçalı (16 ve üzeri)
 */
export function getGridForDifficulty(
  puzzleIndex: number,
  difficulty: Difficulty,
): [number, number] {
  if (difficulty === "easy") {
    return [2, 1]; // 2 parça
  }
  if (difficulty === "hard") {
    if (puzzleIndex < 4) return [4, 4]; // 16 parça
    if (puzzleIndex < 8) return [5, 4]; // 20 parça
    return [5, 5]; // 25 parça
  }
  // Normal
  if (puzzleIndex < 3) return [2, 2]; // 4 parça
  if (puzzleIndex < 6) return [3, 2]; // 6 parça
  if (puzzleIndex < 9) return [3, 3]; // 9 parça
  return [4, 3]; // 12 parça
}

export function getPieceCount(grid: [number, number]): number {
  return grid[0] * grid[1];
}

const mk = (id: string, title: string, image: string): Puzzle => ({
  id,
  title,
  image,
  grid: [2, 2],
});

export const CATEGORIES: Category[] = [
  {
    id: "animals",
    name: "Sevimli Hayvanlar",
    emoji: "🐶",
    color: "sun",
    cover: animals1,
    puzzles: [
      mk("animals-1", "Kedi ve Köpek", animals1),
      mk("animals-2", "Panda ve Tilki", animals2),
      mk("animals-3", "Tavşan ve Kirpi", animals3),
      mk("animals-4", "Sevimli Aslan", animals4),
      mk("animals-5", "Uzun Boylu Zürafa", animals5),
      mk("animals-6", "Neşeli Fil", animals6),
      mk("animals-7", "Muz Yiyen Maymun", animals7),
      mk("animals-8", "Renkli Papağan", animals8),
      mk("animals-9", "Yüzücü Yunus", animals9),
      mk("animals-10", "Kutup Ayısı", animals10),
      mk("animals-11", "Minik Koala", animals11),
      mk("animals-12", "Çiftlik Kuzusu", animals12),
    ],
  },
  {
    id: "nature",
    name: "Güzel Manzaralar",
    emoji: "🏞️",
    color: "sky",
    cover: nature1,
    puzzles: [
      mk("nature-1", "Dağ Gölü ve Gökkuşağı", nature1),
      mk("nature-2", "Deniz Kenarı ve Gün Batımı", nature2),
      mk("nature-3", "Gizemli Şelale", nature3),
      mk("nature-4", "Karlı Zirveler ve Kutup Işıkları", nature4),
      mk("nature-5", "Kutup Fiyordu", nature5),
      mk("nature-6", "Çam Ormanı", nature6),
      mk("nature-7", "Çöl Vahası", nature7),
      mk("nature-8", "Kanyon Vadisi", nature8),
      mk("nature-9", "Kapadokya Balonları", nature9),
      mk("nature-10", "Alpler ve Çiçekli Çayır", nature10),
      mk("nature-11", "Tropik Palmiyeli Sahil", nature11),
      mk("nature-12", "Gizemli Bambu Vadisi", nature12),
    ],
  },
  {
    id: "home",
    name: "Sevimli Ev & Odalar",
    emoji: "🏡",
    color: "berry",
    cover: home1,
    puzzles: [
      mk("home-1", "Bahçeli Masal Evi", home1),
      mk("home-2", "Neşeli Oyuncak Odası", home2),
      mk("home-3", "Yıldızlı Sıcak Yatak Odası", home3),
      mk("home-4", "Kurabiye & Fırın Mutfağı", home4),
      mk("home-5", "Masalsı Kitaplık Odası", home5),
      mk("home-6", "Çatı Katı Resim Atölyesi", home6),
      mk("home-7", "Camlı Çiçek Verandası", home7),
      mk("home-8", "Ahşap Masal Ağaç Ev", home8),
      mk("home-9", "Köpüklü Masal Banyosu", home9),
      mk("home-10", "Şömineli Sıcak Salon", home10),
      mk("home-11", "Güneşli Yemek Odası", home11),
      mk("home-12", "Renkli Oyun Çadırı", home12),
    ],
  },
  {
    id: "school",
    name: "Neşeli Okul",
    emoji: "🏫",
    color: "grape",
    cover: school1,
    puzzles: [
      mk("school-1", "Neşeli Okul Binası", school1),
      mk("school-2", "Renkli Resim Atölyesi", school2),
      mk("school-3", "Melodili Müzik Odası", school3),
      mk("school-4", "Büyük Okul Kütüphanesi", school4),
      mk("school-5", "Fen ve Deney Laboratuvarı", school5),
      mk("school-6", "Anaokulu Blok Sınıfı", school6),
      mk("school-7", "Okul Spor Salonu", school7),
      mk("school-8", "Renkli Okul Koridoru", school8),
      mk("school-9", "Güneşli Okul Yemekhanesi", school9),
      mk("school-10", "Tiyatro ve Gösteri Sahnesi", school10),
      mk("school-11", "Okul Bahçesi ve Çan Kulesi", school11),
      mk("school-12", "Matematik ve Yazı Tahtası", school12),
    ],
  },
  {
    id: "park",
    name: "Oyun Parkı",
    emoji: "🛝",
    color: "leaf",
    cover: park1,
    puzzles: [
      mk("park-1", "Büyülü Lunapark & Dönmedolap", park1),
      mk("park-2", "Sevimli Park Göleti", park2),
      mk("park-3", "Işıltılı Neşeli Atlıkarınca", park3),
      mk("park-4", "Dev Sarmal Kaydırak Kulesi", park4),
      mk("park-5", "Ahşap Park Salıncakları", park5),
      mk("park-6", "Kum Havuzu ve Kale", park6),
      mk("park-7", "Çarpışan Arabalar Pisti", park7),
      mk("park-8", "Macera Halat Parkuru", park8),
      mk("park-9", "Zıplama Trambolini", park9),
      mk("park-10", "Dondurma ve Pamuk Şeker Arabası", park10),
      mk("park-11", "Lunapark Mini Treni", park11),
      mk("park-12", "Uçurtma Tepesi", park12),
    ],
  },
  {
    id: "garden",
    name: "Renkli Bahçeler",
    emoji: "🌸",
    color: "candy",
    cover: garden1,
    puzzles: [
      mk("garden-1", "Çiçek Bahçesi ve Kelebekler", garden1),
      mk("garden-2", "Güneşli Ayçiçeği Tarlası", garden2),
      mk("garden-3", "Tatlı Çilek Bahçesi", garden3),
      mk("garden-4", "Cam Çiçek Serası", garden4),
      mk("garden-5", "Gül Kemeri ve Çardak", garden5),
      mk("garden-6", "Çiçekli Taş Yürüyüş Yolu", garden6),
      mk("garden-7", "Kırmızı Elma Bahçesi", garden7),
      mk("garden-8", "Mor Lavanta Tarlası", garden8),
      mk("garden-9", "Nilüferli Su Bahçesi", garden9),
      mk("garden-10", "Balkabağı Bostanı", garden10),
      mk("garden-11", "Ahşap Bahçe Kulübesi", garden11),
      mk("garden-12", "Rengarenk Lale Bahçesi", garden12),
    ],
  },
];

export const findCategory = (id: string) => CATEGORIES.find((c) => c.id === id);

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  desc: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", icon: "🏆", title: "İlk Puzzle", desc: "İlk puzzle'ını tamamla" },
  { id: "five", icon: "⭐", title: "5 Puzzle Tamamlandı", desc: "5 puzzle tamamla" },
  { id: "ten", icon: "🌟", title: "10 Puzzle Tamamlandı", desc: "10 puzzle tamamla" },
  { id: "twenty", icon: "🎖️", title: "20 Puzzle Tamamlandı", desc: "20 puzzle tamamla" },
  { id: "animals", icon: "🐶", title: "Hayvan Dostu", desc: "3 hayvan puzzle'ı tamamla" },
  { id: "nature", icon: "🌳", title: "Doğa Kâşifi", desc: "3 manzara puzzle'ı tamamla" },
  { id: "garden", icon: "🌸", title: "Bahçe Ustası", desc: "3 bahçe puzzle'ı tamamla" },
  { id: "school", icon: "🏫", title: "Okul Kâşifi", desc: "3 okul puzzle'ı tamamla" },
  { id: "champion", icon: "🥇", title: "Puzzle Şampiyonu", desc: "50 yıldız topla" },
];

export type Sticker = { id: string; icon: string; name: string; cost: number };

export const STICKERS: Sticker[] = [
  { id: "s-bunny", icon: "🐰", name: "Tavşan", cost: 3 },
  { id: "s-puppy", icon: "🐶", name: "Köpek", cost: 6 },
  { id: "s-butterfly", icon: "🦋", name: "Kelebek", cost: 10 },
  { id: "s-flower", icon: "🌻", name: "Ayçiçeği", cost: 15 },
  { id: "s-panda", icon: "🐼", name: "Panda", cost: 22 },
  { id: "s-rainbow", icon: "🌈", name: "Gökkuşağı", cost: 30 },
  { id: "s-lion", icon: "🦁", name: "Aslan", cost: 40 },
  { id: "s-dolphin", icon: "🐬", name: "Yunus", cost: 50 },
];
