import { PRICING_PACKAGES, BILLING_CONFIG } from '../config/pricingPackages';
import type { 
  PackageTierId, 
  ModelTokenAllocation, 
  CartItem, 
  CartState, 
  PendingOrder, 
  TrialAllowance, 
  TrialUsageLog 
} from '../types/billing';

const CART_STORAGE_KEY = 'modelrouter_cart_v1';
const PENDING_ORDERS_STORAGE_KEY = 'modelrouter_pending_orders_v1';
const TRIAL_ALLOWANCE_STORAGE_KEY = 'modelrouter_trial_allowance_v1';
const TRIAL_LOGS_STORAGE_KEY = 'modelrouter_trial_logs_v1';

/**
 * Authoritative calculation of custom model pricing in INR.
 * Based on verified provider input/output costs per 1M tokens.
 */
export function calculateModelTokenCostINR(
  allocatedTokens: number,
  inputPricePerMillion: number | null,
  outputPricePerMillion: number | null
): { priceINR: number; isVerified: boolean } {
  if (
    inputPricePerMillion === null ||
    outputPricePerMillion === null ||
    isNaN(inputPricePerMillion) ||
    isNaN(outputPricePerMillion)
  ) {
    return { priceINR: 0, isVerified: false };
  }

  // Blended cost per million tokens in USD
  const blendedCostPerMillionUSD = 
    (inputPricePerMillion * BILLING_CONFIG.DEFAULT_INPUT_RATIO) +
    (outputPricePerMillion * BILLING_CONFIG.DEFAULT_OUTPUT_RATIO);

  // Compute total USD cost
  const totalCostUSD = (allocatedTokens / 1_000_000) * blendedCostPerMillionUSD;

  // Convert to INR with platform routing margin
  const costINR = totalCostUSD * BILLING_CONFIG.USD_TO_INR_RATE * BILLING_CONFIG.PLATFORM_ROUTING_MARGIN;

  // Minimum fee of ₹10 per model allocation to cover endpoint provisioning
  const finalINR = Math.max(10, Math.ceil(costINR));

  return { priceINR: finalINR, isVerified: true };
}

/**
 * Validate a package configuration and compute its authoritative price on the server/engine.
 */
export function validatePackageConfiguration(
  tierId: PackageTierId,
  allocations: ModelTokenAllocation[]
): {
  isValid: boolean;
  errorMessage?: string;
  authoritativePriceINR: number;
  totalTokensAllocated: number;
} {
  const tierConfig = PRICING_PACKAGES.find((p) => p.id === tierId);
  if (!tierConfig) {
    return {
      isValid: false,
      errorMessage: `Unknown package tier: ${tierId}`,
      authoritativePriceINR: 0,
      totalTokensAllocated: 0
    };
  }

  if (allocations.length === 0) {
    return {
      isValid: false,
      errorMessage: 'Please select at least one model for this package.',
      authoritativePriceINR: 0,
      totalTokensAllocated: 0
    };
  }

  if (allocations.length > tierConfig.maxModelsSelectable) {
    return {
      isValid: false,
      errorMessage: `${tierConfig.name} allows a maximum of ${tierConfig.maxModelsSelectable} models. You have selected ${allocations.length}.`,
      authoritativePriceINR: 0,
      totalTokensAllocated: 0
    };
  }

  // Verify allocations are positive and non-zero
  for (const alloc of allocations) {
    if (alloc.allocatedTokens <= 0 || !Number.isInteger(alloc.allocatedTokens)) {
      return {
        isValid: false,
        errorMessage: `Model ${alloc.modelDisplayName} must have a positive integer token allocation.`,
        authoritativePriceINR: 0,
        totalTokensAllocated: 0
      };
    }
  }

  const totalTokensAllocated = allocations.reduce((sum, a) => sum + a.allocatedTokens, 0);

  if (tierId === 'custom') {
    // For custom tier, price is sum of model token allocations
    let customTotalINR = 0;
    for (const alloc of allocations) {
      if (!alloc.isPriceVerified) {
        return {
          isValid: false,
          errorMessage: `Model ${alloc.modelDisplayName} has unverified provider pricing and cannot be automatically quoted in a custom package.`,
          authoritativePriceINR: 0,
          totalTokensAllocated
        };
      }
      customTotalINR += alloc.calculatedModelPriceINR;
    }

    return {
      isValid: true,
      authoritativePriceINR: Math.max(99, customTotalINR), // Minimum ₹99 order for custom packages
      totalTokensAllocated
    };
  } else {
    // For fixed tiers (Bronze, Silver, Gold), verify that pooled allocation does not exceed package allowance
    if (totalTokensAllocated > tierConfig.baseTokensIncluded) {
      return {
        isValid: false,
        errorMessage: `Total allocated tokens (${totalTokensAllocated.toLocaleString()}) exceed the ${tierConfig.name} allowance of ${tierConfig.baseTokensIncluded.toLocaleString()} tokens.`,
        authoritativePriceINR: tierConfig.priceINR,
        totalTokensAllocated
      };
    }

    return {
      isValid: true,
      authoritativePriceINR: tierConfig.priceINR,
      totalTokensAllocated
    };
  }
}

