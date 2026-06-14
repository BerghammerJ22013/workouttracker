<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { epley1RM, best1RM, entryVolume } from '$lib/calc';
	import { formatDate } from '$lib/utils';
	import type { WorkoutSession } from '$lib/types';

	const id = $derived(page.params.id);

	const exercise = liveQuery(() => db.exercises.get(id));
	const sessions = liveQuery(async () => {
		const all = await db.sessions.filter((s) => !s.deletedAt && s.entries.some((e) => e.exerciseId === id)).toArray();
		return all.sort((a, b) => b.date - a.date);
	});

	type EntryStats = { session: WorkoutSession; rm1: number; volume: number; sets: { weight: number; reps: number; isWarmup: boolean }[] };

	let stats = $derived.by((): EntryStats[] =>
		($sessions ?? []).map((s) => {
			const entry = s.entries.find((e) => e.exerciseId === id);
			if (!entry) return null;
			return { session: s, rm1: best1RM(entry.sets), volume: entryVolume(entry), sets: entry.sets };
		}).filter(Boolean) as EntryStats[]
	);

	let prs = $derived.by(() => {
		if (!stats.length) return null;
		const workingSets = stats.flatMap((s) => s.sets.filter((x) => !x.isWarmup));
		return {
			maxWeight: Math.max(...workingSets.map((x) => x.weight)),
			maxReps: Math.max(...stats.flatMap((s) => s.sets.map((x) => x.reps))),
			best1RM: Math.max(...stats.map((s) => s.rm1)),
			bestVolume: Math.max(...stats.map((s) => s.volume))
		};
	});

	let progress = $derived.by(() => {
		if (stats.length < 2) return null;
		const curr = stats[0], prev = stats[1];
		return {
			rm1Delta: curr.rm1 - prev.rm1,
			rm1Pct: prev.rm1 > 0 ? ((curr.rm1 - prev.rm1) / prev.rm1) * 100 : null,
			volDelta: curr.volume - prev.volume,
			volPct: prev.volume > 0 ? ((curr.volume - prev.volume) / prev.volume) * 100 : null
		};
	});

	function fmtNum(v: number) { return v % 1 === 0 ? v.toString() : v.toFixed(1); }
	function fmtPct(v: number | null) { if (v === null) return ''; return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'; }
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center gap-3 bg-slate-950 px-4 py-4 ring-1 ring-slate-800/40">
		<button onclick={() => goto('/uebungen')} class="shrink-0 rounded-xl p-2 text-slate-400 active:bg-slate-800">
			<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
		</button>
		<h1 class="min-w-0 flex-1 truncate text-lg font-bold text-white">{$exercise?.name ?? '…'}</h1>
	</div>

	<div class="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-5">
		{#if !$exercise}
			<div class="flex justify-center pt-8">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500"></div>
			</div>
		{:else}
			<div class="flex flex-wrap gap-2">
				<span class="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 ring-1 ring-slate-700">{$exercise.muscleGroup}</span>
				<span class="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 ring-1 ring-slate-700">{$exercise.equipment}</span>
				<span class="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 ring-1 ring-slate-700">{$exercise.unit}</span>
			</div>
			{#if $exercise.notes}
				<p class="text-sm text-slate-500 italic">{$exercise.notes}</p>
			{/if}

			{#if prs}
				<div>
					<p class="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Persönliche Rekorde</p>
					<div class="grid grid-cols-2 gap-3">
						{#each [
							{ label: 'Max. Gewicht', value: fmtNum(prs.maxWeight), unit: $exercise.unit },
							{ label: 'Est. 1RM', value: fmtNum(prs.best1RM), unit: $exercise.unit },
							{ label: 'Max. Wdh.', value: String(prs.maxReps), unit: 'reps' },
							{ label: 'Best. Volumen', value: fmtNum(prs.bestVolume), unit: $exercise.unit }
						] as pr}
							<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
								<p class="text-xs text-slate-500">{pr.label}</p>
								<p class="mt-1.5 text-2xl font-bold text-white">
									{pr.value}
									<span class="text-xs font-normal text-slate-500">{pr.unit}</span>
								</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if progress}
				<div>
					<p class="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Steigerung (letzte 2 Einheiten)</p>
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
							<p class="text-xs text-slate-500">1RM</p>
							<p class="mt-1.5 text-xl font-bold {progress.rm1Delta >= 0 ? 'text-emerald-400' : 'text-red-400'}">
								{progress.rm1Delta >= 0 ? '▲' : '▼'} {fmtNum(Math.abs(progress.rm1Delta))}
							</p>
							{#if progress.rm1Pct !== null}
								<p class="text-xs text-slate-600">{fmtPct(progress.rm1Pct)}</p>
							{/if}
						</div>
						<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
							<p class="text-xs text-slate-500">Volumen</p>
							<p class="mt-1.5 text-xl font-bold {progress.volDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}">
								{progress.volDelta >= 0 ? '▲' : '▼'} {fmtNum(Math.abs(progress.volDelta))}
							</p>
							{#if progress.volPct !== null}
								<p class="text-xs text-slate-600">{fmtPct(progress.volPct)}</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<div>
				<p class="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Verlauf ({stats.length} Einheiten)</p>
				{#if stats.length === 0}
					<div class="flex flex-col items-center gap-2 py-8 text-slate-600">
						<p class="text-sm">Noch kein Training geloggt.</p>
					</div>
				{:else}
					<ul class="space-y-2">
						{#each stats as s (s.session.id)}
							<li class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-sm font-semibold text-white">{formatDate(s.session.date)}</span>
									<span class="text-xs text-slate-500">1RM ~{fmtNum(s.rm1)} · Vol {fmtNum(s.volume)}</span>
								</div>
								<div class="flex flex-wrap gap-2">
									{#each s.sets as set}
										<div class="rounded-xl px-3 py-1.5 text-center text-sm {set.isWarmup ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' : 'bg-slate-800 text-white ring-1 ring-slate-700'}">
											{set.weight}×{set.reps}{set.isWarmup ? ' AW' : ''}
										</div>
									{/each}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>
</div>
