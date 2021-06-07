const config = require('dotenv').config()
const { Telegraf, Telegram } = require('telegraf')
const { Composer } = require('micro-bot')
const fs = require('fs')
const { exec } = require('child_process')
const Path = require('path')
const getVideosFiles = require('./utils/getVideoFiles')
const downloadVideo = require('./download')

const TOKEN = process.env.BOT_API_TOKEN
const URL = process.env.API_URL

const dir = 'public/'
const subDir = 'public/uploads/'

var listFilePath = subDir + Date.now() + '-' + 'list.txt'
var outputFilePath = dir + Date.now() + '-' + 'output.mp4'
var countVideos = 1

// Cria o diretório de uploads caso não exista
if (!fs.existsSync(dir)) {

  fs.mkdirSync(dir)

  fs.mkdirSync(subDir)

}

// Cria uma instância do bot
// const bot = new Telegraf(TOKEN)
// const manager = new Telegram(TOKEN)

const bot = new Composer()

bot.start(ctx => ctx.reply('Pronto para uso!'))

// Faz o download dos videos enviados no chat do bot
bot.on('video', async (ctx) => {  

  // Pega o nome e tipo do arquivo
  const { mime_type, file_name } = ctx.update.message.video
  
  // Caso o video não seja no formato 'mp4', retorne
  if (mime_type !== 'video/mp4') return ctx.reply('Formato inválido!')

  // Pega o 'id' do video salvo na API do Telegram
  const fileId = await ctx.telegram.getFile(ctx.update.message.video.file_id)

  // Pega o endereço do video salvo na API do Telegram
  const filePath = fileId.file_path

  // Faz o download do video
  await downloadVideo(`${URL}${TOKEN}/${filePath}`, file_name)
    .then(() => {

      ctx.reply(`${countVideos}° video baixado e convertido com sucesso!`)

      countVideos += 1

    })
    .catch(err => ctx.reply(`Erro no download do ${countVideos}° video!`))

})

// Concatena os videos
bot.command('merge', async ctx => {

  await ctx.reply('Lendo arquivos!')

  // Busca os videos que serão concatenados
  await getVideosFiles(subDir, listFilePath)
    .then(async () => {

      await ctx.reply('Iniciando merge!')

      try {

        // Concatena todos os videos selecionados
        exec(`ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputFilePath}`, async (err, stdout, stderr) => {

          // Caso ocorra algum erro na concatenação, retorne o erro
          if (err) {

            ctx.reply('Erro no merge!')

            // Apaga o arquivo com o nome dos videos selecionados
            fs.unlinkSync(listFilePath)

            throw err

          }

          await ctx.reply('Merge com sucesso!')
          await ctx.reply('Enviando video. Aguarde...')

          // Envia o video para o usuário
          ctx.telegram.sendVideo(ctx.update.message.chat.id, {
            source: Path.resolve(__dirname, '..', `${outputFilePath}`)
          }, {
            caption: 'Finalizado!'
          })
            .then(() => {

              // Apaga o arquivo com o nome dos videos selecionados
              fs.unlinkSync(listFilePath)

              // Apaga o video compilado
              fs.unlinkSync(outputFilePath)

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
  
  countVideos = 1

  // Le todos os arquivos do diretório especifico
  fs.readdir(subDir, (err, files) => {

    if (err) throw err

    // Le arquivo por arquivo
    files.forEach(file => {

      // Apaga o arquivo
      fs.unlink(Path.join(subDir, file), err => {

        // Caso de erro, retorne o erro
        if (err) {

          ctx.reply('Erro na deleção dos videos!')

          throw err

        }

      })

    })

  })

  ctx.reply('Todos os videos na linha de trabalho foram apagados!')

})

// bot.launch()
module.exports = bot