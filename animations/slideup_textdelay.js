// --------------------------------------
// INIT
// --------------------------------------
function initAnimationDefaults() {
    $(".bauchbinde").css('margin-bottom','-100vh');
    $(".bauchbinde .white").css('opacity','1');
    $(".bauchbinde .white .text").css('position','relative');
    $(".bauchbinde .white .text").css('bottom','-4vh');
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
        targets: '.bauchbinde .white .text',
        'bottom': '-4vh',
        duration: 1
    })
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
    })
    .add({
        targets: '.bauchbinde .white .text',
        'bottom': '0vh'
    }, '-=400');
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
        targets: '.bauchbinde .white .text',
        'bottom': '-4vh'
    })
    .add({
        targets: '.bauchbinde',
        'margin-bottom': '-100vh',
    }, '-=400');
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
        targets: '.bauchbinde .white .text',
        'bottom': '-4vh',
        duration: 1
    })
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
    })
    .add({
        targets: '.bauchbinde .white .text',
        'bottom': '0vh'
    }, '-=400');
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
        targets: '.bauchbinde .white .text',
        'bottom': '-4vh'
    })
    .add({
        targets: '.bauchbinde',
        'margin-bottom': '-100vh'
    }, '-=400');
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
        targets: '.bauchbinde .white .text',
        'bottom': '-4vh',
        duration: 1
    })
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
    })
    .add({
        targets: '.bauchbinde .white .text',
        'bottom': '0vh'
    }, '-=400');
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
        targets: '.bauchbinde .white .text',
        'bottom': '-4vh'
    })
    .add({
        targets: '.bauchbinde',
        'margin-bottom': '-100vh'
    }, '-=400');
}

// --------------------------------------
// HELPERS
// --------------------------------------
function cancelAnimation (animation) {
    if (!animation) return;
    // anime.running exists no longer in v4 - handle instance cancellation manually if needed
    if (typeof animation.pause === "function") animation.pause();
}
