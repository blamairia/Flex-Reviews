import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ListingService } from '$lib/db/listingService';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { id } = params;
    const city = url.searchParams.get('city');

    if (!id) {
      return json(
        { status: 'error', message: 'Listing ID is required' },
        { status: 400 }
      );
    }

    // Try to fetch real listing data
    const listing = await ListingService.getListingById(id);
    
    if (!listing) {
      return json(
        { status: 'error', message: 'Listing not found' },
        { status: 404 }
      );
    }

    // Create comprehensive Hostaway-style response
    const hostawayResponse = {
      status: 'success',
      result: {
        id: parseInt(id),
        propertyTypeId: 1,
        name: listing.title,
        externalListingName: listing.title,
        internalListingName: listing.title,
        description: generateDescription(listing.title, city),
        thumbnailUrl: null,
        houseRules: null,
        keyPickup: null,
        specialInstruction: null,
        doorSecurityCode: null,
        country: getCountryByCity(city),
        countryCode: getCountryCodeByCity(city),
        state: getStateByCity(city),
        city: city || 'Paris',
        street: listing.address || '173 Rue Championnet',
        address: listing.address || '173 Rue Championnet',
        publicAddress: listing.address || '173 Rue Championnet',
        zipcode: getZipcodeByCity(city),
        price: 151,
        starRating: listing.avgRating,
        weeklyDiscount: 0.9,
        monthlyDiscount: 0.8,
        propertyRentTax: 0,
        guestPerPersonPerNightTax: 0,
        guestStayTax: 0,
        guestNightlyTax: 0,
        refundableDamageDeposit: 500,
        isDepositStayCollected: 1,
        personCapacity: 3,
        maxChildrenAllowed: null,
        maxInfantsAllowed: null,
        maxPetsAllowed: null,
        lat: getLatByCity(city),
        lng: getLngByCity(city),
        checkInTimeStart: 15,
        checkInTimeEnd: 23,
        checkOutTime: 10,
        cancellationPolicy: 'strict',
        squareMeters: 34,
        roomType: 'entire_home',
        bathroomType: 'private',
        bedroomsNumber: 1,
        bedsNumber: 2,
        bathroomsNumber: 1,
        guestBathroomsNumber: null,
        minNights: 14,
        maxNights: 365,
        guestsIncluded: 1,
        cleaningFee: 75,
        checkinFee: 0,
        priceForExtraPerson: 0,
        instantBookable: 1,
        instantBookableLeadTime: null,
        airbnbBookingLeadTime: 0,
        airbnbBookingLeadTimeAllowRequestToBook: 1,
        airbnbName: listing.title,
        airbnbSummary: generateSummary(listing.title, city),
        airbnbSpace: generateSpaceDescription(),
        airbnbAccess: null,
        airbnbInteraction: generateInteractionText(),
        airbnbNeighborhoodOverview: generateNeighborhoodOverview(city),
        airbnbTransit: generateTransitInfo(city),
        airbnbNotes: generateCheckInNotes(),
        airbnbExportStatus: 'exported',
        vrboExportStatus: null,
        marriotExportStatus: null,
        bookingcomExportStatus: 'exported',
        expediaExportStatus: 'exported',
        googleExportStatus: 'exported',
        allowSameDayBooking: 0,
        sameDayBookingLeadTime: 12,
        contactName: null,
        contactSurName: null,
        contactPhone1: null,
        contactPhone2: null,
        contactLanguage: null,
        contactEmail: null,
        contactAddress: null,
        language: 'en',
        currencyCode: 'GBP',
        timeZoneName: getTimezoneByCity(city),
        wifiUsername: null,
        wifiPassword: null,
        cleannessStatus: null,
        cleaningInstruction: null,
        cleannessStatusUpdatedOn: null,
        homeawayPropertyName: listing.title,
        homeawayPropertyHeadline: listing.title,
        homeawayPropertyDescription: generateDescription(listing.title, city),
        bookingcomPropertyName: listing.title,
        bookingcomPropertyRoomName: 'Apartment',
        bookingcomPropertyDescription: generateDescription(listing.title, city),
        invoicingContactName: null,
        invoicingContactSurName: null,
        invoicingContactPhone1: null,
        invoicingContactPhone2: null,
        invoicingContactLanguage: null,
        invoicingContactEmail: null,
        invoicingContactAddress: null,
        invoicingContactCity: null,
        invoicingContactZipcode: null,
        invoicingContactCountry: null,
        attachment: null,
        listingAmenities: generateAmenities(),
        listingBedTypes: generateBedTypes(),
        listingImages: generateImages(id),
        listingTags: [{ id: 71242, name: listing.title.split(' ').slice(0, 2).join(' ') }],
        listingUnits: [],
        propertyLicenseNumber: null,
        propertyLicenseType: null,
        propertyLicenseIssueDate: null,
        propertyLicenseExpirationDate: null,
        customFieldValues: generateCustomFields(),
        applyPropertyRentTaxToFees: null,
        bookingEngineLeadTime: null,
        cancellationPolicyId: 500804,
        vrboCancellationPolicyId: 79371,
        marriottCancellationPolicyId: 79376,
        bookingCancellationPolicyId: 79382,
        listingFeeSetting: [],
        isRentalAgreementActive: null,
        averageNightlyPrice: null,
        bookingcomPropertyRegisteredInVcs: null,
        bookingcomPropertyHasVat: null,
        bookingcomPropertyDeclaresRevenue: null,
        airbnbCancellationPolicyId: 79388,
        airbnbListingUrl: `https://www.airbnb.com/rooms/${generateRandomId()}`,
        vrboListingUrl: `https://www.vrbo.com/${generateRandomId()}?dateless=true`,
        googleVrListingUrl: `https://www.google.com/travel/hotels/entity/${generateRandomId()}/overview`,
        expediaListingUrl: null,
        averageReviewRating: listing.avgRating || 10,
        partnersListingMarkup: 1,
        airbnbOfficialListingMarkup: 1,
        bookingEngineMarkup: 1,
        homeawayApiMarkup: 1,
        marriottListingMarkup: 1,
        latestActivityOn: new Date().toISOString().replace('T', ' ').substring(0, 19),
        bookingEngineUrls: [],
        marriottListingName: null,
        airbnbPetFeeAmount: null,
        insertedOn: listing.createdAt,
        insuranceEligibilityStatus: null,
        listingSettings: generateListingSettings(id)
      }
    };

    return json(hostawayResponse);
  } catch (error) {
    console.error('Error fetching Hostaway listing data:', error);
    return json(
      { status: 'error', message: 'Failed to fetch listing data' },
      { status: 500 }
    );
  }
};

