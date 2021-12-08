export default class Task {
	static run = (callback: (stopTask: () => void) => void, milliseconds?: number) => {
		const t_id = setInterval(() => {
			callback(() => clearInterval(t_id));
		}, milliseconds || 1000);
	}
}