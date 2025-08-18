import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom') || '2025-06-01';
    const dateTo = searchParams.get('dateTo') || '2025-08-18';
    const window = searchParams.get('window') || '4w';
    const zscore = parseFloat(searchParams.get('zscore') || '2.0');

    const anomalies = generateAnomalies(dateFrom, dateTo, window, zscore);

    return json({
      success: true,
      anomalies,
      dateRange: { dateFrom, dateTo },
      detectionWindow: window,
      threshold: zscore
    });

  } catch (error) {
    console.error('❌ Error fetching anomalies:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        anomalies: []
      },
      { status: 500 }
    );
  }
};

function generateAnomalies(dateFrom: string, dateTo: string, window: string, zscore: number) {
  const anomalies = [];
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  
  // Generate some mock anomalies
  const anomalyTypes = [
    'sudden_rating_drop',
    'review_volume_spike',
    'category_score_decline',
    'response_time_increase',
    'sentiment_shift'
  ];

  const properties = [
    { id: '155613', name: 'The Bromley Collection' },
    { id: '155615', name: 'The Peckham Apartments' },
    { id: '346994', name: 'The Putney Apart 2' }
  ];

  // Generate 3-5 random anomalies
  const numAnomalies = Math.floor(Math.random() * 3) + 3;
  
  for (let i = 0; i < numAnomalies; i++) {
    const anomalyDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    const property = properties[Math.floor(Math.random() * properties.length)];
    const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    
    const anomaly = {
      id: `anomaly_${Date.now()}_${i}`,
      date: anomalyDate.toISOString().split('T')[0],
      propertyId: property.id,
      propertyName: property.name,
      type,
      severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      zscore: zscore + (Math.random() * 2), // Slightly above threshold
      description: generateAnomalyDescription(type),
      metric: getMetricForAnomalyType(type),
      expectedValue: Math.random() * 5,
      actualValue: Math.random() * 5,
      confidence: 0.8 + (Math.random() * 0.2),
      status: Math.random() > 0.3 ? 'active' : 'resolved'
    };

    anomalies.push(anomaly);
  }

  // Sort by date (newest first)
  return anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateAnomalyDescription(type: string): string {
  const descriptions: { [key: string]: string } = {
    'sudden_rating_drop': 'Average rating dropped significantly below historical pattern',
    'review_volume_spike': 'Unusual increase in review volume detected',
    'category_score_decline': 'Specific category scores showing unexpected decline',
    'response_time_increase': 'Host response time increased beyond normal range',
    'sentiment_shift': 'Guest sentiment has shifted negatively compared to baseline'
  };
  
  return descriptions[type] || 'Unusual pattern detected in property metrics';
}

function getMetricForAnomalyType(type: string): string {
  const metrics: { [key: string]: string } = {
    'sudden_rating_drop': 'avgRating',
    'review_volume_spike': 'reviewCount',
    'category_score_decline': 'categoryScore',
    'response_time_increase': 'responseTime',
    'sentiment_shift': 'sentimentScore'
  };
  
  return metrics[type] || 'unknown';
}
