export type PackageTierId = 'bronze' | 'silver' | 'gold' | 'custom';

export interface PackageTierConfig {
  id: PackageTierId;
  name: string;
  priceINR: number;
  baseTokensIncluded: number;
  maxModelsSelectable: number;
  tagline: string;
  accentColor: string;
  badgeText?: string;
  features: string[];
  restrictions: string[];
  isPopular?: boolean;
}

export interface ModelTokenAllocation {
  modelId: string;
  modelDisplayName: string;
  provider: string;
  allocatedTokens: number;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  inputCostPerMillion: number | null;
  outputCostPerMillion: number | null;
  calculatedModelPriceINR: number;
  isPriceVerified: boolean;
}

export interface CartItem {
  cartItemId: string;
  packageTierId: PackageTierId;
  packageName: string;
  packageBasePriceINR: number;
  totalTokensAllocated: number;
  allocations: ModelTokenAllocation[];
  finalItemPriceINR: number;
  createdAt: string;
}

export interface CartState {
  items: CartItem[];
  totalPriceINR: number;
  totalTokens: number;
  totalModelsSelected: number;
}

export interface PendingOrder {
  orderId: string;
  createdAt: string;
  status: 'PENDING_PAYMENT';
  totalAmountINR: number;
  items: CartItem[];
  qrImagePath: string;
  paymentInstructions: string;
}

export interface TrialAllowance {
  totalTrialTokens: number;
  usedTrialTokens: number;
  remainingTrialTokens: number;
}

export interface TrialUsageLog {
  id: string;
  timestamp: string;
  modelId: string;
  modelDisplayName: string;
  promptSnippet: string;
  inputTokens: number;
  outputTokens: number;
  tokensDeducted: number;
  status: 'EXECUTED_MOCK' | 'EXECUTED_API' | 'FAILED';
  executionNotes: string;
}
