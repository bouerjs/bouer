import dynamic from '../../definitions/types/Dynamic';
import { DOM, forEach, isString } from './Utils';

export default class UriHandler {
  readonly _IRT_ = true;
  url: string;

  constructor(url?: string) {
    this.url = url || DOM.location.href;
  }

  params(urlPattern?: string) {
    const mParams: dynamic<string> = {};

    const buildQueryParams = () => {
      // Building from query string
      const queryStr = this.url.split('?')[1];
      if (!queryStr) return this;
      const keys = queryStr.split('&');
      forEach(keys, key => {
        const pair = key.split('=');
        mParams[pair[0]] = (pair[1] || '').split('#')[0];
      });
    };

    if (urlPattern && isString(urlPattern)) {
      const urlWithQueryParamsIgnored = this.url.split('?')[0];
      const urlPartsReversed = urlWithQueryParamsIgnored.split('/').reverse();

      if (urlPartsReversed[0] === '') urlPartsReversed.shift();

      const urlPatternReversed = urlPattern.split('/').reverse();

      forEach(urlPatternReversed, (value, index) => {
        const valueExec = RegExp('{([\\S\\s]*?)}', 'ig').exec(value);

        if (Array.isArray(valueExec))
          mParams[valueExec[1]] = urlPartsReversed[index];
      });
    }

    buildQueryParams();
    return mParams;
  }

  add(params: dynamic) {
    const mParams: string[] = [];
    forEach(Object.keys(params), key => {
      mParams.push(key + '=' + params[key]);
    });

    const joined = mParams.join('&');
    return (this.url.includes('?')) ? '&' + joined : '?' + joined;
  }

  remove(param: { key: string, type?: string }) {
    return param;
  }
}