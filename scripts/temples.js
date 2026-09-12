// ------------------------------
// HAMBURGER MENU
// ------------------------------

const menuButton = document.querySelector("#menu-button");
const navigation = document.querySelector("#navigation");

menuButton.addEventListener("click", () => {
    navigation.classList.toggle("show");

    const isOpen = navigation.classList.contains("show");

    menuButton.setAttribute("aria-expanded", isOpen);

    if (isOpen) {
        menuButton.textContent = "✕";
        menuButton.setAttribute("aria-label", "Close navigation menu");
    } else {
        menuButton.textContent = "☰";
        menuButton.setAttribute("aria-label", "Open navigation menu");
    }
});


// ------------------------------
// CURRENT YEAR
// ------------------------------

const currentYear = new Date().getFullYear();

document.querySelector("#currentyear").textContent = currentYear;


// ------------------------------
// LAST MODIFIED DATE
// ------------------------------

document.querySelector("#lastModified").textContent =
    `Last Modified: ${document.lastModified}`;