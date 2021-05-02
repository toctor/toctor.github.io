/* @todo

multi touche :  2eme touche ramene la premiere piece sous le second doigt

animer le morcellemnt de l'image puis le mélange des pièces
m
occuper tout l'espace de l'écran

a tester sur mobile  touch : gérer plusieurs touches simultanées
    https://developer.mozilla.org/en-US/docs/Web/API/Document/elementFromPoint
    http://www.javascriptkit.com/javatutors/touchevents.shtml


piece border

pas terrible :
déplacement rapide perd la piece => acceleration ou positionner/rapprocher  centre piece sous la souris

cookies setting : SameSite=Lax : 

sound on/off
choix image : gallerie avec images préférées, réussies, nouvelles, ...

scénario animation 
1) animer le morcellemnt de l'image puis le mélange des pièces

a) puzzle constitué s'affiché sans modele
b) fissure et se mélange tombre vers le bas ou autour du tapis
c) le modèle s'affiche avc possibilité de le déplacer ? masquer/réafficher ?

accessibilité 
https://www.joshwcomeau.com/blog/hands-free-coding/

anim fin) confetti ?

arrosage spirale : https://codepen.io/hakimel/pen/aIhkf
    https://codepen.io/danwilson/pen/ybLrWe
pieces disposées en cubes imbriquées et tournants : https://webkit.org/blog-files/3d-transforms/morphing-cubes.html
étaler sur le tapis avec  une impression de vague : https://codepen.io/hakimel/pen/vDnmp
chaque piece réduise de taille et se raprochent pour faire une forme
GSAP Morphsvg

user current preference  : https://css-irl.info/debugging-media-queries-a-dev-tools-wish-list/

amélioration
- orientation des pièces sur écran tactile, repositionnement deux doigts

biblio :
https://developer.mozilla.org/en-US/
https://ishadeed.com/article/say-hello-to-css-container-queries/
https://codepen.io/HunorMarton/pen/PoGbgqj
https://bashooka.com/
framework
    https://github.com/pixijs/pixi.js : HTML5 Creation Engine: Create beautiful digital content with the fastest, most flexible 2D WebGL renderer

fun
- cube pack https://codepen.io/davidkpiano/pen/aqNZxX
- photo tear : https://codepen.io/ste-vg/pen/rNjOgYv
water effect : https://codepen.io/ge1doot/pen/VYXGoo (cliquable)
water ripple : https://codepen.io/al-ro/details/NjOrPV (cliquable)
text blinker : https://codepen.io/RoryGrenade/pen/XbeGZr
- animation de fin
- chnagement d'image slider
*/

// var imagedebug = 'https://unsplash.it/600/600?image=598' // 1074 : lion
"use strict";
const marge = 10;
var gridSize = 4,
    xMax, yMax,
    images, imgWidth, imgHeight,
    imagePuzzle, modele, xyshape = [],
    tapis, nbPiece,
    puzzleHeight = 300,
    puzzleWidth = 300, // @todo : ajust with screen size
    pWidth, pHeight, pWidth2, pHeight2,
    pWidth10, pHeight10,
    svgWidth, svgHeight,
    // dragAgregatNo, dragAgregated, draggedPieceNo, draggedPiece, 
    zIndex = 0,
    draggedPieces = [],
    // offset = { x: 0, y: 0 },
    emplacement;
const pathIsAbsolu = false; // true ko : todo Génération Clip-Path absolu à revoir
var pathX, pathY; // pour construire forme puzzle 
// var normalDrag = true; // set to false when drag piece under svg with masked zone
var message;
var debugmessage = "";
var PuzzleShapeBorders = [];
// var vitesseX, vitesseY;

class Emplacement { // pieces are not regrouped in one, but moved together
    constructor() {
        this.emplacement = [];

        for (let y = 0; y < yMax; y++) {
            for (let x = 0; x < xMax; x++) {
                // position
                let position = y * yMax + x;
                let svg = document.querySelector('svg[position="' + position + '"]');

                //voisins
                let voisins = [];
                if (x > 0) voisins.push(position - 1); // left neighbour
                if (x < xMax - 1) voisins.push(position + 1); // right neighbour
                if (y > 0) voisins.push((y - 1) * yMax + x); // top neighbour
                if (y < yMax - 1) voisins.push((y + 1) * yMax + x); // bottom neighbour

                this.emplacement.push({
                    svg: svg, // fixed
                    x: x,
                    y: y,
                    voisins: voisins, // pieces voisines du puzzle mis à jours après agrégation. une pièce ne peut etre dans l'agrégat ET dans voisin ! ????
                    agregatNo: position, // agrégat mis à jour à chaque intégration dans un agrégat
                    agregated: [position],
                    agregatVoisins: [...voisins] // pour éviter de pointer sur l'array de voisins
                });
            }
        }
    }

