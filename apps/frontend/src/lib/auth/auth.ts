import { loginInput, signUpInput } from '@repo/trpc/schemas';
import { trpc } from '../trpc';
import { authStoreMethods } from '$lib/auth/store';
import { goto } from '$app/navigation';
import { getBackendApiUrl } from '../trpc';

export async function signUp(name: string, email: string, password: string, twofa_enabled = 0) {
  try {
    const validInput = signUpInput.safeParse({
      name,
      email,
      password,
      twofa_enabled
    });
    if (!validInput.success) {
      const messages = validInput.error.issues.map((err) => err.message);
      console.error('signup failed: ', messages);
      throw messages;
    }
    const res = await trpc.auth.signUp.mutate(validInput.data);
    console.log('logged in :', res.user.name);
    authStoreMethods.login(res.token, res.user);
    await goto('/profile');
  } catch (e) {
    console.error('signup failed ', e.message || e);
    throw e;
  }
}

export async function login(email: string, password: string) {
  try {
    const validInput = loginInput.safeParse({
      email,
      password,
    });
    if (!validInput.success) {
      const messages = validInput.error.issues.map((err) => err.message);
      console.error('login validation failed: ', messages);
      throw messages;
    }
    const res = await trpc.auth.login.mutate(validInput.data);

    // 2FA
    if (res.twofaRequired) {
      return { twofaRequired: true, userId: res.userId };
    }

    // Normal login
    // Should go to main page.
    console.log('logged in :', res.user.name);
    authStoreMethods.login(res.token, res.user);
    await goto('/profile');
    return { success: true };
  } catch (e) {
    console.error('login failed: ', e);
    throw e.message || e;
  }
}

export async function verify2FAToLogin(userId: number, code: string) {
  try {
    const res = await fetch(`${getBackendApiUrl()}/api/auth/2fa/verify_login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, token: code }),
    });
    const data = await res.json();
    if (data.ok && data.token && data.user) {
      authStoreMethods.login(data.token, data.user);
      await goto('/profile');
      return { success: true };
    } else {
      throw new Error('Invalid 2FA code');
    }
  } catch (e) {
    throw e.message || e;
  }
}

export function logout() {
  authStoreMethods.logout();
  goto('/signin');
}
