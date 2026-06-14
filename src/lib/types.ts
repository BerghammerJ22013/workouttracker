export type MuscleGroup =
	| 'Brust'
	| 'Rücken'
	| 'Schultern'
	| 'Bizeps'
	| 'Trizeps'
	| 'Beine'
	| 'Hamstrings'
	| 'Waden'
	| 'Bauch'
	| 'Unterer Rücken';

export type Equipment =
	| 'Kabel'
	| 'Smith'
	| 'Maschine'
	| 'Langhantel'
	| 'Kurzhantel'
	| 'Körpergewicht';

export type Unit = 'kg' | 'Platte' | 'Block';

export interface Exercise {
	id: string;
	name: string;
	muscleGroup: MuscleGroup;
	equipment: Equipment;
	notes?: string;
	unit: Unit;
	isFavorite: boolean;
	createdAt: number;
	updatedAt: number;
	deletedAt?: number;
	ownerId: string;
}

export interface PlanExercise {
	exerciseId: string;
	order: number;
	targetSets: number;
	targetReps: string;
	notes?: string;
}

export interface PlanDay {
	id: string;
	name: string;
	exercises: PlanExercise[];
}

export interface WorkoutPlan {
	id: string;
	name: string;
	days: PlanDay[];
	isActive: boolean;
	updatedAt: number;
	deletedAt?: number;
	ownerId: string;
}

export interface LoggedSet {
	weight: number;
	reps: number;
	isWarmup: boolean;
	rir?: number;
}

export interface SessionEntry {
	exerciseId: string;
	sets: LoggedSet[];
}

export interface WorkoutSession {
	id: string;
	date: number;
	planId?: string;
	dayName?: string;
	entries: SessionEntry[];
	durationMin?: number;
	note?: string;
	updatedAt: number;
	deletedAt?: number;
	ownerId: string;
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
	'Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps',
	'Beine', 'Hamstrings', 'Waden', 'Bauch', 'Unterer Rücken'
];

export const EQUIPMENT_LIST: Equipment[] = [
	'Kabel', 'Smith', 'Maschine', 'Langhantel', 'Kurzhantel', 'Körpergewicht'
];

export const UNITS: Unit[] = ['kg', 'Platte', 'Block'];
