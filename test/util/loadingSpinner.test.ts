import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import sinon, { SinonFakeTimers, SinonStub } from 'sinon';
import readline from 'readline';
import { Spinner } from '../../src/lib/util/loadingSpinner.js';

describe('Spinner Functions', () => {
    let clearLineStub: SinonStub;
    let cursorToStub: SinonStub;
    let writeStub: SinonStub;
    let clock: SinonFakeTimers;
    let spinner: Spinner;

    beforeEach(() => {
        spinner = new Spinner();
        clearLineStub = sinon.stub(readline, 'clearLine');
        cursorToStub = sinon.stub(readline, 'cursorTo');
        writeStub = sinon.stub(process.stdout, 'write');
        clock = sinon.useFakeTimers();
    });

    afterEach(() => {
        sinon.restore();
        clock.restore();
    });

    describe('showLoading', () => {
        it('should display a spinner and update the frame index', () => {
            const message = 'Loading';
            spinner.start(message);

            // Simulate spinner running for 4 frames
            for (let i = 0; i < 4; i++) {
                clock.tick(100); // Advance the timer by 100ms
                expect(clearLineStub.calledWith(process.stdout, 0)).to.be.true;
                expect(cursorToStub.calledWith(process.stdout, 0)).to.be.true;

                const frame = ['|', '/', '-', '\\'][i % 4];
                expect(writeStub.calledWith(`${frame} ${message}`)).to.be.true;
            }

            // Cleanup
            spinner.stop('Done');
        });

        it('should not allow starting a new spinner if one is already running', () => {
            const consoleWarnStub = sinon.stub(console, 'warn');

            spinner.start('Loading');
            spinner.start('Another Loading');

            expect(consoleWarnStub.calledOnceWith("A spinner is already running. Call 'stop' before starting a new one.")).to.be.true;

            // Cleanup
            spinner.stop('Done');
        });
    });

    describe('stopLoading', () => {
        it('should stop the spinner and display the final message', () => {
            const consoleInfoStub = sinon.stub(console, 'info');

            const finalMessage = 'Final Message';

            spinner.start('Loading');
            spinner.stop(finalMessage);

            expect(clearLineStub.calledWith(process.stdout, 0)).to.be.true;
            expect(cursorToStub.calledWith(process.stdout, 0)).to.be.true;
            expect(consoleInfoStub.calledOnceWith(`${finalMessage}... done`)).to.be.true;
        });

        it('should log a warning if no spinner is running', () => {
            const spinner = new Spinner();
            const consoleWarnStub = sinon.stub(console, 'warn');
            spinner.stop('Done');
            expect(consoleWarnStub.calledOnceWith('No spinner is running to stop.')).to.be.true;
        });
    });
});
