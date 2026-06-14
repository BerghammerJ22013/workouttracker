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
</script>

<div class="flex h-full flex-col">
	<div class="sticky top-0 z-10 flex items-center gap-3 bg-gray-950 px-4 py-4">
		<button onclick={() => goto('/statistiken')} class="shrink-0 text-2xl leading-none text-gray-400">‹</button>
		<div class="min-w-0 flex-1">
			<h1 class="truncate font-bold">{$session?.dayName ?? 'Training'}</h1>
			<p class="text-xs text-gray-500">
				{$session ? formatDateTime($session.date) : '…'}
				{$session?.durationMin ? ` · ${$session.durationMin} min` : ''}
			</p>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
		{#if !$session}
			<p class="mt-8 text-center text-gray-500">Lädt…</p>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-2xl bg-gray-900 p-4">
					<p class="text-xs text-gray-500">Volumen</p>
					<p class="mt-1 text-2xl font-bold">{fmtNum(sessionVolume($session))} <span class="text-sm font-normal text-gray-400">kg</span></p>
				</div>
				<div class="rounded-2xl bg-gray-900 p-4">
					<p class="text-xs text-gray-500">Übungen</p>
					<p class="mt-1 text-2xl font-bold">{$session.entries.length}</p>
				</div>
			</div>

			{#if $session.note}
				<div class="rounded-2xl bg-gray-900 p-4">
					<p class="text-sm text-gray-400">{$session.note}</p>
				</div>
			{/if}

			{#each $session.entries as entry (entry.exerciseId)}
				<div class="rounded-2xl bg-gray-900 p-4">
					<div class="mb-2 flex items-center justify-between">
						<a href="/uebungen/{entry.exerciseId}" class="font-semibold truncate flex-1">{exName(entry.exerciseId)}</a>
						<span class="ml-2 shrink-0 text-xs text-gray-500">Vol: {fmtNum(entryVolume(entry))}</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each entry.sets as set, i}
							<div class="rounded-xl px-3 py-2 text-center text-sm {set.isWarmup ? 'bg-amber-900/30 text-amber-300' : 'bg-gray-800 text-gray-200'}">
								<span class="text-xs text-gray-500 block">{set.isWarmup ? 'AW' : `Satz ${i + 1}`}</span>
								<span class="font-semibold">{set.weight}×{set.reps}</span>
							</div>
						{/each}
					</div>
					<p class="mt-2 text-xs text-gray-600">1RM ~{fmtNum(best1RM(entry.sets))}</p>
				</div>
			{/each}
		{/if}
	</div>
</div>
