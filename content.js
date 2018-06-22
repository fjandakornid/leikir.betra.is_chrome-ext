/* global localStorage, location */

const $ = window.$

const userCount = $('tr:gt(0)').length

const showDiffToNext = () => {
  $('tr:first').append('<th>ΔN</th>')
  $('tr:eq(1)').append('<td align=\'right\'>-</td>')

  let last = 0
  last = $('tr:eq(1)').find('td:eq(2)').text()

  $('tr:gt(1)').each(function () {
    const curr = $(this).find('td:eq(2)').text()
    if (curr === '') return
    const diff = parseInt(last, 10) - parseInt(curr, 10)
    last = curr
    $(this).append('<td align=\'right\'>' + diff + '</td>')
  })
}

const showDiffToTop = () => {
  $('tr:first').append('<th>ΔT</th>')
  $('tr:eq(1)').append('<td align=\'right\'>-</td>')

  let top = $('tr:eq(1)').find('td:eq(2)').text()

  $('tr:gt(1)').each(function () {
    const curr = $(this).find('td:eq(2)').text()
    if (curr === '') return
    const diff = parseInt(top, 10) - parseInt(curr, 10)
    $(this).append('<td align=\'right\'>' + diff + '</td>')
  })
}

const crawlTable = () => {
  let matrix = new Array(userCount)
  let guesses = new Array(userCount)
  $('tr:gt(0)').each((i, tr) => {
    const rowUrl = $(tr).find('td:eq(2)').children('a').attr('href')
    if (rowUrl === '' || rowUrl === undefined || rowUrl === null) return

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

var getUrlParameter = function getUrlParameter (sParam) {
  let sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=')

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1]
    }
  }
}

const fetchBtn = $('<button>', { text: 'Uppfæra gögn' }).click(() => {
  const data = crawlTable()
  $(document).ajaxStop(function () {
    const league = getUrlParameter('l')
    localStorage.setItem(league + '_scores', JSON.stringify(data.matrix))
    localStorage.setItem(league + '_guesses', JSON.stringify(data.guesses))
    location.reload()
  })
})

const init = () => {
  $('.webform').wrap('<div class="table-wrap"></div>')
  $('.table-wrap').wrap('<div id="table-scroll" class="table-scroll"></div>')
  showDiffToNext()
  showDiffToTop()

  const league = getUrlParameter('l')

  const scores = localStorage.getItem(league + '_scores')
  const guesses = localStorage.getItem(league + '_guesses')
  if (guesses !== null) {
    appendGuesses(JSON.parse(guesses))
  }
  if (scores !== null) {
    appendScores(JSON.parse(scores))
  }

  $('tr').each((i, tr) => {
    for (let j = 0; j <= 6; j++) {
      $(tr).find(`th:eq(${j}), td:eq(${j})`).addClass('fixed')
    }
  })

  $('.webform').clone(true).appendTo('#table-scroll').addClass('clone')
  $('.table-scroll').css({ marginBottom: 20 })
  $('.table-scroll').after(fetchBtn)
}

init()
