/** Current Clerk user (`null` when signed out or while Clerk is still loading). */
export function useAuthUser() {
  const { userId } = useAuth()
  return computed(() => (userId.value ? { id: userId.value } : null))
}
