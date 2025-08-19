import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { populateReviewsDatabase, checkDatabaseState } from '$lib/db/populateReviews';

export const POST: RequestHandler = async ({ url }) => {
  try {
    console.log('🎯 API: Starting database population...');
    
    // Check if we should force repopulate
    const force = url.searchParams.get('force') === 'true';
    
    // Check current state
    const currentState = await checkDatabaseState();
    console.log(`📊 Current state: ${currentState.reviews} reviews, ${currentState.listings} listings`);
    
    // Only populate if database is empty or force is true
    if (currentState.reviews === 0 || force) {
      // Populate database
      const result = await populateReviewsDatabase();
      
      return json({
        success: true,
        message: 'Database populated successfully',
        data: result,
        previousState: currentState
      });
    } else {
      return json({
        success: true,
        message: 'Database already populated',
        data: currentState,
        skipReason: 'Database already has data. Use ?force=true to repopulate.'
      });
    }
    
  } catch (error) {
    console.error('❌ API Error populating database:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async () => {
  try {
    const state = await checkDatabaseState();
    
    return json({
      success: true,
      data: state
    });
    
  } catch (error) {
    console.error('❌ API Error checking database state:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
