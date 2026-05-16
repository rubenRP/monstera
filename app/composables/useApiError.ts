import type { FetchError } from 'ofetch'

export function useApiError() {
  const { t } = useI18n()

  function apiErrorMessage(error: unknown): string {
    const fetchErr = error as FetchError<{ code?: string, messageKey?: string, query?: string }>
    const data = fetchErr?.data
    if (data?.messageKey) {
      return validationMessage(data.messageKey)
    }
    const code = data?.code
    if (code) {
      const key = `errors.api.${code}`
      const params = code === 'perenual.speciesNotFound' && data.query
        ? { query: data.query }
        : undefined
      const translated = t(key, params as Record<string, string>)
      if (translated !== key) return translated
    }
    if (error instanceof Error && error.message) return error.message
    return t('common.unknownError')
  }

  function validationMessage(messageKey: string): string {
    if (messageKey.startsWith('errors.validation.')) {
      return t(messageKey)
    }
    return messageKey
  }

  return { apiErrorMessage, validationMessage }
}
