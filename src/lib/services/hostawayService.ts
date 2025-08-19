import 'dotenv/config';

// Environment variables for Hostaway API
// These MUST be loaded from environment variables - never hardcode secrets!
const HOSTAWAY_ACCOUNT_ID = process.env.HOSTAWAY_ACCOUNT_ID || '';
const HOSTAWAY_CLIENT_SECRET = process.env.HOSTAWAY_API_KEY || '';
const HOSTAWAY_BASE_URL = process.env.HOSTAWAY_BASE_URL || 'https://api.hostaway.com/v1';
const HOSTAWAY_ACCESS_TOKEN = '';

// Validate required environment variables
if (!HOSTAWAY_ACCOUNT_ID || !HOSTAWAY_CLIENT_SECRET) {
  console.warn('⚠️ Missing required Hostaway environment variables. Please check your .env.local file.');
}

export interface HostawayListing {
  id: number;
  propertyTypeId: number;
  name: string;
  externalListingName: string;
  internalListingName: string;
  description: string;
  country: string;
  countryCode: string;
  state: string;
  city: string;
  address: string;
  zipcode: string;
  price: number;
  starRating: number | null;
  personCapacity: number;
  lat: number;
  lng: number;
  bedroomsNumber: number;
  bathroomsNumber: number;
  cleaningFee: number;
  averageReviewRating: number;
  // Policies and Rules
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicyId?: number;
  cancellationPolicy?: string;
  houseRules?: string;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  partiesEventsAllowed?: boolean;
  securityDepositRequired?: boolean;
  securityDepositAmount?: number;
  // Minimum stay policies
  minimumStay?: number;
  minimumStayLongTerm?: number;
  // Additional Details
  bookingEngineUrls?: string[];
  airbnbListingUrl?: string;
  vrboListingUrl?: string;
  timeZone?: string;
  currency?: string;
  // Amenities and Images
  listingAmenities: Array<{
    id: number;
    amenityId: number;
    amenityName: string;
  }>;
  listingImages: Array<{
    id: number;
    url: string;
    caption: string;
    sortOrder: number;
  }>;
  listingTags: Array<{
    id: number;
    name: string;
  }>;
  insertedOn: string;
  updatedOn?: string;
}

export interface HostawayListingsResponse {
  status: string;
  result: HostawayListing[];
  limit: number;
  offset: number;
  count: number;
  page: number;
  totalPages: number;
}

export interface HostawayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class HostawayService {
  private static accessToken: string | null = HOSTAWAY_ACCESS_TOKEN || null;
  private static baseUrl = HOSTAWAY_BASE_URL;
  private static accountId = HOSTAWAY_ACCOUNT_ID;
  private static clientSecret = HOSTAWAY_CLIENT_SECRET;

  /**
   * Exchange credentials for an access token using OAuth2 Client Credentials flow
   */
  static async authenticate(): Promise<string> {
    try {
      // Validate required credentials
      if (!this.accountId || !this.clientSecret) {
        throw new Error('Missing required Hostaway credentials. Please check HOSTAWAY_ACCOUNT_ID and HOSTAWAY_API_KEY environment variables.');
      }

      const response = await fetch(`${this.baseUrl}/accessTokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.accountId,
          client_secret: this.clientSecret,
          scope: 'general'
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
      }

      const data: HostawayTokenResponse = await response.json();
      this.accessToken = data.access_token;
      
      console.log('✅ Hostaway authentication successful');
      console.log(`🔑 Token expires in: ${data.expires_in} seconds (~${Math.round(data.expires_in / (60 * 60 * 24))} days)`);
      
      return this.accessToken;
    } catch (error) {
      console.error('❌ Hostaway authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get the current access token, authenticating if necessary
   */
  static async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.authenticate();
    }
    return this.accessToken!;
  }

  /**
   * Make an authenticated request to the Hostaway API
   */
  static async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try to re-authenticate
        console.log('🔄 Token expired, re-authenticating...');
        await this.authenticate();
        
        // Retry the request with new token
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        if (!retryResponse.ok) {
          throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText}`);
        }
        
        return retryResponse.json();
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch listings from Hostaway API
   */
  static async getListings(params: {
    limit?: number;
    offset?: number;
    city?: string;
    country?: string;
    match?: string;
    sortOrder?: string;
    contactName?: string;
    propertyTypeId?: number;
    attachObjects?: string[];
    includeResources?: boolean;
  } = {}): Promise<HostawayListingsResponse> {
    const url = new URL('/listings', this.baseUrl);
    
    // Set default parameters
    url.searchParams.set('limit', String(params.limit || 50));
    url.searchParams.set('offset', String(params.offset || 0));
    
    // Add optional parameters
    if (params.city) url.searchParams.set('city', params.city);
    if (params.country) url.searchParams.set('country', params.country);
    if (params.match) url.searchParams.set('match', params.match);
    if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);
    if (params.contactName) url.searchParams.set('contactName', params.contactName);
    if (params.propertyTypeId) url.searchParams.set('propertyTypeId', String(params.propertyTypeId));
    if (params.includeResources) url.searchParams.set('includeResources', '1');
    
    // Add attach objects
    if (params.attachObjects && params.attachObjects.length > 0) {
      params.attachObjects.forEach(obj => {
        url.searchParams.append('attachObjects[]', obj);
      });
    }

    const endpoint = url.pathname + url.search;
    return this.makeRequest<HostawayListingsResponse>(endpoint);
  }

