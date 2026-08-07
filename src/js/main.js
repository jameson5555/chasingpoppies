import { loadVideos } from "./videos";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".site-nav");
const videoDialog = document.querySelector(".video-dialog");
const videoPlayer = document.querySelector("[data-video-player]");
const closeVideoButton = document.querySelector(".video-dialog__close");
let lastVideoTrigger = null;

function setMenu(open) {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
    navigation.dataset.open = String(open);
}

if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
        setMenu(menuButton.getAttribute("aria-expanded") !== "true");
    });
    navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
}

function closeVideo() {
    if (!videoDialog || !videoPlayer) return;
    videoDialog.close();
    videoPlayer.replaceChildren();
    if (lastVideoTrigger) lastVideoTrigger.focus();
}

document.addEventListener("click", event => {
    const button = event.target.closest("[data-video-id]");
    if (!button || !videoDialog || !videoPlayer) return;
    const videoId = button.dataset.videoId;
    const title = button.querySelector("strong").textContent;
    lastVideoTrigger = button;
    document.querySelector("#video-dialog-title").textContent = title;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = title;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    videoPlayer.replaceChildren(iframe);
    videoDialog.showModal();
});

if (closeVideoButton) closeVideoButton.addEventListener("click", closeVideo);
if (videoDialog) {
    videoDialog.addEventListener("click", event => {
        if (event.target === videoDialog) closeVideo();
    });
    videoDialog.addEventListener("close", () => videoPlayer.replaceChildren());
}

window.addEventListener("resize", () => {
    if (window.innerWidth > 720) setMenu(false);
});

loadVideos();
