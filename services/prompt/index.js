import inquirer from 'inquirer';
import { months } from '../../utils/constants.js'

export function question() {
 return inquirer
 .prompt([
    {
    name: 'driveId',
    message: 'Enter the drive folder ID (psstt* The folder that have list of stations)',
    type: 'input',
    default: '1UjoNSHg7pPewTGTPuoMkfyOAuPMGje0B',
    },
    {
    name: 'spreadsheetId',
    message: 'Enter the spreadsheet ID',
    type: 'input',
    default: '1M1vrshiJyn4d28qSP-oWyC5zTEPaieSYVZ-v_w1era8',
    },
   {
     name: 'month',
     message: 'Which month?',
     type: 'list',
     choices: months,
     validate: (answer) =>{
        if(answer<0 || answer> 11){
            return 'Wrong Month!'
        }
    }
   },
   {
    name: 'startStation',
    message: 'Start with which station?',
    type: 'input',
    },
    {
    name: 'endStation',
    message: 'End with which station?',
    type: 'input',
    },
 ])
}