    dragAgregatZindexOK1(zindex) {
        // set draggedPieceNo, dragAgregatNo, dragAgregated

        dragAgregatNo = this.emplacement[draggedPieceNo].agregatNo
        dragAgregated = this.emplacement[dragAgregatNo].agregated
            // set dragAgregated pieces z-index to top
        dragAgregated.forEach(pieceNo => {
            this.emplacement[pieceNo].svg.style.zIndex = zindex
        })
    }

    dragAgregatZindex(draggedPiece) {
        // set draggedPieceNo, dragAgregatNo, dragAgregated
        draggedPiece.dragAgregatNo = this.emplacement[draggedPiece.draggedPieceNo].agregatNo
        draggedPiece.dragAgregated = this.emplacement[draggedPiece.dragAgregatNo].agregated
            // set dragAgregated pieces z-index to top
        zIndex++; // new top
        draggedPiece.dragAgregated.forEach(p => {
            this.emplacement[p].svg.style.zIndex = zIndex
        })
    }

    deplacerAgregat(pieceNo, deltaLeft, deltaTop) { // Déplacement des svg avec la souris ou touch
        // if (!pieceNo) {
        //     console.log("deplacerAgregat pieceNo indéfini")
        // }
        for (let p of this.emplacement[pieceNo].agregated) {
            let svgStyle = this.emplacement[p].svg.style
                // console.log("check deplacer p:" + p + "=" + svgStyle.left + " " + svgStyle.top + " delta:" + deltaLeft + " " + deltaTop)
            if (parseInt(svgStyle.left) + deltaLeft < 0 || parseInt(svgStyle.top) + deltaTop < 0) {
                return // block mouvement
            }
        }
        this.emplacement[pieceNo].agregated.forEach(p => {
            // let svg = this.emplacement[p].svg
            let svgStyle = this.emplacement[p].svg.style
            svgStyle.left = (parseInt(svgStyle.left) + deltaLeft) + "px"
            svgStyle.top = (parseInt(svgStyle.top) + deltaTop) + "px"
        })
    }

    dragEnd(draggedPiece) {
        let voisinsAgregatEvaluated = [],
            toAjdustAgregated = [],
            gapLeft,
            gapTop;

        let dragAgregatNo = draggedPiece.dragAgregatNo,
            dragAgregated = draggedPiece.dragAgregated
            /*
                    let draggedPiece = {
                        draggedSvg: svg,
                        draggedPieceNo: draggedPieceNo,
                        offset: offset,
                        dragAgregatNo: null,
                        dragAgregated: null,
                        touchId: evt.identifier
                    }
            */
            // évaluer la distance de chaque voisin de l'agregat déplacé 
        this.emplacement[dragAgregatNo].agregatVoisins.forEach(voisinNo => {
            let voisinAgregatNo = this.emplacement[voisinNo].agregatNo // agrégat du voisin

            if (voisinsAgregatEvaluated.indexOf(voisinAgregatNo) < 0) { // agrégat du voisin n'a pas déjà été évalué  
                voisinsAgregatEvaluated.push(voisinAgregatNo)

                //  l'évaluation de la distance avec 1 pièce de l'agrétat déplacé suffit
                let dragNo = this.emplacement[voisinNo].voisins.find(p => { return dragAgregated.indexOf(p) >= 0 })

                let dragged = { 'left': this.pieceNoNumLeft(dragNo), 'top': this.pieceNoNumTop(dragNo), 'x': this.emplacement[dragNo].x, 'y': this.emplacement[dragNo].y }
                let voisin = { 'left': this.pieceNoNumLeft(voisinNo), 'top': this.pieceNoNumTop(voisinNo), 'x': this.emplacement[voisinNo].x, 'y': this.emplacement[voisinNo].y }

                gapLeft = dragged.left - (voisin.left + pWidth * (dragged.x == voisin.x ? 0 : (dragged.x > voisin.x ? 1 : -1)))
                gapTop = dragged.top - (voisin.top + pHeight * (dragged.y == voisin.y ? 0 : (dragged.y > voisin.y ? 1 : -1)));

                if ((Math.abs(gapLeft) < marge && Math.abs(gapTop) < marge)) {
                    toAjdustAgregated.push({ voisinAgregatNo: voisinAgregatNo, gapLeft: gapLeft, gapTop: gapTop })
                }
            }
        });

        if (toAjdustAgregated) {
            // ajuster left et top des pièces rejoints 
            // @todo ajuster déplacés ou rejoints (si plusieurs rejoints) ou fonction nb pieces
            toAjdustAgregated.forEach(g => {
                this.agreger(g.voisinAgregatNo, dragAgregatNo)
                this.deplacerAgregat(g.voisinAgregatNo, g.gapLeft, g.gapTop)
            })
            return this.success()
        }
    }

