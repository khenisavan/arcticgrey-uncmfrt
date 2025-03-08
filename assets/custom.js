document.addEventListener("click", function (event) {
    if (event.target.closest(".quick-view-block .card-sub-box")) {
        const clickedBox = event.target.closest(".card-sub-box");
        const siblings = Array.from(clickedBox.parentElement.children);
        clickedBox.classList.add("active");
        siblings.forEach(sibling => {
            if (sibling !== clickedBox) {
                sibling.classList.remove("active");
            }
        });
        if (document.querySelector(".block_sub-box").classList.contains("active")) {
            document.querySelector(".block_selct-box-pro").classList.remove("hidden");
        } else {
            document.querySelector(".block_selct-box-pro").classList.add("hidden");
        }
    }
});

document.addEventListener("click", function (event) {
    if (event.target.closest(".block-dark-btn")) {
        const darkButton = event.target.closest(".block-dark-btn");
        darkButton.classList.toggle("active");
        document.body.classList.toggle("block_dark");
    }
});

document.addEventListener("click", function (event) {
    if (event.target.closest(".card-product-subscription--content .card-sub-box")) {
        const clickedBox = event.target.closest(".card-sub-box");
        const siblings = Array.from(clickedBox.parentElement.children);
        clickedBox.classList.add("active");
        siblings.forEach(sibling => {
            if (sibling !== clickedBox) {
                sibling.classList.remove("active");
            }
        });
        if (document.querySelector(".block_sub-box").classList.contains("active")) {
            document.querySelector(".block_selct-box-pro").classList.remove("hidden");
        } else {
            document.querySelector(".block_selct-box-pro").classList.add("hidden");
        }
    }
});
