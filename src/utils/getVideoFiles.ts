import fs from 'fs'
import listFiles from './listFiles'

const getVideosFiles = (directory: string, listFilePath: string) => {

  return new Promise(async (resolve, reject) => {

    // Pega o nome dos arquivos no diretório especificado
    let files = await listFiles(directory)
      .catch(() => console.log('Error na contagem de arquivos!'))

    // Caso a lista de nomes esteja vazia, rejeite a Promise
    if (files === '') return reject(1)

    // Cria um arquivo de escrita
    let writerStream = fs.createWriteStream(listFilePath)

    // Escreve o nome dos videos no arquivo
    writerStream.write(files)

    // Caso a escrita seja bem-sucedida, finalize a Promise
    writerStream.end(() => {

      return resolve(0)

    })

    // Caso ocorra algum erro na escrita do arquivo, rejeite a Promise
    writerStream.on('error', () => {

      return reject(1)

    })

  })

}

export default getVideosFiles