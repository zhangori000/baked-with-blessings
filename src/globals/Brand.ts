import type { GlobalConfig } from 'payload'

export const Brand: GlobalConfig = {
  slug: 'brand',
  label: 'Brand',
  admin: {
    description:
      'Manage the storefront brand name and logo in one place so the header can change without a code edit.',
  },
  fields: [
    {
      name: 'brandName',
      type: 'text',
      defaultValue: 'Baked with Blessings',
      required: true,
      admin: {
        description: 'Primary business name used for accessibility text and text-only fallbacks.',
      },
    },
    {
      name: 'logoAlt',
      type: 'text',
      defaultValue: 'Baked with Blessings logo',
      admin: {
        description: 'Short alt text describing the logo image.',
      },
    },
    {
      name: 'logoSource',
      type: 'radio',
      defaultValue: 'publicPath',
      admin: {
        description:
          'Use a public asset right away, or switch to Media once you upload a production-ready logo through the CMS.',
        layout: 'horizontal',
      },
      options: [
        {
          label: 'Public file path',
          value: 'publicPath',
        },
        {
          label: 'Media library upload',
          value: 'mediaUpload',
        },
      ],
    },
    {
      name: 'logoPath',
      type: 'text',
      defaultValue: '/baked-with-blessings-logo-pasture-restored.svg',
      admin: {
        condition: (_, siblingData) => siblingData?.logoSource === 'publicPath',
        description:
          'Path to a logo file in /public. This is useful for bootstrapping before the business owner starts managing uploaded assets.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.logoSource === 'mediaUpload',
        description:
          'Select the uploaded logo from Media when you are ready to manage branding fully inside Payload.',
      },
    },
  ],
}
