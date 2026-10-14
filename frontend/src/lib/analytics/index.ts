import { config } from '@/config';
import { Analytics } from '@/lib/analytics/analytics';
import { ConsentStore } from '@/lib/analytics/consent-store';

export const consentStore = new ConsentStore();
export const analytics = new Analytics(config.gaMeasurementId);
