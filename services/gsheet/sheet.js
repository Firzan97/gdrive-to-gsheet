import fs from 'fs/promises';
import path  from 'path';
import process from 'process';
import {authenticate}  from '@google-cloud/local-auth';
import {google} from 'googleapis';

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
 export async function loadSavedCredentialsIfExist() {
  try {
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const basePath = `${process.cwd()}/services/gsheet/`
    const TOKEN_PATH = path.join(basePath, 'token.json');

    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
 export async function saveCredentials(client) {
  const basePath = `${process.cwd()}/services/gsheet/`
  const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
  const TOKEN_PATH = path.join(basePath, 'token.json');

  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
export async function authorize() {
  // If modifying these scopes, delete token.json.
  const basePath = `${process.cwd()}/services/gsheet/`
  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
  const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
  const TOKEN_PATH = path.join(basePath, 'token.json');

  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
 export async function appendData(auth, data, spreadsheetId) {
  const sheets = google.sheets({version: 'v4', auth});
  let values = data
  const resource = {
    values,
  };

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:H',
      resource,
      valueInputOption: 'USER_ENTERED'
     });

    return response;
  } catch (err) {
    // TODO (developer) - Handle exception
    throw err;
  }
}


