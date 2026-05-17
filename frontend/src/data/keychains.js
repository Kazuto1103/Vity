import axolotlImg from '../assets/Minecraftaxolotl.jpeg';
import brakeDiscImg from '../assets/Spinningbrakedisc.jpeg';
import sleepingFoxImg from '../assets/sleepingfox.webp';

/**
 * ============================================================
 * Data Keychain Vity
 * ============================================================
 * Berisi informasi varian keychain 3D.
 * ============================================================
 */

// Background soft white konstan untuk semua keychain
const softWhiteBg = "linear-gradient(145deg, #fdfbfb 0%, #ebedee 100%)";

export const keychains = [
  {
    id: 1,
    name: "Minecraft Axolotl",
    tagline: "Teman bawah air paling lucu",
    description: "Gantungan kunci 3D karakter Axolotl dari Minecraft yang ikonik dan menggemaskan.",
    color: "#e8a5b2",
    bgGradient: softWhiteBg,
    image: axolotlImg,
  },
  {
    id: 2,
    name: "Spinning Brake Disc",
    tagline: "Gaya otomotif dalam genggaman",
    description: "Gantungan kunci miniatur cakram rem yang bisa berputar, cocok untuk petrolhead sejati.",
    color: "#8a8d91",
    bgGradient: softWhiteBg,
    image: brakeDiscImg,
  },
  {
    id: 3,
    name: "Sleeping Fox",
    tagline: "Ketenangan dalam bentuk rubah",
    description: "Karakter rubah kecil yang sedang tidur nyenyak, membawa nuansa damai.",
    color: "#d97a3a",
    bgGradient: softWhiteBg,
    image: sleepingFoxImg,
  },
];
