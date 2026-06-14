<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import type { WorkoutPlan, PlanDay, PlanExercise, Exercise } from '$lib/types';
	import { crypto } from '$lib/utils';

	const id = $derived(page.params.id);
	const plan = liveQuery(() => db.plans.get(id));
	const exercises = liveQuery(() => db.exercises.filter((e) => !e.deletedAt).toArray());

	let editingPlanName = $state(false);
	let planNameInput = $state('');

	let showAddDay = $state(false);
	let newDayName = $state('');

	let showAddExercise = $state<string | null>(null); // dayId
	let exSearch = $state('');

	$effect(() => {
		if ($plan) planNameInput = $plan.name;
	});

	async function savePlanName() {
		if (!planNameInput.trim() || !$plan) return;
		await db.plans.update($plan.id, { name: planNameInput.trim(), updatedAt: Date.now() });
		editingPlanName = false;
	}

	async function addDay() {
		if (!newDayName.trim() || !$plan) return;
		const updated: WorkoutPlan = {
			...$plan,
			days: [...$plan.days, { id: crypto.randomUUID(), name: newDayName.trim(), exercises: [] }],
			updatedAt: Date.now()
		};
		await db.plans.put(updated);
		newDayName = '';
		showAddDay = false;
	}

	async function deleteDay(dayId: string) {
		if (!$plan) return;
		const updated: WorkoutPlan = {
			...$plan,
			days: $plan.days.filter((d) => d.id !== dayId),
			updatedAt: Date.now()
		};
		await db.plans.put(updated);
	}

	async function addExerciseToDay(dayId: string, exerciseId: string) {
		if (!$plan) return;
		const day = $plan.days.find((d) => d.id === dayId);
		if (!day) return;
		if (day.exercises.some((e) => e.exerciseId === exerciseId)) return;
		const newEx: PlanExercise = { exerciseId, order: day.exercises.length, targetSets: 3, targetReps: '8–12' };
		const updated: WorkoutPlan = {
			...$plan,
			days: $plan.days.map((d) =>
				d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d
			),
			updatedAt: Date.now()
		};
		await db.plans.put(updated);
		showAddExercise = null;
		exSearch = '';
	}

	async function removeExerciseFromDay(dayId: string, exerciseId: string) {
		if (!$plan) return;
		const updated: WorkoutPlan = {
			...$plan,
			days: $plan.days.map((d) =>
				d.id === dayId
					? { ...d, exercises: d.exercises.filter((e) => e.exerciseId !== exerciseId).map((e, i) => ({ ...e, order: i })) }
					: d
			),
			updatedAt: Date.now()
		};
		await db.plans.put(updated);
	}

	async function updateExerciseTarget(dayId: string, exerciseId: string, field: 'targetSets' | 'targetReps', value: string | number) {
		if (!$plan) return;
		const updated: WorkoutPlan = {
			...$plan,
			days: $plan.days.map((d) =>
				d.id === dayId
					? { ...d, exercises: d.exercises.map((e) => e.exerciseId === exerciseId ? { ...e, [field]: value } : e) }
					: d
			),
			updatedAt: Date.now()
		};
		await db.plans.put(updated);
	}

	function exName(exId: string): string {
		return ($exercises ?? []).find((e) => e.id === exId)?.name ?? exId;
	}

	let exSearchFiltered = $derived.by(() => {
		const query = exSearch.toLowerCase();
		const dayId = showAddExercise;
		const day = $plan?.days.find((d) => d.id === dayId);
		const already = new Set(day?.exercises.map((e) => e.exerciseId) ?? []);
		return ($exercises ?? [])
			.filter((e) => !already.has(e.id) && e.name.toLowerCase().includes(query))
			.slice(0, 20);
	});
</script>

