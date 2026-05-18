<script setup lang="ts">
definePageMeta({ layout: false })

const { t, locale } = useI18n()
const supabase = useSupabaseClient()

const emailPlaceholder = computed(() =>
  locale.value === 'en' ? 'you@email.com' : 'tu@email.com'
)
const email = ref('')
const sent = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

async function sendMagicLink() {
  loading.value = true
  error.value = null
  try {
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: `${window.location.origin}/confirm`
      }
    })
    if (err) throw err
    sent.value = true
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : t('auth.sendLinkError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-default">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center gap-2">
          <AppLogo
            size="lg"
            class="text-primary"
          />
          <div>
            <h1 class="text-xl font-bold">
              {{ t('app.title') }}
            </h1>
            <p class="text-sm text-muted">
              {{ t('auth.loginSubtitle') }}
            </p>
          </div>
        </div>
      </template>

      <UAlert
        v-if="error"
        color="error"
        :title="error"
        class="mb-4"
      />
      <UAlert
        v-if="sent"
        color="success"
        :title="t('auth.checkEmail')"
        :description="t('auth.magicLinkSent')"
        class="mb-4"
      />

      <form
        class="space-y-4"
        @submit.prevent="sendMagicLink"
      >
        <UFormField :label="t('auth.email')">
          <UInput
            v-model="email"
            type="email"
            required
            :placeholder="emailPlaceholder"
          />
        </UFormField>
        <UButton
          type="submit"
          block
          :loading="loading"
        >
          {{ t('auth.sendMagicLink') }}
        </UButton>
      </form>
    </UCard>
  </div>
</template>
