type QueueFunction = {
	(): unknown | Promise<unknown>;
};

/**
 * A priority queue that runs a limited number of jobs at a time.
 */
export default class Queue<T extends any = unknown> {
	/** The number of jobs to run at a time */
	private limit: number;
	/** The queue of low-priority jobs */
	private qlow: Map<string, QueueFunction> = new Map();
	/** The queue of high-priority jobs */
	private qhigh: Map<string, QueueFunction> = new Map();
	/** The list of currently running jobs */
	private running: Map<string, Promise<T>> = new Map();

	constructor(limit: number = 1) {
		this.limit = limit;
	}

	/** The total number of jobs in the queue */
	get total(): number {
		return this.qlow.size + this.qhigh.size;
	}

	/** Add a job to queue */
	async add(key: string, fn: QueueFunction, highPriority: boolean = false): Promise<T> {
		if (this.running.has(key)) {
			return this.running.get(key) as Promise<T>;
		}

		if (this.qlow.has(key) && highPriority) {
			// Promote from low to high-priority queue
			this.qlow.delete(key);
		} else if (this.qhigh.has(key)) {
			// Skip if already in queue
			return;
		}

		(highPriority ? this.qhigh : this.qlow).set(key, fn);

		if (this.total <= 1) {
			this.run();
		}
	}

	has(key: string): boolean {
		return this.running.has(key) || this.qlow.has(key) || this.qhigh.has(key);
	}

	clear(): void {
		this.qlow.clear();
		this.qhigh.clear();
	}

	/** Run the next available job */
	protected async run(): Promise<void> {
		if (!this.total) return;
		if (this.running.size >= this.limit) return;

		const next = this.next();
		if (next) {
			this.running.add(next.key);
			this.run();
			await next.fn();
			this.running.delete(next.key);
			this.run();
		}
	}

	/** Get the next available job */
	protected next(): { key: string; fn: QueueFunction } | null {
		return [this.qhigh, this.qlow].reduce((acc, queue) => {
			if (!acc) {
				const [key, fn] = queue.entries().next().value || [];
				queue.delete(key);
				return key ? { key, fn } : null;
			}
			return acc;
		}, null as { key: string; fn: QueueFunction } | null);
	}
}
