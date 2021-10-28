export default interface IInterceptor {
  type: string;
  path: string;
  http: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>;
  success: (response: { data: any, [key: string]: any }) => void;
  fail: (error: Response) => void,
  done: () => void
}
