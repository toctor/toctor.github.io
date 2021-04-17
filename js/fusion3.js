/* @todo
biblio :
https://developer.mozilla.org/en-US/

bug : click zone vide selectionne pièce x+2 => offset du tapis à prendre en compte
bug : mask à la place de clip-path ne prmet plus de sélectionner une pièce sous la zone vide de l'agrégat !!!
        pb de mask : empeche selection piece en dessous, click target reste use et pas svg comme avec clip-path
        => clip-path + <path d="..." clip-rule="evenodd"> ?
        https://codepen.io/tutsplus/pen/WMZRmO?editors=1100
        https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/clip-rule
        https://webdesign.tutsplus.com/tutorials/a-comprehensive-guide-to-clipping-and-masking-in-svg--cms-30380
            https://codepen.io/tutsplus/pen/WMZRmO?editors=1000
bug cursor selection sur zone invisible :  https://developer.mozilla.org/fr/docs/Web/CSS/pointer-events


touch : gérer plusieurs touches simultanées

cookies setting : SameSite=Lax : 

sound on/off

scénario animation 
1) animer le morcellemnt de l'image puis le mélange des pièces

a) puzzle constitué s'affiché sans modele
b) fissure et se mélange tombre vers le bas ou autour du tapis
c) le modèle s'affiche avc possibilité de le déplacer ? masquer/réafficher ?

anim fin) confetti ?

arrosage spirale : https://codepen.io/hakimel/pen/aIhkf
pieces disposées en cubes imbriquées et tournants : https://webkit.org/blog-files/3d-transforms/morphing-cubes.html
étaler sur le tapis avec  une impression de vague : https://codepen.io/hakimel/pen/vDnmp
chaque piece réduise de taille et se raprochent pour faire une forme
GSAP Morphsvg

user current preference  : https://css-irl.info/debugging-media-queries-a-dev-tools-wish-list/

améliioration
- class clip-path absolu (évie la gestion des pièce sous zone masqué)
- orientation des pièces sur écran tactile, repositionnement deux doigts

https://ishadeed.com/article/say-hello-to-css-container-queries/
https://codepen.io/HunorMarton/pen/PoGbgqj

fun
- cube pack https://codepen.io/davidkpiano/pen/aqNZxX
- animation de fin
- chnagement d'image slider
*/

// var imagedebug = 'https://unsplash.it/600/600?image=598' // 1074 : lion
const marge = 10;
var gridSize = 4,
    xMax, yMax,
    images, imgWidth, imgHeight,
    imagePuzzle, modele, xyshape = [],
    tapis,
    puzzleHeight = 300,
    puzzleWidth = 300, // @todo : ajust with screen size
    pWidth, pHeight,
    pWidth10, pHeight10,
    svgWidth, svgHeight,
    draggedPiece, zIndex = 0,
    offset = { x: 0, y: 0 },
    emplacement;
const pathIsAbsolu = false; // true ko : todo Génération Clip-Path absolu à revoir
var pathX, pathY; // pour construire forme puzzle 
var normalDrag = true; // set to false when drag piece under svg with masked zone
var message;
var PuzzleShapeBorders = [];
// var vitesseX, vitesseY;

class Emplacement {
    constructor() {
        this.emplacement = [];

        for (let y = 0; y < yMax; y++) {
            for (let x = 0; x < xMax; x++) {
                // position
                let position = y * yMax + x;

                //voisins
                let voisins = [];
                if (x > 0) voisins.push(position - 1); // left neighbour
                if (x < xMax - 1) voisins.push(position + 1); // right neighbour
                if (y > 0) voisins.push((y - 1) * yMax + x); // top neighbour
                if (y < yMax - 1) voisins.push((y + 1) * yMax + x); // bottom neighbour

                this.emplacement.push({
                    voisins: voisins, // no pieces voisines du puzzle figé
                    agregatNo: position, // no de l'agrégat contenant draggedPiece (l'agregat conserve le no de la première pièce)
                    agregatLeftNo: position,
                    agregatTopNo: position,
                    agregatRightNo: position,
                    agregatBottomNo: position
                });
            }
        }
    }

    accoster() {
        // cherche piece voisine à proximité à agréger (et qui n'est pas déjà dans l'agrégat déplacé)
        let draggedPieceNo = draggedPiece.getAttribute("position");
        if (!draggedPieceNo) return false;
        let isAgregated = false
        this.emplacement[draggedPieceNo].voisins.forEach(voisinNo => {

            isAgregated = this.distance(draggedPieceNo, voisinNo) || isAgregated
        });
        return isAgregated;
    }

