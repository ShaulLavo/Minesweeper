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
	shownCount: 0,
	markedCount: 0,
	secsPassed: 0,
	matchCount: 0
}
var gCounterInterval

function initGame() {
	gBoard = buildBoard(gLevel.SIZE)
	addMines(gLevel.SIZE, gLevel.MINES)
	setMinesNegsCount(gBoard)
	renderBoard(gBoard, '.table-container')
	console.log(gBoard)
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
			// var className = `cell cell-${i}-${j}`
			// class=" ${className} "
			strHTML += `<td class ="cell" oncontextmenu="cellClickedRight(this,${i},${j});return false;" onclick="cellClicked(this,${i},${j})"><span class="cell-content">${cell}</span></td>`
		}
		strHTML += '</tr>'
	}
	strHTML += '</tbody></table>'
	var elContainer = document.querySelector(selector)
	elContainer.innerHTML = strHTML
}

function addMines(len, mineCount) {
	for (var i = 0; i < mineCount; i++) {
		var row = getRandomIntInclusive(0, len - 1)
		var col = getRandomIntInclusive(0, len - 1)
		if (gBoard[row][col].isMine === true) return addMines(len, 1) // make sure addMines won't randomize same cell twice
		gBoard[row][col].isMine = true
	}
}

// Called when a cell (td) is clicked
function cellClicked(elCell, i, j) {
	if (!gGame.isOn) return
	if (gBoard[i][j].isMarked) return
	if (gBoard[i][j].isShown) return //this is so you can't click a clicked cell and add to shownCount
	startCounter()
	gBoard[i][j].isShown = true
	gGame.shownCount++
	var cellContent = elCell.querySelector('span.cell-content')
	cellContent.style.visibility = 'visible'
    if (gBoard[i][j].isMine) showLose()
	checkGameOver(i, j)
}
// Called when a cell (td) is right-clicked
function cellClickedRight(elCell, i, j) {
	if (!gGame.isOn) return
	if (gBoard[i][j].isShown) return
	startCounter()
	var cellContent = elCell.querySelector('span.cell-content')
	if (gBoard[i][j].isMarked === true) {
		//handle removing marks
		gGame.markedCount--
		gBoard[i][j].isMarked = false
		if (gBoard[i][j].isMine) {
			cellContent.innerText = MINE //put mine back
			gGame.matchCount-- // in case of removing a flag from mine we want to reset count
		} else cellContent.innerText = gBoard[i][j].minesAroundCount //put num back
		cellContent.style.visibility = 'hidden'
	} else {
		// handle adding marks
		gGame.markedCount++
		gBoard[i][j].isMarked = true
		cellContent.style.visibility = 'visible'
		cellContent.innerText = FLAG // put flag instead of num
		checkGameOver(i, j)
	}
}

// Game ends when all mines are marked,
// and all the other cells are shown
function checkGameOver(row, col) {
	var numCount = gLevel.SIZE ** 2 - gLevel.MINES
	if (gBoard[row][col].isMarked && gBoard[row][col].isMine) gGame.matchCount++ //check if flag location matches mine
	if (gGame.matchCount === gLevel.MINES && gGame.shownCount === numCount)
		showWin()
}

// When user clicks a cell with no
// mines around, we need to open
// not only that cell, but also its
// neighbors.

// NOTE: start with a basic
// implementation that only opens
// the non-mine 1st degree
// neighbors

// BONUS: if you have the time
// later, try to work more like the
// real algorithm (see description
// at the Bonuses section below
function expandShown(board, elCell, i, j) {}

function startCounter() {
	if (gGame.secsPassed !== 0) return
	var counter = document.querySelector('.counter')
	gCounterInterval = setInterval(function () {
		gGame.secsPassed++
		if (gGame.secsPassed < 10) counter.innerText = '0' + gGame.secsPassed
		else counter.innerText = gGame.secsPassed
	}, 100)
}

function showWin() {
	gGame.isOn = false
	clearInterval(gCounterInterval)
	console.log('you win!')
}

function showLose() {
	gGame.isOn = false
	clearInterval(gCounterInterval)
	console.log('you Lose!')
}
