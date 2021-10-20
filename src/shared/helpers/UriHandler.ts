export default class UriHandler {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  params() {
    return {};
  }

  add(param: { key: string, value: string, type?: string }) {
    return param;
  }
  remove(param: { key: string, type?: string }) {
    return param;
  }
}
