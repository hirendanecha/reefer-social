const url = 'https://api.reefer.social';
const webUrl = 'https://reefer.social/';
const tubeUrl = 'https://tube.reefer.social/'
// const url = 'http://localhost:8080';
// const webUrl = 'http://localhost:4200/';

export const environment = {
  production: false,
  hmr: false,
  serverUrl: `${url}/api/v1/`,
  socketUrl: `${url}/`,
  webUrl: webUrl,
  tubeUrl: tubeUrl,
  domain: '.reefer.social'
};