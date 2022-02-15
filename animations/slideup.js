// --------------------------------------
// INIT
// --------------------------------------
function initAnimationDefaults() {
    $(".bauchbinde").css('margin-bottom','-100vh');
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
    tl = anime.timeline({
        easing: FX_EASING,
        duration: FX_DURATION,
        loop: false,
        autoplay: true,
    });

    // Add children
    tl
    .add({
        targets: '.bauchbinde',
        'margin-bottom': '-100vh',
        duration: 1
    })
    .add({
        targets: '.bauchbinde .white',
        opacity: 1,
        duration: 1
    })
    .add({
        targets: '.bauchbinde',
        'margin-bottom': '0vh'
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
        targets: '.bauchbinde',
        'margin-bottom': '-100vh'
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
        targets: '.bauchbinde',
        'margin-bottom': '-100vh',
        duration: 1
    })
    .add({
        targets: '.bauchbinde .white',
        opacity: 1,
        duration: 1
    })
    .add({
        targets: '.bauchbinde',
        'margin-bottom': '0vh'
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
        targets: '.bauchbinde',
        'margin-bottom': '-100vh'
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
        targets: '.bauchbinde',
        'margin-bottom': '-100vh',
        duration: 1
    })
    .add({
        targets: '.bauchbinde .white',
        opacity: 1,
        duration: 1
    })
    .add({
        targets: '.bauchbinde',
        'margin-bottom': '0vh'
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
        targets: '.bauchbinde',
        'margin-bottom': '-100vh'
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