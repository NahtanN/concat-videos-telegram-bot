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
const subDir = 'public/uploads'


var listFilePath = dir + Date.now() + '-' + 'list.txt'
var outputFilePath = dir + Date.now() + 'output.mp4'
var countVideos = 1
var list = ''

const convertVideos = async () => {

  const writerStream = fs.createWriteStream(listFilePath)

  return new Promise((resolve, reject) => {

    try {

      setTimeout(() => {

        fs.readdir(subDir, (err, files) => {

          files.forEach(file => {
  
            let video = `${subDir}/${file}`
            let convertedVideo = `converted-${file}`
  
            // 1920:1080
            exec(`ffmpeg -i ${video} -vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1,setsar=1,fps=30,format=yuv420p -ar 48000 -ac 2 ${subDir}/${convertedVideo}`,
              (err, stdout, stderr) => {
  
                if (err) {
                  console.log(err)
  
                  fs.unlink(`${subDir}/${file}`, err => console.log(err))
  
                  throw err
                }
  
                fs.unlinkSync(video)
  
                // ctx.reply('Video baixado e convertido!')
  
              }
            )

            list += `file ${convertedVideo}`
            list += '\n'
  
          })
          
          if (list === '') reject(1)

          writerStream.write(list)

          writerStream.end(() => {
            
            resolve(0)

          })
            
        })

      }, 1000 * countVideos)

    } catch (err) {

      reject(1)

    }

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
    .then(res => {

      ctx.reply(`${countVideos}° video baixado com sucesso!`)
      
      countVideos += 1

    })
    .catch(err => ctx.reply(`Erro no download do ${countVideos}° video!`))

})

// Merger videos
bot.command('merge', async ctx => {

  await ctx.reply('Iniciando conversão!')

  await convertVideos()
    .then(async () => {

    await ctx.reply('Iniciando merge!')

      try {

        setTimeout(() => {

          exec(`ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputFilePath}`, async (err, stdout, stderr) => {

            if (err) {
  
              ctx.reply('Erro no merge!')
  
              fs.unlinkSync(listFilePath)
  
              throw err
  
            }
  
            await ctx.reply('Merge com sucesso!')
            await ctx.reply('Enviando video. Aguarde...')
  
            maneger.sendVideo(ctx.update.message.chat.id, {
              source: Path.resolve(__dirname, '..', `${outputFilePath}`)
            })
              .then(() => {
  
                ctx.reply('Finalizado!')
  
                fs.unlinkSync(listFilePath)
                fs.unlinkSync(outputFilePath)
  
                list = ''
  
              })
              .catch(err => ctx.reply('Erro no envio!'))
  
          })

        }, 1000 * countVideos)

      } catch (err) {

        ctx.reply('Erro no merge!')
        console.log(err)

      }

    })
    .catch(err => console.log(err))

})

// Apaga todos os videos
bot.command('clear', ctx => {

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
  fs.readdir(subDir, (error, files) => {

    files.forEach(file => console.log(file))

  })

})

bot.catch((err, ctx) => {
  ctx.reply('Ocorreu algum error!')
  console.log(err)

})

bot.launch()