  /**
   * Fetch a single listing by ID with comprehensive details
   */
  static async getListing(id: number | string, params: {
    attachObjects?: string[];
    includeResources?: boolean;
  } = {}): Promise<{ status: string; result: HostawayListing }> {
    const url = new URL(`/listings/${id}`, this.baseUrl);
    
    if (params.includeResources) url.searchParams.set('includeResources', '1');
    
    // Default to include all important objects for comprehensive details
    const defaultAttachObjects = [
      'listingImages', 
      'listingAmenities',
      'listingTags',
      'cancellationPolicy',
      'listingRates'
    ];
    
    const attachObjects = params.attachObjects || defaultAttachObjects;
    
    // Add attach objects
    if (attachObjects && attachObjects.length > 0) {
      attachObjects.forEach(obj => {
        url.searchParams.append('attachObjects[]', obj);
      });
    }

    console.log(`🔍 Fetching comprehensive listing details for ID: ${id}`);
    console.log(`📎 Attached objects: ${attachObjects.join(', ')}`);

    const endpoint = url.pathname + url.search;
    return this.makeRequest<{ status: string; result: HostawayListing }>(endpoint);
  }

  /**
   * Fetch detailed listing information with all available data for property details page
   */
  static async getListingDetails(id: number | string): Promise<{ status: string; result: HostawayListing }> {
    console.log(`🏠 Fetching detailed listing information for property page ID: ${id}`);
    
    return this.getListing(id, {
      attachObjects: [
        'listingImages',
        'listingAmenities', 
        'listingTags',
        'cancellationPolicy',
        'listingRates',
        'listingStatistics',
        'listingCalendar'
      ],
      includeResources: true
    });
  }

  /**
   * Test the connection to Hostaway API
   */
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Hostaway API connection...');
      
      const response = await this.getListings({ limit: 1 });
      
      console.log('✅ Connection test successful');
      console.log(`📊 Total listings available: ${response.count}`);
      console.log(`📄 Total pages: ${response.totalPages}`);
      
      if (response.result.length > 0) {
        const firstListing = response.result[0];
        console.log(`🏠 Sample listing: "${firstListing.name}" (ID: ${firstListing.id})`);
        console.log(`📍 Location: ${firstListing.city}, ${firstListing.country}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  /**
   * Sync listings from Hostaway to local database
   */
  static async syncListings(options: {
    limit?: number;
    city?: string;
    country?: string;
  } = {}): Promise<HostawayListing[]> {
    console.log('🔄 Starting Hostaway listings sync...');
    
    const allListings: HostawayListing[] = [];
    let offset = 0;
    const limit = options.limit || 50;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.getListings({
          limit,
          offset,
          city: options.city,
          country: options.country,
          attachObjects: ['bookingEngineUrls'],
          includeResources: true
        });

        allListings.push(...response.result);
        
        console.log(`📥 Fetched ${response.result.length} listings (page ${response.page}/${response.totalPages})`);
        
        hasMore = response.page < response.totalPages;
        offset += limit;
        
        // Add a small delay to be respectful to the API
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ Error fetching listings at offset ${offset}:`, error);
        break;
      }
    }

    console.log(`✅ Sync complete. Total listings fetched: ${allListings.length}`);
    return allListings;
  }
}
