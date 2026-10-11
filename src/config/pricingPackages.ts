import type { PackageTierConfig } from '../types/billing';

/**
 * Exchange rate & Commercial Pricing Constants
 * Used for transparent Custom Package calculations and add-on pricing.
 */
export const BILLING_CONFIG = {
  // USD to INR commercial exchange rate (including cross-border FX buffer)
  USD_TO_INR_RATE: 88.0,
  
  // Standard token ratio assumption for estimation: 40% prompt input, 60% completion output
  DEFAULT_INPUT_RATIO: 0.40,
  DEFAULT_OUTPUT_RATIO: 0.60,
  
  // Platform gateway routing fee buffer (3% margin for multi-region redundant routing)
  PLATFORM_ROUTING_MARGIN: 1.03,
  
  // Minimum custom allocation per selected model
  MIN_CUSTOM_MODEL_TOKENS: 10_000,
  MAX_CUSTOM_MODEL_TOKENS: 50_000_000,
  
  // Free initial trial allowance for prompt execution (separate from commercial packages)
  DEFAULT_TRIAL_TOKENS: 50_000,
  
  // Safety cap for trial execution output tokens per run
  TRIAL_MAX_OUTPUT_TOKENS: 1_024,
  
  // QR image configured location
  QR_IMAGE_PATH: '/payment-qr.png',
  
  // Project owner note displayed when QR is placeholder
  QR_PLACEHOLDER_NOTICE: 'Official Payment QR code will be configured by the project owner. Please contact administrator for billing activation.'
};

/**
 * Central Package Tier Configurations
 * These can be updated without modifying UI components.
 */
export const PRICING_PACKAGES: PackageTierConfig[] = [
  {
    id: 'bronze',
    name: 'Bronze Starter',
    priceINR: 199,
    baseTokensIncluded: 500_000,
    maxModelsSelectable: 2,
    tagline: 'Ideal for single-service developers and experimental prompt prototyping.',
    accentColor: '#D97706', // Copper / Bronze
    badgeText: 'Entry Tier',
    features: [
      '500,000 pooled tokens across selected models',
      'Select up to 2 models from verified registry',
      'Independent per-model allocation sliders',
      'Deterministic SLA routing & latency scoring',
      'Payable in INR via QR transfer'
    ],
    restrictions: [
      'Strict limit: maximum 2 models selectable',
      'Standard priority inference queue',
      'Capped at 2,048 tokens per completion call'
    ]
  },
  {
    id: 'silver',
    name: 'Silver Value',
    priceINR: 499,
    baseTokensIncluded: 1_500_000,
    maxModelsSelectable: 5,
    tagline: 'Best balance for teams needing multi-model routing and automated failover.',
    accentColor: '#94A3B8', // Silver / Platinum
    badgeText: 'Recommended Value',
    isPopular: true,
    features: [
      '1,500,000 pooled tokens across selected models',
      'Select up to 5 models simultaneously',
      'Fine-grained token distribution per model',
      'Zero-violation failover chain integration',
      'Priority inference endpoints & health telemetry',
      'Payable in INR via QR transfer'
    ],
    restrictions: [
      'Strict limit: maximum 5 models selectable',
      'Capped at 4,096 tokens per completion call'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Enterprise',
    priceINR: 999,
    baseTokensIncluded: 3_500_000,
    maxModelsSelectable: 10,
    tagline: 'Maximum flexibility for production workloads, reasoning models, and agent loops.',
    accentColor: '#F59E0B', // Gold
    badgeText: 'Most Flexible',
    features: [
      '3,500,000 pooled tokens across selected models',
      'Select up to 10 models across any provider',
      'Unconstrained token allocation across selections',
      'Enterprise SLA latency routing (P95 guarantee)',
      'Full catalog access including deep reasoning models',
      'Telemetry audit ledger & dedicated queue'
    ],
    restrictions: [
      'Strict limit: maximum 10 models selectable',
      'Capped at 8,192 tokens per completion call'
    ]
  },
  {
    id: 'custom',
    name: 'Custom Tailored',
    priceINR: 0, // Dynamically computed based on models & tokens
    baseTokensIncluded: 0,
    maxModelsSelectable: 20,
    tagline: 'Build your exact model portfolio. Transparent per-model token pricing.',
    accentColor: '#9184FF', // Violet / Purple
    badgeText: 'Fully Dynamic',
    features: [
      'Pick any eligible models individually (no bundling)',
      'Configure exact token budget per model',
      'Transparent INR pricing based on verified provider rates',
      'Full visibility into input vs output costs',
      'Real-time total estimation with zero hidden fees',
      'Add custom package configurations to cart'
    ],
    restrictions: [
      'Pricing requires verified registry token rates',
      'Unverified models excluded from automated quoting'
    ]
  }
];

/**
 * Format numeric currency values consistently in Indian Rupees (INR).
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format token quantities with readable suffixes (K, M).
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    const formatted = (tokens / 1_000_000).toFixed(1);
    return `${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M tokens`;
  }
  if (tokens >= 1_000) {
    const formatted = (tokens / 1_000).toFixed(0);
    return `${formatted}K tokens`;
  }
  return `${tokens} tokens`;
}
