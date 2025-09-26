<script lang="ts">
  import { onMount } from 'svelte';
  import { setAuthToken } from '$lib/trpc';

  let name = '';

  onMount(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/me', {
        credentials: 'include', // so cookies are sent
      });

      if (!res.ok) {
        console.error('Auth check failed');
        return;
      }

      const data = await res.json();
      name = data.name;

      if (data.token) {
        setAuthToken(data.token);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  });
</script>

<div class="flex items-center justify-center min-h-screen font-['Press_Start_2P'] bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364]">
  <div class="bg-gradient-to-br from-purple-700 to-indigo-900 text-white p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-8 text-center">
    <h1 class="text-4xl text-cyan-400 drop-shadow-lg">Welcome, {name}!</h1>
  </div>
</div>
