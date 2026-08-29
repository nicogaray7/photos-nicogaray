/**
 * Format de l'épingle Pinterest, isolé de lib/pin-image.ts (qui importe sharp)
 * pour que le flux RSS puisse annoncer les dimensions sans embarquer sharp.
 * 2:3 est le ratio recommandé par Pinterest.
 */
export const PIN_WIDTH = 1000;
export const PIN_HEIGHT = 1500;
