import { db } from './drizzle';
import { reviews, listings } from './schema';
import { sql } from 'drizzle-orm';

// Function to generate mock reviews for Hostaway listings
function generateMockReviewsForDB(listings: any[]): any[] {
  const channels = ['airbnb', 'booking', 'vrbo', 'website'];
  const statuses = ['approved', 'pending', 'rejected'];
  const guestNames = ['Sarah M.', 'John D.', 'Emma L.', 'Michael R.', 'Lisa K.', 'David P.', 'Anna S.', 'James W.', 'Sophie T.', 'Robert H.', 'Claire B.', 'Mark T.', 'Jennifer K.', 'Alex P.', 'Olivia W.'];
  
  // Property-specific review templates for London properties
  const reviewTemplates = {
    'The Bromley Collection': [
      'Stunning property in Bromley! Perfect for exploring London while staying in a quieter area. The space was immaculate and beautifully decorated.',
      'Amazing stay at The Bromley Collection. Great transport links to central London and the apartment had everything we needed.',
      'Lovely modern apartment with excellent amenities. Bromley is a perfect base for London adventures. Highly recommend!',
      'Beautiful property with attention to detail. Easy access to London via train and great local restaurants nearby.',
      'Perfect family accommodation! The 2-bedroom setup was ideal and the location in Bromley was surprisingly convenient.',
      'Outstanding property! Clean, modern, and well-equipped. The host was responsive and helpful throughout our stay.',
      'Excellent value for money. The apartment exceeded our expectations and Bromley proved to be a great location choice.',
      'Wonderful stay! The property photos didn\'t do justice to how lovely this place actually is. Will definitely return.'
    ],
    'The Peckham Apartments': [
      'Fantastic location in trendy Peckham! Walking distance to amazing restaurants and bars. The apartment was stylish and comfortable.',
      'Loved staying in Peckham - such a vibrant area! The apartment was perfect for our London trip. Great local food scene.',
      'Modern apartment in the heart of Peckham. Perfect for exploring South London\'s creative scene. Excellent transport links too.',
      'Beautiful 1-bedroom apartment with everything we needed. Peckham has such character and the location was ideal.',
      'Outstanding property! Peckham is an amazing area with great food and culture. The apartment was spotless and well-designed.',
      'Perfect base for exploring London! Peckham has excellent transport links and the apartment was beautifully appointed.',
      'Stylish apartment in a fantastic location. We loved exploring Peckham\'s markets and restaurants. Highly recommend!',
      'Exceptional stay! The apartment was modern and comfortable, and Peckham exceeded all our expectations as a neighborhood.'
    ],
    'The Putney Apart 2': [
      'Great location in Putney with easy access to central London. The 3-bedroom apartment was perfect for our group.',
      'Lovely stay in Putney! Close to the Thames and great transport links. The apartment was clean and comfortable.',
      'Perfect for our family trip! Putney is a wonderful area with parks and riverside walks. The space was ideal.',
      'Excellent accommodation in Putney. Easy tube access to central London and beautiful area for morning runs along the Thames.',
      'Wonderful 3-bedroom apartment! Putney has great local amenities and the property was exactly what we needed.',
      'Outstanding location! Putney Bridge area is perfect for exploring London. The apartment was well-equipped and spacious.',
      'Great base for London exploration! Putney has excellent restaurants and the apartment provided all the comfort we needed.',
      'Perfect family accommodation! The space was generous and Putney proved to be an excellent choice for our London stay.'
    ]
  };

  const categories = [
    ['cleanliness', 'location', 'communication'],
    ['amenities', 'value', 'accuracy'],
    ['check-in', 'location', 'cleanliness'],
    ['communication', 'amenities', 'accuracy'],
    ['value', 'location', 'check-in'],
    ['cleanliness', 'communication', 'value'],
    ['location', 'amenities', 'check-in']
  ];

  const mockReviews: any[] = [];
  let reviewId = 1;

  listings.forEach((listing) => {
    // Generate 10-15 reviews per listing for better testing
    const reviewCount = Math.floor(Math.random() * 6) + 10; // 10-15 reviews
    const propertyReviews = reviewTemplates[listing.name as keyof typeof reviewTemplates] || [
      'Great property with excellent amenities and perfect location for exploring London.',
      'Wonderful stay! The apartment was clean, comfortable, and well-equipped.',
      'Perfect base for our London trip. Excellent value and great communication from host.',
      'Outstanding property! Everything was as described and the location was ideal.',
      'Fantastic accommodation! Would definitely stay here again on our next London visit.'
    ];
    
    for (let i = 0; i < reviewCount; i++) {
      const rating = Math.random() > 0.15 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1; // Mostly 4-5 stars
      const daysAgo = Math.floor(Math.random() * 365) + 1; // Last year
      const submittedAt = new Date();
      submittedAt.setDate(submittedAt.getDate() - daysAgo);

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      // Bias towards approved for realistic data
      const finalStatus = Math.random() > 0.25 ? 'approved' : status;

      const review = {
        id: `rv_${reviewId++}`,
        listingId: listing.id.toString(),
        listingName: listing.name,
        channel: channels[Math.floor(Math.random() * channels.length)],
        type: 'guest',
        status: finalStatus,
        overallRating: rating,
        categoriesJson: JSON.stringify(categories[Math.floor(Math.random() * categories.length)]),
        submittedAt: submittedAt.toISOString(),
        guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
        publicReview: propertyReviews[Math.floor(Math.random() * propertyReviews.length)],
        selectedForWeb: Math.random() > 0.3 ? 1 : 0, // 70% selected for web
        note: null,
        tagsJson: null,
        createdAt: submittedAt.toISOString(),
        updatedAt: submittedAt.toISOString()
      };

      mockReviews.push(review);
    }
  });

  return mockReviews;
}

