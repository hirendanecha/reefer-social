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
  domain: '.reefer.social',
  siteKey:'0x4AAAAAAAUxBSzkmShg4ay7',
  secretKey:'0x4AAAAAAAUxBUyv1TfJM6t1rvaqtQi2hUA',
  EncryptIV: 8625401029409790,
  EncryptKey: 8625401029409790,
  qrLink: `${webUrl}settings/edit-profile/`,
};
