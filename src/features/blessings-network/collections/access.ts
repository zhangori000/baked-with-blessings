import type { Access } from 'payload'

import { isAdminUser } from '@/access/utilities'

const adminOrPublishedStatus =
  (fieldName: 'publicStatus'): Access =>
  ({ req: { user } }) => {
    if (isAdminUser(user)) return true

    return {
      [fieldName]: {
        equals: 'published',
      },
    }
  }

export const adminOrPublishedNetworkOwner = adminOrPublishedStatus('publicStatus')
export const adminOrPublishedNetworkQuestion = adminOrPublishedStatus('publicStatus')
export const adminOrPublishedNetworkAnswer = adminOrPublishedStatus('publicStatus')
export const adminOrPublishedNetworkOwnerPost = adminOrPublishedStatus('publicStatus')
