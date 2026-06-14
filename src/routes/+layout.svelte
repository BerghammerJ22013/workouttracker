<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { seedIfEmpty } from '$lib/seed';

	let { children } = $props();

	onMount(async () => {
		await seedIfEmpty();
	});

	const tabs = [
		{ href: '/uebungen', label: 'Übungen' },
		{ href: '/plaene', label: 'Pläne' },
		{ href: '/statistiken', label: 'Stats' }
	] as const;

	function isActive(href: string) {
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<title>Workout Tracker</title>
</svelte:head>

<div class="flex h-dvh flex-col bg-slate-950">
	<main class="min-h-0 flex-1 overflow-y-auto">
		{@render children()}
	</main>

	<nav class="shrink-0 border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-md" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
		<div class="flex">
			{#each tabs as tab}
				{@const active = isActive(tab.href)}
				<a href={tab.href} class="relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors {active ? 'text-indigo-400' : 'text-slate-500'}">
					{#if active}
						<span class="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-indigo-500"></span>
					{/if}

					{#if tab.href === '/uebungen'}
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
						</svg>
					{:else if tab.href === '/plaene'}
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
						</svg>
					{:else}
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
						</svg>
					{/if}

					<span>{tab.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
