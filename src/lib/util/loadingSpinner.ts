import readline from 'readline';

const spinnerFrames = ['|', '/', '-', '\\'];

let spinnerInterval: NodeJS.Timeout | null = null;
let frameIndex = 0;

export function showLoading(message: string): void {
    if (spinnerInterval) {
        console.warn("A spinner is already running. Call 'stopLoading' before starting a new one.");
        return;
    }

    spinnerInterval = setInterval(() => {
        // Clear the previous line
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        // Display the spinner and message
        const frame = spinnerFrames[frameIndex];
        process.stdout.write(`${frame} ${message}`);

        frameIndex = (frameIndex + 1) % spinnerFrames.length;
    }, 100);
}

export function stopLoading(message: string): void {
    if (spinnerInterval) {
        clearInterval(spinnerInterval);
        spinnerInterval = null;

        // Clear the spinner and display the final message
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.info(`${message}... done`);
    } else {
        console.warn('No spinner is running to stop.');
    }
}
