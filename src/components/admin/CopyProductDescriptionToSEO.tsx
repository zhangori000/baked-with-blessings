'use client'

import { extractRichTextPlainText } from '@/utilities/extractRichTextPlainText'
import { Button, toast, useField, useForm } from '@payloadcms/ui'
import React from 'react'

import './CopyProductDescriptionToSEO.css'

const baseClass = 'copy-product-description-to-seo'

export const CopyProductDescriptionToSEO: React.FC = () => {
  const { getDataByPath } = useForm()
  const { setValue: setMetaDescription } = useField<string>({
    path: 'meta.description',
  })

  const copyProductDescription = () => {
    const productDescription = extractRichTextPlainText(getDataByPath('description'))

    if (!productDescription) {
      toast.info('Add a product description first.')
      return
    }

    setMetaDescription(productDescription)
    toast.success('Copied product description to SEO description.')
  }

  return (
    <div className={baseClass}>
      <Button buttonStyle="secondary" onClick={copyProductDescription} size="small">
        Copy product description
      </Button>
      <p className={`${baseClass}__description`}>
        Uses the Product Description from the Writing tab.
      </p>
    </div>
  )
}
