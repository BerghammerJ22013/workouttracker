import { db } from './db';
import type { Exercise, WorkoutPlan, WorkoutSession } from './types';

const LOCAL_OWNER = 'local';

export async function seedIfEmpty() {
	const count = await db.exercises.count();
	if (count > 0) return;

	const now = Date.now();

	const exercises: Exercise[] = [
		{ id: 'ex-01', name: 'Seitheben Kabel', muscleGroup: 'Schultern', equipment: 'Kabel', notes: 'Hüfthöhe', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-02', name: 'Incline Smith Machine', muscleGroup: 'Brust', equipment: 'Smith', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-03', name: 'Brustpresse', muscleGroup: 'Brust', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-04', name: 'Butterfly', muscleGroup: 'Brust', equipment: 'Maschine', notes: 'ca 70–80° ganz runter', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-05', name: 'Schulterdrücken Smith', muscleGroup: 'Schultern', equipment: 'Smith', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-06', name: 'Pushdowns einhändig', muscleGroup: 'Trizeps', equipment: 'Kabel', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-07', name: 'Beinpresse', muscleGroup: 'Beine', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-08', name: 'Leg Extension', muscleGroup: 'Beine', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-09', name: 'Waden', muscleGroup: 'Waden', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-10', name: 'Adduktoren', muscleGroup: 'Beine', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-11', name: 'Hintere Schulter', muscleGroup: 'Schultern', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-12', name: 'High Rows', muscleGroup: 'Rücken', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-13', name: 'T-Bar', muscleGroup: 'Rücken', equipment: 'Langhantel', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-14', name: 'Latzug Maschine', muscleGroup: 'Rücken', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-15', name: 'Enges Rudern', muscleGroup: 'Rücken', equipment: 'Kabel', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-16', name: 'Preacher Curls', muscleGroup: 'Bizeps', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-17', name: 'Hinter-Rücken Curls', muscleGroup: 'Bizeps', equipment: 'Kabel', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-18', name: 'Hamstring Curls stehend', muscleGroup: 'Hamstrings', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-19', name: 'Unterer Rücken', muscleGroup: 'Unterer Rücken', equipment: 'Maschine', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER },
		{ id: 'ex-20', name: 'Cable Crunches', muscleGroup: 'Bauch', equipment: 'Kabel', unit: 'kg', isFavorite: false, createdAt: now, updatedAt: now, ownerId: LOCAL_OWNER }
	];

	const plan: WorkoutPlan = {
		id: 'plan-01',
		name: 'Push FB / Pull FB',
		isActive: true,
		updatedAt: now,
		ownerId: LOCAL_OWNER,
		days: [
			{
				id: 'day-push',
				name: 'Push FB',
				exercises: [
					{ exerciseId: 'ex-01', order: 0, targetSets: 2, targetReps: '9–12' },
					{ exerciseId: 'ex-02', order: 1, targetSets: 2, targetReps: '5–9' },
					{ exerciseId: 'ex-03', order: 2, targetSets: 1, targetReps: '8' },
					{ exerciseId: 'ex-04', order: 3, targetSets: 2, targetReps: '8–11' },
					{ exerciseId: 'ex-05', order: 4, targetSets: 1, targetReps: '9' },
					{ exerciseId: 'ex-06', order: 5, targetSets: 2, targetReps: '8' },
					{ exerciseId: 'ex-07', order: 6, targetSets: 2, targetReps: '8–10' },
					{ exerciseId: 'ex-08', order: 7, targetSets: 2, targetReps: '11' },
					{ exerciseId: 'ex-09', order: 8, targetSets: 1, targetReps: '9' },
					{ exerciseId: 'ex-10', order: 9, targetSets: 1, targetReps: '9' }
				]
			},
			{
				id: 'day-pull',
				name: 'Pull FB',
				exercises: [
					{ exerciseId: 'ex-11', order: 0, targetSets: 2, targetReps: '10–12' },
					{ exerciseId: 'ex-12', order: 1, targetSets: 2, targetReps: '5–10' },
					{ exerciseId: 'ex-13', order: 2, targetSets: 2, targetReps: '8' },
					{ exerciseId: 'ex-14', order: 3, targetSets: 1, targetReps: '9' },
					{ exerciseId: 'ex-15', order: 4, targetSets: 1, targetReps: '10' },
					{ exerciseId: 'ex-16', order: 5, targetSets: 2, targetReps: '7–9' },
					{ exerciseId: 'ex-17', order: 6, targetSets: 2, targetReps: '6–8' },
					{ exerciseId: 'ex-18', order: 7, targetSets: 2, targetReps: '7–8' },
					{ exerciseId: 'ex-19', order: 8, targetSets: 2, targetReps: '7–10' },
					{ exerciseId: 'ex-20', order: 9, targetSets: 2, targetReps: '14' }
				]
			}
		]
	};

	// Sample session for stats
	const session: WorkoutSession = {
		id: 'session-demo-01',
		date: Date.now() - 2 * 24 * 60 * 60 * 1000,
		planId: 'plan-01',
		dayName: 'Push FB',
		updatedAt: now,
		ownerId: LOCAL_OWNER,
		entries: [
			{
				exerciseId: 'ex-01',
				sets: [
					{ weight: 7.5, reps: 12, isWarmup: false },
					{ weight: 7.5, reps: 11, isWarmup: false }
				]
			},
			{
				exerciseId: 'ex-02',
				sets: [
					{ weight: 60, reps: 10, isWarmup: true },
					{ weight: 80, reps: 7, isWarmup: false },
					{ weight: 80, reps: 6, isWarmup: false }
				]
			},
			{
				exerciseId: 'ex-03',
				sets: [{ weight: 55, reps: 8, isWarmup: false }]
			},
			{
				exerciseId: 'ex-04',
				sets: [
					{ weight: 40, reps: 11, isWarmup: false },
					{ weight: 40, reps: 10, isWarmup: false }
				]
			},
			{
				exerciseId: 'ex-05',
				sets: [{ weight: 50, reps: 9, isWarmup: false }]
			},
			{
				exerciseId: 'ex-06',
				sets: [
					{ weight: 12.5, reps: 8, isWarmup: false },
					{ weight: 12.5, reps: 8, isWarmup: false }
				]
			},
			{
				exerciseId: 'ex-07',
				sets: [
					{ weight: 60, reps: 10, isWarmup: true },
					{ weight: 80, reps: 10, isWarmup: false },
					{ weight: 80, reps: 8, isWarmup: false }
				]
			},
			{
				exerciseId: 'ex-08',
				sets: [
					{ weight: 50, reps: 11, isWarmup: false },
					{ weight: 50, reps: 10, isWarmup: false }
				]
			},
			{
				exerciseId: 'ex-09',
				sets: [{ weight: 60, reps: 9, isWarmup: false }]
			},
			{
				exerciseId: 'ex-10',
				sets: [{ weight: 45, reps: 9, isWarmup: false }]
			}
		]
	};

	await db.exercises.bulkAdd(exercises);
	await db.plans.add(plan);
	await db.sessions.add(session);
}
