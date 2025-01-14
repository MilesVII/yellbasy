import { download, track } from "./track"

document.querySelector("button")?.addEventListener("click", play);

const dynamics = [
	[0, .1, .2],
	[.1, 1, .02],
	[1, .2, .04],
	[.2, 0, 4]
] as [number, number, number][];

function play() {
	const length = 4;

	const tau = Math.PI * 2;
	const noise = (a: number) =>
		track(length, () => (Math.random() - .5) * a);
	const sine = (f: number, o: number = 0, a: number = 1) =>
		track(length, at => Math.sin(at * tau * f + o) * a);
	const saw = (f: number, a: number = 1) =>
		track(length, at => ((at * f) % 1) * a).remap(-1, 1);

	const railroad = track(length).add(
		noise(.005),
		// saw(80, .2)
		// 	.mul(sine(160))
		// 	.mul(sine(200, .5))
		// 	.normalize(),
		track(length)
			.derpFill(dynamics)
			.mul(.9)
			.mul(sine(470)),
		track(length)
			.derpFill(dynamics)
			.mul(.6)
			.mul(sine(490)),
		track(length)
			.derpFill(dynamics)
			.mul(.3)
			.mul(sine(420)),
		// sine(240),
		// sine(240, .25)
	);
	// download(railroad.source())
	railroad.source().start();
	
}
