// --------------------------------------
// HTML5
// --------------------------------------
function showAnimationH5(tl, msg) {
    cancelAnimation(tl)

    //TODO

}

function hideAnimationH5(tl) {
    cancelAnimation(tl)

    //TODO
}

// --------------------------------------
// KEY
// --------------------------------------
function showAnimationKEY(tl, msg) {
    cancelAnimation(tl)

    //TODO

}

function hideAnimationKEY(tl) {
    cancelAnimation(tl)

    //TODO
}

// --------------------------------------
// FILL
// --------------------------------------
function showAnimationFILL(tl, msg) {
    cancelAnimation(tl)

    //TODO

}

function hideAnimationFILL(tl) {
    cancelAnimation(tl)

    //TODO
}

// --------------------------------------
// HELPERS
// --------------------------------------
function cancelAnimation (animation) {
    let activeInstances = anime.running;
    let index = activeInstances.indexOf(animation);
    activeInstances.splice(index, 1);
}