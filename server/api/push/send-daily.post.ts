export default defineEventHandler(async (event) => {
  assertCronAuthorized(event)

  const { publicKey, privateKey } = getVapidKeysFromConfig()
  return sendDailyPushReminders(publicKey, privateKey)
})
