# Publishing

## General
- Ensure the version in `manifest.json`, `package.json` and `src/components/PopoutCardFooter.vue` are updated.

## Chrome
1. Build production version by running `npm run build-prod`
2. Side load the `dist` folder into Chrome and test it works correctly.
3. Zip up all the files inside the `dist` folder and name it `sf-niknax-VERSION-chrome.zip`
4. Upload new version to Chrome Developer Dashboard