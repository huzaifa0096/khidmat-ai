/**
 * Provider image overrides — replace random model photos from the mock JSON
 * with category-appropriate professional service photos. Deterministic per
 * provider ID so the same provider always shows the same image.
 */

// Bank of professional service-provider images (Unsplash, free to use).
// Each category gets multiple options so different providers in the same
// category don't all look identical.
const SERVICE_IMAGES: Record<string, string[]> = {
  ac_technician: [
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=75', // AC service
    'https://images.unsplash.com/photo-1635424710928-0544e8eaeb4b?w=600&q=75', // HVAC tech
    'https://images.unsplash.com/photo-1631545806609-c0bd5c8b3df3?w=600&q=75', // AC repair
  ],
  plumber: [
    'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&q=75', // plumber working
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=75', // pipes
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75', // plumbing
  ],
  electrician: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=75', // electrician
    'https://images.unsplash.com/photo-1573164574511-73c773193279?w=600&q=75', // wiring
    'https://images.unsplash.com/photo-1565608438257-fac3c27beb36?w=600&q=75', // electric panel
  ],
  carpenter: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=75', // carpenter
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&q=75', // woodworking
    'https://images.unsplash.com/photo-1572297870735-1782a4f08b46?w=600&q=75', // tools
  ],
  painter: [
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=75', // painter
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=75', // painting wall
    'https://images.unsplash.com/photo-1599619351208-3e6c839d6828?w=600&q=75', // paint roller
  ],
  cleaner: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=75', // cleaning
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600&q=75', // home cleaning
    'https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?w=600&q=75', // service
  ],
  mechanic: [
    'https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=600&q=75', // mechanic
    'https://images.unsplash.com/photo-1632823471565-1ec2d0ba1c1f?w=600&q=75', // auto repair
    'https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?w=600&q=75', // garage
  ],
  tutor: [
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&q=75', // tutor teaching
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=75', // notebook
    'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&q=75', // lesson
  ],
  driver: [
    'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600&q=75', // driver
    'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=75', // car
    'https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?w=600&q=75', // driving
  ],
  beautician: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=75', // salon
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=75', // beauty
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=75', // makeup
  ],
};

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=75', // handshake/business
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=75',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=75',
];

const hashId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const matchCategory = (primary?: string): string[] => {
  if (!primary) return DEFAULT_IMAGES;
  const key = primary.toLowerCase().trim();
  if (SERVICE_IMAGES[key]) return SERVICE_IMAGES[key];
  // Fuzzy match (e.g. "ac_repair" → ac_technician)
  if (key.includes('ac') || key.includes('cool') || key.includes('hvac')) return SERVICE_IMAGES.ac_technician;
  if (key.includes('plumb') || key.includes('pipe') || key.includes('water') || key.includes('geyser')) return SERVICE_IMAGES.plumber;
  if (key.includes('electric') || key.includes('wir') || key.includes('mcb')) return SERVICE_IMAGES.electrician;
  if (key.includes('carpent') || key.includes('wood') || key.includes('furniture')) return SERVICE_IMAGES.carpenter;
  if (key.includes('paint')) return SERVICE_IMAGES.painter;
  if (key.includes('clean') || key.includes('maid')) return SERVICE_IMAGES.cleaner;
  if (key.includes('mechan') || key.includes('car') || key.includes('auto')) return SERVICE_IMAGES.mechanic;
  if (key.includes('tutor') || key.includes('teach') || key.includes('education')) return SERVICE_IMAGES.tutor;
  if (key.includes('driv')) return SERVICE_IMAGES.driver;
  if (key.includes('beaut') || key.includes('salon') || key.includes('makeup')) return SERVICE_IMAGES.beautician;
  return DEFAULT_IMAGES;
};

/**
 * Returns a professional service-themed image for this provider.
 * Same provider ID always returns the same image (deterministic).
 */
export const getProviderImage = (provider: any): string => {
  if (!provider) return DEFAULT_IMAGES[0];
  const pool = matchCategory(provider.primary_service);
  const id = provider.id || provider.business_name || 'X';
  return pool[hashId(id) % pool.length];
};

/**
 * Returns 2-3 portfolio images for the provider — different from the hero,
 * still on-theme for the category. Used on the "See More Photos" rail.
 */
export const getServicePortfolio = (provider: any): string[] => {
  if (!provider) return DEFAULT_IMAGES.slice(0, 3);
  const pool = matchCategory(provider.primary_service);
  const id = provider.id || provider.business_name || 'X';
  const startIdx = hashId(id) % pool.length;
  // Cycle through the pool starting from a different offset than hero
  return [
    pool[(startIdx + 1) % pool.length],
    pool[(startIdx + 2) % pool.length],
    pool[(startIdx + 0) % pool.length],
  ];
};
