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
  let games = []
  let matrix = new Array(userCount)
  let guesses = new Array(userCount)
  let nextGuesses = new Array(userCount)
  $('tr:gt(0)').each((i, tr) => {
    const rowUrl = $(tr).find('td:eq(2)').children('a').attr('href')
    if (rowUrl === '' || rowUrl === undefined || rowUrl === null) return

    $.get(rowUrl, function (data) {
      // Get scores
      let userScores = []
      let userGuesses = []
      let nextUserGuesses = []
      let team1, team2
      $(data).find('.webform tr').each((j, tr2) => {
        if ($(tr2).find('td').length === 7) {
          const finalScore = $(tr2).find('td:eq(6)').text()
          if (i === 0) {
            team1 = $(tr2).find('td:eq(2)').text()
            team2 = $(tr2).find('td:eq(4)').text()
            games.push({'team1': team1, 'team2': team2, 'score': finalScore})
          }
          const score = $(tr2).find('td:eq(5)').text()
          const guess = $(tr2).find('td:eq(3)').text()
          if (score.trim() === '' && finalScore.trim() === '') {
            nextUserGuesses.push(guess)
          } else {
            userScores.push(score)
            userGuesses.push(guess)
          }
        }
      })
      matrix[i] = userScores
      guesses[i] = userGuesses
      if (nextUserGuesses.length > 0) {
        nextGuesses[i] = nextUserGuesses
      }
    })
  })
  return {'games': games, 'matrix': matrix, 'guesses': guesses, 'nextguesses': nextGuesses}
}

const appendData = (games, matrix, guesses, nextguesses) => {
  // Add header
  for (let x = 0; x < games.length; x++) {
    const game = games[x]
    $('tr:eq(0)').append(`<th title="${game.team1}-${game.team2}: ${game.score}">${x+1}</th>`)
  }

  // Add scores
  $('tr:gt(0)').each((i, tr) => {
    for (let j = 0; j < matrix[i].length; j++) {
      let value = matrix[i][j]
      let guess = guesses[i][j]
      $(tr).append(`<td align="center" class="stig${value}" title="${guess}">${value}</td>`)
    }
  })

  // Add next-guesses
  $('tr:gt(0)').each((i, tr) => {
    if (nextguesses[i] === null) return
    for (let j = 0; j < nextguesses[i].length; j++) {
      let value = nextguesses[i][j]
      $(tr).append(`<td align="center">${value}</td>`)
    }
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

const fetchBtn = $('<button>', { id: 'updatebtn', text: 'Uppfæra gögn' }).click(() => {
  $('#updatebtn').prop('disabled', true)
  $('#updatebtn').after('<span class="loader" />')
  const data = crawlTable()
  $(document).ajaxStop(function () {
    const league = getUrlParameter('l')
    localStorage.setItem(league + '_games', JSON.stringify(data.games))
    localStorage.setItem(league + '_scores', JSON.stringify(data.matrix))
    localStorage.setItem(league + '_guesses', JSON.stringify(data.guesses))
    localStorage.setItem(league + '_nextguesses', JSON.stringify(data.nextguesses))
    location.reload()
  })
})

const init = () => {
  $('.webform').wrap('<div class="table-wrap"></div>')
  $('.table-wrap').wrap('<div id="table-scroll" class="table-scroll"></div>')
  $('.table-scroll').css({ marginBottom: 20 })
  $('.table-scroll').after(fetchBtn)
  $(fetchBtn).css({ marginRight: 20 })
  showDiffToNext()
  showDiffToTop()

  const league = getUrlParameter('l')

  const games = localStorage.getItem(league + '_games')
  const scores = localStorage.getItem(league + '_scores')
  const guesses = localStorage.getItem(league + '_guesses')
  const nextguesses = localStorage.getItem(league + '_nextguesses')

  if (games !== null) {
    appendData(JSON.parse(games), JSON.parse(scores), JSON.parse(guesses), JSON.parse(nextguesses))
  }

  // Make table side-scrollable if two long
  $('tr').each((i, tr) => {
    for (let j = 0; j <= 5; j++) {
      $(tr).find(`th:eq(${j}), td:eq(${j})`).addClass('fixed')
    }
  })

  $('.webform').clone(true).appendTo('#table-scroll').addClass('clone')
}

init()