// Helper functions for generating location-specific data
function getCountryByCity(city: string | null): string {
  const cityMappings: Record<string, string> = {
    'Paris': 'France',
    'London': 'United Kingdom',
    'New York': 'United States',
    'Barcelona': 'Spain',
    'Amsterdam': 'Netherlands',
    'Berlin': 'Germany',
    'Rome': 'Italy'
  };
  return cityMappings[city || 'Paris'] || 'France';
}

function getCountryCodeByCity(city: string | null): string {
  const cityMappings: Record<string, string> = {
    'Paris': 'FR',
    'London': 'GB',
    'New York': 'US',
    'Barcelona': 'ES',
    'Amsterdam': 'NL',
    'Berlin': 'DE',
    'Rome': 'IT'
  };
  return cityMappings[city || 'Paris'] || 'FR';
}

function getStateByCity(city: string | null): string {
  const cityMappings: Record<string, string> = {
    'Paris': 'Île-de-France',
    'London': 'England',
    'New York': 'New York',
    'Barcelona': 'Catalonia',
    'Amsterdam': 'North Holland',
    'Berlin': 'Berlin',
    'Rome': 'Lazio'
  };
  return cityMappings[city || 'Paris'] || 'Île-de-France';
}

function getZipcodeByCity(city: string | null): string {
  const cityMappings: Record<string, string> = {
    'Paris': '75018',
    'London': 'SW1A 1AA',
    'New York': '10001',
    'Barcelona': '08001',
    'Amsterdam': '1012',
    'Berlin': '10115',
    'Rome': '00118'
  };
  return cityMappings[city || 'Paris'] || '75018';
}

function getLatByCity(city: string | null): number {
  const cityMappings: Record<string, number> = {
    'Paris': 48.8946355,
    'London': 51.5074,
    'New York': 40.7128,
    'Barcelona': 41.3851,
    'Amsterdam': 52.3676,
    'Berlin': 52.5200,
    'Rome': 41.9028
  };
  return cityMappings[city || 'Paris'] || 48.8946355;
}