    agreger(voisinAgregatNo, dragAgregatNo) {

        sound()

        // Ajouter pièces agrégat voisin à dragAgregated
        this.emplacement[voisinAgregatNo].agregated.forEach(p => {
            this.emplacement[dragAgregatNo].agregated.push(p) // ajouter pièces dans dragAgregated !!! vérifier que emplacement est bien mis à jour (pb réf array)
            this.emplacement[p].agregatNo = dragAgregatNo // Rattacher pièces agrégat rejoint à dragAgregated
        })

        // Ajouter nouveaux voisins  
        this.emplacement[voisinAgregatNo].agregatVoisins.forEach(v => {
                if (this.emplacement[dragAgregatNo].agregatVoisins.indexOf(v) < 0) { // sans doublons 
                    this.emplacement[dragAgregatNo].agregatVoisins.push(v);
                }
            })
            // console.log("Ajouter nouveaux voisins " + this.emplacement[dragAgregatNo].agregatVoisins.reduce((a, v) => { return a + "," + v }))

        // Retirer voisins intégrés
        this.emplacement[dragAgregatNo].agregatVoisins = this.emplacement[dragAgregatNo].agregatVoisins.filter(v => {
                return this.emplacement[dragAgregatNo].agregated.indexOf(v) < 0
            })
            // console.log("Retirer voisins intégrés " + (this.emplacement[dragAgregatNo].agregatVoisins.length > 0 ? this.emplacement[dragAgregatNo].agregatVoisins.reduce((a, v) => { return a + "," + v }) : ""))

    }

    success() {
        for (let p = 1; p < nbPiece; p++) {
            if (this.emplacement[p].agregatNo != this.emplacement[p - 1].agregatNo) {
                return false
            }
        }
        return true
    }

    pieceNoNumLeft(pieceNo) { return parseInt(this.emplacement[pieceNo].svg.style.left); }

    pieceNoNumTop(pieceNo) { return parseInt(this.emplacement[pieceNo].svg.style.top); }

}

