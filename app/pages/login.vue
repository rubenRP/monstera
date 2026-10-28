<script setup lang="ts">
import { isStandalonePwa } from '~/utils/isStandalonePwa'
import { authErrorKey } from '~/utils/authErrors'

definePageMeta({ layout: false })

const { t } = useI18n()
const supabase = useSupabaseClient()
usePageTitle(() => t('auth.loginTitle'))

const RESEND_COOLDOWN_S = 60
const resendIn = ref(0)
let resendTimer: ReturnType<typeof setInterval> | null = null

function startResendCooldown() {
  resendIn.value = RESEND_COOLDOWN_S
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendIn.value = Math.max(0, resendIn.value - 1)
    if (!resendIn.value && resendTimer) clearInterval(resendTimer)
  }, 1000)
}

onBeforeUnmount(() => {
  if (resendTimer) clearInterval(resendTimer)
})
const email = ref('')
const otp = ref('')
const sent = ref(false)
const loading = ref(false)
const verifying = ref(false)
const error = ref<string | null>(null)
const inPwa = ref(import.meta.client ? isStandalonePwa() : false)

async function sendMagicLink() {
  loading.value = true
  error.value = null
  try {
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: inPwa.value
          ? `${window.location.origin}/confirm?from=pwa`
          : `${window.location.origin}/confirm`
      }
    })
    if (err) throw err
    sent.value = true
    otp.value = ''
    startResendCooldown()
  } catch (e: unknown) {
    error.value = t(authErrorKey(e, 'auth.sendLinkError'))
  } finally {
    loading.value = false
  }
}

async function verifyCode() {
  const code = otp.value.replace(/\D/g, '')
  if (code.length !== 6) {
    error.value = t('auth.otpInvalid')
    return
  }
  verifying.value = true
  error.value = null
  try {
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.value,
      token: code,
      type: 'email'
    })
    if (err) throw err
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = t(authErrorKey(e, 'auth.verifyCodeError'))
  } finally {
    verifying.value = false
  }
}

function resetForm() {
  sent.value = false
  otp.value = ''
  error.value = null
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center p-4 bg-default overflow-hidden">
    <AppBackground variant="hero" />
    <UCard class="relative w-full max-w-md shadow-xl shadow-primary/5">
      <template #header>
        <div class="flex items-center gap-2">
          <AppLogo size="lg" />
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

      <template v-if="!sent">
        <form
          class="space-y-4"
          @submit.prevent="sendMagicLink"
        >
          <UFormField :label="t('auth.email')">
            <UInput
              v-model="email"
              type="email"
              required
              autocomplete="email"
              :placeholder="t('auth.emailPlaceholder')"
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
      </template>

      <template v-else>
        <UAlert
          color="success"
          :title="t('auth.checkEmail')"
          :description="inPwa ? t('auth.magicLinkSentPwa') : t('auth.magicLinkSent')"
          class="mb-4"
        />

        <form
          class="space-y-4"
          @submit.prevent="verifyCode"
        >
          <UFormField :label="t('auth.otpLabel')">
            <UInput
              v-model="otp"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              required
              placeholder="000000"
              class="text-center text-lg tracking-widest font-mono"
            />
          </UFormField>
          <UButton
            type="submit"
            block
            :loading="verifying"
          >
            {{ t('auth.verifyCode') }}
          </UButton>
          <UButton
            type="button"
            variant="soft"
            block
            icon="i-lucide-mail"
            :loading="loading"
            :disabled="resendIn > 0"
            @click="sendMagicLink"
          >
            {{ resendIn > 0 ? t('auth.resendIn', { seconds: resendIn }) : t('auth.resendCode') }}
          </UButton>
          <UButton
            type="button"
            variant="ghost"
            block
            :disabled="loading"
            @click="resetForm"
          >
            {{ t('auth.useAnotherEmail') }}
          </UButton>
        </form>
      </template>
      <template #footer>
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4"
          />
          {{ t('auth.backToLanding') }}
        </NuxtLink>
      </template>
    </UCard>
  </div>
</template>
