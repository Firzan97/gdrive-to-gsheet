import { tripFileTypes } from './constants.js'

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function checkFileType(fileName){
    var fileTypes = {...tripFileTypes}

    if (fileName.indexOf('general declaration') >= 0) {
        fileTypes.isGeneralDeclaration = 1;
      } else if (fileName.indexOf('passenger manifest') >= 0) {
        fileTypes.isPassengerManifest = 1;
      } else if (fileName.indexOf('cargo manifest') >= 0) {
        fileTypes.isCargoManifest = 1;
      } else if (fileName.indexOf('loadsheet') >= 0) {
        fileTypes.isLoadSheet = 1;
      } else if (fileName.indexOf('fuel chit') >= 0) {
        fileTypes.isFuelChit = 1;
      } else if (fileName.indexOf('notoc') >= 0) {
        fileTypes.isNOTOC = 1;
      } else if (fileName.indexOf('loading instruction') >= 0) {
        fileTypes.isLIR = 1;
      } else if (fileName.indexOf('departure release note') >= 0) {
        fileTypes.isDRN = 1;
      } else if (fileName.indexOf('journey maintenance log') >= 0) {
        fileTypes.isJourneyMaintenanceLog = 1;
      }
      return fileTypes
}

export function dataAssignment(station, type, date, trip, file, tripFileTypes){
    //Data to be saved
    const data = {
    'Station Name': station.name,
    'Departure/Arrival': type.name,
    'Folder Date': date.name,
    'Departure/Arrival': type.name,
    'Carrier Code': trip.name.substring(0, 2),
    'Flight Number': trip.name,
    'File Name': file.name,
    'Uploader': file.owners[0].emailAddress,
    'Type': file.mimeType,
    'File Upload Date': file.createdTime,
    'Size': file.size / 1024,
    'URL': file.webViewLink,
    ...tripFileTypes
    }

    return data
}


export function logging(stationName,typeName,dateName,tripName,added){
    //Logging
    console.log('===========================')
    console.log(stationName)
    console.log(typeName)
    console.log(dateName)
    console.log(tripName)   
    console.log('Total added - ' + added)
    console.log('==========================')
}