// function numZindex(elem) { return parseInt(elem.style.zIndex); }


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

    emplacement = new Emplacement();

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
        pWidth2 = Math.floor(pWidth / 2)
        pHeight2 = Math.floor(pHeight / 2)

        initShapeSet();

        xMax = gridSize;
        yMax = gridSize;
        nbPiece = xMax * yMax

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
        // for (let i = 0; i < document.styleSheets[0].cssRules.length; i++) {
        //     // svg[position={clip-path: url(#path_x_y);}
        //     if (document.styleSheets[0].cssRules[i].selectorText.indexOf("svg[position=") >= 0) {
        //         document.styleSheets[0].deleteRule(i);
        //     }
        // }

        for (let y = 0; y < yMax; y++) {
            for (let x = 0; x < xMax; x++) {
                createsvgpath(x, y);
            }
        }

    }

    function shuffle() {
        // do {
        for (let i = tapis.children.length; i > 0; i--) {
            tapis.appendChild(tapis.children[Math.random() * i | 0]);
        }
        // } while (success(false))
        for (let i = 0; i < tapis.children.length; i++) {
            // tapis.children[i].style.left = ((i % gridSize) * svgWidth + tapis.offsetLeft) + "px"
            // tapis.children[i].style.top = (Math.floor(i / gridSize) * svgHeight + tapis.offsetTop) + "px"
            tapis.children[i].style.left = ((i % gridSize) * svgWidth) + "px"
            tapis.children[i].style.top = (Math.floor(i / gridSize) * svgHeight) + "px"
        }
    }

    function initShapeSet() {
        let pWidthajust = pWidth % 10,
            pHeightajust = pHeight % 10;
        PuzzleShapeBorders = [ // [0-top/1-right/3-bottom/3-left/4-first MOVE][0-creux/1-flat/2-bosse]
            [poignee(-1, 0, pWidthajust), "h " + pWidth, poignee(1, 0, pWidthajust)], // horizontal left to right
            [poignee(-1, 90, pHeightajust), "v " + pHeight, poignee(1, 90, pHeightajust)], // vertical top to bottom
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

    // let shapepath = "M " + pathX + " " + pathY + " " +
    // let shapepath = "M " + (pWidth10 * 2) + " " + (pHeight10 * 2) + " " +
    let shapepath = "M " + (pWidth10 * 2) + " " + (pHeight10 * 2) + " " +
        // beziercurve(top, right, bottom, left);
        PuzzleShapeBorders[0][top + 1] +
        PuzzleShapeBorders[1][right + 1] +
        // PuzzleShapeBorders[2][bottom + 1] +
        // PuzzleShapeBorders[3][left + 1];
        "M " + (pWidth10 * 2) + " " + (pHeight10 * 2) + " " +
        PuzzleShapeBorders[1][left + 1] +
        PuzzleShapeBorders[0][bottom + 1];

    let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("d", shapepath);
    // newPath.setAttribute("fill", "white"); // mask


    /*
        invisble area not clickable :
        <svg width="103px" height="156px" viewBox="-14 -22 104 157" position="0" style="left: 208px; top: 8px;">
        <clipPath id="path_0_0b">
            <path d="M0.5,0.5H75.5L75.5,33.5S75.....5,112.5,21.5,112.5L0.5,112.5Z"></path>
        </clipPath>
    
        <g class="gbordure">    <rect clip-path="url(#path_0_0b)" width="1080px" height="1618px" fill="#1D0F4E"></rect> </g>
        ou
          <rect width="103px" height="156px" fill="black"></rect>

        <use xlink:href="#imgmodele" clip-path="url(#path_0_0b)"></use></svg>

        +
        svg[position="0"] {   clip-path: url(#path_0_0);}

        */

    let newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    // let newClipPath = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    newClipPath.setAttribute("id", shapeid);
    newClipPath.appendChild(newPath);

    let newImage = document.createElementNS("http://www.w3.org/2000/svg", "use");
    newImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imagePuzzle);

    // newImage.setAttribute("clip-path", "url(#" + shapeid + ")");
    // newImage.setAttribute("mask", "url(#" + shapeid + ")");
    // document.styleSheets[0].insertRule('svg[position="' + position + '"] {clip-path: url(#' + shapeid + ');}');
    // https://codepen.io/vur/pen/pvxbwW

    let newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    newSvg.setAttribute("width", svgWidth + "px");
    newSvg.setAttribute("height", svgHeight + "px");
    newSvg.setAttribute("viewBox", (xPosition - pWidth10 * 2) + " " + (yPosition - pHeight10 * 2) + " " + (1 + svgWidth) + " " + (1 + svgHeight));
    // newSvg.setAttribute("clip-path", "url(#" + shapeid + ")");
    newSvg.setAttribute("position", position);


    /*
    <svg width="168px" height="103px" viewBox="216 61 169 104" position="CSS6" style="left: 336px; top: 103px; clip-path: url(#csspath_2_1);">
      <use xlink:href="#imgmodele"></use>
    </svg>
    */

    // newSvg.style.left = (x * svgWidth + tapis.offsetLeft) + "px"
    // newSvg.style.top = (y * svgHeight + tapis.offsetTop) + "px"
    newSvg.style.left = (x * svgWidth) + "px"
    newSvg.style.top = (y * svgHeight) + "px"
    newSvg.style.clipPath = "url(#" + shapeid + ")"

    // document.querySelector('#svgmodele').lastElementChild.appendChild(newClipPath);
    newSvg.appendChild(newClipPath);

    /*
    let newRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    newRect.setAttribute("clip-path", "url(#" + shapeid + ")");
    newRect.setAttribute("width", imgWidth + "px");
    newRect.setAttribute("height", imgHeight + "px");
    // newRect.setAttribute("width", svgWidth + "px");
    // newRect.setAttribute("height", svgHeight + "px");
    newRect.setAttribute("fill", "#1D0F4E");

    // newClipPath.appendChild(newRect);
    // newSvg.appendChild(newClipPath);

    let newG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    //newG.setAttribute("class", "gbordure");
    newG.appendChild(newRect);
    newSvg.appendChild(newG);
    */

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

    setEventListener()

    function setEventListener() {
        // https://developer.mozilla.org/en-US/docs/Web/API/Touch_events
        newSvg.addEventListener('mousedown', startDrag);
        newSvg.addEventListener('mousemove', drag);
        newSvg.addEventListener('mouseup', endDragDrop); // drop 
        // newSvg.addEventListener('mouseleave', endDrag);
        newSvg.addEventListener("touchstart", startDrag, { passive: false });
        newSvg.addEventListener("touchmove", drag, false);
        newSvg.addEventListener("touchend", endDragDrop, false);
        // newSvg.addEventListener("touchcancel", endDrag, false);
    }

    function startDrag(evtp) {
        //  https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/ 
        // https://www.wikimass.com/js/mouseevent-properties
        // https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
        evtp.preventDefault();
        //todo drag de plusieurs pièces en même temps
        // if (evt.changedTouches) evt = evt.changedTouches[0];
        // if (evt.touches) evt = evt.touches[0];

        let touches = evtp.type.includes('mouse') ? [evtp] : evtp.changedTouches ? evtp.changedTouches : [];
        for (let evt of touches) {
            let x = evt.clientX
            let y = evt.clientY

            // message.innerHTML = "startDrag elementFromPoint:" + document.elementFromPoint(x, y).parentNode;
            // console.log("startDrag draggedPiece:" + evt.target.nodeName + " : " + x + "," + y)
            let svg = evt.target.parentNode; // svg de Use
            let draggedPieceNo = parseInt(svg.getAttribute("position"))

            let offset = {
                x: x - emplacement.pieceNoNumLeft(draggedPieceNo),
                y: y - emplacement.pieceNoNumTop(draggedPieceNo)
            }

            let draggedPiece = {
                draggedSvg: svg,
                draggedPieceNo: draggedPieceNo,
                offset: offset,
                dragAgregatNo: null,
                dragAgregated: null,
                touchId: (evt.identifier ? evt.identifier : 1)
            }
            draggedPieces.push(draggedPiece)

            message.innerHTML += "<br/>START p" + draggedPieceNo + "-" + draggedPiece.touchId + " " + (evtp.touches ? evtp.touches.length + " touch, " : "") + (evtp.changedTouches ? evtp.changedTouches.length + " change " : "") + draggedPieces.length + " ps. ";
            debugmessage = ""

            emplacement.dragAgregatZindex(draggedPiece)
                // console.log("startDrag pret  position :" + draggedPiece.getAttribute("position"))
        }
    }

    function drag(evtp) {
        evtp.preventDefault();
        // if (evt.changedTouches) evt = evt.changedTouches[0];
        // if (evt.touches) evt = evt.touches[0];
        let touches = evtp.type.includes('mouse') ? [evtp] : evtp.touches ? evtp.touches : [];
        for (let evt of touches) {


            // message.innerHTML = "drag: touches" + evt.changedTouches.length + " evt.client:" + evt.clientX + "," + evt.clientY + "  offset:" + offset.x + "," + offset.y
            // message.innerHTML = "drag: e.client:" + evt.clientX + "," + evt.clientY + "  offset:" + offset.x + "," + offset.y
            let draggedPiece = draggedPieces.find(p => { return p.touchId == (evt.identifier ? evt.identifier : 1) })

            if (draggedPiece) {
                let offset = draggedPiece.offset,
                    draggedPieceNo = draggedPiece.draggedPieceNo,
                    dragAgregatNo = draggedPiece.dragAgregatNo
                let msg = draggedPieceNo + "-" + draggedPiece.touchId + " " + (evtp.touches ? evtp.touches.length + " touch, " : "") + (evtp.changedTouches ? evtp.changedTouches.length + " change " : "") + draggedPieces.length + " ps. "

                if (debugmessage != msg) {
                    message.innerHTML += "<br/>drap p" + msg;
                    debugmessage = msg
                }

                // emplacement.drag(evt.clientX - offset.x, evt.clientY - offset.y)
                let deltaLeft = evt.clientX - offset.x - emplacement.pieceNoNumLeft(draggedPieceNo)
                let deltaTop = evt.clientY - offset.y - emplacement.pieceNoNumTop(draggedPieceNo)

                msg = "" + deltaLeft + "," + deltaTop + " "
                if (deltaLeft > 10) {
                    msg += ", x>10:" + deltaLeft
                    deltaLeft += offset.x > pWidth2 ? 5 : -5;
                    msg += "->" + deltaLeft
                } else {
                    if (deltaLeft < -10) {
                        msg += ", x<-10:" + deltaLeft
                        deltaLeft += offset.x > pWidth2 ? -5 : 5;
                        msg += "->" + deltaLeft
                    }
                }
                if (deltaTop > 10) {
                    msg += ", x>10:" + deltaTop
                    deltaTop += (offset.x > pHeight2 ? 5 : -5)
                    msg += "->" + deltaTop
                } else {
                    if (deltaTop < -10) {
                        msg += ", x<-10:" + deltaTop
                        deltaTop += offset.x > pHeight2 ? -5 : 5;
                        msg += "->" + deltaTop
                    }
                }
                // message.innerHTML = "drag: e.client:" + evt.clientX + "," + evt.clientY + "  offset:" + offset.x + "," + offset.y +
                //     ", delta:" + deltaLeft + "," + deltaTop
                // console.log("delta:" + msg + ", clientXY:" + evt.clientX + "," + evt.clientY + ", pageXY:" + evt.pageX + "," + evt.pageY + "  offset:" + offset.x + "," + offset.y)

                emplacement.deplacerAgregat(dragAgregatNo, deltaLeft, deltaTop)
            }
        }
    }

    function endDrag(evtp) {
        // evtp.preventDefault();
        // let touches = evtp.type.includes('mouse') ? [evtp] : evtp.changedTouches ? evtp.changedTouches : [];
        // for (let evt of touches) {

        //     // if (evt.changedTouches) evt = evt.changedTouches[0];
        //     // if (evt.touches) evt = evt.touches[0];

        //     // console.log("endDrag " + evt.target.nodeName + " : " + evt.clientX + "," + evt.clientX)
        //     // message.innerHTML = "endDrag " + evt.target.nodeName + " : " + evt.clientX + "," + evt.clientX
        //     let draggedPiece = draggedPieces.find(p => { return p.touchId == (evt.identifier ? evt.identifier : 1) })
        //     console.log("todo :supprimer cet draggedPiece de draggedPieces " + draggedPiece)
        //     if (draggedPiece) {
        //         draggedPiece.touchId = null;
        //     }
        //     // if (draggedPiece && normalDrag) {
        //     //     if (draggedPiece) {
        //     //         draggedPiece = null;
        //     // }
        // }
    }

    function endDragDrop(evtp) {
        evtp.preventDefault();
        let touches = evtp.type.includes('mouse') ? [evtp] : evtp.changedTouches ? evtp.changedTouches : [];
        for (let evt of touches) {

            for (let i = 0; i < draggedPieces.length; i++) {
                if (draggedPieces[i].touchId == (evt.identifier ? evt.identifier : 1)) {
                    if (emplacement.dragEnd(draggedPieces[i])) {
                        success()
                    }
                    // draggedPiece = null;
                    draggedPieces.splice(i, 1); // supprimer 1 element à la position i
                    i--;
                }
            }
        }
    }
}

function success(finishTest = true) {
    document.querySelector('#results').style.display = "block";
    document.querySelector('#modele').style.display = "none";
    document.body.style.backgroundColor = "green";
}

async function changerNiveau() {
    gridSize = this.value * 1;
    chargerPuzzle();
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

function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}
document.addEventListener("DOMContentLoaded", nouvelleImage);