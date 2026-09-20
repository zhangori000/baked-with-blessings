import { bakerOrdersSort } from '@/utilities/bakerOrderDisplay'

export const attentionOrderStatuses = ['processing', 'confirmed', 'ready'] as const

const statusQuery = attentionOrderStatuses
  .map((status, index) => `where[status][in][${index}]=${status}`)
  .join('&')

export const attentionOrdersHref = `/admin/collections/orders?${statusQuery}&sort=${bakerOrdersSort}`
