import { useContext } from 'react'
import { DbContext } from '@/providers/DbProvider'
import type { DbContextValue } from '@/providers/DbProvider'

export function useRxDB(): DbContextValue {
  const ctx = useContext(DbContext)
  if (!ctx) {
    throw new Error('useRxDB must be used within DbProvider')
  }
  return ctx
}
