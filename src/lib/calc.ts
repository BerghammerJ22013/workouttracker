import type { LoggedSet, WorkoutSession, SessionEntry } from './types';

export function epley1RM(weight: number, reps: number): number {
	if (reps === 1) return weight;
	return weight * (1 + reps / 30);
}

export function setVolume(set: LoggedSet): number {
	return set.weight * set.reps;
}

export function workingSets(sets: LoggedSet[]): LoggedSet[] {
	return sets.filter((s) => !s.isWarmup);
}

export function entryVolume(entry: SessionEntry): number {
	return workingSets(entry.sets).reduce((sum, s) => sum + setVolume(s), 0);
}

export function sessionVolume(session: WorkoutSession): number {
	return session.entries.reduce((sum, e) => sum + entryVolume(e), 0);
}

export function topSet(sets: LoggedSet[]): LoggedSet | undefined {
	return sets.reduce<LoggedSet | undefined>((best, s) => {
		const rm = epley1RM(s.weight, s.reps);
		if (!best || rm > epley1RM(best.weight, best.reps)) return s;
		return best;
	}, undefined);
}

export function best1RM(sets: LoggedSet[]): number {
	const t = topSet(sets);
	return t ? epley1RM(t.weight, t.reps) : 0;
}

export function progressPct(prev: number, curr: number): number | null {
	if (prev === 0) return null;
	return ((curr - prev) / prev) * 100;
}
