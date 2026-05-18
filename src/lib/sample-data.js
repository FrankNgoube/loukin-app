// Sample Cameroonian menu items used when the backend entities are not yet seeded.
// Pages will fall back to this data so the app remains demonstrable end-to-end.

export const SAMPLE_RESTAURANT = {
  id: "demo-restaurant",
  name: "LouKin Restaurant",
  address: "Akwa, Douala — Cameroun",
  logo_url: "",
  is_active: true,
};

export const SAMPLE_MENU = [
  {
    id: "m-ndole",
    name: "Ndolé",
    description: "Feuilles de ndolé, arachides, crevettes et viande — accompagné de plantain",
    price: 3500,
    category: "plats",
    image_url:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock: 12,
    stock_unlimited: false,
    emoji: "🥬",
  },
  {
    id: "m-poulet-dg",
    name: "Poulet DG",
    description: "Poulet mijoté, plantains mûrs, légumes croquants",
    price: 4500,
    category: "plats",
    image_url:
      "https://images.unsplash.com/photo-1604908554007-3a5cd0d3da6e?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock: 8,
    stock_unlimited: false,
    emoji: "🍗",
  },
  {
    id: "m-eru",
    name: "Eru",
    description: "Feuilles d'eru et waterleaf, viande et poisson fumé, accompagné de water-fufu",
    price: 3000,
    category: "plats",
    image_url:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock: 3,
    stock_unlimited: false,
    emoji: "🌿",
  },
  {
    id: "m-poisson-braise",
    name: "Poisson braisé",
    description: "Bar braisé au feu de bois, sauce piquante, miondo",
    price: 5000,
    category: "plats",
    image_url:
      "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock: 6,
    stock_unlimited: false,
    emoji: "🐟",
  },
  {
    id: "m-brochettes",
    name: "Brochettes de bœuf",
    description: "Brochettes marinées au piment doux, oignons grillés",
    price: 2500,
    category: "entrees",
    image_url:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock: 15,
    stock_unlimited: false,
    emoji: "🍢",
  },
  {
    id: "m-sanga",
    name: "Sanga",
    description: "Maïs, feuilles de manioc, jus de palme — saveurs du terroir",
    price: 2800,
    category: "accompagnements",
    image_url:
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock: 0,
    stock_unlimited: false,
    emoji: "🌽",
  },
  {
    id: "m-bissap",
    name: "Bissap",
    description: "Boisson fraîche d'hibiscus, menthe et gingembre",
    price: 1000,
    category: "boissons",
    image_url:
      "https://images.unsplash.com/photo-1622597467836-f3e6707e1191?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock_unlimited: true,
    stock: 0,
    emoji: "🌺",
  },
  {
    id: "m-gingembre",
    name: "Jus de gingembre",
    description: "Gingembre frais pressé, citron vert, miel local",
    price: 1200,
    category: "boissons",
    image_url:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=70",
    is_available: true,
    stock_unlimited: true,
    stock: 0,
    emoji: "🫚",
  },
];

export const SAMPLE_TABLES = [
  { id: "t-1", restaurant_id: "demo-restaurant", table_number: 1, is_active: true },
  { id: "t-2", restaurant_id: "demo-restaurant", table_number: 2, is_active: true },
  { id: "t-3", restaurant_id: "demo-restaurant", table_number: 3, is_active: true },
  { id: "t-4", restaurant_id: "demo-restaurant", table_number: 4, is_active: true },
];