    distance(draggedPieceNo, voisinNo) {

        let agregatNo = voisinNo
        while (agregatNo != this.emplacement[agregatNo].agregatNo) {
            agregatNo = this.emplacement[agregatNo].agregatNo // biggest & latest agregat containing voisinNo
        }
        if (draggedPieceNo == agregatNo) return false;

        let agregat = document.querySelector('svg[position="' + agregatNo + '"]')

        // Trouver dans draggedPiece la pièce qui voisinNo pour voisin
        let pieceInDraggedNo = draggedPieceNo
        this.emplacement.forEach((pieceNoTab, pieceNo, tableau) => {
            if (pieceNoTab.agregatNo == draggedPieceNo && tableau[voisinNo].voisins.indexOf(pieceNo) >= 0) {
                pieceInDraggedNo = pieceNo;
            }
        })

        let voisinNoX = voisinNo % gridSize,
            voisinNoY = Math.floor(voisinNo / gridSize);

        let voisinLeft = numLeft(agregat) + pWidth * (voisinNoX - this.emplacement[agregatNo].agregatLeftNo % gridSize),
            voisinTop = numTop(agregat) + pHeight * (voisinNoY - Math.floor(this.emplacement[agregatNo].agregatTopNo / gridSize));

        let dragX = pieceInDraggedNo % gridSize,
            dragY = Math.floor(pieceInDraggedNo / gridSize);

        let dragLeft = numLeft(draggedPiece) + pWidth * (dragX - this.emplacement[draggedPieceNo].agregatLeftNo % gridSize + (dragX == voisinNoX ? 0 : (dragX > voisinNoX ? -1 : 1))),
            dragTop = numTop(draggedPiece) + pHeight * (dragY - Math.floor(this.emplacement[draggedPieceNo].agregatTopNo / gridSize) + (dragY == voisinNoY ? 0 : (dragY > voisinNoY ? -1 : 1)));

        if (Math.abs(voisinLeft - dragLeft) < marge && Math.abs(voisinTop - dragTop) < marge) {
            //test draggedPieceNo ne vient pas d'être ajouté dans this.emplacement[agregatNo].voisins (proche de 2 voisins du même agrégat)
            if (this.emplacement[agregatNo].voisins.indexOf(pieceInDraggedNo) >= 0) {
                this.agreger(draggedPieceNo, agregat, agregatNo)
            }
            return true
        }
        return false
    }

    agreger(draggedPieceNo, agregat, agregatNo) {

        //son
        sound()

        // resize agregat 
        this.resizeAgregat(draggedPieceNo, agregat, agregatNo)

        //  maj draggedPiece & collecte pièces de agregatNo
        let voisins = [];
        let inAgregat = [];
        this.emplacement.forEach((pieceNoTab, pieceNo) => {
            if (pieceNoTab.agregatNo == agregatNo || pieceNoTab.agregatNo == draggedPieceNo) {
                if (pieceNoTab.agregatNo == draggedPieceNo) {
                    pieceNoTab.agregatNo = agregatNo; // maj rattachement à l'agrégat rejoint
                }
                voisins = voisins.concat(pieceNoTab.voisins); // collecte voisins de toutes les pièces de draggedPieceNo et agregatNo
                inAgregat = inAgregat.concat(pieceNo); // collecte pièces de draggedPieceNo et agregatNo
            }
        });

        // déplacer les voisins de TOUTES LES PIECES de draggedPiece dans agregat s'il n'y sont pas déjà en tant que voisin OU PIECE AGREGEE
        let voisinsUpdate = [];
        voisins.forEach(voisinNo => {
            if (voisinsUpdate.indexOf(voisinNo) < 0 && inAgregat.indexOf(voisinNo) < 0) {
                voisinsUpdate.push(voisinNo);
            }
        })
        this.emplacement[agregatNo].voisins = voisinsUpdate;

        // retirer draggedPieceNo et autre pièces qui constituent l'agrégat
        //this.emplacement[agregatNo].voisins = this.emplacement[agregatNo].voisins.filter(voisinNo => { return voisinNo !== draggedPieceNo })
        // this change à l'intérieur de la fonction foreach
        this.emplacement.forEach((pieceNoTab, pieceNo, tableau) => {
            if (pieceNoTab.agregatNo == agregatNo) {
                tableau[agregatNo].voisins =
                    tableau[agregatNo].voisins.filter(voisinNo => {
                        return voisinNo !== pieceNo
                    })
            }
        })

        // regrouper les d= dans le path du voisin     // @todo : éliminer les parcours internes, cas draggedPiece est un agrégat
        // agregat.firstChild.firstChild.setAttribute("d", agregat.firstChild.firstChild.getAttribute("d") + draggedPiece.firstChild.firstChild.getAttribute("d"))

        // agregat.firstChild.firstChild.setAttribute("d", this.setAgregatPath(agregatNo, inAgregat));
        this.setAgregatPath(agregat, agregatNo, inAgregat);
    }

