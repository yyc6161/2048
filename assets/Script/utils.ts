import Cell from './cell'
//--------------------- 方块相关 ----------------------
let cellBgColorArray = {
    2: '#F2EADF',
    4: '#EFE0C9',
    8: '#F2B17B',
    16: '#EC986C',
    32: '#F47D5F',
    64: '#FB5E3D',
    128: '#E8D078',
    256: '#E9CA70',
    512: '#EDC762',
    1024: '#EAC157',
    2048: '#E7BF4E',
}

/**
 * 获得方块的背景色
 * @param num 对应方块值
 */
export let getCellBgColor = function(num: number): string {
    let color = '#000000'
    if (cellBgColorArray.hasOwnProperty(num)) color = cellBgColorArray[num]
    return color
}

/**
 * 获得方块的前景字的颜色
 * @param num 对应方块值
 */
export let getCellValueColor = function(num: number): string {
    return num <= 4? '#787065' : '#F2E9DA'
}

//--------------------- 数字块操作相关 ----------------------
export let MOVE = cc.Enum({
    LEFT: 0,
    RIGHT: 1,
    UP: 2,
    DOWN: 3
})

let mergeTwoBlock = function(remindBlock, abondonBlock, cells, mergeCallback) {
    if (remindBlock == null || abondonBlock == null) return
    let abondon = abondonBlock
    for (let i = 0; i < cells.length; i++) {
        if (cells[i] == abondonBlock) cells.splice(i, 1)
    }
    abondon.destroy()
    let newValue = remindBlock.getComponent(Cell).value * 2
    remindBlock.getComponent(Cell).value = newValue
    mergeCallback(newValue)
}

/**
 * 使所有的数字块都往指定方向滑动，并合并同类项
 * @param orientation 表示方向的数值
 * @param self 调用这个方法的类
 * 需要调用的类有如下参数：_cells[], _bgCells[], cellMaxNum
 */
