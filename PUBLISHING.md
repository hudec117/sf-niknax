# Publishing

## General
- Ensure the version in `public/manifest.json`, `package.json` and `src/components/PopoutCardFooter.vue` are updated.

## Chrome
1. Delete the contents of the `dist` folder. (if it has any)
2. Build a production version by running `npm run build-prod`
3. Side load the `dist` folder into Chrome and test it works correctly.
4. Zip up all the files inside the `dist` folder and name it `sf-niknax-VERSION-chrome.zip`
5. Upload new version to Chrome Developer Dashboard