    resizeAgregat(draggedPieceNo, agregat, agregatNo) {
        let viewbox = agregat.getAttribute("viewBox").split(" "),
            viewboxIsUpdate = false,
            deltaWidth = 0,
            deltaHeight = 0;

        let agregatLeftX = this.emplacement[agregatNo].agregatLeftNo % gridSize,
            agregatTopY = Math.floor(this.emplacement[agregatNo].agregatTopNo / gridSize),
            agregatRightX = this.emplacement[agregatNo].agregatRightNo % gridSize,
            agregatBottomY = Math.floor(this.emplacement[agregatNo].agregatBottomNo / gridSize),
            draggedPieceLeftNo = this.emplacement[draggedPieceNo].agregatLeftNo,
            draggedPieceTopNo = this.emplacement[draggedPieceNo].agregatTopNo,
            draggedPieceRightNo = this.emplacement[draggedPieceNo].agregatRightNo,
            draggedPieceBottomNo = this.emplacement[draggedPieceNo].agregatBottomNo,
            draggedPieceTopY = Math.floor(draggedPieceTopNo / gridSize),
            draggedPieceLeftX = draggedPieceLeftNo % gridSize,
            draggedPieceBottomY = Math.floor(draggedPieceBottomNo / gridSize),
            draggedPieceRightX = draggedPieceRightNo % gridSize

        if (draggedPieceLeftX < agregatLeftX) {
            this.emplacement[agregatNo].agregatLeftNo = draggedPieceLeftNo
            deltaWidth = agregatLeftX - draggedPieceLeftX;
            agregat.style.left = (numLeft(agregat) - pWidth * deltaWidth) + "px";
            agregat.setAttribute("width", (parseInt(agregat.getAttribute("width"), 10) + pWidth * deltaWidth) + "px")
            viewbox[0] = parseInt(viewbox[0]) - pWidth * deltaWidth;
            viewbox[2] = parseInt(viewbox[2]) + pWidth * deltaWidth;
            viewboxIsUpdate = true
        }

        if (draggedPieceRightX > agregatRightX) {
            this.emplacement[agregatNo].agregatRightNo = draggedPieceRightNo
            deltaWidth = draggedPieceRightX - agregatRightX
            agregat.setAttribute("width", (parseInt(agregat.getAttribute("width"), 10) + pWidth * deltaWidth) + "px")
            viewbox[2] = parseInt(viewbox[2]) + pWidth * deltaWidth;
            viewboxIsUpdate = true
        }

        if (draggedPieceTopY < agregatTopY) {
            this.emplacement[agregatNo].agregatTopNo = draggedPieceTopNo
            deltaHeight = agregatTopY - draggedPieceTopY
            agregat.style.top = (numTop(agregat) - pHeight * deltaHeight) + "px";
            agregat.setAttribute("height", (parseInt(agregat.getAttribute("height"), 10) + pHeight * deltaHeight) + "px")
            viewbox[1] = parseInt(viewbox[1]) - pHeight * deltaHeight;
            viewbox[3] = parseInt(viewbox[3]) + pHeight * deltaHeight;
            viewboxIsUpdate = true
        }

        if (draggedPieceBottomY > agregatBottomY) {
            this.emplacement[agregatNo].agregatBottomNo = draggedPieceBottomNo
            deltaHeight = draggedPieceBottomY - agregatBottomY
            agregat.setAttribute("height", (parseInt(agregat.getAttribute("height"), 10) + pHeight * deltaHeight) + "px")
            viewbox[3] = parseInt(viewbox[3]) + pHeight * deltaHeight;
            viewboxIsUpdate = true
        }
        if (viewboxIsUpdate) {
            agregat.setAttribute("viewBox", viewbox.join(" "))
        }

    }