<div class="flex h-full flex-col">
	<div class="sticky top-0 z-10 bg-gray-950 px-4 py-4 flex items-center gap-3">
		<button onclick={() => goto('/plaene')} class="shrink-0 text-2xl leading-none text-gray-400">‹</button>
		{#if editingPlanName}
			<input
				type="text"
				bind:value={planNameInput}
				onblur={savePlanName}
				onkeydown={(e) => e.key === 'Enter' && savePlanName()}
				class="flex-1 rounded-xl bg-gray-800 px-3 py-2 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
				autofocus
			/>
		{:else}
			<button onclick={() => (editingPlanName = true)} class="flex-1 text-left text-lg font-bold truncate">
				{$plan?.name ?? '…'}
				<span class="ml-1 text-gray-600 text-sm">✏️</span>
			</button>
		{/if}
	</div>

	<div class="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
		{#if !$plan}
			<p class="mt-8 text-center text-gray-500">Lädt…</p>
		{:else}
			{#each $plan.days as day (day.id)}
				<div class="rounded-2xl bg-gray-900 p-4">
					<div class="mb-3 flex items-center justify-between">
						<h2 class="font-semibold">{day.name}</h2>
						<button onclick={() => deleteDay(day.id)} class="text-gray-600 text-sm active:text-red-400">🗑️</button>
					</div>

					<div class="space-y-2 mb-3">
						{#each day.exercises as pe (pe.exerciseId)}
							<div class="rounded-xl bg-gray-800 px-3 py-2.5">
								<div class="flex items-center gap-2 mb-1.5">
									<p class="flex-1 text-sm font-medium truncate">{exName(pe.exerciseId)}</p>
									<button onclick={() => removeExerciseFromDay(day.id, pe.exerciseId)} class="shrink-0 text-gray-600 text-xs active:text-red-400">✕</button>
								</div>
								<div class="flex gap-2">
									<div class="flex items-center gap-1">
										<label class="text-xs text-gray-500">Sätze</label>
										<input
											type="number"
											value={pe.targetSets}
											onchange={(e) => updateExerciseTarget(day.id, pe.exerciseId, 'targetSets', parseInt((e.target as HTMLInputElement).value))}
											class="w-12 rounded-lg bg-gray-700 px-2 py-1 text-center text-sm outline-none"
											inputmode="numeric"
											min="1"
										/>
									</div>
									<div class="flex items-center gap-1">
										<label class="text-xs text-gray-500">Wdh.</label>
										<input
											type="text"
											value={pe.targetReps}
											onchange={(e) => updateExerciseTarget(day.id, pe.exerciseId, 'targetReps', (e.target as HTMLInputElement).value)}
											class="w-16 rounded-lg bg-gray-700 px-2 py-1 text-center text-sm outline-none"
											placeholder="8–12"
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>

					{#if showAddExercise === day.id}
						<div class="mb-2">
							<input
								type="search"
								bind:value={exSearch}
								placeholder="Übung suchen…"
								class="mb-2 w-full rounded-xl bg-gray-800 px-3 py-2.5 text-sm outline-none"
								autofocus
							/>
							<div class="max-h-48 overflow-y-auto space-y-1">
								{#each exSearchFiltered as ex}
									<button
										onclick={() => addExerciseToDay(day.id, ex.id)}
										class="w-full rounded-xl bg-gray-700 px-3 py-2.5 text-left text-sm active:bg-gray-600"
									>
										<span class="font-medium">{ex.name}</span>
										<span class="ml-2 text-xs text-gray-400">{ex.muscleGroup}</span>
									</button>
								{/each}
								{#if exSearchFiltered.length === 0}
									<p class="py-2 text-center text-xs text-gray-500">Keine Übungen gefunden.</p>
								{/if}
							</div>
							<button onclick={() => (showAddExercise = null)} class="mt-2 w-full py-1 text-sm text-gray-500">Abbrechen</button>
						</div>
					{:else}
						<button
							onclick={() => { showAddExercise = day.id; exSearch = ''; }}
							class="w-full rounded-xl border border-dashed border-gray-700 py-2.5 text-sm text-gray-500 active:bg-gray-800"
						>
							+ Übung hinzufügen
						</button>
					{/if}
				</div>
			{/each}

			<!-- Add Day -->
			{#if showAddDay}
				<div class="rounded-2xl bg-gray-900 p-4">
					<input
						type="text"
						bind:value={newDayName}
						placeholder="z. B. Push FB"
						class="mb-3 w-full rounded-xl bg-gray-800 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-indigo-500"
						autofocus
						onkeydown={(e) => e.key === 'Enter' && addDay()}
					/>
					<div class="flex gap-2">
						<button onclick={addDay} class="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold active:bg-indigo-700">Hinzufügen</button>
						<button onclick={() => (showAddDay = false)} class="flex-1 rounded-xl bg-gray-800 py-3 text-sm active:bg-gray-700">Abbrechen</button>
					</div>
				</div>
			{:else}
				<button
					onclick={() => (showAddDay = true)}
					class="w-full rounded-2xl border border-dashed border-gray-700 py-4 text-sm text-gray-500 active:bg-gray-900"
				>
					+ Trainingstag hinzufügen
				</button>
			{/if}
		{/if}
	</div>
</div>
