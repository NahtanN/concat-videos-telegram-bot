import fs from 'fs'
import Path from 'path'
import axios from 'axios'

const downloadVideo = async (url: string, fileName = 'placeholder') => {

  const path = Path.resolve(__dirname, '..', 'public', 'uploads')
  const name = `${Date.now()}-${fileName}`

  await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  }).then( async response => {

    const writer = fs.createWriteStream(`${path}/${name}`)

    await response.data.pipe(writer)

    writer.on('finish', () => {
      
      writer.close()

    })

    writer.on('error', () => {
      throw new Error('Erro no download!')
    })

  }).catch(err => console.log(err))

  return name
}

export default downloadVideo