export interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  category: string;
  subcategory?: string;
  price: number;
  stock: number;
  image: string;
  variants?: string[];
  featured?: boolean;
  isNew?: boolean;
}

export type Category = 'Sábanas' | 'Toallas' | 'Almohadas' | 'Acolchados' | 'Manteles';

export const categories: { name: Category; image: string; description: string }[] = [
  { name: 'Sábanas', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=750&fit=crop', description: 'Algodón premium para tu descanso' },
  { name: 'Toallas', image: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600&h=750&fit=crop', description: 'Suavidad en cada detalle' },
  { name: 'Almohadas', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=750&fit=crop', description: 'El soporte perfecto' },
  { name: 'Acolchados', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=750&fit=crop', description: 'Calidez y estilo' },
  { name: 'Manteles', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop', description: 'Elegancia en tu mesa' },
];

export const brands = ['Casa Lino', 'Algodón Royal', 'Textura Home', 'Blanc Pur', 'Terrasol'];

export const initialProducts: Product[] = [
  // Sábanas
  { id: '1', name: 'Sábanas de Algodón Egipcio 400 Hilos', description: 'Juego de sábanas de algodón egipcio de 400 hilos. Suavidad incomparable y durabilidad excepcional. Incluye sábana encimera, bajera ajustable y dos fundas de almohada.', brand: 'Casa Lino', category: 'Sábanas', price: 45900, stock: 15, image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=750&fit=crop', variants: ['1 Plaza', '1½ Plaza', '2 Plazas', 'King'], featured: true, isNew: true },
  { id: '2', name: 'Sábanas de Percal Suave', description: 'Juego de sábanas de percal de algodón 100%. Tejido fresco ideal para todas las estaciones. Acabado mate elegante.', brand: 'Algodón Royal', category: 'Sábanas', price: 32500, stock: 22, image: 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600&h=750&fit=crop', variants: ['1 Plaza', '2 Plazas', 'King'] },
  { id: '3', name: 'Sábanas de Microfibra Premium', description: 'Sábanas de microfibra ultra suave con tratamiento anti-peeling. Resistentes al lavado y de fácil planchado.', brand: 'Textura Home', category: 'Sábanas', price: 18900, stock: 35, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=750&fit=crop', variants: ['1 Plaza', '2 Plazas'], isNew: true },
  { id: '4', name: 'Sábanas de Satén de Algodón', description: 'Juego de sábanas de satén con brillo natural. 300 hilos de puro algodón. Sensación sedosa al tacto.', brand: 'Blanc Pur', category: 'Sábanas', price: 52000, stock: 8, image: 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=600&h=750&fit=crop', variants: ['2 Plazas', 'King'], featured: true },

  // Toallas
  { id: '5', name: 'Toallón de Algodón Peinado 600g', description: 'Toallón de baño extra grande en algodón peinado de 600 gramos. Máxima absorción y suavidad duradera.', brand: 'Casa Lino', category: 'Toallas', price: 12800, stock: 40, image: 'https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600&h=750&fit=crop', featured: true, isNew: true },
  { id: '6', name: 'Set de Toallas Spa x3', description: 'Set de tres toallas de diferentes tamaños con borde jacquard. Algodón turco de primera calidad.', brand: 'Algodón Royal', category: 'Toallas', price: 22500, stock: 18, image: 'https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600&h=750&fit=crop', variants: ['Blanco', 'Gris', 'Beige'] },
  { id: '7', name: 'Toalla de Mano Bordada', description: 'Toalla de mano con bordado artesanal. Algodón 100% con terminación premium.', brand: 'Textura Home', category: 'Toallas', price: 6500, stock: 50, image: 'https://images.unsplash.com/photo-1583845112203-29329902332e?w=600&h=750&fit=crop' },
  { id: '8', name: 'Bata de Baño Algodón Waffle', description: 'Bata de baño unisex en tejido waffle de algodón. Ligera, absorbente y elegante.', brand: 'Blanc Pur', category: 'Toallas', price: 28900, stock: 12, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=750&fit=crop', variants: ['S', 'M', 'L', 'XL'] },

  // Almohadas
  { id: '9', name: 'Almohada de Pluma de Ganso', description: 'Almohada premium rellena de pluma de ganso blanco. Funda de algodón de 300 hilos. Soporte medio.', brand: 'Casa Lino', category: 'Almohadas', price: 19500, stock: 25, image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=750&fit=crop', featured: true },
  { id: '10', name: 'Almohada Viscoelástica Ergonómica', description: 'Almohada de memory foam con gel refrigerante. Diseño ergonómico cervical. Funda lavable con cierre.', brand: 'Terrasol', category: 'Almohadas', price: 24800, stock: 20, image: 'https://images.unsplash.com/photo-1592789705501-f9ae4278a9e9?w=600&h=750&fit=crop', isNew: true },
  { id: '11', name: 'Almohada de Fibra Siliconada', description: 'Almohada de fibra siliconada hueca hipoalergénica. Firmeza media-alta. Ideal para quienes duermen de lado.', brand: 'Algodón Royal', category: 'Almohadas', price: 8900, stock: 45, image: 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&h=750&fit=crop' },
  { id: '12', name: 'Almohada de Látex Natural', description: 'Almohada de látex 100% natural con perforaciones de ventilación. Antiácaros y antibacteriana.', brand: 'Textura Home', category: 'Almohadas', price: 31200, stock: 10, image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=750&fit=crop' },

  // Acolchados
  { id: '13', name: 'Acolchado de Duvet Premium', description: 'Acolchado de duvet relleno de pluma y plumón de ganso. Exterior de algodón percal 300 hilos. Calidez sin peso.', brand: 'Casa Lino', category: 'Acolchados', price: 89000, stock: 6, image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=750&fit=crop', variants: ['2 Plazas', 'King'], featured: true, isNew: true },
  { id: '14', name: 'Cubrecama Boutí Jacquard', description: 'Cubrecama acolchado con diseño jacquard geométrico. Reversible en tono liso. Lavable en lavarropas.', brand: 'Blanc Pur', category: 'Acolchados', price: 42500, stock: 14, image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=750&fit=crop', variants: ['1½ Plaza', '2 Plazas'] },
  { id: '15', name: 'Edredón de Microfibra Térmico', description: 'Edredón de microfibra con relleno térmico de 400g/m². Ideal para invierno. Hipoalergénico.', brand: 'Terrasol', category: 'Acolchados', price: 35800, stock: 20, image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=750&fit=crop', variants: ['1 Plaza', '2 Plazas', 'King'] },
  { id: '16', name: 'Quilt de Algodón Orgánico', description: 'Quilt liviano de algodón orgánico certificado GOTS. Perfecto para entretiempo. Diseño minimalista.', brand: 'Algodón Royal', category: 'Acolchados', price: 55000, stock: 9, image: 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&h=750&fit=crop' },

  // Manteles
  { id: '17', name: 'Mantel de Lino Natural', description: 'Mantel de lino puro con acabado lavado. Textura orgánica y caída elegante. Resistente a manchas.', brand: 'Casa Lino', category: 'Manteles', price: 28500, stock: 16, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop', variants: ['4 personas', '6 personas', '8 personas'], featured: true },
  { id: '18', name: 'Mantel Antimanchas Jacquard', description: 'Mantel con tratamiento antimanchas Teflon. Diseño jacquard sutil. Fácil limpieza con paño húmedo.', brand: 'Textura Home', category: 'Manteles', price: 18200, stock: 30, image: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=600&h=750&fit=crop', variants: ['4 personas', '6 personas'], isNew: true },
  { id: '19', name: 'Set Individual + Servilletas x4', description: 'Set de 4 individuales y 4 servilletas de algodón. Bordado discreto en el borde. Varios colores disponibles.', brand: 'Blanc Pur', category: 'Manteles', price: 14500, stock: 25, image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=750&fit=crop', variants: ['Natural', 'Gris', 'Terracota'] },
  { id: '20', name: 'Camino de Mesa Tejido', description: 'Camino de mesa tejido a mano en telar. Mezcla de algodón y lino. Pieza artesanal única.', brand: 'Terrasol', category: 'Manteles', price: 11800, stock: 18, image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&h=750&fit=crop', isNew: true },
];
