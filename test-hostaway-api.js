// Test script for Hostaway API endpoint
// Usage: node test-hostaway-api.js

const testCases = [
  {
    url: 'http://localhost:5173/api/listings/404450/hostaway?city=Paris',
    description: 'Paris listing with city parameter'
  },
  {
    url: 'http://localhost:5173/api/listings/123456/hostaway?city=London', 
    description: 'London listing with city parameter'
  },
  {
    url: 'http://localhost:5173/api/listings/789012/hostaway?city=Barcelona',
    description: 'Barcelona listing with city parameter'
  },
  {
    url: 'http://localhost:5173/api/listings/345678/hostaway',
    description: 'Listing without city parameter (defaults to Paris)'
  },
  {
    url: 'http://localhost:5173/api/listings/invalid/hostaway',
    description: 'Invalid listing ID (should return 404)'
  }
];

async function testHostawayAPI() {
  console.log('🧪 Testing Hostaway API Endpoint\n');
  
  for (const testCase of testCases) {
    console.log(`📋 ${testCase.description}`);
    console.log(`🔗 ${testCase.url}`);
    
    try {
      const response = await fetch(testCase.url);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Status:', data.status);
        console.log('🏠 Property:', data.result?.name || 'N/A');
        console.log('📍 Location:', `${data.result?.city}, ${data.result?.country}`);
        console.log('💰 Price:', `${data.result?.price} ${data.result?.currencyCode}`);
        console.log('⭐ Rating:', data.result?.averageReviewRating || 'N/A');
        console.log('🖼️  Images:', data.result?.listingImages?.length || 0);
        console.log('🛏️  Amenities:', data.result?.listingAmenities?.length || 0);
      } else {
        console.log('❌ Error:', data.message || data.error);
      }
      
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    
    console.log('─'.repeat(60));
  }
}

// Run tests if this is a Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  testHostawayAPI();
}

// For browser testing
if (typeof window !== 'undefined') {
  window.testHostawayAPI = testHostawayAPI;
  console.log('💡 Run testHostawayAPI() in the browser console to test the API');
}
