import readline from 'readline';

export class Spinner {
    private static spinnerFrames = ['|', '/', '-', '\\'];
    private spinnerInterval: NodeJS.Timeout | null = null;
    private frameIndex: number = 0;

    /**
     * Starts the spinner with a given message.
     * @param message The message to display alongside the spinner.
     */
    public start(message: string): void {
        if (this.spinnerInterval) {
            console.warn("A spinner is already running. Call 'stop' before starting a new one.");
            return;
        }

        this.spinnerInterval = setInterval(() => {
            // Clear the previous line
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);

            // Display the spinner and message
            const frame = Spinner.spinnerFrames[this.frameIndex];
            process.stdout.write(`${frame} ${message}`);

            this.frameIndex = (this.frameIndex + 1) % Spinner.spinnerFrames.length;
        }, 100);
    }

    /**
     * Stops the spinner and displays a final message.
     * @param message The message to display after stopping the spinner.
     */
    public stop(message: string): void {
        if (this.spinnerInterval) {
            clearInterval(this.spinnerInterval);
            this.spinnerInterval = null;

            // Clear the spinner and display the final message
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            console.info(`${message}... done`);
        } else {
            console.warn('No spinner is running to stop.');
        }
    }
}

export default Spinner;
