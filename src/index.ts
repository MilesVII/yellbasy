import { download, lerp, track } from "./track"

const [b0, b1] = document.querySelectorAll("button");
b0?.addEventListener("click", play);
b1?.addEventListener("click", dl);

const dynamics = [
	[0, .07, .1],
	[.08, 1, .0002],
	[1, .2, .004],
	[.2, 0, 1],
	[.0, 0, 1],
] as [number, number, number][];

function build() {
	const length = 3;

	const tau = Math.PI * 2;
	const noise = (a: number) =>
		track(length, () => (Math.random() - .5) * a);
	const sineRaw = (x: number, f: number, o: number = 0, a: number = 1) =>
		Math.sin(x * tau * f + o) * a
	const sine = (f: number, o: number = 0, a: number = 1) =>
		track(length, at => sineRaw(at, f, o, a));
	const saw = (f: number, a: number = 1) =>
		track(length, at => ((at * f) % 1) * a).remap(-1, 1);

	const bf = 100;

	const railroad = track(length).add(
		noise(.001),
		track(length)
			.add(
				sine(bf * 1, 0, 2),
				sine(bf * 3, 1, .5),
				sine(bf * 8, 4, .25),
				sine(bf * 24, 8, .064)
			)
			.mul(
				track(length).derpFill(dynamics)
			)
	).normalize();

	return railroad.source();
}

function dl() {
	download(build())
}

function play() {
	build().start();
}
