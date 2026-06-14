import Dexie, { type Table } from 'dexie';
import type { Exercise, WorkoutPlan, WorkoutSession } from './types';

export class WorkoutDB extends Dexie {
	exercises!: Table<Exercise, string>;
	plans!: Table<WorkoutPlan, string>;
	sessions!: Table<WorkoutSession, string>;

	constructor() {
		super('WorkoutTracker');
		this.version(1).stores({
			exercises: 'id, muscleGroup, equipment, isFavorite, updatedAt, deletedAt, ownerId',
			plans: 'id, isActive, updatedAt, deletedAt, ownerId',
			sessions: 'id, date, planId, updatedAt, deletedAt, ownerId'
		});
	}
}

export const db = new WorkoutDB();