    setAgregatPath(agregat, agregatNo, inAgregat) {
        /* start from Top piece top
                set border (top left right bottom) depending on neighbour x+(-1,0,1), y+(-1,0,1) => continue on same piece or neighbour piece side
           stop when back to top piece top
        */

        //start from Top piece top
        let startPosition = this.emplacement[agregatNo].agregatTopNo;
        let side = 0;
        let position = startPosition;
        let coord = xyPosition(position);
        let agregatPath = "M " + (coord.x * pWidth) + " " + (coord.y * pHeight) + " ";
        let maxiteration = 1000
        do {
            // console.log("position : " + position + ", side : " + side + ", coord.x, coord.y : " + coord.x + ", " + coord.y)
            let shape = this.sideShape(side, coord.x, coord.y)
            agregatPath += PuzzleShapeBorders[side][shape + 1];

            let nextPath = this.findNextBorder(position, side, coord, inAgregat)
            side = nextPath.side
            position = nextPath.position
            coord = xyPosition(position)
        }
        while (!(position == startPosition && side == 0) && maxiteration-- > 0)
        // console.log("end while position : " + position + ", side : " + side + ", coord.x, coord.y : " + coord.x + ", " + coord.y)

        // svgMask.setAttribute("d", agregatPath);

        //supprimer tous les paths
        let svgMask = agregat.firstChild; // mask
        while (svgMask.firstChild) { // path
            svgMask.removeChild(svgMask.firstChild);
        }

        // creation path
        let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        newPath.setAttribute("d", agregatPath);
        newPath.setAttribute("fill", "white");
        svgMask.appendChild(newPath);

        // zones masquées au sein de l'agrégat
        let surrounded = this.setAgregatHolesPath(agregatNo, inAgregat);
        surrounded.forEach(pieceNo => {
            newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            newPath.setAttribute("d", document.querySelector('svg[position="' + pieceNo + '"]').firstChild.firstChild.getAttribute("d"));
            // newPath.setAttribute("fill", "black"); // mask

            svgMask.appendChild(newPath); // ajouter path à mask
        })

    }

    setAgregatHolesPath(agregatNo, inAgregat) {
        // https: //leetcode.com/problems/surrounded-regions/
        // si plus de 7 pieces 
        let xAgrMin = xyPosition(this.emplacement[agregatNo].agregatLeftNo).x,
            yAgrMin = xyPosition(this.emplacement[agregatNo].agregatTopNo).y,
            xAgrMax = xyPosition(this.emplacement[agregatNo].agregatRightNo).x,
            yAgrMax = xyPosition(this.emplacement[agregatNo].agregatBottomNo).y;

        let surrounded = [],
            wayOut = [];
        // pour chaque pièce de la zone rectangulaire de l'agrégat 
        // todo en colimaçon
        for (let y = yAgrMin; y <= yAgrMax; y++) {
            for (let x = xAgrMin; x <= xAgrMax; x++) {
                let pieceNo = positionXY(x, y)

                if (inAgregat.indexOf(pieceNo) < 0) { // si la pièce n'est pas dans l'agrégat
                    if (x == xAgrMin || x == xAgrMax || y == yAgrMin || y == yAgrMax) { // si la pièce est au bord de l'agrégat
                        wayOut = wayOut.concat(pieceNo)
                    } else {
                        let isWayOut = false
                        for (let v = 0; v < this.emplacement[pieceNo].voisins.length; v++) {
                            let voisinNo = this.emplacement[pieceNo].voisins[v]
                            if (wayOut.indexOf(voisinNo) >= 0) { // si un voisin est dans wayOut
                                isWayOut = true
                                break // inutile de voir les autres voisins
                            } else {
                                if (inAgregat.indexOf(voisinNo) < 0) {
                                    let vxy = xyPosition(voisinNo)
                                    if (vxy.x == xAgrMax || vxy.y == yAgrMax || vxy.x == xAgrMin || vxy.y == yAgrMin) { // si un voisin est au bord de l'agrégat
                                        isWayOut = true
                                        break // inutile de voir les autres voisins
                                    }
                                }
                            }
                        }
                        if (isWayOut) {
                            wayOut = wayOut.concat(pieceNo)
                        } else {
                            surrounded = surrounded.concat(pieceNo)
                        }
                    }
                }
            }
        }
        console.log("surrounded :" + surrounded.length)
            // surrounded.forEach(pieceNo => {
            //     let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            //     newPath.setAttribute("d", document.querySelector('svg[position="' + pieceNo + '"]').firstChild.firstChild.getAttribute("d"));
            //     // newPath.setAttribute("fill", "black"); // mask

        //     agregat.firstChild.appendChild(newPath); // ajouter path à mask
        // })
        return surrounded;
    }

    findNextBorder(position, side, coord, inAgregat) {
        const sidesVoisin = [
            [{ dx: 1, dy: -1, ns: 3 }, { dx: 1, dy: 0, ns: 0 }], // top 2 neighbours {delta x, delat y, next side}
            [{ dx: 1, dy: 1, ns: 0 }, { dx: 0, dy: 1, ns: 1 }], // right neighbours
            [{ dx: -1, dy: 1, ns: 1 }, { dx: -1, dy: 0, ns: 2 }], // bottom
            [{ dx: -1, dy: -1, ns: 2 }, { dx: 0, dy: -1, ns: 3 }] // left
        ];

        for (let i = 0; i < 2; i++) {
            let sv = sidesVoisin[side][i];
            let x = coord.x + sv.dx,
                y = coord.y + sv.dy;
            if (x >= 0 && x < xMax && y >= 0 && y < yMax) {
                let voisin = positionXY(x, y)
                if (inAgregat.indexOf(voisin) >= 0) {
                    return { position: voisin, side: sv.ns }
                }
            }
        }
        return { position: position, side: (side + 1) % 4 } // poursuivre sur la même pièce
    }

