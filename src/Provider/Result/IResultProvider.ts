export interface IResultProvider {
    getResult(): Promise<string>;
}