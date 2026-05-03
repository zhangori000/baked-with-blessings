'use client'

import { useTheme } from '@/providers/Theme'
import { Toaster } from 'sonner'

export const SonnerProvider = ({ children }: { children?: React.ReactNode }) => {
  const { theme } = useTheme()

  return (
    <>
      {children}

      <Toaster
        position="top-center"
        theme={theme || 'light'}
        toastOptions={{
          classNames: {
            actionButton: 'bakeryToastActionBtn',
            cancelButton: 'bakeryToastCancelBtn',
            description: 'bakeryToastDescription',
            error: 'bakeryToast bakeryToast--error',
            info: 'bakeryToast bakeryToast--info',
            success: 'bakeryToast bakeryToast--success',
            title: 'bakeryToastTitle',
            toast: 'bakeryToast',
            warning: 'bakeryToast bakeryToast--warning',
          },
        }}
      />
    </>
  )
}
