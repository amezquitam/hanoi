
window.onload = main
window.onselectstart = () => false // Evitar que el usuario pueda seleccionar


function main() {
    /** Cuenta todos los movimientos que ha hecho el jugador */
    const count = new Count(count => movCounterElement.textContent = count)
    let startTime = Date.now()
    let resetTime = () => startTime = Date.now()

    setInterval(() => timeElement.textContent = Math.floor((Date.now() - startTime) / 1000), 600)

    /** Seleccionar el elemento que indica la cantidad de movimientos del jugador */
    const movCounterElement = document.querySelector('#movCounter')
    const timeElement = document.querySelector('#time')
    /** Seleccionar el elemento que indica la dificultad del juego */
    const dificult = document.querySelector('#dificult-selector')

    /** Seleccionar los elementos de las tres torres que hay en index.html */
    const initialTower = document.querySelector('#initial-tower')
    const midTower = document.querySelector('#mid-tower')
    const finalTower = document.querySelector('#final-tower')

    /** Arreglo con todas las torres, se usará para aplicar funcionalidad que se
     * necesite en todas las torres simultaneamente */
    const towers = [initialTower, midTower, finalTower]

    /** Con esta función se validará toda la logica de los movimientos del juego */
    const onMove = ({ piece, into }) => {
        /** Se extrae información del tamaño de la pieza que se va a mover */
        const size = parseInt(piece.dataset.size)
        /** Se obtiene la pieza de más arriba de la torre donde se moverá */
        const top = into.children.item(into.children.length - 1)
        /** Si no hay nada, se puede colocar sin problemas */
        if (!top)
            return true

        /** Si hay, entonces se debe comprobar que es más grande que la 
         * que se va a colocar encima */
        const topSize = parseInt(top.dataset.size)
        if (size < topSize)
            return true

        /** Se vuelve a hacer las movibles las piezas de arriba */
        return false
    }

    /** Se ejecuta despues de realizar un movimiento */
    const posMove = () => {
        makeMovableTopPiecesWithDrag(towers, onMove, posMove)
        makeMovableTopPiecesWithClick(towers, onMove, posMove)
        count.count = count.count + 1

        if (win()) {
            showResults({ movements: count.count, time: Date.now() - startTime, setup: setupAlias })
        }
    }

    const setupAlias = () => {
        setup({ towers, count, dificult, onMove, posMove, resetTime })
    }

    /** Comprueba si el jugador ha ganado */
    const win = () => {
        // No deben haber piezas en ninguna de las torres
        if (initialTower.children.length > 0) return false
        if (midTower.children.length > 0) return false

        let size = finalTower.childElementCount

        for (const piece of finalTower.children) {
            if (parseInt(piece.dataset.size) !== size)
                return false
            size--
        }

        return true
    }

    /** Se crea un nuevo juego */
    setupAlias()

    // Cada vez que se cambia la dificultas debe reiniciarse el juego
    dificult.addEventListener('change', () => setupAlias())
}

/**
 * @param towers: Las torres deben estar en orden de izquierda a derecha
 * @param dificult: Elemento <select /> que maneja la dificultad
 */
function setup({ towers, count, dificult, onMove, posMove, resetTime }) {
    /** Se establecen el contador de movimientos en cero */
    count.count = 0
    resetTime()

    /** Se eliminan todas las piezas */
    for (const tower of towers) {
        clear(tower)
    }

    const initialTower = towers[0]

    /** Se inicializa la primera torre con todas las piezas */
    setupInitialTower(initialTower, dificult.value ?? 'easy')

    /** Se habilita el movimiento de las piezas que se encuentran en la
     * parte superior de cada torre */
    makeMovableTopPiecesWithDrag(towers, onMove, posMove)
    makeMovableTopPiecesWithClick(towers, onMove, posMove)
}

/**
 * @param dificult: especifica la dificultad. Puede ser: 'easy', 'mid' o 'hard'
 * @returns Un array de tamaño variable dependiendo de la dificultad. En caso que el
 * argumento sea invalido, retornará por defecto las piezas de la modalidad fácil.
 */
function initialPieces(dificult) {
    // Un mapa con las 3 opciones de dificultad
    const piecesByDificult = {
        // Los números indican el tamaño de la pieza
        'easy': [4, 3, 2, 1],
        'mid': [6, 5, 4, 3, 2, 1],
        'hard': [8, 7, 6, 5, 4, 3, 2, 1],
        'bobo': [2, 1]
    }

    return piecesByDificult[dificult] ?? piecesByDificult['easy']
}

/** Se utiliza para crear un elemento HTML que dibuje una pieza en la pantalla */
function createPiece(size, color) {
    return {
        html: `<div data-size="${size}" style="background-color: ${color}" class="size-${size} piece"></div>`,
    }
}

/** Retorna un color dependiendo del tamaño o blanco si el tamaño no está soportado */
function sizeColor(size) {
    const colors = ['#ffe1bc', '#d4ffbd', '#f3c6f1', '#d4989a', '#cef6fd', '#ff9e9e', '#deff8c', '#ff8458', '#fff583']
    return colors[size] ?? '#fff'
}

/** Agrega todas las piezas a la torre principal */
function setupInitialTower(initialTower, dificult) {
    for (const pieceSize of initialPieces(dificult)) {
        initialTower.innerHTML += createPiece(pieceSize, sizeColor(pieceSize)).html
    }
}


