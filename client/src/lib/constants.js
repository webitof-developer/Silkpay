/**
 * Application Constants
 * Centralized configuration for the SilkPay application
 */

// ========================================
// AVATAR PRESETS
// ========================================
export const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
];

export const DEFAULT_AVATAR = PRESET_AVATARS[0];

export const DEFAULT_USER_PROFILE = {
    name: 'Business Merchant',
    email: 'manager@silkpay.com',
    avatar: DEFAULT_AVATAR
};

// ========================================
// STATUS COLORS
// ========================================
export const PAYOUT_STATUS_COLORS = {
    INITIAL: 'bg-blue-500/10 text-blue-500',
    PROCESSING: 'bg-yellow-500/10 text-yellow-500',
    SUCCESS: 'bg-green-500/10 text-green-500',
    FAILED: 'bg-red-500/10 text-red-500',
    REVERSED: 'bg-gray-500/10 text-gray-500'
};

export const BENEFICIARY_STATUS_COLORS = {
    ACTIVE: 'bg-green-500/10 text-green-500',
    INACTIVE: 'bg-gray-500/10 text-gray-500'
};

export const MERCHANT_STATUS_COLORS = {
    ACTIVE: 'bg-green-500/10 text-green-500',
    INACTIVE: 'bg-red-500/10 text-red-500',
    SUSPENDED: 'bg-orange-500/10 text-orange-500'
};

// ========================================
// VALIDATION RULES
// ========================================
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 6,
    MOBILE_PATTERN: /^[6-9]\d{9}$/,
    IFSC_PATTERN: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    PAN_PATTERN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    ACCOUNT_NUMBER_MIN: 8,
    ACCOUNT_NUMBER_MAX: 18
};

// ========================================
// API ENDPOINTS (for reference)
// ========================================
export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password'
    },
    MERCHANT: {
        PROFILE: '/merchant/profile',
        CHANGE_PASSWORD: '/merchant/change-password',
        BANK_ACCOUNT: '/merchant/bank-account'
    },
    DASHBOARD: {
        OVERVIEW: '/dashboard/overview',
        TOP_BENEFICIARIES: '/dashboard/top-beneficiaries'
    },
    PAYOUTS: {
        LIST: '/payouts',
        CREATE: '/payouts',
        QUERY: '/payouts/query'
    },
    BENEFICIARIES: {
        LIST: '/beneficiaries',
        CREATE: '/beneficiaries',
        GET: '/beneficiaries/:id',
        UPDATE: '/beneficiaries/:id',
        DELETE: '/beneficiaries/:id'
    },
    BALANCE: {
        SYNC: '/balance/sync'
    },
    TRANSACTIONS: {
        LIST: '/transactions'
    },
    SETTINGS: {
        GET: '/settings',
        UPDATE: '/settings/update'
    }
};

// ========================================
// DATE & CURRENCY FORMATS
// ========================================
export const DATE_FORMAT = 'en-IN';
export const CURRENCY = 'INR';
export const CURRENCY_FORMAT = {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
};

// ========================================
// TABLE & PAGINATION
// ========================================
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ========================================
// FILE UPLOAD
// ========================================
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
