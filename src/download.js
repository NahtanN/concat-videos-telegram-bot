const fs = require('fs') 
const Path = require('path') 
const axios = require('axios') 
const { exec } = require('child_process') 

const downloadVideo = async (url, fileName) => {

  const name = `${Date.now()}-${fileName}`

  let video = `public/uploads/${name}`
  let convertedVideo = `converted-${name}`

  // Faz o download do video
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })
    .then(res => res)
    .catch(err => console.log(err))

  // Retorne caso a API do Telegram não responda
  if (!response) return

  return new Promise(async (resolve, reject) => {

    // Cria um arquivo de escrita
    const writer = fs.createWriteStream(`${video}`)

    // Escreve os dados do video no arquivo
    await response.data.pipe(writer)
    
    writer.on('finish', () => {

      writer.close()

      // Após finalizar e fechar o arquivo, faz a conversão para o formato
      // Escala = 1920:1080
      // fps = 30
      // Audio = stereo
      // Essa etapa é extremamente importante pois, se os videos não estiverem no mesmo formato, 
      // quando forem concatenados ocorrera erros na sincronização do audio
      exec(`ffmpeg -i ${video} -vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1,setsar=1,fps=30,format=yuv420p -ar 48000 -ac 2 public/uploads/${convertedVideo}`,
        (err, stdout, stderr) => {

          // Caso ocorra algum erro na conversão, retorne o erro
          if (err) {
            console.log(err)

            // Deleta o video não convertido
            fs.unlink(`public/uploads/${name}`, err => console.log(err))

            return reject(1)
          }

          // Após a conversão, apague o video original
          fs.unlinkSync(video)

          // Finalize a Promise
          return resolve(0)

        }
      )

    })

    // Caso ocorra algum erro, rejeite a Promise
    writer.on('error', () => {

      return reject(1)      

    })

  })

}

module.exports = downloadVideo