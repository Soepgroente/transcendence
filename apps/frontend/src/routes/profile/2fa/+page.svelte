<script lang="ts">
  import QRCode from 'qrcode';
  import { currentUser, authStoreMethods } from '$lib/auth/store';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getBackendApiUrl } from "$lib/trpc";

  let userId = -1;
  let otpauth = '';
  let qrDataUrl = '';
  let token = '';
  let verified = false;
  let error = '';
  let twofaEnabled = 0;

  onMount(() => {
    const unsubscribe = currentUser.subscribe(user => {
      userId = user?.id ?? -1;
      twofaEnabled = user?.twofa_enabled ?? 0;
    });
    return unsubscribe;
  });

  async function setup2FA() {
    error = '';
    try {
      const res = await fetch(`${getBackendApiUrl()}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to setup 2FA');
      const data = await res.json();
      otpauth = data.otpauth;
      qrDataUrl = await QRCode.toDataURL(otpauth);
    } catch (e) {
      error = e.message || 'Error setting up 2FA';
    }
  }

  async function verify2FA() {
    error = '';
    try {
      const res = await fetch(`${getBackendApiUrl()}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token }),
      });
      if (!res.ok) throw new Error('Failed to verify 2FA');
      const data = await res.json();
      verified = data.ok;
      if (verified) {
        twofaEnabled = 1;
        authStoreMethods.setUser({ ...$currentUser, twofa_enabled: 1 });
      }
      error = verified ? '' : 'Invalid code. Try again.';
    } catch (e) {
      error = e.message || 'Error verifying 2FA';
    }
  }

  async function disable2FA() {
    error = '';
    try {
      const res = await fetch(`${getBackendApiUrl()}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to disable 2FA');
      otpauth = '';
      qrDataUrl = '';
      token = '';
      verified = false;
      twofaEnabled = 0;
      error = '';
      authStoreMethods.setUser({ ...$currentUser, twofa_enabled: 0 });
    } catch (e) {
      error = e.message || 'Error disabling 2FA';
    }
  }
</script>

{#if twofaEnabled}
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 text-center shadow-lg">
      <h2 class="text-lg font-semibold">Two-Factor Authentication</h2>
      <p class="text-green-600 font-medium">2FA is enabled on your account.</p>

      <button
        onclick={disable2FA}
        class="bg-red-500 hover:bg-red-600 active:scale-95 shadow-md active:shadow-inner transition-transform text-white rounded-xl px-6 py-3 font-bold w-full"
      >
        Disable 2FA
      </button>

      <button
        onclick={() => goto('/profile')}
        class="bg-cyan-500 hover:bg-cyan-600 active:scale-95 shadow-md active:shadow-inner transition-transform text-black rounded-xl px-6 py-3 font-bold w-full"
      >
        Back to Profile
      </button>
    </div>
  </div>

{:else if !otpauth}
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 text-center shadow-lg">
      <h2 class="text-lg font-semibold">Enable Two-Factor Authentication</h2>
      <p class="text-sm text-gray-600">Add an extra layer of security to your account.</p>

      <button
        onclick={setup2FA}
        class="bg-cyan-500 hover:bg-cyan-600 active:scale-95 shadow-md active:shadow-inner transition-transform text-black rounded-xl px-6 py-3 font-bold w-full"
      >
        Enable 2FA
      </button>

      <button
        onclick={() => goto('/profile')}
        class="bg-gray-200 hover:bg-gray-300 active:scale-95 shadow-md transition-transform rounded-xl px-6 py-3 font-bold text-gray-700 w-full"
      >
        Back to Profile
      </button>
    </div>
  </div>

{:else}
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 text-center shadow-lg">
      <h2 class="text-lg font-semibold">Set Up Two-Factor Authentication</h2>
      <p class="text-sm text-gray-600">
        Scan this QR code with your authenticator app:
      </p>

      {#if qrDataUrl}
        <img src={qrDataUrl} alt="2FA QR Code" class="mx-auto rounded-lg shadow-sm" />
      {/if}

      <input
        type="text"
        bind:value={token}
        placeholder="Enter 6-digit code"
        class="w-full rounded-xl px-4 py-3 text-black font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400"
      />

      <button
        onclick={verify2FA}
        class="bg-green-500 hover:bg-green-600 active:scale-95 shadow-md active:shadow-inner transition-transform text-white rounded-xl px-6 py-3 font-bold w-full"
      >
        Verify
      </button>

      {#if error}
        <p class="text-red-500 text-xs">{error}</p>
      {/if}

      <button
        onclick={() => goto('/profile')}
        class="bg-gray-200 hover:bg-gray-300 active:scale-95 shadow-md transition-transform rounded-xl px-6 py-3 font-bold text-gray-700 w-full"
      >
        Back to Profile
      </button>
    </div>
  </div>
{/if}
