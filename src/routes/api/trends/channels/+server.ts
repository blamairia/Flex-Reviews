import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom') || '2025-06-01';
    const dateTo = searchParams.get('dateTo') || '2025-08-18';
    const groupBy = searchParams.get('groupBy') || 'month';

    const channelImpact = generateChannelImpact(dateFrom, dateTo, groupBy);

    return json({
      success: true,
      channelImpact,
      dateRange: { dateFrom, dateTo },
      groupBy
    });

  } catch (error) {
    console.error('❌ Error fetching channel impact:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        channelImpact: []
      },
      { status: 500 }
    );
  }
};

function generateChannelImpact(dateFrom: string, dateTo: string, groupBy: string) {
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const points = groupBy === 'day' ? daysDiff : 
                groupBy === 'week' ? Math.ceil(daysDiff / 7) :
                groupBy === 'month' ? Math.ceil(daysDiff / 30) : 6;

  const channels = ['airbnb', 'booking', 'vrbo', 'website'];
  const impact = [];
  
  for (let i = 0; i < points; i++) {
    const date = new Date(startDate);
    if (groupBy === 'day') {
      date.setDate(date.getDate() + i);
    } else if (groupBy === 'week') {
      date.setDate(date.getDate() + (i * 7));
    } else if (groupBy === 'month') {
      date.setMonth(date.getMonth() + i);
    }

    const dataPoint: any = {
      date: date.toISOString().split('T')[0],
      totalReviews: Math.floor(Math.random() * 50) + 20,
      totalRevenue: Math.floor(Math.random() * 10000) + 5000,
      channels: {}
    };

    // Generate data for each channel
    channels.forEach(channel => {
      const baseMetrics = getChannelBaseMetrics(channel);
      dataPoint.channels[channel] = {
        reviewCount: Math.floor(Math.random() * 15) + 5,
        avgRating: baseMetrics.avgRating + (Math.random() - 0.5) * 0.6,
        revenue: Math.floor(Math.random() * 3000) + baseMetrics.baseRevenue,
        bookings: Math.floor(Math.random() * 10) + 3,
        conversionRate: baseMetrics.conversionRate + (Math.random() - 0.5) * 0.1,
        avgBookingValue: Math.floor(Math.random() * 200) + baseMetrics.avgBookingValue
      };
    });

    impact.push(dataPoint);
  }

  // Add summary statistics
  const summary = generateChannelSummary(impact);

  return {
    timeSeries: impact,
    summary,
    comparison: generateChannelComparison(channels)
  };
}

function getChannelBaseMetrics(channel: string) {
  const metrics: { [key: string]: any } = {
    'airbnb': { avgRating: 4.4, baseRevenue: 1200, conversionRate: 0.15, avgBookingValue: 400 },
    'booking': { avgRating: 4.2, baseRevenue: 1000, conversionRate: 0.12, avgBookingValue: 350 },
    'vrbo': { avgRating: 4.3, baseRevenue: 800, conversionRate: 0.18, avgBookingValue: 450 },
    'website': { avgRating: 4.5, baseRevenue: 600, conversionRate: 0.25, avgBookingValue: 500 }
  };
  
  return metrics[channel] || { avgRating: 4.0, baseRevenue: 500, conversionRate: 0.1, avgBookingValue: 300 };
}

function generateChannelSummary(impact: any[]) {
  const channels = ['airbnb', 'booking', 'vrbo', 'website'];
  const summary: any = {};

  channels.forEach(channel => {
    const channelData = impact.map(point => point.channels[channel]);
    const totalReviews = channelData.reduce((sum, data) => sum + data.reviewCount, 0);
    const totalRevenue = channelData.reduce((sum, data) => sum + data.revenue, 0);
    const avgRating = channelData.reduce((sum, data) => sum + data.avgRating, 0) / channelData.length;
    
    summary[channel] = {
      totalReviews,
      totalRevenue,
      avgRating: Math.round(avgRating * 10) / 10,
      marketShare: totalRevenue / impact.reduce((sum, point) => {
        return sum + Object.values(point.channels).reduce((s: number, ch: any) => s + ch.revenue, 0);
      }, 0),
      growthRate: (Math.random() - 0.5) * 0.4 // ±20% growth rate
    };
  });

  return summary;
}

function generateChannelComparison(channels: string[]) {
  return channels.map(channel => {
    const baseMetrics = getChannelBaseMetrics(channel);
    return {
      channel,
      performanceScore: 0.6 + (Math.random() * 0.4), // 60-100%
      strengths: getChannelStrengths(channel),
      weaknesses: getChannelWeaknesses(channel),
      recommendation: getChannelRecommendation(channel)
    };
  });
}

function getChannelStrengths(channel: string): string[] {
  const strengths: { [key: string]: string[] } = {
    'airbnb': ['High visibility', 'Strong brand trust', 'Mobile-first experience'],
    'booking': ['Global reach', 'Business travel focus', 'Multi-language support'],
    'vrbo': ['Family-focused', 'Longer stays', 'Premium positioning'],
    'website': ['No commission fees', 'Direct relationship', 'Brand control']
  };
  
  return strengths[channel] || ['Standard features'];
}

function getChannelWeaknesses(channel: string): string[] {
  const weaknesses: { [key: string]: string[] } = {
    'airbnb': ['High competition', 'Algorithm dependency', 'Commission fees'],
    'booking': ['Price competition', 'Lower margins', 'Less personal touch'],
    'vrbo': ['Limited inventory', 'Seasonal demand', 'Higher acquisition cost'],
    'website': ['Marketing cost', 'SEO dependency', 'Technical maintenance']
  };
  
  return weaknesses[channel] || ['Standard challenges'];
}

function getChannelRecommendation(channel: string): string {
  const recommendations: { [key: string]: string } = {
    'airbnb': 'Focus on unique amenities and experiences to stand out',
    'booking': 'Optimize pricing strategy and improve review scores',
    'vrbo': 'Target family vacation segments and longer stays',
    'website': 'Invest in SEO and direct booking incentives'
  };
  
  return recommendations[channel] || 'Monitor performance and optimize accordingly';
}