function getLngByCity(city: string | null): number {
  const cityMappings: Record<string, number> = {
    'Paris': 2.3348555,
    'London': -0.1278,
    'New York': -74.0060,
    'Barcelona': 2.1734,
    'Amsterdam': 4.9041,
    'Berlin': 13.4050,
    'Rome': 12.4964
  };
  return cityMappings[city || 'Paris'] || 2.3348555;
}

function getTimezoneByCity(city: string | null): string {
  const cityMappings: Record<string, string> = {
    'Paris': 'Europe/Paris',
    'London': 'Europe/London',
    'New York': 'America/New_York',
    'Barcelona': 'Europe/Madrid',
    'Amsterdam': 'Europe/Amsterdam',
    'Berlin': 'Europe/Berlin',
    'Rome': 'Europe/Rome'
  };
  return cityMappings[city || 'Paris'] || 'Europe/Paris';
}

function generateDescription(title: string, city: string | null): string {
  const locationText = city === 'Paris' 
    ? "Cet appartement lumineux et spacieux d'une chambre se trouve rue Championnet à Paris. Il est parfait pour tous les profils – que vous soyez seul, en couple ou en télétravail.\n\nL'appartement comprend un grand salon, une chambre confortable, une cuisine et une salle de bain. Il est situé dans un quartier agréable, proche des commerces, cafés et transports en commun."
    : `This bright and spacious one-bedroom apartment is located in the heart of ${city || 'the city'}. Perfect for all types of travelers – whether you're solo, a couple, or working remotely.\n\nThe apartment includes a large living room, comfortable bedroom, kitchen, and bathroom. It's situated in a pleasant neighborhood, close to shops, cafés, and public transportation.`;

  return `${locationText}\n\nBienvenue dans votre pied-à-terre confortable ! Cet appartement chaleureux comprend une chambre spacieuse, une cuisine entièrement équipée, une salle de bain moderne et un salon accueillant avec un matelas gonflable supplémentaire – parfait pour héberger une troisième personne.\n\nQue vous voyagiez entre amis ou en famille, ce logement est idéal pour 3 personnes à la recherche d'un séjour agréable et reposant.\n\nVotre confort est ma priorité, alors si vous avez besoin de quoi que ce soit ou si je peux vous aider d'une manière ou d'une autre, n'hésitez pas à me le faire savoir – je serai toujours ravi de vous assister !`;
}

function generateSummary(title: string, city: string | null): string {
  return city === 'Paris'
    ? "Cet appartement lumineux et spacieux d'une chambre se trouve rue Championnet à Paris. Il est parfait pour tous les profils – que vous soyez seul, en couple ou en télétravail.\n\nL'appartement comprend un grand salon, une chambre confortable, une cuisine et une salle de bain. Il est situé dans un quartier agréable, proche des commerces, cafés et transports en commun."
    : `This bright and spacious one-bedroom apartment is located in ${city || 'the city'}. Perfect for all profiles – whether you're alone, a couple, or working remotely.\n\nThe apartment includes a large living room, comfortable bedroom, kitchen, and bathroom. It's located in a pleasant neighborhood, close to shops, cafés, and public transport.`;
}

function generateSpaceDescription(): string {
  return "Bienvenue dans votre pied-à-terre confortable ! Cet appartement chaleureux comprend une chambre spacieuse, une cuisine entièrement équipée, une salle de bain moderne et un salon accueillant avec un matelas gonflable supplémentaire – parfait pour héberger une troisième personne.\n\nQue vous voyagiez entre amis ou en famille, ce logement est idéal pour 3 personnes à la recherche d'un séjour agréable et reposant.\n\nVeuillez noter que le canapé-lit du salon est un matelas gonflable .";
}

function generateInteractionText(): string {
  return "Votre confort est ma priorité, alors si vous avez besoin de quoi que ce soit ou si je peux vous aider d'une manière ou d'une autre, n'hésitez pas à me le faire savoir – je serai toujours ravi de vous assister !";
}

