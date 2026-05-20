export function isValidUserId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id !== 'undefined'
}

export function useRequireUserId() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  function userIdFromRef(): string | undefined {
    const u = user.value as { id?: string, sub?: string } | null
    if (!u) return undefined
    const id = u.id ?? u.sub
    return isValidUserId(id) ? id : undefined
  }

  async function requireUserId(): Promise<string> {
    const fromRef = userIdFromRef()
    if (fromRef) return fromRef

    const { data: { session } } = await supabase.auth.getSession()
    const uid = session?.user?.id
    if (!isValidUserId(uid)) {
      throw new Error('No autenticado')
    }
    return uid
  }

  return { requireUserId }
}
