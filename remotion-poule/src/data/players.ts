// Ranglijst-data voor de WK Gazette video.
// Losgekoppeld van de composition zodat je 'm per week kunt vervangen
// (of later live uit Firebase kunt vullen). Zelfde vorm als de PLAYERS-array
// in de oude render.js, nu getypeerd en herbruikbaar.

export type Player = {
  pos: number;
  naam: string;
  pt: number; // punten
  ex: number; // exacte uitslagen (bonus)
  color: string; // accentkleur voor avatar/rij
  km?: string; // kampioen-vlag emoji (optioneel)
};

export const PLAYERS: Player[] = [
  { pos: 1, naam: 'Pok', pt: 61, ex: 3, color: '#FFD700', km: '🇲🇽' },
  { pos: 2, naam: 'Shamma', pt: 61, ex: 3, color: '#00FFE5', km: '🇫🇷' },
  { pos: 3, naam: 'Shyam Asarfi', pt: 59, ex: 5, color: '#4488FF', km: '🇫🇷' },
  { pos: 4, naam: 'Céline Jaikaran', pt: 57, ex: 1, color: '#FF6D00', km: '🇫🇷' },
  { pos: 5, naam: 'Moek', pt: 55, ex: 3, color: '#FF1493', km: '🇳🇱' },
  { pos: 6, naam: 'Kawita', pt: 53, ex: 3, color: '#C84FEE', km: '🇩🇪' },
  { pos: 7, naam: 'Sunita', pt: 52, ex: 4, color: '#4ade80', km: '🇳🇱' },
  { pos: 8, naam: 'Sunaina', pt: 52, ex: 2, color: '#FF4444', km: '🇫🇷' },
  { pos: 9, naam: 'Vinay', pt: 49, ex: 1, color: '#00BCD4' },
  { pos: 10, naam: 'Duup', pt: 46, ex: 2, color: '#FFA000' },
  { pos: 11, naam: 'Totomaster', pt: 46, ex: 2, color: '#CDDC39', km: '🇲🇦' },
  { pos: 12, naam: 'Chanine Jaikaran', pt: 45, ex: 1, color: '#9E7BCA', km: '🇲🇦' },
  { pos: 13, naam: 'Geert Wilders', pt: 45, ex: 1, color: '#29B6F6', km: '🇳🇱' },
  { pos: 14, naam: 'Oetra', pt: 44, ex: 0, color: '#FF7961' },
  { pos: 15, naam: 'Surya', pt: 42, ex: 0, color: '#FFB300', km: '🇫🇷' },
  { pos: 16, naam: 'Kandratiki', pt: 32, ex: 2, color: '#69F0AE' },
  { pos: 17, naam: 'ikke', pt: 28, ex: 0, color: '#FF6B6B' },
  { pos: 18, naam: 'SeanJay', pt: 27, ex: 1, color: '#7C4DFF' },
  { pos: 19, naam: 'KOEKIEE', pt: 20, ex: 2, color: '#FF3D00', km: '🇧🇷' },
  { pos: 20, naam: 'Rinaldo', pt: 6, ex: 0, color: '#9E9E9E' },
];

export const getInitials = (naam: string): string =>
  naam
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
