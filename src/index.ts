import { track } from "./track"

document.querySelector("button")?.addEventListener("click", play);

function play() {
	const tau = Math.PI * 2;
	const noise = (a: number) =>
		track(() => (Math.random() - .5) * a);
	const sine = (f: number, o: number = 0, a: number = 1) =>
		track(at => Math.sin(at * tau * f + o) * a);
	const saw = (f: number, a: number = 1) =>
		track(at => ((at * f) % 1) * a).remap(-1, 1);

	const railroad = track().add(
		noise(.005),
		saw(80, .2)
			.mul(sine(160))
			.mul(sine(200, .5))
			.normalize()
		// sine()
	);
	railroad.source().start();
}