// Variable para evitar crear muchas veces los listenners
let makeMovableTopPiecesInitialized = false
let makeClickableTopPiecesInitialized = false
let topPieces = []

function makeMovableTopPiecesWithClick(towers, onMove, posMove) {
    
    let pieceToMove = null
    
    if (makeClickableTopPiecesInitialized) return

    // Se buscan las piezas de arriba
    for (const tower of towers) {
        // Se obtiene la ultima pieza, que corresponde con la pieza de arriba
        tower.parentElement.addEventListener('click', () => {
            const topPiece = tower.children.item(tower.children.length - 1)

            if (!pieceToMove && topPiece) {
                pieceToMove = topPiece
            }
            else if (pieceToMove && onMove({ piece: pieceToMove, into: tower })) {
                pieceToMove.remove()
                tower.appendChild(pieceToMove)
                posMove()
                pieceToMove = null
            } else if (pieceToMove) {
                pieceToMove = topPiece
            }
        })
    }

    makeClickableTopPiecesInitialized = true
}

function makeMovableTopPiecesWithDrag(towers, onMove, posMove) {
    // Piezas de arriba
    // Pieza que se esta arrastrando
    let draggingPiece = null
    // Rectangulos, R es relativo a la posición inicial de la pieza,
    // y C es relativo a la esquina superior izquierda de la pantalla
    let R = null
    let C = null

    // Se buscan las piezas de arriba
    for (const tower of towers) {
        // Se obtiene la ultima pieza, que corresponde con la pieza de arriba
        const topPiece = tower.children.item(tower.children.length - 1)
        if (!topPiece) continue
        topPieces.push(topPiece)
    }

    // Se agregan los listenners iniciales
    if (!makeMovableTopPiecesInitialized) {

        // Esta función se ejecuta cuando se intenta empezar a mover
        // una pieza
        const onBeginDrag = ({ target }) => {
            // Se verifica que esta pieza es una de las que habiamos
            // marcado como pieza de arriba
            if (topPieces.includes(target)) {
                draggingPiece = target
                R = draggingPiece.getBoundingClientRect()
            }
        }

        // Esta funcion es para cambiar de torre las piezas luego de arrastraslas
        // es decir, cuando se sueltan
        const onDrop = () => {
            // Salir si no se está arrastrando ninguna pieza
            if (!draggingPiece) return

            // buscar la torre más cercana usando bounding rects
            for (const tower of towers) {
                const { x, y, width, height } = tower.parentElement.getBoundingClientRect()

                // verificar si la pieza se encuentra dentro del rectangulo alrededor
                // de una torre en especifico
                if (x < C.x && C.x < x + width && y < C.y && C.y < y + height) {
                    // Se valida si este movimiento es valido
                    if (!onMove({ piece: draggingPiece, into: tower })) continue
                    // se elimina el elemento de la torre en la que está
                    draggingPiece.remove()
                    // y se agrega a la torre a donde se movió
                    tower.appendChild(draggingPiece)
                    // Se ejecuta otra logica que va luego de aplicar el movimiento
                    posMove()
                }
            }
            // Se anulan las transformaciones para que se acomode con
            // los estilos CSS
            draggingPiece.style.transform = ''
            // despues de soltarse, ya no se está arrastrando ninguna pieza
            draggingPiece = null
        }

        // esta funcion se ejecutará al momento de arrastrar una pieza
        const onDrag = ({ buttons, x: mouseX, y: mouseY }) => {
            // si no hay ninguna pieza arrastrable seleccionada
            // o no se está presionando ningun botón, entonces
            // se abandona esta funcion 
            if (!draggingPiece || buttons !== 1) return

            // Se guarda en C, para que al momento de soltar se sepa la posición 
            // absoluta de la pieza
            C = {
                x: mouseX,
                y: mouseY
            }

            // CR es una posición relativa, la cual se usa para aplicar la 
            // transformación de más abajo
            const CR = {
                x: mouseX - R.x - R.width / 2,
                y: mouseY - R.y - R.height / 2,
            }

            // Se translada la pieza a medida que se arrastra
            draggingPiece.style.transform = `translate(${CR.x}px, ${CR.y}px)`
        }

        document.addEventListener('mousedown', onBeginDrag)
        document.addEventListener('mousemove', onDrag)
        document.addEventListener('mouseleave', onDrop)
        document.addEventListener('mouseup', onDrop)
        makeMovableTopPiecesInitialized = true
    }
}


function clear(element) {
    element.innerHTML = ''
}

const result = document.querySelector('#result')

function showResults({ movements, time, setup }) {
    result.style.display = 'flex'
    result.innerHTML += `
        <div class="result-card">
            <h1>Felicidades, Has ganado</h1>
            <ul>
                <li>Movimientos: ${movements}</li>
                <li>Tiempo: ${time / 1000} seg</li>    
            </ul>
        </div>
    `
    setTimeout(() => {
        result.innerHTML = ''
        result.style.display = 'none'
        setup()
    }, 3000)
}

class Count {
    constructor(onChange) {
        this._count = 0
        this.onChange = onChange
    }
    get count() {
        return this._count
    }
    set count(val) {
        this._count = val
        this.onChange(this.count)
    }
    reset() {
        this._count = 0
    }
}
