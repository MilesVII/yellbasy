import toWav from "audiobuffer-to-wav";

// export type Track = ReturnType<typeof track>;
export type Feel = (at: number) => number;
export type Buffer = number[];
type Factor = number | Track;

const sampleRate = 69420;

function buffer(length: number, feel?: Feel) {
	const r = Array.from<number>({length: sampleRate * length});
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

function lerpFill(length: number, src: Buffer) {
	const r: Buffer = [];
	for (let i = 0; i < length; ++i) {
		let at = i / length;
		
		if (at >= 1) {
			console.error(`invalid at: ${at}`)
			at = .999
		};
		const lix = src.length - 1;
		const ix = Math.floor(at * src.length) - 1;
		const nix = ix === lix ? 0 : (ix + 1);
		r.push(remap(at, ix / lix, nix / lix, src[ix], src[nix]));
	}
	return track(length, r);
}

type Segment = [from: number, to: number, weight: number];
function derpFill(length: number, segs: Segment[]) {
	const allWeights = segs.reduce((p, [_f, _t, w]) => p + w, 0);
	
	return track(length, (at) => {
		const globalAt = remap(at, 0, length, 0, allWeights);
		let progress = 0;

		for (const [f, t, w] of segs) {
			if (globalAt < progress + w)
				return remap(globalAt, progress, progress + w, f, t);
			progress += w;
		}
		console.log(globalAt, at)
		console.error("derpFill is faulty");
		return 0;
	});
}

export function download(source: AudioBufferSourceNode) {
	const blob = new Blob([toWav(source.buffer!)], { type: 'audio/wav' });
	window.open(URL.createObjectURL(blob));
}

function source(data: Buffer) {
	const audioContext = new window.AudioContext({ sampleRate });
	console.log(data.length, sampleRate)
	const audioBuffer = audioContext.createBuffer(1, data.length, sampleRate);

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
	remap: (low: number, high: number) => Track,
	lerpFill: (src: Buffer) => Track,
	derpFill: (segs: Segment[]) => Track,
	map: (mapper: (v: number, i: number, ri: number) => number) => Track
}

const numb = () => 0;
export function track(length: number, src: Feel | Buffer = numb): Track {
	const buf =
		Array.isArray(src)
			? src
			: buffer(length, src);
	return {
		buffer: buf,
		mul: (factor) => track(length, multiply(buf, factor)),
		add: (...additions) => track(length, combine([buf, ...additions])),
		normalize: () => track(length, normalize(buf)),
		source: () => source(buf),
		remap: (low, high) => track(length, bufferRemap(buf, low, high)),
		lerpFill: (src) => lerpFill(length, src),
		derpFill: (segs: Segment[]) => derpFill(length, segs),
		map: (mapper) => track(length, buf.map((v, i) => mapper(v, i, i / buf.length * length)))
	};
}

export function remap(x: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
	return (x - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
}

export function lerp(k: number, from: number, to: number) {
	return from + (to - from) * k;
}
