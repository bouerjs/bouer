export default class Task {
    static run: (callback: (stopTask: () => void) => void, milliseconds?: number | undefined) => void;
}
