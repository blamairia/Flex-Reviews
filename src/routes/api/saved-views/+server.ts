import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// In-memory storage for demo purposes
let savedViews: any[] = [
  {
    id: 'view_1',
    name: 'High Priority Reviews',
    scope: 'dashboard',
    filters: {
      status: 'pending',
      ratingMax: 3,
      dateFrom: '2025-08-01'
    },
    createdAt: '2025-08-10T10:00:00Z',
    updatedAt: '2025-08-10T10:00:00Z'
  },
  {
    id: 'view_2', 
    name: 'Airbnb Performance',
    scope: 'dashboard',
    filters: {
      channel: ['airbnb'],
      dateFrom: '2025-07-01',
      dateTo: '2025-08-18'
    },
    createdAt: '2025-08-05T15:30:00Z',
    updatedAt: '2025-08-05T15:30:00Z'
  }
];

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const scope = searchParams.get('scope') || 'dashboard';

    const filteredViews = savedViews.filter(view => view.scope === scope);

    return json({
      success: true,
      views: filteredViews,
      scope
    });

  } catch (error) {
    console.error('❌ Error fetching saved views:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        views: []
      },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const viewData = await request.json();
    
    const newView = {
      id: `view_${Date.now()}`,
      name: viewData.name,
      scope: viewData.scope || 'dashboard',
      filters: viewData.filters || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    savedViews.push(newView);

    return json({
      success: true,
      view: newView,
      message: 'Saved view created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating saved view:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const PUT: RequestHandler = async ({ request, url }) => {
  try {
    const viewId = url.searchParams.get('id');
    const updatedData = await request.json();

    if (!viewId) {
      return json({ success: false, error: 'View ID is required' }, { status: 400 });
    }

    const viewIndex = savedViews.findIndex(view => view.id === viewId);
    
    if (viewIndex === -1) {
      return json({ success: false, error: 'View not found' }, { status: 404 });
    }

    savedViews[viewIndex] = {
      ...savedViews[viewIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    return json({
      success: true,
      view: savedViews[viewIndex],
      message: 'Saved view updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating saved view:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

export const DELETE: RequestHandler = async ({ url }) => {
  try {
    const viewId = url.searchParams.get('id');

    if (!viewId) {
      return json({ success: false, error: 'View ID is required' }, { status: 400 });
    }

    const viewIndex = savedViews.findIndex(view => view.id === viewId);
    
    if (viewIndex === -1) {
      return json({ success: false, error: 'View not found' }, { status: 404 });
    }

    savedViews.splice(viewIndex, 1);

    return json({
      success: true,
      message: 'Saved view deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting saved view:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
