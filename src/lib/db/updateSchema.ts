import { db, sqlite } from './drizzle';

async function updateListingsTable() {
  try {
    // Check if columns exist
    const tableInfo = sqlite.pragma('table_info(listings)') as Array<{ name: string }>;
    const columnNames = tableInfo.map(row => row.name);
    
    console.log('Current columns:', columnNames);
    
    // Add missing columns
    if (!columnNames.includes('address')) {
      console.log('Adding address column...');
      sqlite.exec('ALTER TABLE listings ADD COLUMN address TEXT');
    }
    
    if (!columnNames.includes('channel')) {
      console.log('Adding channel column...');
      sqlite.exec('ALTER TABLE listings ADD COLUMN channel TEXT NOT NULL DEFAULT "Airbnb"');
    }
    
    if (!columnNames.includes('status')) {
      console.log('Adding status column...');
      sqlite.exec('ALTER TABLE listings ADD COLUMN status TEXT NOT NULL DEFAULT "active"');
    }
    
    if (!columnNames.includes('avg_rating')) {
      console.log('Adding avg_rating column...');
      sqlite.exec('ALTER TABLE listings ADD COLUMN avg_rating REAL DEFAULT 0');
    }
    
    if (!columnNames.includes('review_count')) {
      console.log('Adding review_count column...');
      sqlite.exec('ALTER TABLE listings ADD COLUMN review_count INTEGER NOT NULL DEFAULT 0');
    }
    
    console.log('Listings table updated successfully!');
    
    // Check final structure
    const finalInfo = sqlite.pragma('table_info(listings)') as Array<{ name: string }>;
    console.log('Final columns:', finalInfo.map(row => row.name));
    
  } catch (error) {
    console.error('Error updating listings table:', error);
  }
}

updateListingsTable().then(() => {
  console.log('Migration complete');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
