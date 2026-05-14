/**
 * Localization strings — Urdu + English.
 * Language toggle stored in AsyncStorage.
 */

export type Lang = 'ur' | 'en';

export const strings = {
  ur: {
    appName: 'خدمت AI',
    tagline: 'Ek Awaaz, Sub Khidmat Hazir',
    home: {
      greeting: 'Assalam-o-Alaikum',
      prompt: 'Aap ko kaun si khidmat chahiye?',
      micHint: 'Mic dabayein ya likhein',
      textPlaceholder: 'Misaal: Mujhe kal subah G-13 mein AC technician chahiye',
      submit: 'Khidmat Talab Karein',
      suggestions: 'Mashhoor Khidmaat',
    },
    chips: {
      ac_technician: 'AC Technician',
      plumber: 'Plumber',
      electrician: 'Electrician',
      tutor: 'Tutor',
      beautician: 'Beautician',
      cleaner: 'Safai',
      mobile_repair: 'Mobile Repair',
      car_mechanic: 'Car Mechanic',
    },
    agent: {
      thinking: 'AI Soch Raha Hai...',
      intent: 'Intent Samjha Ja Raha Hai',
      discovery: 'Providers Dhoondh Rahe Hain',
      ranking: 'Behtareen Match Kiya Ja Raha Hai',
      crisis: 'Emergency Coordinator Faal',
    },
    results: {
      title: 'Behtareen Recommendations',
      whyThisChoice: 'Yeh Choice Kyun?',
      bookNow: 'Abhi Book Karein',
      viewAll: 'Sab Dekhein',
      reasonsHeader: 'Reasoning',
      badges: 'Badges',
    },
    booking: {
      confirmTitle: 'Booking Confirm',
      confirmSubtitle: 'Aap ki khidmat ka intezam ho gaya',
      viewReceipt: 'Receipt Dekhein',
      addToCalendar: 'Calendar mein Save Karein',
      shareDetails: 'Details Share Karein',
      timeline: 'Aage Kya Hoga?',
    },
    crisis: {
      title: 'EMERGENCY MODE',
      subtitle: 'Foran response activate ho gaya',
      surcharge: 'Emergency Surcharge',
      eta: 'ETA',
      areaAlert: 'Area Alert',
      ticketCreated: 'Emergency Ticket',
    },
    insights: {
      title: 'Smart Insights',
      subtitle: 'AI ki nazar mein aap ki area',
      executive: 'Khulasa',
    },
    followup: {
      title: 'Follow-up Timeline',
      subtitle: 'Khidmat ke baad bhi hum sath hain',
    },
    common: {
      back: 'Wapis',
      next: 'Aagay',
      done: 'Mukammal',
      cancel: 'Cancel',
      confirm: 'Tasdeeq',
      retry: 'Phir Try Karein',
      error: 'Kuch ghalat hua, dobara try karein',
      loading: 'Load ho raha hai...',
    },
  },
  en: {
    appName: 'Khidmat AI',
    tagline: 'One Voice, Every Service Delivered',
    home: {
      greeting: 'Welcome',
      prompt: 'What service do you need?',
      micHint: 'Tap mic or type',
      textPlaceholder: 'e.g., I need an AC technician in G-13 tomorrow morning',
      submit: 'Request Service',
      suggestions: 'Popular Services',
    },
    chips: {
      ac_technician: 'AC Technician',
      plumber: 'Plumber',
      electrician: 'Electrician',
      tutor: 'Tutor',
      beautician: 'Beautician',
      cleaner: 'Cleaner',
      mobile_repair: 'Mobile Repair',
      car_mechanic: 'Car Mechanic',
    },
    agent: {
      thinking: 'AI is thinking...',
      intent: 'Understanding intent',
      discovery: 'Finding providers',
      ranking: 'Finding best match',
      crisis: 'Emergency coordinator active',
    },
    results: {
      title: 'Top Recommendations',
      whyThisChoice: 'Why this choice?',
      bookNow: 'Book Now',
      viewAll: 'View all',
      reasonsHeader: 'Reasoning',
      badges: 'Badges',
    },
    booking: {
      confirmTitle: 'Booking Confirmed',
      confirmSubtitle: 'Your service is scheduled',
      viewReceipt: 'View Receipt',
      addToCalendar: 'Add to Calendar',
      shareDetails: 'Share Details',
      timeline: 'What\'s Next?',
    },
    crisis: {
      title: 'EMERGENCY MODE',
      subtitle: 'Priority response activated',
      surcharge: 'Emergency Surcharge',
      eta: 'ETA',
      areaAlert: 'Area Alert',
      ticketCreated: 'Emergency Ticket',
    },
    insights: {
      title: 'Smart Insights',
      subtitle: 'AI\'s view of your area',
      executive: 'Summary',
    },
    followup: {
      title: 'Follow-up Timeline',
      subtitle: 'We\'re with you after service too',
    },
    common: {
      back: 'Back',
      next: 'Next',
      done: 'Done',
      cancel: 'Cancel',
      confirm: 'Confirm',
      retry: 'Retry',
      error: 'Something went wrong, please retry',
      loading: 'Loading...',
    },
  }
} as const;

export type Strings = (typeof strings)[Lang];
