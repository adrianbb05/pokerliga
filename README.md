# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## JSONBin on Vercel

The browser calls `/api/data`; the Vercel function in `api/data.js` contacts JSONBin. Credentials are read only by the server and are never included in the browser bundle or API responses.

In Vercel → Project → Settings → Environment Variables, add:

| Name | Value | Type |
| --- | --- | --- |
| `APP_PASSWORD` | A long password shared with your league | Secret |
| `JSONBIN_MASTER_KEY` | Your JSONBin master key | Secret |
| `BIN_MATCHES` | ID of the results bin | Config |
| `BIN_PLAYERS` | ID of the players bin | Config |
| `BIN_SETTINGS` | ID of the settings bin | Config |

Select Production and/or Preview as appropriate, then deploy this code and redeploy after changing variables. Use bin IDs, not URLs. Remove the old `REACT_APP_JSONBIN_MASTER_KEY` and `REACT_APP_BIN_*` variables; `VITE_*` variables are also unused. If the key appeared in a deployed browser bundle or Git history, rotate it in JSONBin.

For JSONBin access keys, the server also supports private `JSONBIN_ACCESS_KEY`, or separate `JSONBIN_READ_KEY` and `JSONBIN_WRITE_KEY`, instead of the master key. Select Secret for these values and remove any old `REACT_APP_JSONBIN_*` key variables.

Initialize new bins with `{ "matches": [] }`, `{ "players": [{ "id": "p-1", "name": "Ana" }] }`, and `{ "currentWeek": 1, "pointsSystem": { "1": 10, "2": 7, "3": 5, "4": 3, "5": 2, "6": 1 } }`, respectively. Existing bare arrays for matches and players are also supported. Preserve existing bins that already contain your league data.

Missing configuration and JSONBin failures appear in the app. Failed loads do not substitute demo data, and failed saves do not change the displayed results or cache. Protected league data is not saved to browser storage; older caches are removed when the app starts or a session expires.

For local development with JSONBin, put the private variables in ignored `.env.local` and run `vercel dev` (requires the Vercel CLI). Plain `npm start` does not serve Vercel functions. For a local demo with `npm start`, set `REACT_APP_USE_LOCAL_STORAGE=true` in `.env.local`; leave this variable unset on Vercel.

The app requires the shared `APP_PASSWORD` before loading league data. Both reads and writes are protected on the server. Missing `APP_PASSWORD` blocks access. Sessions last 12 hours and use a signed HttpOnly, SameSite=Strict cookie with Secure enabled on Vercel. Changing the password and redeploying invalidates existing sessions. Use **Cerrar sesión** to sign out of the current browser. The password is never included in the browser build, cookies or browser storage.

Local storage mode is available only outside production and starts with empty data; production always requires server authentication.

Validate with `CI=true npm test -- --watchAll=false --runInBand`, `npm run test:api`, and `npm run build`.

## Development commands

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
