export const crypto = globalThis.crypto;

export function formatDate(ts: number): string {
	return new Date(ts).toLocaleDateString('de-AT', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
}

export function formatDateShort(ts: number): string {
	return new Date(ts).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
}

export function formatDateTime(ts: number): string {
	return new Date(ts).toLocaleString('de-AT', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}
