// Total Waterproofing Solutions — mobile navigation toggle
document.addEventListener('DOMContentLoaded', function () {
    var hamburger = document.querySelector('.hamburger');
    var nav = document.querySelector('.main-nav');

    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('nav-open');
        hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu after a link is tapped (mobile)
    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            nav.classList.remove('nav-open');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
});