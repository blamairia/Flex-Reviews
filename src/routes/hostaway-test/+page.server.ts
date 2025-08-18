import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return {
    title: 'Hostaway API Test Dashboard'
  };
};
