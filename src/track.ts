

// export type Track = ReturnType<typeof track>;
export type Feel = (at: number) => number;
export type Buffer = number[];
type Factor = number | Track;

const sampleRate = 69420;
const l = 2;

function buffer(feel?: Feel) {
	const r = Array.from<number>({length: sampleRate * l});
	if (feel)
		r.forEach((_, i) => r[i] = feel(i / sampleRate));
	return r;
}

function multiply(src: Buffer, factor: Factor): Buffer {
	if (typeof factor === "number")
		return src.map((x) => x * factor);
	else
		return src.map((x, i) => x * factor.buffer[i]);
	
}

function combine(tracks: (Buffer | Track)[]){
	// @ts-ignore
	const buffers: Buffer[] = tracks.map(t => t.buffer ?? t)
	const r: Buffer = [];
	for (const i in buffers[0]) {
		r.push(buffers
			.map(t => t[i])
			.reduce((p,c) => p + c, 0)
		)
	}
	return r;
}

function normalize(buffer: Buffer): Buffer {
	const low = Math.min(...buffer);
	const high = Math.max(...buffer);
	return buffer.map(v =>
		remap(v, low, high, -1, 1)
	);
}

function bufferRemap(buffer: Buffer, low: number, high: number): Buffer {
	const l = Math.min(...buffer);
	const h = Math.max(...buffer);
	return buffer.map(s => remap(s, l, h, low, high));
}

function source(data: Buffer) {
	const audioContext = new window.AudioContext({ sampleRate });
	const audioBuffer = audioContext.createBuffer(1, sampleRate * l, sampleRate);

	const channelData = audioBuffer.getChannelData(0);
	for (let i = 0; i < channelData.length; i++)
		channelData[i] = data[i];

	const source = audioContext.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(audioContext.destination);
	source.loop = false;
	return source;
}

export type Track = {
	buffer: Buffer,
	mul: (f: Factor) => Track,
	add: (...additions: Track[]) => Track,
	normalize: () => Track,
	source: () => AudioBufferSourceNode,
	remap: (low: number, high: number) => Track
} 

export function track(src: Feel | Buffer = () => 0): Track {
	const buf = Array.isArray(src) ? src : buffer(src)
	return {
		buffer: buf,
		mul: (factor) => track(multiply(buf, factor)),
		add: (...additions) => track(combine([buf, ...additions])),
		normalize: () => track(normalize(buf)),
		source: () => source(buf),
		remap: (low, high) => track(bufferRemap(buf, low, high))
	};
}

export function remap(x: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
	return (x - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
}
// function lerp(k, from, to) {
// 	return from + (to - from) * k;
// }