    sideShape(side, x, y) {
        switch (side) {
            case 0: // top
                return y == 0 ? 0 : xyshape[x][y - 1].bottom;
            case 1: // right
                return x == xMax - 1 ? 0 : xyshape[x][y].right;
            case 2: // bottom
                return y == yMax - 1 ? 0 : xyshape[x][y].bottom;
            case 3: // left
                return x == 0 ? 0 : xyshape[x - 1][y].right;
        }
    }
}

function xyPosition(position) { return { x: position % gridSize, y: Math.floor(position / gridSize) } }

function positionXY(x, y) { return y * yMax + x }

function numLeft(elem) { return parseInt(elem.style.left, 10); }

function numZindex(elem) { return parseInt(elem.style.zIndex, 10); }

function numTop(elem) { return parseInt(elem.style.top, 10); }

async function nouvelleImage() {
    document.querySelectorAll(".taille").forEach(elem => elem.addEventListener("change", changerNiveau));
    document.querySelector("#nouvelleImage").addEventListener("click", nouvelleImage);
    document.querySelector("form").reset();
    document.querySelector("#rejouer").addEventListener("click", chargerPuzzle);
    document.querySelector('input[type=file]').addEventListener("click", previewFile);
    images = ['http://source.unsplash.com/random'];
    //let i = (Math.floor((Math.random() * (images.length - 1)) + 0.5));
    let i = 0;
    imagePuzzle = images[i]; // random image

    modele = document.querySelector("#modele");
    tapis = document.querySelector("#tapis");
    message = document.querySelector("#message");
    await _loadImage(imagePuzzle, modele);

    await chargerPuzzle();
}

async function _loadImage(url, elem) {
    return new Promise((resolve, reject) => {
        elem.onload = () => resolve(elem);
        elem.onerror = reject;
        elem.src = url;
    });
}

async function chargerPuzzle() {
    await document.querySelector('#imgmodele').setAttributeNS('http://www.w3.org/1999/xlink', 'href', modele.src);
    imagePuzzle = "#imgmodele"

    imgWidth = modele.naturalWidth;
    imgHeight = modele.naturalHeight;
    //vidage pour rejeu
    while (tapis.firstChild) {
        tapis.removeChild(tapis.firstChild);
    }


    slice();

    // shuffle()

    function slice() {
        // width and height ratio
        if (imgWidth > imgHeight) {
            puzzleWidth = Math.floor(puzzleHeight * imgWidth / imgHeight)
        } else {
            puzzleHeight = Math.floor(puzzleWidth * imgHeight / imgWidth)
        }

        pWidth = Math.floor(puzzleWidth / gridSize);
        pHeight = Math.floor(puzzleHeight / gridSize);
        pWidth10 = Math.floor(pWidth / 10)
        pHeight10 = Math.floor(pHeight / 10)

        initShapeSet();

        xMax = gridSize;
        yMax = gridSize;

        svgWidth = pWidth + pWidth10 * 4;
        svgHeight = pHeight + pHeight10 * 4;

        tapis.style.width = (xMax * svgWidth) + 'px';
        tapis.style.height = (yMax * svgHeight) + 'px';

        puzzleWidth = xMax * pWidth
        puzzleHeight = yMax * pHeight

        document.querySelector('#imgmodele').setAttribute("width", puzzleWidth + "px");
        document.querySelector('#imgmodele').setAttribute("height", puzzleHeight + "px");

        xyshape.length = 0 // Clear array

        //style dynamique
        for (let i = 0; i < document.styleSheets[0].cssRules.length; i++) {
            // svg[position={clip-path: url(#path_x_y);}
            if (document.styleSheets[0].cssRules[i].selectorText.indexOf("svg[position=") >= 0) {
                document.styleSheets[0].deleteRule(i);
            }
        }

        for (let y = 0; y < yMax; y++) {
            for (let x = 0; x < xMax; x++) {
                createsvgpath(x, y);
            }
        }

        emplacement = new Emplacement();
        // console.log(emplacement);
    }

    function shuffle() {
        do {
            for (let i = tapis.children.length; i > 0; i--) {
                tapis.appendChild(tapis.children[Math.random() * i | 0]);
            }
        } while (success(false))
        for (let i = 0; i < tapis.children.length; i++) {
            tapis.children[i].style.left = ((i % gridSize) * svgWidth + tapis.offsetLeft) + "px"
            tapis.children[i].style.top = (Math.floor(i / gridSize) * svgHeight + tapis.offsetTop) + "px"
        }
    }

    function initShapeSet() {
        let pWidthajust = pWidth % 10,
            pHeightajust = pHeight % 10;

        PuzzleShapeBorders = [ // [0-top/1-right/3-bottom/3-left/4-first MOVE][0-creux/1-flat/2-bosse]
            [poignee(-1, 0, pWidthajust), "h " + pWidth, poignee(1, 0, pWidthajust)], // top 
            [poignee(-1, 90, pHeightajust), "v " + pHeight, poignee(1, 90, pHeightajust)], // right
            [poignee(-1, 180, pWidthajust), "h " + -pWidth, poignee(1, 180, pWidthajust)], // bottom
            [poignee(-1, 270, pHeightajust), "v " + -pHeight, poignee(1, 270, pHeightajust)] // left
            // ["M " + (coord.x * pWidth) + " " + (coord.y * pHeight) + " "] // first move [4,0]
            // ["Z", poignee(1, 270, pHeightajust), poignee(-1, 270, pHeightajust)] // left
        ];
    }
}

