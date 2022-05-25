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
	life: 3,
	shownCount: 0,
	markedCount: 0,
	secsPassed: 0,
	matchCount: 0
}
var gCounterInterval

function initGame() {
	gBoard = buildBoard(gLevel.SIZE)
	renderBoard(gBoard, '.table-container')
}

function onFirstClick(elCell, row, col) {
	gGame.isFirstClick = false
	addMines(gLevel.SIZE, gLevel.MINES, row, col)
	setMinesNegsCount(gBoard)
	renderBoard(gBoard, '.table-container')
	//! refactor this entire thing:
	// gGame.shownCount++                      //! this breaks the game
	var cellContent = elCell.querySelector('span.cell-content')
	console.log(cellContent) // add visibility to new clicked cell  //!doesn't work 😤
	cellContent.style.visibility = 'visible' // why am i doing this in the first place?
	console.log(cellContent.style)
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
		if (exclRow === row && exclCol === col) return addMines(len, 1) //don't place bomb on excluded cell (first clicked)
		if (gBoard[row][col].isMine === true) return addMines(len, 1) // make sure addMines won't randomize same cell twice
		gBoard[row][col].isMine = true
	}
}

// Called when a cell (td) is clicked
function cellClicked(elCell, row, col) {
	if (gGame.isFirstClick) onFirstClick(elCell, row, col)
	if (!gGame.isOn) return
	if (gBoard[row][col].isMarked) return
	if (gBoard[row][col].isShown) return //this is so you can't click a clicked cell and add to shownCount
	startCounter()
	gBoard[row][col].isShown = true
	gGame.shownCount++
	var cellContent = elCell.querySelector('span.cell-content')
	cellContent.style.visibility = 'visible'
	if (gBoard[row][col].isMine) showLose()
	checkGameOver(row, col)
	expandShown(gBoard, row, col)
}
// Called when a cell (td) is right-clicked
function cellClickedRight(elCell, row, col) {
	if (!gGame.isOn) return
	if (gBoard[row][col].isShown) return
	startCounter()
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

// Game ends when all mines are marked,
// and all the other cells are shown
function checkGameOver(row, col) {
	var numCount = gLevel.SIZE ** 2 - gLevel.MINES
	if (gBoard[row][col].isMarked && gBoard[row][col].isMine) gGame.matchCount++ //check if flag location matches mine
	if (gGame.matchCount === gLevel.MINES && gGame.shownCount === numCount) showWin()
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
	initGame()
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
				board[i][j].isShown = true
				gGame.shownCount++
				var negCellContent = document.querySelector(`.cell-${i}-${j} span.cell-content`)
				negCellContent.style.visibility = 'visible'
			}
		}
	}
}

function startCounter() {
	if (gGame.secsPassed !== 0) return
	var counter = document.querySelector('.counter')
	gCounterInterval = setInterval(function () {
		gGame.secsPassed++
		if (gGame.secsPassed < 10) counter.innerText = '0' + gGame.secsPassed
		else counter.innerText = gGame.secsPassed
	}, 1000)
}

function showWin() {
	gGame.isOn = false
	clearInterval(gCounterInterval)
	console.log('you win!')
}
//! bug -last hearth won't hide
function showLose() {
	var life = document.querySelector('.life-' + gGame.life)
	life.style.visibility = 'hidden'
	console.log(life)
	gGame.life--
	if (gGame.life === 0) {
		gGame.isOn = false
		clearInterval(gCounterInterval)
		console.log('you Lose!')
	}
}
