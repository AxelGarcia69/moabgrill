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

/* =========================
   MOBILE FIX — REAL
========================= */
@media (max-width: 768px){

  /* HEADER */
  header{
    flex-direction:column;
    gap:12px;
    padding:14px;
  }

  header .logo{
    margin:0;
  }

  nav{
    width:100%;
    flex-direction:column;
    gap:14px;
  }

  nav a{
    font-size:18px;
    margin:0;
  }

  /* HERO */
  .hero{
    flex-direction:column;
    gap:22px;
    margin:20px auto;
  }

  .hero-text{
    width:100%;
    text-align:center;
  }

  /* VIDEO */
  .video-container{
    width:100%;
    border-width:4px;
  }

  .video-slogan{
    font-size:22px;
    padding:0 10px;
  }

  /* INFO SECTION */
  .info-section{
    flex-direction:column;
    align-items:center;
    text-align:center;
  }

  .info-image,
  .info-text{
    width:100%;
  }

  /* SUBMENU */
  .submenu{
    padding:20px 12px;
    gap:22px;
  }

  .submenu a{
    width:48%;
    max-width:none;
  }

  /* MENU ITEMS */
  .menu-item{
    flex:1 1 100%;
    max-width:100%;
  }

  /* FOOTER */
  .footer .footer-container{
    flex-direction:column;
    gap:16px;
    text-align:center;
  }

  .footer .footer-socials{
    gap:16px;
  }
}
