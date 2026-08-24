import type { Plugin } from 'payload'

import { applyOwnerAdminNav } from '@/utilities/adminNav'

/**
 * Runs last so ecommerce / form-builder collections pick up the same
 * bakery-staff sidebar rules as first-party collections.
 */
export const ownerAdminNavPlugin: Plugin = (config) => applyOwnerAdminNav(config)
