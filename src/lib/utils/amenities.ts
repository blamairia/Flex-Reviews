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
