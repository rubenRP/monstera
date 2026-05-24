export const API_ERROR_CODES = {
  AUTH_UNAUTHORIZED: 'auth.unauthorized',
  AUTH_INVALID_SESSION: 'auth.invalidSession',
  PLANT_NOT_FOUND: 'plant.notFound',
  PLANT_ARCHIVED: 'plant.archived',
  PLANT_ID_REQUIRED: 'plant.idRequired',
  PLANT_SPECIES_REQUIRED: 'plant.speciesRequired',
  AI_SERVICE_UNAVAILABLE: 'ai.serviceUnavailable',
  AI_QUERY_FAILED: 'ai.queryFailed',
  AI_PARSE_FAILED: 'ai.parseFailed',
  AI_SAVE_FAILED: 'ai.saveFailed',
  PERENUAL_SERVICE_UNAVAILABLE: 'perenual.serviceUnavailable',
  PERENUAL_QUERY_FAILED: 'perenual.queryFailed',
  PERENUAL_SPECIES_NOT_FOUND: 'perenual.speciesNotFound',
  VALIDATION_FAILED: 'validation.failed',
  PUSH_INVALID_SUBSCRIPTION: 'push.invalidSubscription',
  PUSH_SAVE_FAILED: 'push.saveFailed',
  CRON_FORBIDDEN: 'cron.forbidden',
  VAPID_NOT_CONFIGURED: 'vapid.notConfigured',
  SUPABASE_NOT_CONFIGURED: 'supabase.notConfigured',
  WEATHER_UNAVAILABLE: 'weather.unavailable',
  WEATHER_NO_FORECAST: 'weather.noForecast'
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]
