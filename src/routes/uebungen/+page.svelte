<script lang="ts">
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import type { Exercise, MuscleGroup, Equipment } from '$lib/types';
	import { MUSCLE_GROUPS, EQUIPMENT_LIST } from '$lib/types';
	import ExerciseForm from './ExerciseForm.svelte';

	let search = $state('');
	let filterMuscle = $state<MuscleGroup | ''>('');
	let filterEquipment = $state<Equipment | ''>('');
	let showForm = $state(false);
	let editExercise = $state<Exercise | null>(null);

	const allExercises = liveQuery(() =>
		db.exercises.filter((e) => !e.deletedAt).toArray()
	);

	let filtered = $derived.by(() => {
		const list = $allExercises ?? [];
		return list
			.filter((e) => {
				const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
				const matchMuscle = !filterMuscle || e.muscleGroup === filterMuscle;
				const matchEquipment = !filterEquipment || e.equipment === filterEquipment;
				return matchSearch && matchMuscle && matchEquipment;
			})
			.sort((a, b) => {
				if (a.isFavorite && !b.isFavorite) return -1;
				if (!a.isFavorite && b.isFavorite) return 1;
				return a.name.localeCompare(b.name, 'de');
			});
	});

	function openAdd() { editExercise = null; showForm = true; }
	function openEdit(e: Exercise) { editExercise = e; showForm = true; }

	async function toggleFavorite(e: Exercise, ev: MouseEvent) {
		ev.preventDefault();
		ev.stopPropagation();
		await db.exercises.update(e.id, { isFavorite: !e.isFavorite, updatedAt: Date.now() });
	}

	async function deleteExercise(e: Exercise, ev: MouseEvent) {
		ev.preventDefault();
		ev.stopPropagation();
		const inPlans = await db.plans.filter((p) =>
			p.days.some((d) => d.exercises.some((pe) => pe.exerciseId === e.id))
		).count();
		const inSessions = await db.sessions.filter((s) =>
			s.entries.some((en) => en.exerciseId === e.id)
		).count();
		const msg = (inPlans > 0 || inSessions > 0)
			? `„${e.name}" ist in ${inPlans} Plan(en) und ${inSessions} Session(s) referenziert.\nTrotzdem archivieren?`
			: `„${e.name}" löschen?`;
		if (!confirm(msg)) return;
		await db.exercises.update(e.id, { deletedAt: Date.now(), updatedAt: Date.now() });
	}

	const muscleBadge: Record<string, string> = {
		'Brust': 'bg-rose-500/15 text-rose-400 ring-rose-500/20',
		'Rücken': 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
		'Schultern': 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
		'Bizeps': 'bg-violet-500/15 text-violet-400 ring-violet-500/20',
		'Trizeps': 'bg-pink-500/15 text-pink-400 ring-pink-500/20',
		'Beine': 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
		'Hamstrings': 'bg-teal-500/15 text-teal-400 ring-teal-500/20',
		'Waden': 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/20',
		'Bauch': 'bg-orange-500/15 text-orange-400 ring-orange-500/20',
		'Unterer Rücken': 'bg-indigo-500/15 text-indigo-400 ring-indigo-500/20',
	};

	let hasFilter = $derived(!!filterMuscle || !!filterEquipment);
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="bg-slate-950 px-4 pt-5 pb-3">
		<div class="mb-4 flex items-center justify-between">
			<h1 class="text-2xl font-bold tracking-tight text-white">Übungen</h1>
			<button
				onclick={openAdd}
				class="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 active:bg-indigo-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Übung
			</button>
		</div>

		<div class="relative mb-3">
			<svg class="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
			</svg>
			<input
				type="search"
				placeholder="Suchen…"
				bind:value={search}
				class="w-full rounded-xl bg-slate-800/80 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-slate-700/50 focus:ring-indigo-500"
			/>
		</div>

		<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
			<select
				bind:value={filterMuscle}
				class="shrink-0 rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-slate-300 outline-none ring-1 ring-slate-700/50 {filterMuscle ? 'ring-indigo-500 text-indigo-300' : ''}"
			>
				<option value="">Alle Muskeln</option>
				{#each MUSCLE_GROUPS as mg}
					<option value={mg}>{mg}</option>
				{/each}
			</select>
			<select
				bind:value={filterEquipment}
				class="shrink-0 rounded-xl bg-slate-800/80 px-3 py-2 text-sm text-slate-300 outline-none ring-1 ring-slate-700/50 {filterEquipment ? 'ring-indigo-500 text-indigo-300' : ''}"
			>
				<option value="">Alles Equipment</option>
				{#each EQUIPMENT_LIST as eq}
					<option value={eq}>{eq}</option>
				{/each}
			</select>
			{#if hasFilter}
				<button
					onclick={() => { filterMuscle = ''; filterEquipment = ''; }}
					class="shrink-0 rounded-xl bg-slate-700 px-3 py-2 text-xs text-slate-300 active:bg-slate-600"
				>
					✕ Reset
				</button>
			{/if}
		</div>
	</div>

	<!-- List -->
	<div class="flex-1 overflow-y-auto px-4 pb-4">
		{#if !$allExercises}
			<div class="mt-16 flex flex-col items-center gap-3 text-slate-500">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500"></div>
				<p class="text-sm">Lädt…</p>
			</div>
		{:else if filtered.length === 0}
			<div class="mt-16 flex flex-col items-center gap-2 text-slate-500">
				<svg class="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
				</svg>
				<p class="text-sm">Keine Übungen gefunden.</p>
			</div>
		{:else}
			<p class="py-2 text-xs text-slate-600">{filtered.length} Übung{filtered.length !== 1 ? 'en' : ''}</p>
			<ul class="space-y-2">
				{#each filtered as ex (ex.id)}
					<li class="group relative overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-800/60 active:ring-slate-700">
						<a href="/uebungen/{ex.id}" class="flex items-center gap-3 p-4">
							<button
								onclick={(ev) => toggleFavorite(ex, ev)}
								class="shrink-0 text-lg leading-none transition-transform active:scale-125"
							>
								{#if ex.isFavorite}
									<span class="text-amber-400">★</span>
								{:else}
									<span class="text-slate-600">☆</span>
								{/if}
							</button>

							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold text-white">{ex.name}</p>
								<div class="mt-1.5 flex flex-wrap gap-1.5">
									<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 {muscleBadge[ex.muscleGroup] ?? 'bg-slate-700 text-slate-300 ring-slate-600'}">
										{ex.muscleGroup}
									</span>
									<span class="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-slate-700">
										{ex.equipment}
									</span>
								</div>
								{#if ex.notes}
									<p class="mt-1 truncate text-xs text-slate-500">{ex.notes}</p>
								{/if}
							</div>

							<div class="flex shrink-0 items-center gap-1">
								<button
									onclick={(ev) => { ev.preventDefault(); ev.stopPropagation(); openEdit(ex); }}
									class="rounded-xl p-2.5 text-slate-600 active:bg-slate-800 active:text-slate-300"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
									</svg>
								</button>
								<button
									onclick={(ev) => deleteExercise(ex, ev)}
									class="rounded-xl p-2.5 text-slate-600 active:bg-red-950 active:text-red-400"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
									</svg>
								</button>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

{#if showForm}
	<ExerciseForm exercise={editExercise} onclose={() => (showForm = false)} />
{/if}
