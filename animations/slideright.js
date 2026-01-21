// --------------------------------------
// INIT
// --------------------------------------
function initAnimationDefaults() {
    $(".bauchbinde").css('left','100vw');
    $(".bauchbinde .white").css('opacity','1');
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
    tl = anime.createTimeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    // Add children
    tl
    .add({
        targets: '.bauchbinde',
        'left': '100vw',
        duration: 1
    })
    .add({
        targets: '.bauchbinde .white',
        opacity: 1,
        duration: 1
    })
    .add({
        targets: '.bauchbinde',
        'left': '0vw'
    });
}

function hideAnimationH5(tl) {
    cancelAnimation(tl)

    tl = anime.createTimeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    tl
    .add({
        targets: '.bauchbinde',
        'left': '100vw'
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
    tl = anime.createTimeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    // Add children
    tl
    .add({
        targets: '.bauchbinde',
        'left': '100vw',
        duration: 1
    })
    .add({
        targets: '.bauchbinde .white',
        opacity: 1,
        duration: 1
    })
    .add({
        targets: '.bauchbinde',
        'left': '0vw'
    });
}

function hideAnimationKEY(tl) {
    cancelAnimation(tl)

    tl = anime.createTimeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    tl   
    .add({
        targets: '.bauchbinde',
        'left': '100vw'
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
    tl = anime.createTimeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    // Add children
    tl
    .add({
        targets: '.bauchbinde',
        'left': '100vw',
        duration: 1
    })
    .add({
        targets: '.bauchbinde .white',
        opacity: 1,
        duration: 1
    })
    .add({
        targets: '.bauchbinde',
        'left': '0vw'
    });
}

function hideAnimationFILL(tl) {
    cancelAnimation(tl)

    tl = anime.createTimeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    tl   
    .add({
        targets: '.bauchbinde',
        'left': '100vw'
    });
}

// --------------------------------------
// HELPERS
// --------------------------------------
function cancelAnimation (animation) {
    if (!animation) return;
    // anime.running exists no longer in v4 - handle instance cancellation manually if needed
    if (typeof animation.pause === "function") animation.pause();
}
