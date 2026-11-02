export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'GBP',
    memberLimit: 100,
    features: {
      events: true,
      attendance: true,
      firstTimers: true,
      children: true,
      members: true,
      reports: 'basic',       // basic only
      customFields: false,
      csvExport: false,
      multipleAdmins: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 19,
    currency: 'GBP',
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
    memberLimit: Infinity,
    features: {
      events: true,
      attendance: true,
      firstTimers: true,
      children: true,
      members: true,
      reports: 'full',
      customFields: true,
      csvExport: true,
      multipleAdmins: true,
    },
  },
  custom: {
    name: 'Custom',
    price: null,
    currency: 'GBP',
    memberLimit: Infinity,
    features: {
      events: true,
      attendance: true,
      firstTimers: true,
      children: true,
      members: true,
      reports: 'full',
      customFields: true,
      csvExport: true,
      multipleAdmins: true,
    },
  },
};

export function getPlan(church) {
  return PLANS[church?.plan] || PLANS.free;
}

export function canUseFeature(church, feature) {
  const plan = getPlan(church);
  return !!plan.features[feature];
}

export function memberLimitReached(church, currentCount) {
  const plan = getPlan(church);
  return plan.memberLimit !== Infinity && currentCount >= plan.memberLimit;
}