function createsvgpath(x, y) {
    let left = (x == 0 ? 0 : (xyshape[x - 1][y].right)),
        top = (y == 0 ? 0 : (xyshape[x][y - 1].bottom)),
        right = (x == xMax - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1)),
        bottom = (y == yMax - 1 ? 0 : (Math.random() < 0.5 ? 1 : -1));

    if (xyshape.length == 0) {
        for (var i = 0; i < xMax; i++) {
            xyshape[i] = [];
        }
    }
    xyshape[x][y] = {
        right: right,
        bottom: bottom,
    };

    let position = (y * yMax + x);
    let shapeid = "path_" + x + "_" + y; //@todo test si shape existe déjà

    let xPosition = x * pWidth // + pWidth10 * (left ? 2 : 0)
    let yPosition = y * pHeight // + pHeight10 * (top ? 2 : 0)

    // pathX = (xPosition + 0.5); // init pour path absolu
    // pathY = (yPosition + 0.5);
    pathX = (xPosition); // init pour path absolu
    pathY = (yPosition);

    let shapepath = "M " + pathX + " " + pathY + " " +
        // beziercurve(top, right, bottom, left);
        PuzzleShapeBorders[0][top + 1] +
        PuzzleShapeBorders[1][right + 1] +
        PuzzleShapeBorders[2][bottom + 1] +
        PuzzleShapeBorders[3][left + 1];

    let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("d", shapepath);
    newPath.setAttribute("fill", "white"); // mask


    // let newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    let newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    newClipPath.setAttribute("id", shapeid);
    newClipPath.appendChild(newPath);

    let newImage = document.createElementNS("http://www.w3.org/2000/svg", "use");
    newImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagePuzzle);

    // newImage.setAttribute("clip-path", "url(#" + shapeid + ")");
    newImage.setAttribute("mask", "url(#" + shapeid + ")");
    // document.styleSheets[0].insertRule('svg[position="' + position + '"] {clip-path: url(#' + shapeid + ');}');
    // https://codepen.io/vur/pen/pvxbwW

    let newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    newSvg.setAttribute("width", svgWidth + "px");
    newSvg.setAttribute("height", svgHeight + "px");
    newSvg.setAttribute("viewBox", (xPosition - pWidth10 * 2) + " " + (yPosition - pHeight10 * 2) + " " + (1 + svgWidth) + " " + (1 + svgHeight));
    // newSvg.setAttribute("clip-path", "url(#" + shapeid + ")");

    newSvg.setAttribute("position", position);

    // newSvg.style.left = (x * svgWidth + tapis.offsetLeft) + "px"
    // newSvg.style.top = (y * svgHeight + tapis.offsetTop) + "px"
    newSvg.style.left = (x * svgWidth) + "px"
    newSvg.style.top = (y * svgHeight) + "px"

    // document.querySelector('#svgmodele').lastElementChild.appendChild(newClipPath);
    newSvg.appendChild(newClipPath);

    // let newRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    // newRect.setAttribute("clip-path", "url(#" + shapeid + ")");
    // newRect.setAttribute("width", imgWidth + "px");
    // newRect.setAttribute("height", imgHeight + "px");
    // newRect.setAttribute("fill", "#1D0F4E");
    // let newG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    // newG.setAttribute("class", "gbordure");
    // newG.appendChild(newRect);
    // newSvg.appendChild(newG);

    newSvg.appendChild(newImage);

    draggable(newSvg)

    tapis.appendChild(newSvg);

    // function beziercurve() {
    //     let pWidthajust = pWidth % 10
    //     let pHeightajust = pHeight % 10

    //     let path = "";
    //     path += top == 0 ? "h " + pWidth : poignee(top, 0, pWidthajust); // top 0°
    //     path += right == 0 ? "v " + pHeight : poignee(right, 90, pHeightajust);
    //     path += bottom == 0 ? "h " + -pWidth : poignee(bottom, 180, pWidthajust);
    //     path += left == 0 ? "Z" : poignee(left, 270, pHeightajust);
    //     return pathIsAbsolu ? path.toUpperCase() : path;
    // }

}

