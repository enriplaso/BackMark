import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import sinon, { SinonFakeTimers, SinonStub } from 'sinon';
import readline from 'readline';
import { showLoading, stopLoading } from '../../src/lib/util/loadingSpinner.js';

describe('Spinner Functions', () => {
    let clearLineStub: SinonStub;
    let cursorToStub: SinonStub;
    let writeStub: SinonStub;
    let clock: SinonFakeTimers;

    beforeEach(() => {
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
            showLoading(message);

            // Simulate spinner running for 4 frames
            for (let i = 0; i < 4; i++) {
                clock.tick(100); // Advance the timer by 100ms
                expect(clearLineStub.calledWith(process.stdout, 0)).to.be.true;
                expect(cursorToStub.calledWith(process.stdout, 0)).to.be.true;

                const frame = ['|', '/', '-', '\\'][i % 4];
                expect(writeStub.calledWith(`${frame} ${message}`)).to.be.true;
            }

            // Cleanup
            stopLoading('Done');
        });

        it('should not allow starting a new spinner if one is already running', () => {
            const consoleWarnStub = sinon.stub(console, 'warn');

            showLoading('Loading');
            showLoading('Another Loading');

            expect(consoleWarnStub.calledOnceWith("A spinner is already running. Call 'stopLoading' before starting a new one.")).to.be
                .true;

            // Cleanup
            stopLoading('Done');
        });
    });

    describe('stopLoading', () => {
        it('should stop the spinner and display the final message', () => {
            const consoleInfoStub = sinon.stub(console, 'info');

            const finalMessage = 'Final Message';

            showLoading('Loading');
            stopLoading(finalMessage);

            expect(clearLineStub.calledWith(process.stdout, 0)).to.be.true;
            expect(cursorToStub.calledWith(process.stdout, 0)).to.be.true;
            expect(consoleInfoStub.calledOnceWith(`${finalMessage}... done`)).to.be.true;
        });

        it('should log a warning if no spinner is running', () => {
            const consoleWarnStub = sinon.stub(console, 'warn');
            stopLoading('Done');
            expect(consoleWarnStub.calledOnceWith('No spinner is running to stop.')).to.be.true;
        });
    });
});
