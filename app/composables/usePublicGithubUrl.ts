export function usePublicGithubUrl() {
  const config = useRuntimeConfig()

  const githubUrl = computed(() => config.public.githubUrl as string)

  const selfHostingDocsUrl = computed(
    () => `${githubUrl.value.replace(/\/$/, '')}/blob/main/docs/self-hosting.md`
  )

  return { githubUrl, selfHostingDocsUrl }
}