// Function to populate database with mock reviews
export async function populateReviewsDatabase() {
  try {
    console.log('🔄 Starting database population...');
    
    // Use the exact 3 Hostaway listings from your API response
    const mockListings = [
      { id: 155613, name: "The Bromley Collection" },
      { id: 155615, name: "The Peckham Apartments" },
      { id: 346994, name: "The Putney Apart 2" }
    ];
    
    console.log(`📋 Using ${mockListings.length} specific Hostaway listings`);
    console.log('🏠 Listings:', mockListings.map(l => `${l.name} (ID: ${l.id})`).join(', '));

    // Clear existing reviews
    console.log('🗑️ Clearing existing reviews...');
    await db.delete(reviews);
    
    // Generate mock reviews
    console.log('📝 Generating mock reviews...');
    const mockReviews = generateMockReviewsForDB(mockListings);
    
    // Insert reviews in batches
    console.log(`💾 Inserting ${mockReviews.length} reviews into database...`);
    const batchSize = 50;
    for (let i = 0; i < mockReviews.length; i += batchSize) {
      const batch = mockReviews.slice(i, i + batchSize);
      await db.insert(reviews).values(batch);
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mockReviews.length / batchSize)}`);
    }
    
    // Update listing review counts and averages
    console.log('📊 Updating listing statistics...');
    for (const listing of mockListings) {
      const listingReviews = mockReviews.filter(r => r.listingId === listing.id.toString());
      const approvedReviews = listingReviews.filter(r => r.status === 'approved');
      const avgRating = approvedReviews.length > 0 
        ? approvedReviews.reduce((sum, r) => sum + r.overallRating, 0) / approvedReviews.length 
        : 0;
      
      // Insert or update listing
      await db.insert(listings).values({
        id: listing.id.toString(),
        name: listing.name,
        slug: listing.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        address: `Sample Address ${listing.id}, UK`,
        channel: 'hostaway',
        status: 'active',
        avgRating,
        reviewCount: approvedReviews.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).onConflictDoUpdate({
        target: listings.id,
        set: {
          avgRating,
          reviewCount: approvedReviews.length,
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    console.log('✅ Database population completed successfully!');
    console.log(`📈 Total reviews inserted: ${mockReviews.length}`);
    console.log(`🏠 Total listings updated: ${mockListings.length}`);
    
    return { success: true, reviewsCount: mockReviews.length, listingsCount: mockListings.length };
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  }
}

// Function to check current database state
export async function checkDatabaseState() {
  try {
    const reviewCount = await db.select({ count: sql<number>`count(*)` }).from(reviews);
    const listingCount = await db.select({ count: sql<number>`count(*)` }).from(listings);
    
    return {
      reviews: reviewCount[0]?.count || 0,
      listings: listingCount[0]?.count || 0
    };
  } catch (error) {
    console.error('❌ Error checking database state:', error);
    return { reviews: 0, listings: 0 };
  }
}
