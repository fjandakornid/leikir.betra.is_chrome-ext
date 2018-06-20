/* global localStorage, location */

const $ = window.$

const userCount = $('tr:gt(0)').length
const mainTable = $('.webform')
mainTable.css({ marginBottom: 20 })

const showDiff = () => {
  $('tr:first').append('<th>Diff</th>')
  $('tr:eq(1)').append('<td align=\'right\'>-</td>')

  let last = 0
  last = $('tr:eq(1)').find('td:eq(2)').text()

  $('tr:gt(1)').each(function () {
    const curr = $(this).find('td:eq(2)').text()
    const diff = parseInt(last, 10) - parseInt(curr, 10)
    last = curr
    $(this).append('<td align=\'right\'>' + diff + '</td>')
  })
}

const crawlTable = () => {
  let matrix = new Array(userCount)
  let guesses = new Array(userCount)
  $('tr:gt(0)').each((i, tr) => {
    const rowUrl = $(tr).find('td:eq(2)').children('a').attr('href')

    $.get(rowUrl, function (data) {
      // Get scores
      let userScores = []
      $(data).find('.webform tr').each((j, tr2) => {
        if ($(tr2).find('td').length === 7) {
          const colText = $(tr2).find('td:eq(5)').text()
          userScores.push(colText)
        }
      })
      matrix[i] = userScores

      // Get guesses
      guesses[i] = $(data).find('tr:last').find('td:eq(3)').text()
    })
  })
  return {'matrix': matrix, 'guesses': guesses}
}

const appendScores = (matrix) => {
  for (let x = 1; x <= matrix[0].length; x++) {
    $('tr:eq(0)').append('<th>' + x + '</th>')
  }
  $('tr:gt(0)').each((i, tr) => {
    for (let j = 0; j < matrix[i].length; j++) {
      let value = matrix[i][j]
      $(tr).append('<td align=\'center\' class=\'stig' + value + '\'>' + value + '</td>')
    }
  })
}

const appendGuesses = (guesses) => {
  $('tr:first').append('<th>Gisk</th>')
  $('tr:gt(0)').each((i, tr) => {
    $(tr).append('<td>' + guesses[i] + '</td>')
  })
}

const fetchBtn = $('<button>', { text: 'Uppfæra gögn' }).click(() => {
  const data = crawlTable()
  $(document).ajaxStop(function () {
    localStorage.setItem('scores', JSON.stringify(data.matrix))
    localStorage.setItem('guesses', JSON.stringify(data.guesses))
    location.reload()
  })
})
mainTable.after(fetchBtn)
showDiff()

const scores = localStorage.getItem('scores')
const guesses = localStorage.getItem('guesses')
if (guesses !== null) {
  appendGuesses(JSON.parse(guesses))
}
if (scores !== null) {
  appendScores(JSON.parse(scores))
}
