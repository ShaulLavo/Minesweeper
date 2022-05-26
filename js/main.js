'use strict'

const MINE = '💣'
const FLAG = '🚩'

var gBoard
var gLevel = {
	SIZE: 4,
	MINES: 2
}

var gGame = {
	isOn: true,
	isFirstClick: true,
	isHint: false,
	hintsLeft: 3,
	life: 3,
	shownCount: 0,
	markedCount: 0,
	secsPassed: 0,
	matchCount: 0
}
var gCounterInterval
var gWoozySmileyInterval
var gLastHint

function initGame(row, col) {
	gBoard = buildBoard(gLevel.SIZE)
	addMines(gLevel.SIZE, gLevel.MINES, row, col)
	setMinesNegsCount(gBoard)
	renderBoard(gBoard, '.table-container')
}

// Builds the board
// Set mines at random locations
// Call setMinesNegsCount()
// Return the created board
function buildBoard(size = 4) {
	var board = []
	for (var i = 0; i < size; i++) {
		board.push([])
		for (var j = 0; j < size; j++) {
			board[i][j] = {
				minesAroundCount: 0,
				isShown: false,
				isMine: false,
				isMarked: false
			}
		}
	}
	return board
}

// Count mines around each cell
// and set the cell's
// minesAroundCount
function setMinesNegsCount(board) {
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[0].length; j++) {
			board[i][j].minesAroundCount = countNeighbors(board, i, j)
		}
	}
}

function countNeighbors(board, rowIdx, colIdx) {
	var count = 0
	for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
		if (i < 0 || i > board.length - 1) continue //don't count border
		for (var j = colIdx - 1; j <= colIdx + 1; j++) {
			if (j < 0 || j > board[0].length - 1) continue //don't count border
			if (i === rowIdx && j === colIdx) continue //don't count self
			if (board[i][j].isMine) {
				// if neighbor is mine
				count++
			}
		}
	}
	return count
}

//Render the board as a <table> to the page
function renderBoard(board, selector) {
	var strHTML = '<table border="0"><tbody>'
	for (var i = 0; i < board.length; i++) {
		strHTML += '<tr>'
		for (var j = 0; j < board[0].length; j++) {
			var cell
			cell = board[i][j].isMine ? MINE : board[i][j].minesAroundCount
			if (board[i][j].minesAroundCount === 0 && !board[i][j].isMine) cell = ''
			var className = `cell cell-${i}-${j}` // this is just for revealing neighbors
			var onRightClick = `cellClickedRight(this,${i},${j});return false;`
			var onClick = `cellClicked(this,${i},${j})`
			// class=" ${className} "
			strHTML += `<td class ="cell ${className}" oncontextmenu="${onRightClick}" onclick="${onClick}"><span class="cell-content">${cell}</span></td>`
		}
		strHTML += '</tr>'
	}
	strHTML += '</tbody></table>'
	var elContainer = document.querySelector(selector)
	elContainer.innerHTML = strHTML
}

function addMines(len, mineCount, exclRow, exclCol) {
	for (var i = 0; i < mineCount; i++) {
		var row = getRandomIntInclusive(0, len - 1)
		var col = getRandomIntInclusive(0, len - 1)
		if (exclRow === row && exclCol === col) addMines(len, 1) //don't place bomb on excluded cell (first clicked)
		if (gBoard[row][col].isMine === true) addMines(len, 1) // make sure addMines won't randomize same cell twice
		gBoard[row][col].isMine = true
	}
}

// Called when a cell (td) is clicked
function cellClicked(elCell, row, col) {
	if (gGame.isFirstClick && gGame.isHint) return alert('click on cell first') //stop user from hint on first turn
	if (gGame.isFirstClick) handleFirstClick(elCell, row, col)
	if (!gGame.isOn) return
	if (gBoard[row][col].isMarked) return
	if (gBoard[row][col].isShown) return
	if (gGame.isHint) return handleHint(row, col)
	var cellContent = elCell.querySelector('span.cell-content')
	gBoard[row][col].isShown = true
	if (!gBoard[row][col].isMine) gGame.shownCount++ //only count shown nums
	elCell.classList.add('clicked-cell')
	cellContent.style.visibility = 'visible'
	if (gBoard[row][col].isMine) {
		handleLife(elCell, row, col)
		smileyOnMine()
	}
	checkGameOver(row, col)
	expandShown(gBoard, row, col)
}
// Called when a cell (td) is right-clicked
function cellClickedRight(elCell, row, col) {
	if (!gGame.isOn) return
	if (gBoard[row][col].isShown) return
	if (gGame.isFirstClick) {
		startCounter()
		gGame.isFirstClick = false
	}
	var cellContent = elCell.querySelector('span.cell-content')
	if (gBoard[row][col].isMarked === true) {
		//handle removing marks
		gGame.markedCount--
		gBoard[row][col].isMarked = false
		if (gBoard[row][col].isMine) {
			cellContent.innerText = MINE //put mine back
			gGame.matchCount-- // in case of removing a flag from mine we want to reset count
		} else cellContent.innerText = gBoard[row][col].minesAroundCount //put num back
		cellContent.style.visibility = 'hidden'
	} else {
		// handle adding marks
		gGame.markedCount++
		gBoard[row][col].isMarked = true
		cellContent.style.visibility = 'visible'
		cellContent.innerText = FLAG // put flag instead of num
		checkGameOver(row, col)
	}
}

function setLvl(elLvl) {
	if (elLvl.innerText === 'Beginner') {
		gLevel.SIZE = 4
		gLevel.MINES = 2
	}
	if (elLvl.innerText === 'Intermediate') {
		gLevel.SIZE = 8
		gLevel.MINES = 12
	}
	if (elLvl.innerText === 'Expert') {
		gLevel.SIZE = 12
		gLevel.MINES = 30
	}
	restart()
}

