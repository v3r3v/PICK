import type {ImageSourcePropType} from 'react-native';
import type {Vehicle} from '@pick/contracts';

type CatalogEntry = {model:string;color:string;generation:string;body:Vehicle['body'];source:ImageSourcePropType};
// Explicit model / depicted generation / paint keys. Metro statically bundles every image.
/* eslint-disable @typescript-eslint/no-require-imports -- Metro's static asset registry uses literal requires to bundle native images. */
export const vehicleCatalog = {
  'toyota-sienna-2024-blue': {model:'Toyota Sienna',color:'Blue',generation:'2024 · fourth generation',body:'van',source:require('../assets/vehicles/toyota-sienna-2024-blue.png')},
  'honda-civic-2024-blue': {model:'Honda Civic',color:'Blue',generation:'2024 · eleventh-generation sedan',body:'sedan',source:require('../assets/vehicles/honda-civic-2024-blue.png')},
  'kia-sportage-2023-white': {model:'Kia Sportage',color:'White',generation:'2023 · fifth generation',body:'suv',source:require('../assets/vehicles/kia-sportage-2023-white.png')},
  'volkswagen-golf-mk8-red': {model:'Volkswagen Golf',color:'Red',generation:'2021–2024 · Mk8 hatchback',body:'hatchback',source:require('../assets/vehicles/volkswagen-golf-mk8-red.png')},
  'ford-ranger-2024-silver': {model:'Ford Ranger',color:'Silver',generation:'2024 · P703 double cab',body:'pickup',source:require('../assets/vehicles/ford-ranger-2024-silver.png')},
} as const satisfies Record<string,CatalogEntry>;
/* eslint-enable @typescript-eslint/no-require-imports */
type CatalogKey = keyof typeof vehicleCatalog;
const fixtureArtwork:Record<string,CatalogKey> = {
  'vehicle-a':'toyota-sienna-2024-blue','vehicle-2':'honda-civic-2024-blue','vehicle-3':'kia-sportage-2023-white',
  'vehicle-4':'volkswagen-golf-mk8-red','vehicle-5':'ford-ranger-2024-silver',
};
export function catalogFor(vehicle:Vehicle):CatalogEntry|undefined {
  const key=fixtureArtwork[vehicle.id];
  const entry=key?vehicleCatalog[key]:undefined;
  // A changed or unknown assignment must not inherit a different model's artwork.
  return entry&&entry.model===vehicle.model&&entry.color===vehicle.color&&entry.body===vehicle.body?entry:undefined;
}