/**
 * Re-validates and recalculates authoritative cart totals.
 */
export function recalculateCart(items: CartItem[]): CartState {
  let totalPriceINR = 0;
  let totalTokens = 0;
  let totalModelsSelected = 0;

  const validatedItems: CartItem[] = items.map((item) => {
    const validation = validatePackageConfiguration(item.packageTierId, item.allocations);
    const itemPrice = validation.isValid ? validation.authoritativePriceINR : item.finalItemPriceINR;

    totalPriceINR += itemPrice;
    totalTokens += item.totalTokensAllocated;
    totalModelsSelected += item.allocations.length;

    return {
      ...item,
      finalItemPriceINR: itemPrice
    };
  });

  return {
    items: validatedItems,
    totalPriceINR,
    totalTokens,
    totalModelsSelected
  };
}

/**
 * Load cart from persistent storage.
 */
export function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return { items: [], totalPriceINR: 0, totalTokens: 0, totalModelsSelected: 0 };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.items)) {
      return recalculateCart(parsed.items);
    }
  } catch (err) {
    console.error('Failed to load cart from storage:', err);
  }
  return { items: [], totalPriceINR: 0, totalTokens: 0, totalModelsSelected: 0 };
}

/**
 * Save cart to persistent storage.
 */
export function saveCart(cart: CartState): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.error('Failed to save cart to storage:', err);
  }
}

/**
 * Authoritative creation of a PENDING order.
 * STOP AT QR DISPLAY: The order remains in PENDING_PAYMENT status.
 * No tokens credited. No payment verification.
 */
export function createPendingOrder(cart: CartState): PendingOrder {
  if (cart.items.length === 0) {
    throw new Error('Cannot create an order with an empty cart.');
  }

  // Recalculate to ensure client hasn't tampered with totals
  const validatedCart = recalculateCart(cart.items);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const orderId = `ORD-${dateStr}-${randomSuffix}`;

  const pendingOrder: PendingOrder = {
    orderId,
    createdAt: new Date().toISOString(),
    status: 'PENDING_PAYMENT',
    totalAmountINR: validatedCart.totalPriceINR,
    items: JSON.parse(JSON.stringify(validatedCart.items)), // Deep snapshot
    qrImagePath: BILLING_CONFIG.QR_IMAGE_PATH,
    paymentInstructions: `Scan the QR code with any UPI app (GPay, PhonePe, Paytm, BHIM). Payable: ${formatINR(validatedCart.totalPriceINR)}. Mention Order ID "${orderId}" in the payment remarks.`
  };

  // Persist pending order
  try {
    const existingOrders = loadPendingOrders();
    const updated = [pendingOrder, ...existingOrders];
    localStorage.setItem(PENDING_ORDERS_STORAGE_KEY, JSON.stringify(updated));
    // Clear cart upon order creation
    saveCart({ items: [], totalPriceINR: 0, totalTokens: 0, totalModelsSelected: 0 });
  } catch (err) {
    console.error('Failed to persist pending order:', err);
  }

  return pendingOrder;
}

