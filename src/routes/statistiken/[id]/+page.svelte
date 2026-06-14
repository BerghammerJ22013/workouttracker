<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { sessionVolume, entryVolume, best1RM } from '$lib/calc';
	import { formatDateTime } from '$lib/utils';

	const id = $derived(page.params.id);
	const session = liveQuery(() => db.sessions.get(id));
	const exercises = liveQuery(() => db.exercises.filter((e) => !e.deletedAt).toArray());

	function exName(exId: string) {
		return ($exercises ?? []).find((e) => e.id === exId)?.name ?? exId;
	}

	function fmtNum(v: number) {
		return v % 1 === 0 ? v.toString() : v.toFixed(1);
	}

	async function deleteSession() {
		if (!confirm('Training löschen?')) return;
		await db.sessions.update(id, { deletedAt: Date.now(), updatedAt: Date.now() });
		goto('/statistiken');
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center gap-3 bg-slate-950 px-4 py-4 ring-1 ring-slate-800/40">
		<button onclick={() => goto('/statistiken')} class="shrink-0 rounded-xl p-2 text-slate-400 active:bg-slate-800">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
		</button>
		<div class="min-w-0 flex-1">
			<h1 class="truncate font-bold text-white">{$session?.dayName ?? 'Training'}</h1>
			<p class="text-xs text-slate-500">
				{$session ? formatDateTime($session.date) : '…'}
				{$session?.durationMin ? ` · ${$session.durationMin} min` : ''}
			</p>
		</div>
		<button
			onclick={deleteSession}
			class="shrink-0 rounded-xl p-2 text-slate-600 active:bg-red-950 active:text-red-400"
			aria-label="Training löschen"
		>
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
			</svg>
		</button>
	</div>

	<div class="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">
		{#if !$session}
			<div class="flex justify-center pt-8">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500"></div>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
					<p class="text-xs text-slate-500">Volumen</p>
					<p class="mt-1.5 text-2xl font-bold text-white">{fmtNum(sessionVolume($session))} <span class="text-sm font-normal text-slate-500">kg</span></p>
				</div>
				<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
					<p class="text-xs text-slate-500">Übungen</p>
					<p class="mt-1.5 text-2xl font-bold text-white">{$session.entries.length}</p>
				</div>
			</div>

			{#if $session.note}
				<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
					<p class="text-sm text-slate-400 italic">{$session.note}</p>
				</div>
			{/if}

			{#each $session.entries as entry (entry.exerciseId)}
				<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
					<div class="mb-3 flex items-center justify-between">
						<a href="/uebungen/{entry.exerciseId}" class="truncate font-semibold text-white flex-1">{exName(entry.exerciseId)}</a>
						<span class="ml-2 shrink-0 text-xs text-slate-500">Vol: {fmtNum(entryVolume(entry))}</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each entry.sets as set, i}
							<div class="rounded-xl px-3 py-2 text-center text-sm {set.isWarmup ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' : 'bg-slate-800 text-white ring-1 ring-slate-700'}">
								<span class="text-xs text-slate-500 block">{set.isWarmup ? 'AW' : `Satz ${i + 1}`}</span>
								<span class="font-semibold">{set.weight}×{set.reps}</span>
							</div>
						{/each}
					</div>
					<p class="mt-2 text-xs text-slate-600">1RM ~{fmtNum(best1RM(entry.sets))}</p>
				</div>
			{/each}
		{/if}
	</div>
</div>
