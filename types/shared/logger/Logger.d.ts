export default class Logger {
    private static prefix;
    static log(...content: any[]): void;
    static error(...content: any[]): void;
    static warn(...content: any[]): void;
    static info(...content: any[]): void;
}