function poignee(c, r, adjust) {
    // creux top M0,0 h3 s2,0 1,1   s0,1 1,1  s2,0 1,-1  s1,-1 1,-1 h3
    return " l " + trsl(3, 0) +
        " s " + trsl(2, 0) + trsl(1, 1) +
        " s " + trsl(0, 1) + trsl(1, 1) +
        " l " + trsl(0, 0, adjust) +
        " s " + trsl(2, 0) + trsl(1, -1) +
        " s " + trsl(1, -1) + trsl(1, -1) +
        " l " + trsl(3, 0);

    function trsl(x, y, adjust_default = 0) {
        let X, Y;
        if (r == 0 || r == 180) {
            X = pWidth10 * x + adjust_default;
            Y = pHeight10 * c * y; //  y négatifs si creux
        } else { // 90° ou 270°
            // inverser x,y
            Y = pHeight10 * x + adjust_default; //  x négatifs si creux
            X = pWidth10 * c * y;
        }
        if (pathIsAbsolu) {
            pathX += (r == 180 ? -X : X); // x négatif si 180°
            pathY += (r == 270 ? -Y : Y); // y négatif si 270°
            return pathX + "," + pathY + " ";

        } else {
            return (r == 180 ? -X : X) + "," + (r == 270 ? -Y : Y) + " "; // x négatif si 180°, y négatif si 270°
        }
    }
}

function draggable(newSvg) {

    newSvg.addEventListener('mousedown', startDrag);
    newSvg.addEventListener('mousemove', drag);
    newSvg.addEventListener('mouseup', endDragDrop); // drop 
    newSvg.addEventListener('mouseleave', endDrag);
    // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
    // var el = document.getElementById("canvas");
    newSvg.addEventListener("touchstart", startDrag, { passive: false });
    newSvg.addEventListener("touchmove", drag, false);
    newSvg.addEventListener("touchend", endDragDrop, false);
    newSvg.addEventListener("touchcancel", endDrag, false);

    function startDrag(evt) {
        //  https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/ 
        // https://www.wikimass.com/js/mouseevent-properties
        // https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events

        evt.preventDefault();

        //todo drag de plusieurs pièces en même temps
        if (evt.changedTouches) evt = evt.changedTouches[0];
        if (evt.touches) evt = evt.touches[0];

        // let x = evt.screenX
        // let y = evt.screenY
        let x = evt.clientX
        let y = evt.clientY

        console.log("startDrag draggedPiece:" + evt.target.nodeName + " : " + x + "," + y)
            // message.innerHTML = "startDrag draggedPiece:" + evt.target.nodeName + " : " + x + "," + y
        let debug;
        if (evt.target.nodeName == 'use') {
            debug = getPosition(evt.target)
            console.log("use : " + debug.x + "," + debug.y)
            draggedPiece = evt.target.parentNode; // svg de Use
            debug = getPosition(draggedPiece)
            console.log("draggedPiece : " + debug.x + "," + debug.y)
        } else {
            // cas svg avec zone vide qui empeche sélection pièce en dessous
            let z = -1;
            debug = getPosition(evt.target)
            console.log("evt.target : " + debug.x + "," + debug.y)

            document.querySelectorAll('svg[position]').forEach(svg => {
                if (svg != evt.target) {
                    debug = getPosition(svg)
                    console.log("svg : " + debug.x + "," + debug.y)

                    let xSvg = numLeft(svg),
                        ySvg = numTop(svg),
                        zSvg = svg.style.zIndex == "" ? 0 : numZindex(svg);

                    //  sélection plus haute pièce
                    if (x > xSvg && x < xSvg + svg.clientWidth && y > ySvg && y < ySvg + svg.clientHeight && z < zSvg) {
                        draggedPiece = svg;
                        z = zSvg;
                    }
                }
            })
            if (!draggedPiece) {
                // console.log("startDrag svg non localisé :");
                return;
            }
            normalDrag = false;
        }

        draggedPiece.style.zIndex = ++zIndex;
        // vitesseX = 0;
        // vitesseY = 0;

        offset.x = x - numLeft(draggedPiece)
        offset.y = y - numTop(draggedPiece)
            // console.log("startDrag pret  position :" + draggedPiece.getAttribute("position"))
    }

    function drag(evt) {
        evt.preventDefault();
        if (evt.changedTouches) evt = evt.changedTouches[0];
        if (evt.touches) evt = evt.touches[0];

        // console.log("drag " + evt.target.nodeName + " : " + evt.x + "," + evt.y)
        if (draggedPiece) {

            let x = evt.clientX - offset.x,
                y = evt.clientY - offset.y;

            // anticiper accélération
            // let px = numLeft(draggedPiece),
            //     py = numTop(draggedPiece);

            // let progressionX = Math.abs(x - px),
            //     progressionY = Math.abs(y - py);
            // if (progressionX > vitesseX) {
            //     x += (x - px)
            // }
            // if (progressionY > vitesseY) {
            //     y += (y - py)
            // }
            // console.log("drag " + evt.target.parentNode.id +
            //     ", piece :" + px + "," + py +
            //     ", vitesse :" + vitesseX + "," + vitesseY +
            //     ", mouse :" + x + "," + y +
            //     ", progression :" + progressionX + "," + progressionY)

            // vitesseX = progressionX;
            // vitesseY = progressionY;


            // console.log("drag " + evt.target.nodeName +
            //     " piece left,top :" + draggedPiece.style.left + "," + draggedPiece.style.top +
            //     ", mouse x,y :" + +evt.clientX + "," + evt.clientY +
            //     ", delta x,y :" + (evt.screenX - offset.x) + "," + (evt.screenY - offset.y) )

            draggedPiece.style.left = x + "px"
            draggedPiece.style.top = y + "px"
        }
    }

    function endDrag(evt) {
        evt.preventDefault();

        // if (evt.changedTouches) evt = evt.changedTouches[0];
        // if (evt.touches) evt = evt.touches[0];

        // console.log("endDrag " + evt.target.nodeName + " : " + evt.clientX + "," + evt.clientX)
        // message.innerHTML = "endDrag " + evt.target.nodeName + " : " + evt.clientX + "," + evt.clientX
        if (draggedPiece && normalDrag) {
            draggedPiece = null;
        }
    }

    function endDragDrop(evt) {
        evt.preventDefault();

        // if (evt.changedTouches) evt = evt.changedTouches[0];
        // if (evt.touches) evt = evt.touches[0];

        // console.log("endDragDrop " + evt.target.nodeName + " : " + evt.x + "," + evt.y)
        if (draggedPiece) {
            // cherche piece voisine à proximité à agréger (et qui n'est pas déjà dans l'agrégat déplacé)
            if (emplacement.accoster()) {
                draggedPiece.remove()
            }
            draggedPiece = null;
            success()
        }
        normalDrag = true;
    }
}

