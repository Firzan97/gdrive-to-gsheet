import fs from "fs/promises";
import path from "path";
import process from "process";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { authorize, appendData } from "../gsheet/sheet.js";
import moment from "moment";
import { dataAssignment, checkFileType, logging } from "../../utils/index.js";
import * as dotenv from "dotenv";
import { Console } from "console";
dotenv.config();

export class GDrive {
  // If modifying these scopes, delete token.json.
  static SCOPES = ["https://www.googleapis.com/auth/drive.metadata.readonly"];
  // The file token.json stores the user's access and refresh tokens, and is
  // created automatically when the authorization flow completes for the first
  // time.

  static basePath = `${process.cwd()}/services/gdrive/`;
  static TOKEN_PATH = path.join(this.basePath, "token.json");
  static CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
  /**
   * Reads previously authorized credentials from the save file.
   *
   * @return {Promise<OAuth2Client|null>}
   */
  static async loadSavedCredentialsIfExist() {
    try {
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
  static async saveCredentials(client) {
    const content = await fs.readFile(this.CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(this.TOKEN_PATH, payload);
  }

  /**
   * Load or request or authorization to call APIs.
   *
   */
  static async authorizeGDrive() {
    let client = await this.loadSavedCredentialsIfExist();
    if (client) {
      return client;
    }
    client = await authenticate({
      scopes: this.SCOPES,
      keyfilePath: this.CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await this.saveCredentials(client);
    }
    return client;
  }

  static async getStations(drive, driveId) {
    // Get list of stations
    const res = await drive.files.list({
      pageSize: 1000,
      fields: "nextPageToken, files(id, name)",
      q: `'${driveId}' in parents`,
      orderBy: "name",
    });
    let stations = res.data.files;

    return stations;
  }

  static async getTypes(stationId, drive) {
    const res = await drive.files.list({
      pageSize: 1000,
      fields: "nextPageToken, files(id, name)",
      q: `'${stationId}' in parents`,
      orderBy: "name",
    });
    const types = res.data.files;

    return types;
  }

  static async getDates(typeId, drive) {
    const res = await drive.files.list({
      pageSize: 1000,
      fields: "nextPageToken, files(id, name)",
      q: `'${typeId}' in parents`,
      orderBy: "name desc",
    });
    const dates = res.data.files;

    return dates;
  }

  static async getTrips(dateId, drive) {
    const a = await drive.files.list({
      pageSize: 1000,
      fields: "nextPageToken, files(id, name)",
      q: `'${dateId}' in parents`,
      orderBy: "name desc",
    });
    const trips = a.data.files;

    return trips;
  }

  static async getFiles(tripId, drive) {
    const a = await drive.files.list({
      pageSize: 1000,
      fields:
        "nextPageToken, files(id, name, size, mimeType, createdTime, owners, webViewLink)",
      q: `'${tripId}' in parents`,
      orderBy: "name desc",
    });
    const files = a.data.files;

    return files;
  }

  /**
   * Lists the names and IDs of up to 10 files.
   * @param {OAuth2Client} authClient An authorized OAuth2 client.
   */
  static async listFiles(
    authClient,
    { driveId, spreadsheetId, month, startStation, endStation, year = 2022 }
  ) {
    try {
      console.log("=======================");
      console.log("Getting authenticate the GSheet");
      console.log("=======================");

      const auth = await authorize();
      const drive = google.drive({ version: "v3", auth: authClient });
      let added = 0,
        count = 0;
      let batchData = [];
      const batch = process.env.BATCH;

      //Get Stations
      let stations = await this.getStations(drive, driveId);
      // If there is no station
      if (stations.length === 0) {
        console.log("No files found.");
        return;
      }

      // If want to start from which station to which station
      // Can comment if want to do it from start to end
      const start = stations.findIndex((s) => s.name === startStation);
      const lastIndex = stations.findIndex((s) => s.name === endStation);

      stations = stations.slice(start, lastIndex + 1);

      // Looping the stations
      for (const [stationIndex, station] of stations.entries()) {
        // Get the type of trips
        const types = await this.getTypes(station.id, drive);

        //Looping trip type
        for (const type of types) {
          // Execute only for Departure and Arrival
          if (type.name == "Departure" || type.name == "Arrival") {
            //Get all the dates
            const dates = await this.getDates(type.id, drive);

            // Looping the dates
            for (const [dateIndex, date] of dates.entries()) {
              const fileDate = moment(date.name, "YYYY-MM-DD");
      
              //Set the range for the trip date
              //Remove if want all the dates
              const start = moment().year(year).month(month).startOf("month");
              const end = moment().year(year).month(month).endOf("month");

              //if the date not matching the one we enter in terminal, then ignore and proceed to next loop
              if (fileDate < start || fileDate > end) continue;

              //Get all trips
              const trips = await this.getTrips(date.id, drive);

              // Looping the trips
              for (const [tripIndex, trip] of trips.entries()) {
                //Get all files
                const files = await this.getFiles(trip.id, drive);

                // Looping the files
                for (let [index, file] of files.entries()) {
                  let fileName = file.name.toLocaleLowerCase();

                  //Trip Files type
                  const tripFileTypes = { ...checkFileType(fileName) };

                  //Data to be saved
                  const data = dataAssignment(
                    station,
                    type,
                    date,
                    trip,
                    file,
                    tripFileTypes
                  );
                  count++;

                  //Logging
                  console.log(count);

                  //Double validate, if the date matching, then add it,else ignore
                  if (fileDate >= start && fileDate <= end) {
                    //Convert object to array
                    var newData = Object.keys(data).map((key) => data[key]);

                    //Accumulate data until reaching batch value
                    batchData.push(newData);

                    //If the batch reached the batch length
                    if (batchData.length === parseInt(batch)) {
                      await appendData(auth, batchData, spreadsheetId);
                      added = added + 100;
                      batchData = [];

                      //Logging
                      logging(
                        station.name,
                        type.name,
                        date.name,
                        trip.name,
                        added
                      );
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (batchData.length > 0) {
        console.log(
          "Last batch data not reaching total batch ${batch} will be append until the loop is done!"
        );

        await appendData(auth, batchData, spreadsheetId);
        added = added + batchData.length;
        batchData = [];

        console.log("Done!!!");
      } else {
        console.log("Done!!!");
      }
    } catch (e) {
      console.log(e);
    }
  }
}