export let adjustCells = function(orientation: number, cells: Array<cc.Node>, bgCells: Array<{pos:cc.Vec2, cover:cc.Node}>, mergeCallback: Function) {
    if (cells.length == 0) return
    let cellMaxNum = bgCells.length

    let MaxBlockInLine = 4      // 一行最大的数字块个数
    if (orientation == MOVE.LEFT || orientation == MOVE.RIGHT) {
        let move = orientation == MOVE.LEFT? -1 : 1 // 数组遍历方向, 1 正向  2 反向
        let line = -1                               // 遍历的行数
        let emptyCellIndex = -1                     // 空节点的下标
        let lastCellHasBlock = null                 // 上个检测到的数字块的值
        for (let i = move == -1? cellMaxNum-1:0; 0 <= i && i < cellMaxNum; i += move) {
            if (line != Math.floor(i / MaxBlockInLine)) {   // 换行，把空节点下标清空
                line = Math.floor(i / MaxBlockInLine)
                emptyCellIndex = -1
                lastCellHasBlock = -1
            } 
            let coverNode = bgCells[i].cover 
            if (coverNode == null && emptyCellIndex == -1) {
                emptyCellIndex = i
            } else if (coverNode != null) {
                if (lastCellHasBlock != -1 && bgCells[lastCellHasBlock].cover.getComponent(Cell).value == coverNode.getComponent(Cell).value) {   // 可以合并相同数字
                    let lastBlock = bgCells[lastCellHasBlock].cover
                    coverNode.runAction(cc.sequence(
                        cc.moveTo(0.1, bgCells[lastCellHasBlock].pos),
                        cc.callFunc((data)=>{
                            mergeTwoBlock(lastBlock, data, cells, mergeCallback)
                        },self,coverNode)
                    ))
                    bgCells[i].cover = null
                    if (emptyCellIndex == -1) emptyCellIndex = i    //   如果前面没有空块，那么空块就是当前被合并的数字块
                    lastCellHasBlock = -1
                } else if (emptyCellIndex >= 0) {   // 把当前数字块移到空位
                    lastCellHasBlock = emptyCellIndex
                    coverNode.runAction(cc.moveTo(0.1, bgCells[emptyCellIndex].pos))
                    bgCells[emptyCellIndex].cover = coverNode
                    bgCells[i].cover = null
                    emptyCellIndex += move
                } else {
                    lastCellHasBlock = i
                }
            }
        }
    } else if (orientation == MOVE.UP || orientation == MOVE.DOWN) {
        let move = orientation == MOVE.UP? -1 : 1   // 数组遍历方向, 1 正向  2 反向
        let emptyCellIndex = []                     // 各列对应空节点下标的数组
        let lastCellHasBlock = []                   // 上个检测到的数字块的值
        for (let i = 0; i < MaxBlockInLine; i++) {
            emptyCellIndex.push(-1)
            lastCellHasBlock.push(-1)
        }
        for (let i = move == -1?cellMaxNum-1:0; 0 <= i && i < cellMaxNum; i += move) {
            let column = i % MaxBlockInLine           // 遍历的列数
            let coverNode = bgCells[i].cover 
            if (coverNode == null && emptyCellIndex[column] == -1) {
                emptyCellIndex[column] = i
            } else if (coverNode != null) {
                if (lastCellHasBlock[column] != -1 && bgCells[lastCellHasBlock[column]].cover.getComponent(Cell).value == coverNode.getComponent(Cell).value) {   // 可以同类合并
                    let lastBlock = bgCells[lastCellHasBlock[column]].cover
                    coverNode.runAction(cc.sequence(
                        cc.moveTo(0.1, bgCells[lastCellHasBlock[column]].pos),
                        cc.callFunc((data)=>{
                            mergeTwoBlock(lastBlock, data, cells, mergeCallback)
                        },this,coverNode)
                    ))
                    bgCells[i].cover = null
                    if (emptyCellIndex[column] == -1) emptyCellIndex[column] = i    //   如果前面没有空块，那么空块就是当前被合并的数字块
                    lastCellHasBlock[column] = -1
                } else if (emptyCellIndex[column] >= 0) {       // 可以移到下一空块
                    lastCellHasBlock[column] = emptyCellIndex[column]
                    coverNode.runAction(cc.moveTo(0.1, bgCells[emptyCellIndex[column]].pos))
                    bgCells[emptyCellIndex[column]].cover = coverNode
                    bgCells[i].cover = null
                    emptyCellIndex[column] += move * MaxBlockInLine
                } else {
                    lastCellHasBlock[column] = i
                }
            }
        }
    }
}

/**
 * 计算触控方向
 * @param startPoint 起始点坐标
 * @param endPoint 终点坐标
 */
export let calculateTouchOrientation = function (startPoint, endPoint) { 
    let orientation
    let horizontal = endPoint.x - startPoint.x   
    let vertical = endPoint.y - startPoint.y

    if (Math.abs(horizontal) > Math.abs(vertical)) {
        if (horizontal > 0) orientation = MOVE.LEFT
        else orientation = MOVE.RIGHT
    } else {
        if (vertical > 0) orientation = MOVE.UP
        else orientation = MOVE.DOWN
    }

    return orientation
}

/**
 * 获得该事件点在node处的相对坐标
 * @param node 
 * @param touchEvent 
 */
export let getTouchLocation = function (node, touchEvent) {
    let location = node.convertTouchToNodeSpace(touchEvent);
    return location
}

/**
 * 找出一个空的背景格
 * @param bgCells 背景格信息数组
 */
export let getEmptyBgCellIndex = function (bgCells) {
    let emptyCell = []
    for (let key in bgCells) {
        if (bgCells[key].cover == null) {
            emptyCell.push(key)
        }
    }
    let emptyCellIndex = Math.floor(Math.random() * emptyCell.length)
    return emptyCell[emptyCellIndex]? emptyCell[emptyCellIndex]: -1
}
