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
    if (!animation) return;
    // anime.running exists no longer in v4 - handle instance cancellation manually if needed
    if (typeof animation.pause === "function") animation.pause();
}
