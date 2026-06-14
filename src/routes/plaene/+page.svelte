<script lang="ts">
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import type { WorkoutPlan } from '$lib/types';
	import { goto } from '$app/navigation';
	import { crypto } from '$lib/utils';

	const plans = liveQuery(() =>
		db.plans.filter((p) => !p.deletedAt).toArray()
	);

	async function setActive(plan: WorkoutPlan) {
		await db.plans.toCollection().modify({ isActive: false });
		await db.plans.update(plan.id, { isActive: true, updatedAt: Date.now() });
	}

	async function deletePlan(plan: WorkoutPlan) {
		if (!confirm(`„${plan.name}" löschen?`)) return;
		await db.plans.update(plan.id, { deletedAt: Date.now(), updatedAt: Date.now() });
	}

	async function createPlan() {
		const id = crypto.randomUUID();
		await db.plans.add({ id, name: 'Neuer Plan', days: [], isActive: false, updatedAt: Date.now(), ownerId: 'local' });
		goto(`/plaene/${id}`);
	}

	function totalExercises(plan: WorkoutPlan) {
		return plan.days.reduce((s, d) => s + d.exercises.length, 0);
	}
</script>

<div class="flex h-full flex-col">
	<div class="bg-slate-950 px-4 pt-5 pb-4">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold tracking-tight text-white">Pläne</h1>
			<button
				onclick={createPlan}
				class="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 active:bg-indigo-700"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Plan
			</button>
		</div>
	</div>

	<div class="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3">
		{#if !$plans}
			<div class="mt-16 flex flex-col items-center gap-3 text-slate-500">
				<div class="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500"></div>
			</div>
		{:else if $plans.length === 0}
			<div class="mt-16 flex flex-col items-center gap-3 text-slate-500">
				<svg class="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
				</svg>
				<p class="text-sm">Noch keine Pläne.</p>
				<button onclick={createPlan} class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white active:bg-indigo-700">Ersten Plan erstellen</button>
			</div>
		{:else}
			{#each $plans as plan (plan.id)}
				<div class="rounded-2xl bg-slate-900 ring-1 ring-slate-800/60 overflow-hidden">
					<!-- Plan header -->
					<div class="flex items-start gap-3 p-4 pb-3">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<h2 class="font-bold text-white">{plan.name}</h2>
								{#if plan.isActive}
									<span class="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">Aktiv</span>
								{/if}
							</div>
							<p class="mt-0.5 text-sm text-slate-500">
								{plan.days.length} Tag{plan.days.length !== 1 ? 'e' : ''} · {totalExercises(plan)} Übungen
							</p>
						</div>
						<div class="flex shrink-0 gap-1">
							<button onclick={() => goto(`/plaene/${plan.id}`)} class="rounded-xl p-2.5 text-slate-600 active:bg-slate-800 active:text-slate-300">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
								</svg>
							</button>
							<button onclick={() => deletePlan(plan)} class="rounded-xl p-2.5 text-slate-600 active:bg-red-950 active:text-red-400">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
								</svg>
							</button>
						</div>
					</div>

					<!-- Days -->
					{#if plan.days.length > 0}
						<div class="border-t border-slate-800/60 divide-y divide-slate-800/40">
							{#each plan.days as day}
								<div class="flex items-center justify-between px-4 py-3">
									<div class="min-w-0">
										<p class="text-sm font-semibold text-white truncate">{day.name}</p>
										<p class="text-xs text-slate-500">{day.exercises.length} Übung{day.exercises.length !== 1 ? 'en' : ''}</p>
									</div>
									<a
										href="/training?planId={plan.id}&dayId={day.id}"
										class="ml-3 flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600/20 px-3.5 py-2 text-xs font-bold text-indigo-400 ring-1 ring-indigo-500/30 active:bg-indigo-600/40"
									>
										<svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M8 5v14l11-7z" />
										</svg>
										Start
									</a>
								</div>
							{/each}
						</div>
					{/if}

					{#if !plan.isActive}
						<div class="border-t border-slate-800/60 px-4 py-3">
							<button
								onclick={() => setActive(plan)}
								class="w-full rounded-xl py-2 text-sm text-slate-500 active:bg-slate-800"
							>
								Als aktiv markieren
							</button>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
