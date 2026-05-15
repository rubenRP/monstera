<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
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
    error.value = e instanceof Error ? e.message : 'Error al enviar el enlace'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-green-50 dark:bg-green-950">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-sprout" class="w-8 h-8 text-primary" />
          <div>
            <h1 class="text-xl font-bold">Monstera</h1>
            <p class="text-sm text-muted">Inicia sesión con tu email</p>
          </div>
        </div>
      </template>

      <UAlert v-if="error" color="error" :title="error" class="mb-4" />
      <UAlert
        v-if="sent"
        color="success"
        title="Revisa tu correo"
        description="Te hemos enviado un enlace mágico para entrar."
        class="mb-4"
      />

      <form class="space-y-4" @submit.prevent="sendMagicLink">
        <UFormField label="Email">
          <UInput v-model="email" type="email" required placeholder="tu@email.com" />
        </UFormField>
        <UButton type="submit" block :loading="loading">
          Enviar enlace mágico
        </UButton>
      </form>
    </UCard>
  </div>
</template>