function generateNeighborhoodOverview(city: string | null): string {
  if (city === 'Paris') {
    return "Situé dans le quartier vivant et en pleine effervescence de Championnet, au cœur du 18e arrondissement de Paris, ce logement vous plonge dans une ambiance typiquement parisienne, entre charme populaire et esprit artistique. À quelques pas de Montmartre, ce quartier séduit par ses petites rues calmes, ses cafés bohèmes, ses ateliers d'artistes, et ses adresses gourmandes prisées des locaux.\n\nChampionnet est apprécié pour son atmosphère conviviale, son marché de quartier, et sa proximité avec les transports (métro, bus), permettant de rejoindre rapidement le centre de Paris tout en profitant d'un cadre plus tranquille et authentique.\n\nC'est l'endroit idéal pour vivre une expérience parisienne vraie, loin des foules touristiques, tout en ayant à portée de main toutes les commodités et l'âme vibrante de la capitale.";
  }
  return `Located in the vibrant and bustling heart of ${city || 'the city'}, this accommodation immerses you in an authentic local atmosphere. The neighborhood is known for its friendly atmosphere, local markets, and proximity to transportation, allowing you to quickly reach the city center while enjoying a quieter and more authentic setting.\n\nIt's the ideal place to experience true local life, away from tourist crowds, while having all amenities and the vibrant soul of the city at your fingertips.`;
}

function generateTransitInfo(city: string | null): string {
  if (city === 'Paris') {
    return "P1 Bouche - 11 minute walk\nMignon Café - 13 minute walk\nFirmin Gémier - 5 minute walk";
  }
  return "Local transit station - 5 minute walk\nCity center - 15 minute walk\nNearby café - 8 minute walk";
}

function generateCheckInNotes(): string {
  return "Lors de votre arrivée, il vous sera demandé de présenter une pièce d'identité valide et d'accepter nos conditions générales. Ces étapes sont mises en place pour garantir un processus sécurisé et fluide pour tous. Merci beaucoup pour votre compréhension !";
}

function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateAmenities() {
  return [
    { id: 249364605, amenityId: 1, amenityName: "Cable TV" },
    { id: 249364465, amenityId: 2, amenityName: "Internet" },
    { id: 249364450, amenityId: 3, amenityName: "Wireless" },
    { id: 249364452, amenityId: 7, amenityName: "Kitchen" },
    { id: 249364458, amenityId: 13, amenityName: "Washing Machine" },
    { id: 249364472, amenityId: 15, amenityName: "Elevator" },
    { id: 249364456, amenityId: 17, amenityName: "Hair Dryer" },
    { id: 249364455, amenityId: 18, amenityName: "Heating" },
    { id: 249364464, amenityId: 25, amenityName: "Smoke detector" },
    { id: 249364484, amenityId: 26, amenityName: "Carbon Monoxide Detector" },
    { id: 249364451, amenityId: 29, amenityName: "Essentials" },
    { id: 249364448, amenityId: 30, amenityName: "Shampoo" },
    { id: 249364473, amenityId: 31, amenityName: "Hangers" },
    { id: 249364459, amenityId: 32, amenityName: "Iron" },
    { id: 249364453, amenityId: 34, amenityName: "TV" },
    { id: 249364602, amenityId: 47, amenityName: "Private living room" },
    { id: 249364487, amenityId: 48, amenityName: "Suitable for children" },
    { id: 249364488, amenityId: 49, amenityName: "Suitable for infants" },
    { id: 249364598, amenityId: 53, amenityName: "Iron board" },
    { id: 249364482, amenityId: 54, amenityName: "Linens" },
    { id: 249364462, amenityId: 56, amenityName: "Toaster" },
    { id: 249364457, amenityId: 58, amenityName: "Microwave" },
    { id: 249364466, amenityId: 59, amenityName: "Oven" },
    { id: 249364476, amenityId: 60, amenityName: "Electric kettle" },
    { id: 249364600, amenityId: 62, amenityName: "Shower" },
    { id: 249364463, amenityId: 66, amenityName: "Baby crib" },
    { id: 249364475, amenityId: 68, amenityName: "Stove" },
    { id: 249364449, amenityId: 69, amenityName: "Refrigerator" },
    { id: 249364599, amenityId: 70, amenityName: "Towels" },
    { id: 249364467, amenityId: 73, amenityName: "High chair" },
    { id: 249364478, amenityId: 74, amenityName: "Kitchen utensils" },
    { id: 249364468, amenityId: 101, amenityName: "Hot water" },
    { id: 249364461, amenityId: 104, amenityName: "Extra pillows and blankets" },
    { id: 249364486, amenityId: 106, amenityName: "Cooking basics" },
    { id: 249364607, amenityId: 129, amenityName: "Toilet" },
    { id: 249364604, amenityId: 149, amenityName: "Dining area" },
    { id: 249364471, amenityId: 202, amenityName: "Long term stays allowed" },
    { id: 249364480, amenityId: 203, amenityName: "Cleaning before checkout" },
    { id: 249364597, amenityId: 272, amenityName: "Contactless Check-In/Out" },
    { id: 249364606, amenityId: 280, amenityName: "Free WiFi" },
    { id: 249364601, amenityId: 282, amenityName: "WiFi speed (25+ Mbps)" },
    { id: 249364603, amenityId: 287, amenityName: "Smart TV" },
    { id: 249364470, amenityId: 294, amenityName: "Dining table" },
    { id: 249364483, amenityId: 337, amenityName: "Cleaning products" },
    { id: 249364469, amenityId: 338, amenityName: "Body soap" },
    { id: 249364460, amenityId: 339, amenityName: "Conditioner" },
    { id: 249364477, amenityId: 341, amenityName: "Shower gel" },
    { id: 249364474, amenityId: 342, amenityName: "Clothing storage" },
    { id: 249364479, amenityId: 343, amenityName: "Drying rack for clothing" },
    { id: 249364454, amenityId: 351, amenityName: "Portable fans" },
    { id: 249364485, amenityId: 357, amenityName: "Freezer" },
    { id: 249364481, amenityId: 361, amenityName: "Wine glasses" }
  ];
}

