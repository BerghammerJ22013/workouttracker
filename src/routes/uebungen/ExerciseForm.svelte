<script lang="ts">
	import { db } from '$lib/db';
	import { MUSCLE_GROUPS, EQUIPMENT_LIST, UNITS } from '$lib/types';
	import type { Exercise, MuscleGroup, Equipment, Unit } from '$lib/types';
	import { crypto } from '$lib/utils';

	let {
		exercise = null,
		onclose
	}: { exercise?: Exercise | null; onclose: () => void } = $props();

	let name = $state(exercise?.name ?? '');
	let muscleGroup = $state<MuscleGroup>(exercise?.muscleGroup ?? 'Brust');
	let equipment = $state<Equipment>(exercise?.equipment ?? 'Maschine');
	let notes = $state(exercise?.notes ?? '');
	let unit = $state<Unit>(exercise?.unit ?? 'kg');
	let saving = $state(false);

	async function save() {
		if (!name.trim()) return;
		saving = true;
		const now = Date.now();
		if (exercise) {
			await db.exercises.update(exercise.id, {
				name: name.trim(), muscleGroup, equipment,
				notes: notes.trim() || undefined, unit, updatedAt: now
			});
		} else {
			await db.exercises.add({
				id: crypto.randomUUID(),
				name: name.trim(), muscleGroup, equipment,
				notes: notes.trim() || undefined, unit,
				isFavorite: false, createdAt: now, updatedAt: now, ownerId: 'local'
			});
		}
		saving = false;
		onclose();
	}
</script>

<div
	class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
	onclick={onclose}
	role="none"
></div>

<div class="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-slate-900 shadow-2xl ring-1 ring-slate-700/50"
	style="padding-bottom: env(safe-area-inset-bottom, 16px)">

	<!-- Handle -->
	<div class="flex justify-center pt-3 pb-1">
		<div class="h-1 w-10 rounded-full bg-slate-700"></div>
	</div>

	<div class="px-5 pb-2 pt-3">
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-lg font-bold text-white">
				{exercise ? 'Übung bearbeiten' : 'Neue Übung'}
			</h2>
			<button onclick={onclose} class="rounded-full p-1.5 text-slate-500 active:bg-slate-800">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="space-y-4">
			<div>
				<label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Name</label>
				<input
					type="text"
					bind:value={name}
					placeholder="z. B. Seitheben Kabel"
					class="w-full rounded-xl bg-slate-800 px-4 py-3.5 text-base text-white placeholder-slate-600 outline-none ring-1 ring-slate-700 focus:ring-indigo-500"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Muskelgruppe</label>
					<select bind:value={muscleGroup} class="w-full rounded-xl bg-slate-800 px-3 py-3.5 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-indigo-500">
						{#each MUSCLE_GROUPS as mg}
							<option value={mg}>{mg}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Equipment</label>
					<select bind:value={equipment} class="w-full rounded-xl bg-slate-800 px-3 py-3.5 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-indigo-500">
						{#each EQUIPMENT_LIST as eq}
							<option value={eq}>{eq}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Einheit</label>
					<select bind:value={unit} class="w-full rounded-xl bg-slate-800 px-3 py-3.5 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-indigo-500">
						{#each UNITS as u}
							<option value={u}>{u}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">Notizen</label>
					<input
						type="text"
						bind:value={notes}
						placeholder="optional"
						class="w-full rounded-xl bg-slate-800 px-3 py-3.5 text-sm text-white placeholder-slate-600 outline-none ring-1 ring-slate-700 focus:ring-indigo-500"
					/>
				</div>
			</div>

			<button
				onclick={save}
				disabled={saving || !name.trim()}
				class="mt-2 w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/20 transition-opacity active:bg-indigo-700 disabled:opacity-40"
			>
				{saving ? '…' : exercise ? 'Speichern' : 'Hinzufügen'}
			</button>
		</div>
	</div>
</div>