// BONUS: if you have the time
// later, try to work more like the
// real algorithm (see description
// at the Bonuses section below
//! this only opens 1st degree neighbors
function expandShown(board, row, col) {
	if (board[row][col].isMine) return
	if (board[row][col].minesAroundCount === 0) {
		for (var i = row - 1; i <= row + 1; i++) {
			if (i < 0 || i > board.length - 1) continue
			for (var j = col - 1; j <= col + 1; j++) {
				if (j < 0 || j > board[0].length - 1) continue
				if (i === row && j === col) continue
				if (!board[i][j].isShown) gGame.shownCount++ // make sure we don't count prev opened cells
				board[i][j].isShown = true
				var negCellContent = document.querySelector(`.cell-${i}-${j} span.cell-content`)
				var elCell = document.querySelector(`.cell-${i}-${j}`)
				negCellContent.style.visibility = 'visible'
				elCell.classList.add('clicked-cell')
			}
		}
	}
	checkGameOver(row, col)
}

// Game ends when all mines are marked,
// and all the other cells are shown
function checkGameOver(row, col) {
	var numCount = gLevel.SIZE ** 2 - gLevel.MINES
	if (gBoard[row][col].isMarked && gBoard[row][col].isMine) gGame.matchCount++ //check if flag location matches mine
	if (gGame.matchCount === gLevel.MINES && gGame.shownCount === numCount) showWin()
	if (gGame.life === 0) showLose()
}

function handleFirstClick(elCell, row, col) {
	startCounter()
	if (gBoard[row][col].isMine) initGame(row, col)
	gGame.isFirstClick = false
	var cellContent = elCell.querySelector('span.cell-content')
	setTimeout(function () {
		elCell.classList.add('clicked-cell')
		cellContent.classList.remove('cell-content')
	}, 50)
	// this is a patch cuz i don't understand the bug
}

function showWin() {
	gGame.isOn = false
	clearInterval(gCounterInterval)
	console.log('you win!')
}

function showLose() {
	var smiley = document.querySelector('.smiley')
	smiley.innerText = '🤕'
	gGame.isOn = false
	clearInterval(gWoozySmileyInterval)
	clearInterval(gCounterInterval)
	console.log('you Lose!')
}

function handleLife(elCell, row, col) {
	var life = document.querySelector('.life-' + gGame.life)
	life.style.visibility = 'hidden'
	gGame.life--
	if (gGame.life === 0) return
	gGame.markedCount++ // when stepping on mine it gets auto marked
	gBoard[row][col].isMarked = true
	setTimeout(function () {
		elCell.innerText = FLAG
	}, 1000)
}

function restart() {
	for (var i = 1; i <= 3; i++) {
		var life = document.querySelector('.life-' + i)
		life.style.visibility = 'visible'
	}
	clearInterval(gCounterInterval)
	gGame.isOn = true
	gGame.isFirstClick = true
	gGame.isHint = false
	gGame.hintsLeft = 3
	gGame.life = 3
	gGame.shownCount = 0
	gGame.markedCount = 0
	gGame.secsPassed = 0
	gGame.matchCount = 0
	initGame()
}

function startCounter() {
	if (!gGame.isFirstClick) return
	var counter = document.querySelector('.counter')
	gCounterInterval = setInterval(function () {
		gGame.secsPassed++
		if (gGame.secsPassed < 10) counter.innerText = '0' + gGame.secsPassed
		else counter.innerText = gGame.secsPassed
	}, 1000)
}

function smile(elSmiley) {
	// console.log(elSmiley)
	elSmiley.innerText = '😆'
	setTimeout(function () {
		elSmiley.innerText = '😄'
	}, 333)
	restart()
}

function smileyOnMine() {
	var smiley = document.querySelector('.smiley')
	smiley.innerText = '😵'
	gWoozySmileyInterval = setTimeout(function () {
		smiley.innerText = '😄'
	}, 1000)
}

function hint(elHint) {
	gLastHint = elHint
	//! add something to stop from clicking more then one hint
	if (!elHint.classList.contains('hint-clicked')) {
		console.log('hint')
		//allows toggle (without toggle)
		elHint.classList.add('hint-clicked')
		gGame.isHint = true
		gGame.hintsLeft--
	} else {
		console.log('hint removed')
		elHint.classList.remove('hint-clicked')
		gGame.isHint = false
		gGame.hintsLeft++
	}
}

function handleHint(row, col) {
	gGame.isHint = false
	for (var i = row - 1; i <= row + 1; i++) {
		if (i < 0 || i > gBoard.length - 1) continue
		for (var j = col - 1; j <= col + 1; j++) {
			if (j < 0 || j > gBoard[0].length - 1) continue
			if (i === row && j === col) continue
			let elCell = document.querySelector(`.cell-${i}-${j}`)
			let negCellContent = document.querySelector(`.cell-${i}-${j} span.cell-content`)
			console.log(elCell)
			// had to use let or it won't work sorry 😕
			negCellContent.style.visibility = 'visible'
			elCell.style.backgroundColor = 'lightgray'
			gLastHint.style.display = 'none'
			setTimeout(function () {
				elCell.style.backgroundColor = ''
				negCellContent.style.visibility = 'hidden'
			}, 1000)
		}
	}
}

//if first click is a mine swap it's location with first empty cell
// function firstIsMine(row, col) {
// 	var i = 0
// 	var j = 0
// 	while (gBoard[i][j].isMine) i++
// 	var temp = gBoard[row][col]
// 	gBoard[row][col] = gBoard[i][j]
// 	gBoard[i][j] = temp
// 	setMinesNegsCount(gBoard)
// 	renderBoard(gBoard, '.table-container')
// }
