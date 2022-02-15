// --------------------------------------
// INIT
// --------------------------------------
function initAnimationDefaults() {
    $(".bauchbinde .white").css('opacity','0');
}

// --------------------------------------
// HTML5
// --------------------------------------
function showAnimationH5(tl, msg) {
    cancelAnimation(tl)

    console.log("msg", msg)

    $(".text h1").html(msg.name || "")
    $(".text h2").html(msg.title || "")

    // Create a timeline with default parameters
    tl = anime.timeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    // Add children
    tl
    .add({
        targets: '.bauchbinde .white',
        opacity: 1
    });
}

function hideAnimationH5(tl) {
    cancelAnimation(tl)

    tl = anime.timeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    tl
    .add({
        targets: '.bauchbinde .white',
        opacity: 0
    });
}

// --------------------------------------
// KEY
// --------------------------------------
function showAnimationKEY(tl, msg) {
    cancelAnimation(tl)

    $(".text h1").html(msg.name || "")
    $(".text h2").html(msg.title || "")

    // Create a timeline with default parameters
    tl = anime.timeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    // Add children
    tl
    .add({
        targets: '.bauchbinde .white',
        opacity: 1
    });
}

function hideAnimationKEY(tl) {
    cancelAnimation(tl)

    tl = anime.timeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    tl   
    .add({
        targets: '.bauchbinde .white',
        opacity: 1
    });
}

// --------------------------------------
// FILL
// --------------------------------------
function showAnimationFILL(tl, msg) {
    cancelAnimation(tl)

    $(".text h1").html(msg.name || "")
    $(".text h2").html(msg.title || "")

    // Create a timeline with default parameters
    tl = anime.timeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    // Add children
    tl
    .add({
        targets: '.bauchbinde .white',
        opacity: 1
    });
}

function hideAnimationFILL(tl) {
    cancelAnimation(tl)

    tl = anime.timeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    tl   
    .add({
        targets: '.bauchbinde .white',
        opacity: 1
    });
}

// --------------------------------------
// HELPERS
// --------------------------------------
function cancelAnimation (animation) {
    let activeInstances = anime.running;
    let index = activeInstances.indexOf(animation);
    activeInstances.splice(index, 1);
}