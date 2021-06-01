import fs from 'fs'
import Path from 'path'
import axios from 'axios'
import { exec } from 'child_process'

const downloadVideo = async (url: string, fileName = 'placeholder') => {

  const path = Path.resolve(__dirname, '..', 'public', 'uploads')
  const name = `${Date.now()}-${fileName}`

  let video = `public/uploads/${name}`
  let convertedVideo = `converted-${name}`

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })
    .then(res => res)
    .catch(err => console.log(err))

  if (!response) return


  return new Promise(async (resolve, reject) => {

    const writer = fs.createWriteStream(`${path}/${name}`)

    await response.data.pipe(writer)

    writer.on('finish', () => {

      writer.close()

      // 1920:1080
      exec(`ffmpeg -i ${video} -vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1,setsar=1,fps=30,format=yuv420p -ar 48000 -ac 2 public/uploads/${convertedVideo}`,
        (err, stdout, stderr) => {

          if (err) {
            console.log(err)

            fs.unlink(`public/uploads/${name}`, err => console.log(err))

            throw err
          }

          fs.unlinkSync(video)

          return resolve(0)

        }
      )

    })

    writer.on('error', () => {

      reject(1)

      throw new Error('Erro no download!')

    })

  })

}

export default downloadVideo