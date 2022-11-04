import express from 'express'
import { GDrive } from './services/gdrive/drive.js'
import { question } from './services/prompt/index.js'
import * as dotenv from 'dotenv'
dotenv.config()

const app = express()
const port = process.env.PORT

  app.listen(port, async () => {
    
    console.log(`GDrive-to-GSheet running on port ${port}`)

    question().then(async (answer)=>{
        console.log("=======================")
        console.log('Getting authenticate')
        console.log("=======================")

        const authGDrive = await GDrive.authorizeGDrive()

        console.log("=======================")
        console.log('Running up the script')
        console.log("=======================")

        GDrive.listFiles(authGDrive, answer)
    })
  })