/**
 * Load all pending orders history.
 */
export function loadPendingOrders(): PendingOrder[] {
  try {
    const raw = localStorage.getItem(PENDING_ORDERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Manage separate Trial Allowance for prompt execution.
 * Initial balance: 50,000 trial tokens.
 */
export function getTrialAllowance(): TrialAllowance {
  try {
    const raw = localStorage.getItem(TRIAL_ALLOWANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read trial allowance:', err);
  }

  const initial: TrialAllowance = {
    totalTrialTokens: BILLING_CONFIG.DEFAULT_TRIAL_TOKENS,
    usedTrialTokens: 0,
    remainingTrialTokens: BILLING_CONFIG.DEFAULT_TRIAL_TOKENS
  };
  saveTrialAllowance(initial);
  return initial;
}

function saveTrialAllowance(allowance: TrialAllowance): void {
  try {
    localStorage.setItem(TRIAL_ALLOWANCE_STORAGE_KEY, JSON.stringify(allowance));
  } catch (err) {
    console.error('Failed to save trial allowance:', err);
  }
}

/**
 * Deduct tokens from trial allowance when executing a prompt on a recommended model.
 */
export function recordTrialExecution(
  modelId: string,
  modelDisplayName: string,
  promptText: string,
  inputTokens: number,
  outputTokens: number,
  status: 'EXECUTED_MOCK' | 'EXECUTED_API' | 'FAILED',
  executionNotes: string
): { success: boolean; error?: string; remainingTokens: number; log: TrialUsageLog } {
  const current = getTrialAllowance();
  const tokensNeeded = inputTokens + outputTokens;

  if (current.remainingTrialTokens < tokensNeeded) {
    const failedLog: TrialUsageLog = {
      id: 'trial_' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      modelId,
      modelDisplayName,
      promptSnippet: promptText.slice(0, 80),
      inputTokens,
      outputTokens,
      tokensDeducted: 0,
      status: 'FAILED',
      executionNotes: `Trial token exhaustion: needed ${tokensNeeded} tokens, but only ${current.remainingTrialTokens} remain.`
    };
    return {
      success: false,
      error: `Trial token balance insufficient (${current.remainingTrialTokens.toLocaleString()} tokens remaining, need ${tokensNeeded.toLocaleString()}).`,
      remainingTokens: current.remainingTrialTokens,
      log: failedLog
    };
  }

  const updatedAllowance: TrialAllowance = {
    totalTrialTokens: current.totalTrialTokens,
    usedTrialTokens: current.usedTrialTokens + tokensNeeded,
    remainingTrialTokens: current.remainingTrialTokens - tokensNeeded
  };
  saveTrialAllowance(updatedAllowance);

  const logEntry: TrialUsageLog = {
    id: 'trial_' + Date.now().toString(36),
    timestamp: new Date().toISOString(),
    modelId,
    modelDisplayName,
    promptSnippet: promptText.slice(0, 80),
    inputTokens,
    outputTokens,
    tokensDeducted: tokensNeeded,
    status,
    executionNotes
  };

  try {
    const existingLogs = getTrialUsageLogs();
    localStorage.setItem(TRIAL_LOGS_STORAGE_KEY, JSON.stringify([logEntry, ...existingLogs.slice(0, 49)]));
  } catch (err) {
    console.error('Failed to log trial execution:', err);
  }

  return {
    success: true,
    remainingTokens: updatedAllowance.remainingTrialTokens,
    log: logEntry
  };
}

/**
 * Retrieve trial execution ledger logs.
 */
export function getTrialUsageLogs(): TrialUsageLog[] {
  try {
    const raw = localStorage.getItem(TRIAL_LOGS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Format INR helper
 */
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
