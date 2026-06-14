<script lang="ts">
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { sessionVolume, entryVolume } from '$lib/calc';
	import { formatDate, formatDateShort } from '$lib/utils';
	import type { MuscleGroup } from '$lib/types';
	import { goto } from '$app/navigation';

	type Range = '7T' | '4W' | '3M' | '1J' | 'Alle';
	let range = $state<Range>('4W');

	const allSessions = liveQuery(() => db.sessions.filter((s) => !s.deletedAt).toArray());
	const allExercises = liveQuery(() => db.exercises.filter((e) => !e.deletedAt).toArray());

	const DAY = 86400000;
	function cutoff(r: Range): number {
		const now = Date.now();
		if (r === '7T') return now - 7 * DAY;
		if (r === '4W') return now - 28 * DAY;
		if (r === '3M') return now - 90 * DAY;
		if (r === '1J') return now - 365 * DAY;
		return 0;
	}

	let filtered = $derived.by(() =>
		($allSessions ?? []).filter((s) => s.date >= cutoff(range)).sort((a, b) => b.date - a.date)
	);

	let totalVolume = $derived(filtered.reduce((s, x) => s + sessionVolume(x), 0));

	let volumeByMuscle = $derived.by((): { group: MuscleGroup; vol: number }[] => {
		const map = new Map<string, number>();
		for (const s of filtered) {
			for (const e of s.entries) {
				const ex = ($allExercises ?? []).find((x) => x.id === e.exerciseId);
				if (!ex) continue;
				map.set(ex.muscleGroup, (map.get(ex.muscleGroup) ?? 0) + entryVolume(e));
			}
		}
		return Array.from(map.entries()).map(([group, vol]) => ({ group: group as MuscleGroup, vol })).sort((a, b) => b.vol - a.vol);
	});
	let maxMuscleVol = $derived(Math.max(1, ...volumeByMuscle.map((m) => m.vol)));

	let weeklyData = $derived.by(() => {
		const now = Date.now();
		const n = range === '7T' ? 1 : range === '4W' ? 4 : range === '3M' ? 13 : range === '1J' ? 26 : 16;
		return Array.from({ length: n }, (_, i) => {
			const start = now - (n - i) * 7 * DAY;
			const end = now - (n - i - 1) * 7 * DAY;
			const count = ($allSessions ?? []).filter((s) => !s.deletedAt && s.date >= start && s.date < end).length;
			return { label: formatDateShort(end), count };
		});
	});
	let maxWeekly = $derived(Math.max(1, ...weeklyData.map((w) => w.count)));

	function fmtNum(v: number) {
		if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
		return v % 1 === 0 ? v.toString() : v.toFixed(0);
	}

	const muscleColor: Record<string, string> = {
		'Brust': 'bg-rose-500',
		'Rücken': 'bg-blue-500',
		'Schultern': 'bg-amber-500',
		'Bizeps': 'bg-violet-500',
		'Trizeps': 'bg-pink-500',
		'Beine': 'bg-emerald-500',
		'Hamstrings': 'bg-teal-500',
		'Waden': 'bg-cyan-500',
		'Bauch': 'bg-orange-500',
		'Unterer Rücken': 'bg-indigo-500',
	};
</script>

<div class="flex h-full flex-col">
	<div class="bg-slate-950 px-4 pt-5 pb-3">
		<h1 class="mb-4 text-2xl font-bold tracking-tight text-white">Statistiken</h1>
		<div class="flex gap-2">
			{#each (['7T', '4W', '3M', '1J', 'Alle'] as Range[]) as r}
				<button
					onclick={() => (range = r)}
					class="rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors
						{range === r ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400'}"
				>
					{r}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex-1 overflow-y-auto px-4 pb-6 pt-3 space-y-4">
		<!-- Overview -->
		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
				<p class="text-xs font-medium uppercase tracking-wider text-slate-500">Einheiten</p>
				<p class="mt-2 text-4xl font-bold text-white">{filtered.length}</p>
			</div>
			<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
				<p class="text-xs font-medium uppercase tracking-wider text-slate-500">Volumen</p>
				<p class="mt-2 text-4xl font-bold text-white">{fmtNum(totalVolume)}</p>
				<p class="text-xs text-slate-600">kg gesamt</p>
			</div>
		</div>

		<!-- Frequency chart -->
		{#if weeklyData.some((w) => w.count > 0)}
			<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
				<p class="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">Trainingsfrequenz</p>
				<div class="flex h-24 items-end gap-1">
					{#each weeklyData as w}
						<div class="group flex flex-1 flex-col items-center gap-1">
							{#if w.count > 0}
								<span class="text-[9px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100">{w.count}</span>
							{/if}
							<div
								class="w-full min-h-[3px] rounded-t-md transition-all {w.count > 0 ? 'bg-indigo-600' : 'bg-slate-800'}"
								style="height: {w.count > 0 ? Math.max(12, (w.count / maxWeekly) * 80) : 3}px"
							></div>
						</div>
					{/each}
				</div>
				<div class="mt-1 flex justify-between text-[10px] text-slate-700">
					<span>{weeklyData[0]?.label}</span>
					<span>{weeklyData.at(-1)?.label}</span>
				</div>
			</div>
		{/if}

		<!-- Muscle volume -->
		{#if volumeByMuscle.length > 0}
			<div class="rounded-2xl bg-slate-900 p-4 ring-1 ring-slate-800/60">
				<p class="mb-4 text-xs font-medium uppercase tracking-wider text-slate-500">Volumen nach Muskelgruppe</p>
				<div class="space-y-3">
					{#each volumeByMuscle as m}
						<div class="flex items-center gap-3">
							<span class="w-[110px] shrink-0 text-xs text-slate-400 truncate">{m.group}</span>
							<div class="flex-1 overflow-hidden rounded-full bg-slate-800 h-2">
								<div
									class="h-full rounded-full transition-all {muscleColor[m.group] ?? 'bg-indigo-500'}"
									style="width: {(m.vol / maxMuscleVol) * 100}%"
								></div>
							</div>
							<span class="w-12 shrink-0 text-right text-xs font-medium text-slate-400">{fmtNum(m.vol)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Recent sessions -->
		<div>
			<p class="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">Letzte Trainings</p>
			{#if filtered.length === 0}
				<div class="flex flex-col items-center gap-2 py-8 text-slate-600">
					<svg class="h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
					</svg>
					<p class="text-sm">Keine Einheiten im Zeitraum.</p>
				</div>
			{:else}
				<ul class="space-y-2">
					{#each filtered as s (s.id)}
						<li>
							<button
								onclick={() => goto(`/statistiken/${s.id}`)}
								class="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-left ring-1 ring-slate-800/60 active:bg-slate-800"
							>
								<div class="flex items-center justify-between">
									<div class="min-w-0">
										<p class="truncate font-semibold text-white">{s.dayName ?? 'Freies Training'}</p>
										<p class="text-xs text-slate-500 mt-0.5">
											{formatDate(s.date)}{s.durationMin ? ` · ${s.durationMin} min` : ''}
										</p>
									</div>
									<div class="ml-3 shrink-0 text-right">
										<p class="font-bold text-white">{fmtNum(sessionVolume(s))}<span class="ml-0.5 text-xs font-normal text-slate-500">kg</span></p>
										<p class="text-xs text-slate-500">{s.entries.length} Übungen</p>
									</div>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
