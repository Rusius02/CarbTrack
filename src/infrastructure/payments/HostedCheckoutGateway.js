export class HostedCheckoutGateway {
  constructor(urls = {}) {
    this.urls = urls;
  }

  getCheckoutUrl(plan) {
    const url = this.urls[plan];
    if (typeof url !== "string" || !/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//.test(url)) {
      return null;
    }
    return url;
  }
}