function success(finish = true) {
    if (tapis.children.length > 1) return false;
    if (!finish) return true;

    document.querySelector('#results').style.display = "block";
    document.querySelector('#modele').style.display = "none";
    // document.querySelector('#tapis').style.display = "none";
    document.body.style.backgroundColor = "green";

    // for (let i = document.styleSheets[0].cssRules.length - 1; i >= 0; i--) {
    //     let stylei = document.styleSheets[0].cssRules[i].selectorText;
    //     if (stylei == ".gbordure") {
    //         document.styleSheets[0].deleteRule(i);
    //     }
    // }
}

async function changerNiveau() {
    gridSize = this.value * 1;
    chargerPuzzle();
}

async function rechargerPage() {
    // window.reload(true)
    await nouvelleImage()
}

function previewFile() {
    // The button where the user chooses the local image to display
    var file = document.querySelector('input[type=file]').files[0];
    if (file) {
        // FileReader instance
        var reader = new FileReader();
        // When the image is loaded we set it as source of our img tag
        reader.onloadend = async function() {
            // Where you will display your image
            await _loadImage(reader.result, modele);
            chargerPuzzle()
        }

        // Load image as a base64 encoded URI
        reader.readAsDataURL(file);
    }
}

function sound() {
    //music notes https://marcgg.com/blog/2016/11/01/javascript-audio/
    var context = new AudioContext()
    var o = context.createOscillator()
    var g = context.createGain()
    o.connect(g)
    g.connect(context.destination)
    o.start(0)
    g.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.04)
    o.stop(0.5)
}

function getPosition(el) {
    var xPos = 0;
    var yPos = 0;

    while (el) {
        if (el.tagName == "BODY") {
            // deal with browser quirks with body/window/document and page scroll
            var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
            var yScroll = el.scrollTop || document.documentElement.scrollTop;

            xPos += (el.offsetLeft - xScroll + el.clientLeft);
            yPos += (el.offsetTop - yScroll + el.clientTop);
        } else {
            // for all other non-BODY elements
            xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
            yPos += (el.offsetTop - el.scrollTop + el.clientTop);
        }

        el = el.offsetParent;
    }
    return {
        x: xPos,
        y: yPos
    };
}
document.addEventListener("DOMContentLoaded", nouvelleImage);