import { config } from 'dotenv'
import { Telegraf, Telegram } from 'telegraf'
import downloadVideo from './download'
import fs from 'fs'
import { exec } from 'child_process'
import Path from 'path'

config()

const TOKEN = process.env.BOT_API_TOKEN
const URL = process.env.API_URL

const dir = 'public'
const subDir = 'public/uploads/'

var listFilePath = subDir + Date.now() + '-' + 'list.txt'
var outputFilePath = 'public/' + Date.now() + 'output.mp4'
var countVideos = 1

const listFiles = () => {
  let list = ''

  return new Promise((resolve, reject) => {
    
    try {

      fs.readdir(subDir, (err, files) => {

        files.forEach(file => {
  
          if (file.includes('converted-')) list += `file ${file}\n`
          
        })
        
        resolve(list)

      })

    } catch (err) {

      reject(1)

    }

  })

}

const getVideos = () => {
  
  
  return new Promise(async (resolve, reject) => {

    let files = await listFiles()
      .catch(() => console.log('Error na contagem de arquivos!'))
    
    if (files === '') return reject(1)

    let writerStream = fs.createWriteStream(listFilePath)

      writerStream.write(files)
    
      writerStream.end(() => {
  
        return resolve(0)
  
      })
  
      writerStream.on('error', () => {
        
        return reject(1)
  
      })

  })

}

// Cria o diretório de uploads caso não exista
if (!fs.existsSync(dir)) {

  fs.mkdirSync(dir)

  fs.mkdirSync(subDir)

}

// Cria uma instância do bot
const bot = new Telegraf(TOKEN)
const maneger = new Telegram(TOKEN)

bot.start(ctx => ctx.reply('Pronto para uso!'))

// Faz o download dos videos enviados no chat do bot
bot.on('video', async ctx => {

  const { mime_type, file_name } = ctx.update.message.video

  if (mime_type !== 'video/mp4') ctx.reply('Formato inválido!')

  const fileId = await maneger.getFile(ctx.update.message.video.file_id)

  const filePath = fileId.file_path

  await downloadVideo(`${URL}${TOKEN}/${filePath}`, file_name)
    .then(() => {
      // console.log(res)
      ctx.reply(`${countVideos}° video baixado e convertido com sucesso!`)
      
      countVideos += 1      

    })
    .catch(err => ctx.reply(`Erro no download do ${countVideos}° video!`))

})

// Merger videos
bot.command('merge', async ctx => {

  await ctx.reply('Lendo arquivos!')

  await getVideos()
    .then(async () => {

    await ctx.reply('Iniciando merge!')

      try {

        exec(`ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputFilePath}`, async (err, stdout, stderr) => {

          if (err) {

            ctx.reply('Erro no merge!')

            fs.unlinkSync(listFilePath)

            // fs.readdir(subDir, (err, files) => {

            //   if (err) throw err
          
            //   files.forEach(file => {
          
            //     fs.unlink(Path.join(subDir, file), err => {
          
            //       if (err) {
          
            //         ctx.reply('Erro na deleção dos videos!')
          
            //         throw err
          
            //       }
          
            //     })
          
            //   })
          
            // })

            throw err

          }

          await ctx.reply('Merge com sucesso!')
          await ctx.reply('Enviando video. Aguarde...')

          maneger.sendVideo(ctx.update.message.chat.id, {
            source: Path.resolve(__dirname, '..', `${outputFilePath}`)
          }, {
            caption: 'Finalizado!'
          })
            .then(() => {

              // ctx.reply('Finalizado!')

              fs.unlinkSync(listFilePath)
              fs.unlinkSync(outputFilePath)

              // list = ''

            })
            .catch(err => ctx.reply('Erro no envio!'))

        })

      } catch (err) {

        ctx.reply('Erro no merge!')
        console.log(err)

      }

    })
    .catch(err => ctx.reply('Lista vazia!'))

})

// Apaga todos os videos
bot.command('clear', ctx => {

  // list = ''
  countVideos = 1

  fs.readdir(subDir, (err, files) => {

    if (err) throw err

    files.forEach(file => {

      fs.unlink(Path.join(subDir, file), err => {

        if (err) {

          ctx.reply('Erro na deleção dos videos!')

          throw err

        }

      })

    })

  })

})

bot.command('teste', ctx => {
  // console.log(list)

  fs.readdir(subDir, (error, files) => {

    files.forEach(file => console.log(file))

  })

})

bot.catch((err, ctx) => {
  ctx.reply('Ocorreu algum error!')
  console.log(err)

})

bot.launch()