function generateBedTypes() {
  return [
    { id: 20215388, bedTypeId: 2, quantity: 1, bedroomNumber: 1 },
    { id: 20215389, bedTypeId: 1, quantity: 1, bedroomNumber: 0 }
  ];
}

function generateImages(id: string) {
  const baseUrl = "https://images.unsplash.com/photo-";
  const imageIds = [
    "1566073771259-6a8506099945",
    "1560448204-e02f11c3d0e2", 
    "1502672260266-1c1ef2d93688",
    "1484154218962-a197022b5858",
    "1522708323590-d24dbb6b0267",
    "1540518614846-7eded433c457",
    "1571624436279-b272aff752b5",
    "1556020685-ae41abfc9365"
  ];

  return imageIds.map((imageId, index) => ({
    id: parseInt(id) * 1000 + index,
    caption: "",
    bookingEngineCaption: null,
    airbnbCaption: "",
    vrboCaption: null,
    url: `${baseUrl}${imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`,
    sortOrder: index + 1
  }));
}

function generateCustomFields() {
  return [
    {
      id: 45959773,
      customFieldId: 71552,
      value: null,
      insertedOn: "2025-06-19 10:10:37",
      updatedOn: "2025-06-19 10:10:37",
      customField: {
        id: 71552,
        name: "Lockbox",
        possibleValues: [{ value: "Yes" }, { value: "No" }],
        type: "dropdown",
        isPublic: 1,
        insertedOn: "2025-01-07 09:30:18",
        updatedOn: "2025-06-30 11:52:13"
      }
    },
    {
      id: 45959774,
      customFieldId: 71551,
      value: null,
      insertedOn: "2025-06-19 10:10:37",
      updatedOn: "2025-06-19 10:10:37",
      customField: {
        id: 71551,
        name: "grouped_property",
        possibleValues: [{ value: "Yes" }, { value: "No" }],
        type: "dropdown",
        isPublic: 1,
        insertedOn: "2025-01-07 09:30:06",
        updatedOn: "2025-06-30 11:52:13"
      }
    },
    {
      id: 45959775,
      customFieldId: 71553,
      value: null,
      insertedOn: "2025-06-19 10:10:37",
      updatedOn: "2025-06-19 10:10:37",
      customField: {
        id: 71553,
        name: "Number of Flats",
        possibleValues: null,
        type: "number",
        isPublic: 1,
        insertedOn: "2025-01-07 09:30:58",
        updatedOn: "2025-06-30 11:52:13"
      }
    }
  ];
}

function generateListingSettings(id: string) {
  return {
    id: 230678,
    accountId: 130509,
    listingMapId: parseInt(id),
    showInvoices: 1,
    showInvoicesStage: "always",
    showInvoicesChannels: null,
    showReceipts: 1,
    minimumNightsThresholdToApplyMonthlyDiscount: 30,
    showPaymentLinkForAwaitingPayments: 0,
    showPaymentLinkForFailedPayments: 1,
    insertedOn: "2025-06-19 10:10:36",
    updatedOn: "2025-07-31 14:23:31"
  };
}
