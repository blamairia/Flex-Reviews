// Amenity categories and icons mapping
export interface AmenityGroup {
  id: string;
  name: string;
  icon: string;
  amenities: Array<{
    id: number;
    name: string;
    icon?: string;
  }>;
}

// Define amenity categories with specific amenity IDs and icons
export const AMENITY_GROUPS: AmenityGroup[] = [
  {
    id: 'connectivity',
    name: 'Internet & Entertainment',
    icon: '📶',
    amenities: [
      { id: 2, name: 'Internet', icon: '🌐' },
      { id: 3, name: 'Wireless', icon: '📶' },
      { id: 280, name: 'Free WiFi', icon: '📶' },
      { id: 282, name: 'WiFi speed (25+ Mbps)', icon: '⚡' },
      { id: 1, name: 'Cable TV', icon: '📺' },
      { id: 34, name: 'TV', icon: '📺' },
      { id: 287, name: 'Smart TV', icon: '📱' }
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen & Dining',
    icon: '🍽️',
    amenities: [
      { id: 7, name: 'Kitchen', icon: '🍳' },
      { id: 49, name: 'Refrigerator', icon: '🧊' },
      { id: 357, name: 'Freezer', icon: '❄️' },
      { id: 58, name: 'Microwave', icon: '📦' },
      { id: 59, name: 'Oven', icon: '🔥' },
      { id: 68, name: 'Stove', icon: '🔥' },
      { id: 56, name: 'Toaster', icon: '🍞' },
      { id: 60, name: 'Electric kettle', icon: '☕' },
      { id: 74, name: 'Kitchen utensils', icon: '🍴' },
      { id: 106, name: 'Cooking basics', icon: '🧂' },
      { id: 294, name: 'Dining table', icon: '🪑' },
      { id: 149, name: 'Dining area', icon: '🍽️' },
      { id: 361, name: 'Wine glasses', icon: '🍷' }
    ]
  },
  {
    id: 'bathroom',
    name: 'Bathroom & Personal Care',
    icon: '🚿',
    amenities: [
      { id: 62, name: 'Shower', icon: '🚿' },
      { id: 129, name: 'Toilet', icon: '🚽' },
      { id: 17, name: 'Hair Dryer', icon: '💨' },
      { id: 30, name: 'Shampoo', icon: '🧴' },
      { id: 339, name: 'Conditioner', icon: '🧴' },
      { id: 338, name: 'Body soap', icon: '🧼' },
      { id: 341, name: 'Shower gel', icon: '🧴' },
      { id: 101, name: 'Hot water', icon: '♨️' },
      { id: 70, name: 'Towels', icon: '🏖️' }
    ]
  },
  {
    id: 'bedroom',
    name: 'Bedroom & Laundry',
    icon: '🛏️',
    amenities: [
      { id: 54, name: 'Linens', icon: '🛏️' },
      { id: 104, name: 'Extra pillows and blankets', icon: '🛌' },
      { id: 31, name: 'Hangers', icon: '👔' },
      { id: 342, name: 'Clothing storage', icon: '👕' },
      { id: 13, name: 'Washing Machine', icon: '👕' },
      { id: 32, name: 'Iron', icon: '👔' },
      { id: 53, name: 'Iron board', icon: '👔' },
      { id: 343, name: 'Drying rack for clothing', icon: '👕' }
    ]
  },
  {
    id: 'comfort',
    name: 'Comfort & Climate',
    icon: '🌡️',
    amenities: [
      { id: 18, name: 'Heating', icon: '🔥' },
      { id: 351, name: 'Portable fans', icon: '💨' },
      { id: 15, name: 'Elevator', icon: '🛗' },
      { id: 47, name: 'Private living room', icon: '🛋️' }
    ]
  },
  {
    id: 'safety',
    name: 'Safety & Security',
    icon: '🔒',
    amenities: [
      { id: 25, name: 'Smoke detector', icon: '🚨' },
      { id: 26, name: 'Carbon Monoxide Detector', icon: '⚠️' },
      { id: 29, name: 'Essentials', icon: '🩹' }
    ]
  },
  {
    id: 'family',
    name: 'Family & Accessibility',
    icon: '👶',
    amenities: [
      { id: 48, name: 'Suitable for children', icon: '👶' },
      { id: 49, name: 'Suitable for infants', icon: '🍼' },
      { id: 66, name: 'Baby crib', icon: '👶' },
      { id: 73, name: 'High chair', icon: '🪑' }
    ]
  },
  {
    id: 'services',
    name: 'Services & Policies',
    icon: '🧹',
    amenities: [
      { id: 202, name: 'Long term stays allowed', icon: '📅' },
      { id: 203, name: 'Cleaning before checkout', icon: '🧹' },
      { id: 272, name: 'Contactless Check-In/Out', icon: '📱' },
      { id: 337, name: 'Cleaning products', icon: '🧽' }
    ]
  }
];

// Function to categorize amenities
export function categorizeAmenities(amenities: Array<{ amenityId: number; amenityName?: string; name?: string }>) {
  const categorizedGroups: AmenityGroup[] = [];
  const usedAmenityIds = new Set<number>();

  AMENITY_GROUPS.forEach(group => {
    const matchingAmenities = amenities.filter(amenity => 
      group.amenities.some(groupAmenity => groupAmenity.id === amenity.amenityId)
    );

    if (matchingAmenities.length > 0) {
      const categoryAmenities = matchingAmenities.map(amenity => {
        usedAmenityIds.add(amenity.amenityId);
        const groupAmenity = group.amenities.find(ga => ga.id === amenity.amenityId);
        return {
          id: amenity.amenityId,
          name: amenity.amenityName || amenity.name || 'Unknown Amenity',
          icon: groupAmenity?.icon || '✓'
        };
      });

      categorizedGroups.push({
        ...group,
        amenities: categoryAmenities
      });
    }
  });

  // Add uncategorized amenities if any
  const uncategorizedAmenities = amenities.filter(amenity => 
    !usedAmenityIds.has(amenity.amenityId)
  );

  if (uncategorizedAmenities.length > 0) {
    categorizedGroups.push({
      id: 'other',
      name: 'Other Amenities',
      icon: '✨',
      amenities: uncategorizedAmenities.map(amenity => ({
        id: amenity.amenityId,
        name: amenity.amenityName || amenity.name || 'Unknown Amenity',
        icon: '✓'
      }))
    });
  }

  return categorizedGroups;
}

// Get icon for individual amenity
export function getAmenityIcon(amenityId: number): string {
  for (const group of AMENITY_GROUPS) {
    const amenity = group.amenities.find(a => a.id === amenityId);
    if (amenity?.icon) {
      return amenity.icon;
    }
  }
  return '✓';
}

// Icon helper function for amenity names
export function amenityIcon(name: string): string {
  const n = name.toLowerCase();
  if (/wifi|internet|wireless/.test(n)) return 'wifi';
  if (/wash|laundry/.test(n)) return 'washer';
  if (/tv|television/.test(n)) return 'tv';
  if (/kitchen|cook|microwave|oven|fridge/.test(n)) return 'kitchen';
  if (/bath|shower|toilet/.test(n)) return 'bath';
  if (/smoke|alarm/.test(n)) return 'smoke';
  if (/carbon monoxide/.test(n)) return 'co';
  if (/heating|ac|air|hot water/.test(n)) return 'thermo';
  if (/hangers|iron|linens|towels|shampoo|essentials/.test(n)) return 'closet';
  if (/garden|backyard/.test(n)) return 'garden';
  return 'dot';
}

// Icon SVG generator
export function getIcon(id: string): string {
  const common = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-slate-600" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const circle = '<span class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">';
  const end = '</span>';

  const paths: Record<string, string> = {
    wifi: `<svg ${common}><path d="M5 12a9 9 0 0 1 14 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/></svg>`,
    washer: `<svg ${common}><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="5"/></svg>`,
    tv: `<svg ${common}><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 21h10"/></svg>`,
    kitchen: `<svg ${common}><path d="M4 3h16v6H4z"/><path d="M9 9v12"/><path d="M15 9v12"/></svg>`,
    bath: `<svg ${common}><path d="M3 13h18"/><path d="M5 13V7a2 2 0 0 1 2-2h1"/><path d="M7 21h10"/><path d="M5 17h14"/></svg>`,
    smoke: `<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M8 12h8"/></svg>`,
    co: `<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M9.5 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M18 10h-3v4h3"/></svg>`,
    thermo: `<svg ${common}><path d="M14 14a4 4 0 1 1-6 3.46V5a2 2 0 1 1 4 0v12"/></svg>`,
    closet: `<svg ${common}><path d="M6 3v18"/><path d="M18 3v18"/><path d="M3 7h18"/></svg>`,
    garden: `<svg ${common}><path d="M12 22v-7"/><path d="M7 15c0-3 2-5 5-5s5 2 5 5"/><path d="M5 22h14"/></svg>`,
    dot: `<svg ${common}><circle cx="12" cy="12" r="5"/></svg>`
  };
  return circle + (paths[id] || paths.dot) + end;
}
