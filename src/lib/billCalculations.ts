import type { BillEntry } from '@types'

/**
 * Core calculation functions for Bill & Under Billing module
 */

export const calculateBillEntry = (
  quantity_mt: number,
  bill_rate: number, // per KG
  actual_rate: number // per KG
) => {
  const quantity_kg = quantity_mt * 1000
  const rate_difference = actual_rate - bill_rate // BILL AMT per kg
  const rtgs_amount = rate_difference * quantity_kg // Total RTGS in ₹

  const billing_type: BillEntry['billing_type'] =
    rate_difference > 0 ? 'under' : rate_difference < 0 ? 'over' : 'exact'

  return {
    quantity_kg: parseFloat(quantity_kg.toFixed(3)),
    rate_difference: parseFloat(rate_difference.toFixed(2)),
    rtgs_amount: parseFloat(rtgs_amount.toFixed(2)),
    billing_type,
  }
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatRate = (rate: number): string => {
  return `₹${rate.toFixed(2)}/kg`
}

export const formatMT = (qty: number): string => {
  return `${qty.toFixed(3)} MT`
}

export const formatKG = (qty: number): string => {
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(qty)} KG`
}

// Billing type labels, colors, and badge styling
export const getBillingTypeConfig = (type: string) => {
  switch (type) {
    case 'under':
      return {
        label: 'Under Billing',
        color: 'orange',
        bgClass: 'bg-orange-100 dark:bg-orange-950/40',
        textClass: 'text-orange-700 dark:text-orange-300',
        borderClass: 'border-orange-200 dark:border-orange-800',
        icon: 'TrendingDown',
        description: 'Supplier billed less than actual rate — RTGS payment required',
      }
    case 'over':
      return {
        label: 'Over Billing',
        color: 'red',
        bgClass: 'bg-red-100 dark:bg-red-950/40',
        textClass: 'text-red-700 dark:text-red-300',
        borderClass: 'border-red-200 dark:border-red-800',
        icon: 'TrendingUp',
        description: 'Supplier billed more than actual rate — refund/adjustment needed',
      }
    case 'exact':
      return {
        label: 'Exact',
        color: 'green',
        bgClass: 'bg-green-100 dark:bg-green-950/40',
        textClass: 'text-green-700 dark:text-green-300',
        borderClass: 'border-green-200 dark:border-green-800',
        icon: 'CheckCircle',
        description: 'Bill rate matches actual rate — no adjustment needed',
      }
    default:
      return {
        label: type,
        color: 'gray',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-600 dark:text-gray-300',
        borderClass: 'border-gray-200 dark:border-gray-700',
        icon: '',
        description: '',
      }
  }
}

export const getPaymentStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pending',
        bgClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
        textClass: 'text-yellow-700 dark:text-yellow-400',
      }
    case 'paid':
      return {
        label: 'Paid',
        bgClass: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800',
        textClass: 'text-green-700 dark:text-green-400',
      }
    case 'partial':
      return {
        label: 'Partial',
        bgClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        textClass: 'text-blue-700 dark:text-blue-400',
      }
    case 'na':
      return {
        label: 'N/A',
        bgClass: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
        textClass: 'text-gray-600 dark:text-gray-400',
      }
    default:
      return {
        label: status,
        bgClass: 'bg-gray-100 text-gray-700',
        textClass: 'text-gray-600',
      }
  }
}
