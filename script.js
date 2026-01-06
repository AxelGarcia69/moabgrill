document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById("moabVideo");
    const replayBtn = document.getElementById("replayBtn");

    if (!video || !replayBtn) return;

    video.addEventListener("ended", () => {
        replayBtn.style.display = "block";
    });

    replayBtn.addEventListener("click", () => {
        video.currentTime = 0;
        video.play();
        replayBtn.style.display = "none";
    });
});
