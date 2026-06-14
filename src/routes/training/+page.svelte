<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import type { LoggedSet, SessionEntry, WorkoutSession, Exercise } from '$lib/types';
	import { epley1RM, entryVolume } from '$lib/calc';
	import { crypto, formatDate } from '$lib/utils';

	const planId = $derived(page.url.searchParams.get('planId') ?? '');
	const dayId = $derived(page.url.searchParams.get('dayId') ?? '');

	const plan = liveQuery(() => db.plans.get(planId));
	const exercises = liveQuery(() => db.exercises.filter((e) => !e.deletedAt).toArray());

	let day = $derived($plan?.days.find((d) => d.id === dayId));

	const lastSessions = liveQuery(async () => {
		const all = await db.sessions.filter((s) => !s.deletedAt).toArray();
		all.sort((a, b) => b.date - a.date);
		const map = new Map<string, LoggedSet[]>();
		for (const s of all) {
			for (const e of s.entries) {
				if (!map.has(e.exerciseId)) map.set(e.exerciseId, e.sets);
			}
		}
		return map;
	});

	type EntryState = { exerciseId: string; sets: LoggedSet[] };

	let entries = $state<EntryState[]>([]);
	let sessionNote = $state('');
	let startTime = Date.now();
	let saving = $state(false);
	let saved = $state(false);
	let newPRs = $state<string[]>([]);

	$effect(() => {
		if (!day || entries.length > 0) return;
		entries = day.exercises
			.slice()
			.sort((a, b) => a.order - b.order)
			.map((pe) => ({
				exerciseId: pe.exerciseId,
				sets: Array.from({ length: pe.targetSets }, () => ({
					weight: 0, reps: 0, isWarmup: false
				}))
			}));
	});

	function exInfo(id: string): Exercise | undefined {
		return ($exercises ?? []).find((e) => e.id === id);
	}
	function lastSets(id: string): LoggedSet[] {
		return $lastSessions?.get(id) ?? [];
	}
	function addSet(ei: number) {
		const last = entries[ei].sets.at(-1);
		entries[ei].sets = [...entries[ei].sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 0, isWarmup: false }];
	}
	function removeSet(ei: number, si: number) {
		entries[ei].sets = entries[ei].sets.filter((_, i) => i !== si);
	}
	function quickFill(ei: number, sets: LoggedSet[]) {
		entries[ei].sets = sets.map((s) => ({ ...s }));
	}

	async function saveSession() {
		if (saving) return;
		saving = true;
		const now = Date.now();
		const sessionEntries: SessionEntry[] = entries
			.filter((e) => e.sets.some((s) => s.reps > 0))
			.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets }));

		const prs: string[] = [];
		for (const e of sessionEntries) {
			const prev = await db.sessions.filter((s) => !s.deletedAt && s.entries.some((en) => en.exerciseId === e.exerciseId)).toArray();
			const prevBest = Math.max(0, ...prev.flatMap((s) => s.entries.filter((en) => en.exerciseId === e.exerciseId).flatMap((en) => en.sets.filter((s) => !s.isWarmup).map((s) => epley1RM(s.weight, s.reps)))));
			const currBest = Math.max(0, ...e.sets.filter((s) => !s.isWarmup).map((s) => epley1RM(s.weight, s.reps)));
			if (currBest > prevBest && prevBest > 0) {
				const ex = exInfo(e.exerciseId);
				if (ex) prs.push(ex.name);
			}
		}
		newPRs = prs;

		await db.sessions.add({
			id: crypto.randomUUID(), date: startTime, planId: planId || undefined, dayName: day?.name,
			entries: sessionEntries, durationMin: Math.round((now - startTime) / 60000),
			note: sessionNote.trim() || undefined, updatedAt: now, ownerId: 'local'
		});
		saved = true;
		saving = false;
	}

	function fmtNum(v: number) { return v % 1 === 0 ? v.toString() : v.toFixed(1); }
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="flex items-center gap-3 bg-slate-950 px-4 py-4 ring-1 ring-slate-800/40">
		<button onclick={() => goto('/plaene')} class="shrink-0 rounded-xl p-2 text-slate-400 active:bg-slate-800">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
		</button>
		<div class="flex-1 min-w-0">
			<h1 class="truncate font-bold text-white">{day?.name ?? '…'}</h1>
			<p class="text-xs text-slate-500">{formatDate(startTime)}</p>
		</div>
	</div>

	{#if saved}
		<div class="flex flex-1 flex-col items-center justify-center px-6 text-center">
			<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/30">
				<svg class="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
			</div>
			<h2 class="text-xl font-bold text-white mb-1">Training gespeichert!</h2>
			<p class="text-sm text-slate-500 mb-5">Gut gemacht 💪</p>
			{#if newPRs.length > 0}
				<div class="mb-6 w-full rounded-2xl bg-amber-500/10 px-4 py-3.5 ring-1 ring-amber-500/30">
					<p class="mb-2 text-sm font-bold text-amber-400">🏆 Neue PRs!</p>
					{#each newPRs as pr}
						<p class="text-sm text-amber-300">{pr}</p>
					{/each}
				</div>
			{/if}
			<button onclick={() => goto('/plaene')} class="rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-lg shadow-indigo-500/20 active:bg-indigo-700">
				Zurück zu Plänen
			</button>
		</div>
	{:else}
		<div class="flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-3">
			{#if !day}
				<p class="mt-8 text-center text-slate-500">Lädt…</p>
			{:else}
				{#each entries as entry, ei (entry.exerciseId)}
					{@const ex = exInfo(entry.exerciseId)}
					{@const last = lastSets(entry.exerciseId)}
					<div class="rounded-2xl bg-slate-900 ring-1 ring-slate-800/60">
						<!-- Exercise header -->
						<div class="flex items-center gap-2 px-4 pt-4 pb-2">
							<a href="/uebungen/{entry.exerciseId}" class="min-w-0 flex-1 font-bold text-white truncate">
								{ex?.name ?? entry.exerciseId}
							</a>
							{#if last.length > 0}
								<button
									onclick={() => quickFill(ei, last)}
									class="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-slate-700 active:bg-slate-700"
								>
									↩ Letztes Mal
								</button>
							{/if}
						</div>

						{#if last.length > 0}
							<div class="flex flex-wrap gap-1 px-4 pb-2">
								{#each last as s}
									<span class="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
										{s.weight}×{s.reps}{s.isWarmup ? ' AW' : ''}
									</span>
								{/each}
							</div>
						{/if}

						<!-- Set rows -->
						<div class="px-3 pb-3 space-y-2">
							<!-- Column labels -->
							<div class="flex items-center gap-1.5 px-1">
								<span class="w-5 shrink-0"></span>
								<span class="w-9 shrink-0 text-center text-xs text-slate-600">AW</span>
								<span class="flex-1 text-center text-xs text-slate-600">{ex?.unit ?? 'kg'}</span>
								<span class="flex-1 text-center text-xs text-slate-600">Wdh.</span>
								<span class="w-7 shrink-0"></span>
							</div>

							{#each entry.sets as set, si}
								<div class="flex items-center gap-1.5">
									<span class="w-5 shrink-0 text-center text-xs font-medium text-slate-600">{si + 1}</span>
									<button
										onclick={() => (set.isWarmup = !set.isWarmup)}
										class="w-9 shrink-0 rounded-lg py-2.5 text-xs font-bold transition-colors
											{set.isWarmup ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-slate-800 text-slate-600 ring-1 ring-slate-700'}"
									>
										AW
									</button>
									<input
										type="number"
										bind:value={set.weight}
										inputmode="decimal"
										placeholder="0"
										class="min-w-0 flex-1 rounded-xl bg-slate-800 py-2.5 text-center text-base font-bold text-white outline-none ring-1 ring-slate-700 focus:ring-indigo-500"
									/>
									<input
										type="number"
										bind:value={set.reps}
										inputmode="numeric"
										placeholder="0"
										class="min-w-0 flex-1 rounded-xl bg-slate-800 py-2.5 text-center text-base font-bold text-white outline-none ring-1 ring-slate-700 focus:ring-indigo-500"
									/>
									<button
										onclick={() => removeSet(ei, si)}
										class="w-7 shrink-0 rounded-lg py-2.5 text-slate-700 active:bg-red-950 active:text-red-400"
									>
										<svg class="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</div>
							{/each}

							<button
								onclick={() => addSet(ei)}
								class="mt-1 w-full rounded-xl border border-dashed border-slate-700 py-2.5 text-sm font-medium text-slate-600 active:bg-slate-800"
							>
								+ Satz
							</button>
						</div>
					</div>
				{/each}

				<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
					<label class="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">Notiz</label>
					<textarea
						bind:value={sessionNote}
						rows="2"
						placeholder="Optional…"
						class="w-full resize-none rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none ring-1 ring-slate-700 focus:ring-indigo-500"
					></textarea>
				</div>

				<button
					onclick={saveSession}
					disabled={saving}
					class="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/20 active:bg-indigo-700 disabled:opacity-50"
				>
					{saving ? 'Speichern…' : 'Training speichern'}
				</button>
			{/if}
		</div>
	{/if}
</div>
