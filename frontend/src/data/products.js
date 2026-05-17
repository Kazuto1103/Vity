/**
 * ============================================================
 * Data Produk Vity
 * ============================================================
 * Berisi informasi 3 varian minuman Vity beserta palet warna
 * masing-masing. Setiap produk memiliki warna utama, turunan
 * warna terang/gelap, dan gradient background untuk transisi
 * halaman penuh.
 * ============================================================
 */

import goldenHourImg from '../assets/goldenhour.png';
import avoLogicImg from '../assets/avo-logic.png';
import purpleReignImg from '../assets/purplereign.png';

export const products = [
  {
    id: 1,
    name: "Golden Hour",
    tagline: "Sinar emas dalam setiap tegukan",
    description: "Perpaduan 100% nanas dan wortel yang sehat nan menyegarkan.",
    color: "#cf8f24",
    colorLight: "#f5dfa8",
    colorDark: "#7a5510",
    colorMuted: "#b8842a",
    textColor: "#ffffff",
    bgGradient: "linear-gradient(145deg, #cf8f24 0%, #e4a832 40%, #a87420 100%)",
    image: goldenHourImg,
  },
  {
    id: 2,
    name: "Avo-Logic",
    tagline: "Logika segar dari alam",
    description: "Alpukat segar dan creamy yang menyehatkan jantung",
    color: "#70742c",
    colorLight: "#c8cb8a",
    colorDark: "#3a3c16",
    colorMuted: "#5d6125",
    textColor: "#ffffff",
    bgGradient: "linear-gradient(145deg, #70742c 0%, #8a8e3a 40%, #555822 100%)",
    image: avoLogicImg,
  },
  {
    id: 3,
    name: "Purple Reign",
    tagline: "Kuasai harimu dengan warna ungu",
    description: "Buah naga merah yang kaya antioksidan.",
    color: "#882d57",
    colorLight: "#d4a0b8",
    colorDark: "#4e1a33",
    colorMuted: "#73264a",
    textColor: "#ffffff",
    bgGradient: "linear-gradient(145deg, #882d57 0%, #a33d6a 40%, #6b2345 100%)",
    image: purpleReignImg,
  },
];
