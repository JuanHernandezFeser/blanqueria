INSERT OR IGNORE INTO users (id, email, password_hash, name, is_admin, email_verified) VALUES
  ('usr-1', 'admin@tienda.com', 'PLACEHOLDER_ADMIN', 'Administrador', 1, 1),
  ('usr-2', 'user@tienda.com', 'PLACEHOLDER_USER', 'Usuario Demo', 0, 1);

INSERT OR IGNORE INTO categories (name, image, description, subcategories_json) VALUES
  ('Sábanas', '', 'Algodón premium para tu descanso', '[]'),
  ('Toallas', '', 'Suavidad en cada detalle', '[]'),
  ('Almohadas', '', 'El soporte perfecto', '[]'),
  ('Acolchados', '', 'Calidez y estilo', '[]'),
  ('Manteles', '', 'Elegancia en tu mesa', '[]');

INSERT OR IGNORE INTO ambientes (name, image, description) VALUES
  ('Baño', '', 'Textiles para tu baño'),
  ('Living', '', 'Textiles para tu living'),
  ('Comedor', '', 'Textiles para tu comedor'),
  ('Cocina', '', 'Textiles para tu cocina'),
  ('Dormitorio', '', 'Textiles para tu dormitorio');

INSERT OR IGNORE INTO hero_slides (id, type, image, title, subtitle, "order") VALUES
  ('default-1', 'image', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1400&h=700&fit=crop', 'AIKEN', 'Hacemos de tu casa tu refugio', 0),
  ('default-2', 'image', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1400&h=700&fit=crop', 'Colección Otoño', 'Fibras naturales para tu hogar', 1),
  ('default-3', 'image', 'https://images.unsplash.com/photo-1616627561950-9f746e330187?w=1400&h=700&fit=crop', 'Toallas Premium', 'Suavidad en cada detalle', 2);

INSERT OR IGNORE INTO bank_config (id, bank_name, cbu, alias, account_holder, discount_percentage) VALUES
  (1, 'Banco Ejemplo', '0000000000000000000000', 'BLANQUERIA.TRANSFERENCIA', 'AIKEN S.A.', 0);

INSERT OR IGNORE INTO products (id, name, description, brand, category, subcategory, price, stock, image, images_json, variants_json, colors_json, variant_stock_json, ambientes_json, featured, is_new) VALUES
  ('1', 'Sábanas de Algodón Egipcio 400 Hilos', 'Juego de sábanas de algodón egipcio de 400 hilos. Suavidad incomparable y durabilidad excepcional. Incluye sábana encimera, bajera ajustable y dos fundas de almohada.', 'Casa Lino', 'Sábanas', '', 45900, 15, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=750&fit=crop', '[]', '["1 Plaza","1½ Plaza","2 Plazas","King"]', '["Blanco","Gris","Beige"]', '{}', '["Dormitorio"]', 1, 1),
  ('2', 'Sábanas de Percal Suave', 'Juego de sábanas de percal de algodón 100%. Tejido fresco ideal para todas las estaciones. Acabado mate elegante.', 'Algodón Royal', 'Sábanas', '', 32500, 22, 'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?w=600&h=750&fit=crop', '[]', '["1 Plaza","2 Plazas","King"]', '[]', '{}', '["Dormitorio"]', 0, 0),
  ('3', 'Sábanas de Microfibra Premium', 'Sábanas de microfibra ultra suave con tratamiento anti-peeling. Resistentes al lavado y de fácil planchado.', 'Textura Home', 'Sábanas', '', 18900, 35, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=750&fit=crop', '[]', '["1 Plaza","2 Plazas"]', '[]', '{}', '["Dormitorio"]', 0, 1),
  ('4', 'Sábanas de Satén de Algodón', 'Juego de sábanas de satén con brillo natural. 300 hilos de puro algodón. Sensación sedosa al tacto.', 'Blanc Pur', 'Sábanas', '', 52000, 8, 'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=600&h=750&fit=crop', '[]', '["2 Plazas","King"]', '["Blanco","Marfil"]', '{}', '["Dormitorio"]', 1, 0),
  ('5', 'Toallón de Algodón Peinado 600g', 'Toallón de baño extra grande en algodón peinado de 600 gramos. Máxima absorción y suavidad duradera.', 'Casa Lino', 'Toallas', '', 12800, 40, 'https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600&h=750&fit=crop', '[]', '[]', '["Blanco","Gris","Azul"]', '{}', '["Baño"]', 1, 1),
  ('6', 'Set de Toallas Spa x3', 'Set de tres toallas de diferentes tamaños con borde jacquard. Algodón turco de primera calidad.', 'Algodón Royal', 'Toallas', '', 22500, 18, 'https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=600&h=750&fit=crop', '[]', '[]', '["Blanco","Gris","Beige"]', '{}', '["Baño"]', 0, 0),
  ('7', 'Toalla de Mano Bordada', 'Toalla de mano con bordado artesanal. Algodón 100% con terminación premium.', 'Textura Home', 'Toallas', '', 6500, 50, 'https://images.unsplash.com/photo-1583845112203-29329902332e?w=600&h=750&fit=crop', '[]', '[]', '[]', '{}', '["Baño","Cocina"]', 0, 0),
  ('8', 'Bata de Baño Algodón Waffle', 'Bata de baño unisex en tejido waffle de algodón. Ligera, absorbente y elegante.', 'Blanc Pur', 'Toallas', '', 28900, 12, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=750&fit=crop', '[]', '["S","M","L","XL"]', '[]', '{}', '["Baño"]', 0, 0),
  ('9', 'Almohada de Pluma de Ganso', 'Almohada premium rellena de pluma de ganso blanco. Funda de algodón de 300 hilos. Soporte medio.', 'Casa Lino', 'Almohadas', '', 19500, 25, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=750&fit=crop', '[]', '[]', '[]', '{}', '["Dormitorio"]', 1, 0),
  ('10', 'Almohada Viscoelástica Ergonómica', 'Almohada de memory foam con gel refrigerante. Diseño ergonómico cervical. Funda lavable con cierre.', 'Terrasol', 'Almohadas', '', 24800, 20, 'https://images.unsplash.com/photo-1592789705501-f9ae4278a9e9?w=600&h=750&fit=crop', '[]', '[]', '[]', '{}', '["Dormitorio"]', 0, 1),
  ('11', 'Almohada de Fibra Siliconada', 'Almohada de fibra siliconada hueca hipoalergénica. Firmeza media-alta. Ideal para quienes duermen de lado.', 'Algodón Royal', 'Almohadas', '', 8900, 45, 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=600&h=750&fit=crop', '[]', '[]', '[]', '{}', '["Dormitorio"]', 0, 0),
  ('12', 'Almohada de Látex Natural', 'Almohada de látex 100% natural con perforaciones de ventilación. Antiácaros y antibacteriana.', 'Textura Home', 'Almohadas', '', 31200, 10, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=750&fit=crop', '[]', '[]', '[]', '{}', '["Dormitorio"]', 0, 0),
  ('13', 'Acolchado de Duvet Premium', 'Acolchado de duvet relleno de pluma y plumón de ganso. Exterior de algodón percal 300 hilos. Calidez sin peso.', 'Casa Lino', 'Acolchados', '', 89000, 6, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=750&fit=crop', '[]', '["2 Plazas","King"]', '[]', '{}', '["Dormitorio"]', 1, 1),
  ('14', 'Cubrecama Boutí Jacquard', 'Cubrecama acolchado con diseño jacquard geométrico. Reversible en tono liso. Lavable en lavarropas.', 'Blanc Pur', 'Acolchados', '', 42500, 14, 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=750&fit=crop', '[]', '["1½ Plaza","2 Plazas"]', '[]', '{}', '["Dormitorio"]', 0, 0),
  ('15', 'Edredón de Microfibra Térmico', 'Edredón de microfibra con relleno térmico de 400g/m². Ideal para invierno. Hipoalergénico.', 'Terrasol', 'Acolchados', '', 35800, 20, 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=750&fit=crop', '[]', '["1 Plaza","2 Plazas","King"]', '[]', '{}', '["Dormitorio"]', 0, 0),
  ('16', 'Quilt de Algodón Orgánico', 'Quilt liviano de algodón orgánico certificado GOTS. Perfecto para entretiempo. Diseño minimalista.', 'Algodón Royal', 'Acolchados', '', 55000, 9, 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&h=750&fit=crop', '[]', '[]', '[]', '{}', '["Dormitorio"]', 0, 0),
  ('17', 'Mantel de Lino Natural', 'Mantel de lino puro con acabado lavado. Textura orgánica y caída elegante. Resistente a manchas.', 'Casa Lino', 'Manteles', '', 28500, 16, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop', '[]', '["4 personas","6 personas","8 personas"]', '[]', '{}', '["Comedor","Cocina"]', 1, 0),
  ('18', 'Mantel Antimanchas Jacquard', 'Mantel con tratamiento antimanchas Teflon. Diseño jacquard sutil. Fácil limpieza con paño húmedo.', 'Textura Home', 'Manteles', '', 18200, 30, 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=600&h=750&fit=crop', '[]', '["4 personas","6 personas"]', '[]', '{}', '["Comedor","Cocina"]', 0, 1),
  ('19', 'Set Individual + Servilletas x4', 'Set de 4 individuales y 4 servilletas de algodón. Bordado discreto en el borde. Varios colores disponibles.', 'Blanc Pur', 'Manteles', '', 14500, 25, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=750&fit=crop', '[]', '[]', '["Natural","Gris","Terracota"]', '{}', '["Comedor","Cocina"]', 0, 0),
  ('20', 'Camino de Mesa Tejido', 'Camino de mesa tejido a mano en telar. Mezcla de algodón y lino. Pieza artesanal única.', 'Terrasol', 'Manteles', '', 11800, 18, 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=600&h=750&fit=crop', '[]', '[]', '[]', '{}', '["Comedor","Cocina"]', 0, 1);
