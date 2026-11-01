/** Clerk session token for `Authorization: Bearer` on `/api/*` calls. Resolves to `null` when signed out. */
export function useAccessToken() {
  const { getToken } = useAuth()

  async function getAccessToken(): Promise<string | null> {
    return (await getToken.value()) ?? null
  }

  return { getAccessToken }
}
