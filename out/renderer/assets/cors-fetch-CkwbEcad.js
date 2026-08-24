async function corsFetch(url, init) {
  const targetUrl = url.toString();
  {
    return fetch(targetUrl, init);
  }
}
export {
  corsFetch as c
};
