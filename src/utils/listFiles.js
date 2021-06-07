const fs = require('fs')

const listFiles = (directory) => {

  let list = ''

  return new Promise((resolve, reject) => {

    try {
      
      // Faz a leitura de todos os arquivos do diretório desejado
      fs.readdir(directory, (err, files) => {

        // Le arquivo por arquivo
        files.forEach(file => {

          // Se o arquivo possuir 'converted-' no nome, adicione-o na variável 'list'
          if (file.includes('converted-')) list += `file ${file}\n`

        })

        // Finaliza a Promise
        resolve(list)

      })

    } catch (err) {

      // Caso de algum error, rejeite a Promise
      reject(1)

    }

  })

}


module.exports = listFiles